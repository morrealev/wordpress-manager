#!/usr/bin/env node
// scripts/dashboard-renderer.mjs — Editorial Kanban Dashboard HTML Renderer
// Generates a self-contained HTML file from .content-state/ data and opens it in the browser.
//
// Usage:
//   node scripts/dashboard-renderer.mjs                          # auto-detect site, current month
//   node scripts/dashboard-renderer.mjs --site=mysite        # specific site
//   node scripts/dashboard-renderer.mjs --month=2026-04          # specific month
//   node scripts/dashboard-renderer.mjs --output=/tmp/dash.html  # custom output
//   node scripts/dashboard-renderer.mjs --no-open                # skip browser launch

import { writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { scanContentState, aggregateMetrics } from './context-scanner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const CONTENT_STATE_DIR = '.content-state';
const RENDERER_VERSION = '1.0.0';

// ── CLI Args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

// ── HTML Helpers ────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function statusColor(status) {
  const map = {
    planned: 'var(--status-planned)',
    draft: 'var(--status-draft)',
    ready: 'var(--status-ready)',
    scheduled: 'var(--status-scheduled)',
    published: 'var(--status-published)'
  };
  return map[status] || 'var(--status-planned)';
}

function channelBadge(channel) {
  const map = {
    linkedin: { abbr: 'in', color: '#0077b5' },
    twitter: { abbr: 'tw', color: '#1da1f2' },
    newsletter: { abbr: 'nl', color: '#f59e0b' },
    mailchimp: { abbr: 'nl', color: '#f59e0b' },
    buffer: { abbr: 'bf', color: '#168eea' },
  };
  const info = map[channel] || { abbr: channel.substring(0, 2), color: '#64748b' };
  return `<span class="channel" style="background:${info.color}" title="${escapeHtml(channel)}">${escapeHtml(info.abbr)}</span>`;
}

function typeIcon(type) {
  return type === 'page' ? '&#x1F4C4;' : '&#x1F4DD;';
}

function groupByStatus(entries) {
  const groups = { planned: [], draft: [], ready: [], scheduled: [], published: [] };
  for (const entry of entries) {
    const bucket = groups[entry.status];
    if (bucket) bucket.push(entry);
    else groups.planned.push(entry); // fallback
  }
  return groups;
}

// ── Card Renderer ───────────────────────────────────────────────────

function renderCard(entry) {
  const isEmpty = entry.title === null;
  const cardClass = isEmpty ? 'card card--empty' : 'card';
  const titleDisplay = isEmpty
    ? '<span class="card-title card-title--placeholder">[da assegnare]</span>'
    : `<span class="card-title" title="${escapeHtml(entry.title)}">${escapeHtml(truncate(entry.title, 55))}</span>`;

  const briefLine = entry.briefId
    ? `<div class="card-brief">${escapeHtml(entry.briefId)}</div>`
    : '';

  const postLine = entry.postId
    ? `<div class="card-post">WP #${entry.postId}</div>`
    : '';

  const channelsLine = entry.channels.length > 0
    ? `<div class="card-channels">${entry.channels.map(channelBadge).join(' ')}</div>`
    : '';

  return `
    <div class="${cardClass}" style="--status-color: ${statusColor(entry.status)}">
      <div class="card-header">
        <span class="card-date">${formatDate(entry.date)}</span>
        <span class="card-type">${typeIcon(entry.type)}</span>
      </div>
      ${titleDisplay}
      ${briefLine}
      ${postLine}
      ${channelsLine}
    </div>`;
}

// ── Column Renderer ─────────────────────────────────────────────────

function renderColumn(status, entries, label) {
  const cards = entries.map(renderCard).join('');
  return `
    <div class="column">
      <div class="column-header">
        <span class="column-label">${escapeHtml(label)}</span>
        <span class="column-count">${entries.length}</span>
      </div>
      <div class="column-body">
        ${cards || '<div class="column-empty">—</div>'}
      </div>
    </div>`;
}

// ── Signal Renderer ─────────────────────────────────────────────────

function renderSignal(anomaly) {
  const deltaNum = parseFloat(anomaly.delta) || 0;
  const arrow = deltaNum >= 0 ? '&#x25B2;' : '&#x25BC;';
  const cls = deltaNum >= 0 ? 'signal--up' : 'signal--down';
  return `
    <div class="signal ${cls}">
      <span class="signal-arrow">${arrow}</span>
      <span class="signal-delta">${escapeHtml(anomaly.delta)}</span>
      <span class="signal-entity">${escapeHtml(anomaly.entity)}</span>
      <span class="signal-sep">→</span>
      <span class="signal-action">${escapeHtml(anomaly.action)}</span>
    </div>`;
}

// ── Full HTML Renderer ──────────────────────────────────────────────

export function renderKanbanHTML(rawData, metrics) {
  const entries = rawData.calendar?.entries || [];
  const groups = groupByStatus(entries);
  const anomalies = rawData.signals?.anomalies || [];
  const period = metrics.calendarPeriod || '';
  const monthLabel = period ? (() => {
    const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    const m = parseInt(period.slice(5,7), 10);
    const y = period.slice(0,4);
    return `${months[m-1] || ''} ${y}`;
  })() : 'N/A';

  const nextDeadlineStr = metrics.nextDeadline
    ? `Next: ${formatDate(metrics.nextDeadline.date)} — "${escapeHtml(truncate(metrics.nextDeadline.title, 40))}"`
    : '';

  const signalsStrip = anomalies.length > 0
    ? `<section class="signals-strip">
        <h2>&#x26A1; Signals</h2>
        <div class="signal-list">${anomalies.map(renderSignal).join('')}</div>
       </section>`
    : '';

  const pipelineBadges = ['planned','draft','ready','scheduled','published'].map(s => {
    return `<span class="badge badge--${s}">${metrics.columns[s]} ${s}</span>`;
  }).join(' ');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Editorial Dashboard — ${escapeHtml(metrics.siteId)} — ${escapeHtml(monthLabel)}</title>
  <style>
    :root {
      --bg-page: #f8fafc;
      --bg-column: #f1f5f9;
      --bg-card: #ffffff;
      --border: #e2e8f0;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --text-muted: #94a3b8;
      --status-planned: #94a3b8;
      --status-draft: #eab308;
      --status-ready: #3b82f6;
      --status-scheduled: #8b5cf6;
      --status-published: #22c55e;
      --signal-up: #22c55e;
      --signal-down: #ef4444;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: var(--bg-page);
      color: var(--text-primary);
      line-height: 1.5;
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    header {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border);
    }
    header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .meta {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 12px;
    }
    .progress-bar {
      position: relative;
      height: 28px;
      background: var(--border);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .progress-fill {
      height: 100%;
      background: var(--status-published);
      border-radius: 14px;
      transition: width 0.3s;
    }
    .progress-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .pipeline-counts {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }
    .badge--planned   { background: var(--status-planned); }
    .badge--draft     { background: var(--status-draft); color: #1e293b; }
    .badge--ready     { background: var(--status-ready); }
    .badge--scheduled { background: var(--status-scheduled); }
    .badge--published { background: var(--status-published); }

    /* Kanban Grid */
    .kanban {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
      min-height: 300px;
    }
    .column {
      background: var(--bg-column);
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 200px;
    }
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 4px;
    }
    .column-label {
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }
    .column-count {
      background: var(--border);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .column-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .column-empty {
      color: var(--text-muted);
      text-align: center;
      padding: 24px 0;
      font-size: 0.875rem;
    }

    /* Cards */
    .card {
      background: var(--bg-card);
      border-radius: 8px;
      border-left: 4px solid var(--status-color);
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .card--empty {
      opacity: 0.6;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .card-date {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .card-type {
      font-size: 0.875rem;
    }
    .card-title {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .card-title--placeholder {
      color: var(--text-muted);
      font-style: italic;
      font-weight: 400;
    }
    .card-brief {
      font-size: 0.7rem;
      color: var(--text-secondary);
      font-family: 'SF Mono', 'Fira Code', monospace;
      margin-bottom: 4px;
    }
    .card-post {
      font-size: 0.7rem;
      color: var(--status-published);
      font-weight: 600;
      margin-bottom: 4px;
    }
    .card-channels {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .channel {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Signals Strip */
    .signals-strip {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .signals-strip h2 {
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 10px;
      color: #92400e;
    }
    .signal-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .signal {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      flex-wrap: wrap;
    }
    .signal-arrow { font-size: 0.7rem; }
    .signal--up .signal-arrow, .signal--up .signal-delta { color: var(--signal-up); }
    .signal--down .signal-arrow, .signal--down .signal-delta { color: var(--signal-down); }
    .signal-delta { font-weight: 700; min-width: 50px; }
    .signal-entity { font-weight: 600; color: var(--text-primary); }
    .signal-sep { color: var(--text-muted); }
    .signal-action { color: var(--text-secondary); font-style: italic; }

    /* Footer */
    footer {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .kanban { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 600px) {
      .kanban { grid-template-columns: 1fr; }
      body { padding: 12px; }
    }

    /* Print */
    @media print {
      body { padding: 0; max-width: none; }
      .kanban { grid-template-columns: repeat(5, 1fr); gap: 8px; }
      .card { box-shadow: none; border: 1px solid #ddd; }
      .signals-strip { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Editorial Dashboard — ${escapeHtml(metrics.siteId)} — ${escapeHtml(monthLabel)}</h1>
    <div class="meta">
      Generato: ${new Date(metrics.generatedAt).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}${nextDeadlineStr ? ' | ' + nextDeadlineStr : ''}
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${metrics.progressPercent}%"></div>
      <span class="progress-label">${metrics.postsPublished}/${metrics.postsTarget} pubblicati (${metrics.progressPercent}%)</span>
    </div>
    <div class="pipeline-counts">
      ${pipelineBadges}
    </div>
  </header>

  <main class="kanban">
    ${renderColumn('planned', groups.planned, 'Planned')}
    ${renderColumn('draft', groups.draft, 'Draft')}
    ${renderColumn('ready', groups.ready, 'Ready')}
    ${renderColumn('scheduled', groups.scheduled, 'Scheduled')}
    ${renderColumn('published', groups.published, 'Published')}
  </main>

  ${signalsStrip}

  <footer>
    WordPress Manager v${RENDERER_VERSION} | wp-dashboard skill | Fill rate: ${metrics.fillRate}% | Channels: ${Object.keys(metrics.channelUsage).join(', ') || '—'}
  </footer>
</body>
</html>`;
}

// ── CLI Entry Point ─────────────────────────────────────────────────

function openInBrowser(filepath) {
  const p = platform();
  const cmd = p === 'darwin' ? 'open' :
              p === 'win32'  ? 'start' :
              'xdg-open';
  exec(`${cmd} "${filepath}"`, (err) => {
    if (err) console.error(`Note: could not open browser (${cmd}). Open manually: ${filepath}`);
  });
}

async function detectSite(absContentDir) {
  const files = await readdir(absContentDir);
  const configs = files.filter(f => f.endsWith('.config.md'));
  if (configs.length === 0) {
    throw new Error(`No site configs found in ${absContentDir}. Create a {site_id}.config.md first.`);
  }
  if (configs.length === 1) {
    return configs[0].replace('.config.md', '');
  }
  const sites = configs.map(f => f.replace('.config.md', '')).join(', ');
  throw new Error(`Multiple sites found: ${sites}. Specify with --site=<site_id>`);
}

async function main() {
  const absContentDir = resolve(PROJECT_ROOT, CONTENT_STATE_DIR);
  const siteId = getArg('site') || await detectSite(absContentDir);
  const month = getArg('month') || null; // null = auto-detect latest
  const outputPath = getArg('output') || join(absContentDir, `.dashboard-${siteId}-${month || 'latest'}.html`);
  const noOpen = hasFlag('no-open');

  // SCAN
  const rawData = await scanContentState(CONTENT_STATE_DIR, siteId, month);

  // Resolve output path with actual month
  const actualMonth = rawData.calendar?.period?.slice(0, 7) || 'unknown';
  const finalOutput = getArg('output') || join(absContentDir, `.dashboard-${siteId}-${actualMonth}.html`);

  // AGGREGATE
  const metrics = aggregateMetrics(rawData, 'kanban');

  // RENDER
  const html = renderKanbanHTML(rawData, metrics);

  // WRITE
  await writeFile(finalOutput, html, 'utf8');

  // REPORT
  const size = Buffer.byteLength(html, 'utf8');
  console.log(`Dashboard generated: ${finalOutput} (${(size / 1024).toFixed(1)} KB)`);
  console.log(`Posts: ${metrics.postsPublished}/${metrics.postsTarget} published | Pipeline: ${metrics.columns.draft} draft, ${metrics.columns.ready} ready, ${metrics.columns.scheduled} scheduled | Signals: ${metrics.signalsCount} anomalies`);

  // OPEN
  if (!noOpen) {
    openInBrowser(resolve(finalOutput));
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

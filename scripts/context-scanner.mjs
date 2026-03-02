#!/usr/bin/env node
// scripts/context-scanner.mjs — Shared SCAN + AGGREGATE module for dashboard system
// Reads .content-state/ files, parses YAML frontmatter and editorial tables,
// computes aggregate metrics for rendering.
//
// Exports:
//   scanContentState(contentStatePath, siteId, month?)
//   aggregateMetrics(rawData, viewType)
//   renderContextSnippet(metrics, sliceType)
//   parseFrontmatter(content)
//   parseEditorialTable(markdownBody, calendarPeriod)

import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ── YAML Frontmatter Parser ────────────────────────────────────────
// Handles the subset of YAML used in .content-state/ files:
// scalars, inline arrays [a, b], multi-line arrays (- item), nested objects (1-2 levels)

function parseYamlValue(raw) {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === '~') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  // Inline array: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map(s => parseYamlValue(s));
  }
  // Quoted string
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseYamlBlock(lines) {
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines and comments
    if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }

    // Detect indentation level
    const indent = line.search(/\S/);

    // Top-level key: value
    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)/);
    if (!kvMatch) { i++; continue; }

    const key = kvMatch[1];
    const valueStr = kvMatch[2].trim();

    // Multi-line block scalar (|)
    if (valueStr === '|') {
      const blockLines = [];
      i++;
      while (i < lines.length) {
        const nextIndent = lines[i].search(/\S/);
        if (nextIndent <= indent && lines[i].trim() !== '') break;
        blockLines.push(lines[i].trimStart());
        i++;
      }
      result[key] = blockLines.join('\n').trimEnd();
      continue;
    }

    // Value on same line
    if (valueStr !== '') {
      result[key] = parseYamlValue(valueStr);
      i++;
      continue;
    }

    // Value is on next lines (nested object or multi-line array)
    i++;
    const children = [];
    while (i < lines.length) {
      if (lines[i].trim() === '' || lines[i].trim().startsWith('#')) { i++; continue; }
      const nextIndent = lines[i].search(/\S/);
      if (nextIndent <= indent) break;
      children.push(lines[i]);
      i++;
    }

    if (children.length === 0) {
      result[key] = null;
      continue;
    }

    // Multi-line array (- item)
    if (children[0].trim().startsWith('- ')) {
      result[key] = children
        .filter(c => c.trim().startsWith('- '))
        .map(c => parseYamlValue(c.trim().slice(2)));
      continue;
    }

    // Nested object — recurse with dedented lines
    const minIndent = children[0].search(/\S/);
    const dedented = children.map(c => c.slice(minIndent));
    result[key] = parseYamlBlock(dedented);
  }

  return result;
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const yamlStr = match[1];
  const body = content.slice(match[0].length).trim();
  const lines = yamlStr.split('\n');
  const frontmatter = parseYamlBlock(lines);

  return { frontmatter, body };
}

// ── Editorial Table Parser ─────────────────────────────────────────
// Parses Markdown tables from editorial calendar .state.md files.
// Tables have fixed columns: | Data | Titolo | Tipo | Status | Brief ID | Post ID | Canali |

const MONTH_MAP = {
  'gen': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'mag': '05', 'giu': '06',
  'lug': '07', 'ago': '08', 'set': '09', 'ott': '10', 'nov': '11', 'dic': '12',
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
};

function resolveDate(dateStr, calendarPeriod) {
  // dateStr: "Mar 18", "Apr 3", etc.
  // calendarPeriod: "2026-03-01..2026-03-31"
  if (!dateStr || !calendarPeriod) return null;

  const year = calendarPeriod.slice(0, 4);
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const monthKey = parts[0].toLowerCase().slice(0, 3);
  const day = parseInt(parts[1], 10);
  const month = MONTH_MAP[monthKey];
  if (!month || isNaN(day)) return null;

  return `${year}-${month}-${String(day).padStart(2, '0')}`;
}

function parseCellValue(cell) {
  const trimmed = cell.trim();
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return null;
  return trimmed;
}

export function parseEditorialTable(markdownBody, calendarPeriod) {
  const entries = [];
  const lines = markdownBody.split('\n');

  for (const line of lines) {
    // Only process table data rows (start with |, contain data)
    if (!line.trim().startsWith('|')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');

    // Skip header rows and separator rows
    if (cells.length < 7) continue;
    if (cells[0] === 'Data' || cells[0].startsWith('---') || cells[0].match(/^-+$/)) continue;
    if (cells.every(c => c.match(/^-+$/))) continue;

    const title = parseCellValue(cells[1]);
    const channels = parseCellValue(cells[6]);

    entries.push({
      date: resolveDate(cells[0], calendarPeriod),
      title: title === '[da assegnare]' ? null : title,
      type: parseCellValue(cells[2]) || 'post',
      status: parseCellValue(cells[3]) || 'planned',
      briefId: parseCellValue(cells[4]),
      postId: parseCellValue(cells[5]) ? parseInt(cells[5], 10) || parseCellValue(cells[5]) : null,
      channels: channels ? channels.split(',').map(c => c.trim()).filter(Boolean) : []
    });
  }

  return entries;
}

// ── Anomaly Table Parser ───────────────────────────────────────────
// Parses the Anomalies & Patterns table from signals-feed.md
// | Entity | Metric | Delta | Pattern Match | Action |

function parseAnomalyTable(markdownBody) {
  const anomalies = [];
  const lines = markdownBody.split('\n');

  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.length < 5) continue;
    if (cells[0] === 'Entity' || cells[0].match(/^-+$/)) continue;
    if (cells.every(c => c.match(/^-+$/))) continue;

    anomalies.push({
      entity: cells[0],
      metric: cells[1],
      delta: cells[2],
      pattern: cells[3],
      action: cells[4]
    });
  }

  return anomalies;
}

// ── File Glob Helper ───────────────────────────────────────────────

async function globFiles(dirPath, suffix) {
  try {
    const files = await readdir(dirPath);
    return files.filter(f => f.endsWith(suffix)).sort();
  } catch {
    return [];
  }
}

// ── SCAN: scanContentState ─────────────────────────────────────────

export async function scanContentState(contentStatePath, siteId, month) {
  const absPath = resolve(PROJECT_ROOT, contentStatePath);

  // 1. Read site config
  const configPath = join(absPath, `${siteId}.config.md`);
  let site;
  try {
    const configContent = await readFile(configPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(configContent);
    site = {
      id: frontmatter.site_id || siteId,
      url: frontmatter.site_url || null,
      brand: frontmatter.brand || {},
      defaults: frontmatter.defaults || {},
      channels: frontmatter.channels || {},
      seo: frontmatter.seo || {},
      cadence: frontmatter.cadence || {},
      brandContext: body
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Site config not found: ${configPath}. Run wp-editorial-planner first.`);
    }
    throw err;
  }

  // 2. Find and read editorial calendar
  let calendar = null;
  const calendarFiles = await globFiles(absPath, '-editorial.state.md');

  if (calendarFiles.length > 0) {
    // If month specified, find matching file; otherwise use most recent
    let calFile;
    if (month) {
      calFile = calendarFiles.find(f => f.includes(month));
    }
    if (!calFile) {
      calFile = calendarFiles[calendarFiles.length - 1]; // most recent by name sort
    }

    const calContent = await readFile(join(absPath, calFile), 'utf8');
    const { frontmatter, body } = parseFrontmatter(calContent);
    const entries = parseEditorialTable(body, frontmatter.period);

    calendar = {
      id: frontmatter.calendar_id,
      period: frontmatter.period,
      goals: frontmatter.goals || {},
      status: frontmatter.status,
      entries
    };
  }

  // 3. Read active briefs
  const activeBriefs = [];
  const activeDir = join(absPath, 'pipeline-active');
  const activeFiles = await globFiles(activeDir, '.brief.md');
  for (const file of activeFiles) {
    const content = await readFile(join(activeDir, file), 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    activeBriefs.push({
      briefId: frontmatter.brief_id,
      status: frontmatter.status,
      title: frontmatter.content?.title || null,
      siteId: frontmatter.target?.site_id || null,
      channels: frontmatter.distribution?.channels || [],
      signalRef: frontmatter.source?.signal_ref || null,
      postId: frontmatter.post_id || null,
      postUrl: frontmatter.post_url || null
    });
  }

  // 4. Read archived briefs
  const archivedBriefs = [];
  const archiveDir = join(absPath, 'pipeline-archive');
  const archiveFiles = await globFiles(archiveDir, '.brief.md');
  for (const file of archiveFiles) {
    const content = await readFile(join(archiveDir, file), 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    archivedBriefs.push({
      briefId: frontmatter.brief_id,
      status: frontmatter.status,
      title: frontmatter.content?.title || null,
      postId: frontmatter.post_id || null,
      postUrl: frontmatter.post_url || null
    });
  }

  // 5. Read signals feed
  let signals = null;
  const signalsPath = join(absPath, 'signals-feed.md');
  try {
    const sigContent = await readFile(signalsPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(sigContent);
    const anomalies = parseAnomalyTable(body);
    signals = {
      feedId: frontmatter.feed_id,
      period: frontmatter.period,
      anomalies
    };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    // signals-feed.md not found — signals stays null
  }

  return {
    site,
    calendar,
    briefs: { active: activeBriefs, archived: archivedBriefs },
    signals
  };
}

// ── AGGREGATE: aggregateMetrics ────────────────────────────────────

export function aggregateMetrics(rawData, viewType = 'kanban') {
  const { site, calendar, briefs, signals } = rawData;

  const entries = calendar?.entries || [];
  const postsTarget = calendar?.goals?.posts_target || entries.length || 0;

  // Column counts
  const columns = { planned: 0, draft: 0, ready: 0, scheduled: 0, published: 0 };
  for (const entry of entries) {
    if (columns[entry.status] !== undefined) {
      columns[entry.status]++;
    }
  }

  const postsPublished = columns.published;
  const progressPercent = postsTarget > 0 ? Math.round((postsPublished / postsTarget) * 100) : 0;

  // Next deadline: first non-published entry with a title, sorted by date
  const upcoming = entries
    .filter(e => e.status !== 'published' && e.title && e.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().slice(0, 10);
  const nextDeadline = upcoming.length > 0 ? {
    date: upcoming[0].date,
    title: upcoming[0].title,
    status: upcoming[0].status,
    daysFromNow: Math.ceil((new Date(upcoming[0].date) - new Date(today)) / 86400000)
  } : null;

  // Channel usage
  const channelUsage = {};
  for (const entry of entries) {
    for (const ch of entry.channels) {
      channelUsage[ch] = (channelUsage[ch] || 0) + 1;
    }
  }

  // Fill rate: entries with title / total entries
  const withTitle = entries.filter(e => e.title !== null).length;
  const fillRate = entries.length > 0 ? Math.round((withTitle / entries.length) * 100 * 10) / 10 : 0;

  // Signals summary
  const anomalies = signals?.anomalies || [];
  const signalsCount = anomalies.length;
  const signalsHighest = anomalies.length > 0
    ? anomalies.reduce((best, a) => {
        const delta = parseFloat(a.delta) || 0;
        const bestDelta = parseFloat(best.delta) || 0;
        return Math.abs(delta) > Math.abs(bestDelta) ? a : best;
      })
    : null;

  return {
    siteId: site.id,
    siteUrl: site.url,
    calendarId: calendar?.id || null,
    calendarPeriod: calendar?.period || null,
    postsPublished,
    postsTarget,
    progressPercent,
    columns,
    nextDeadline,
    channelUsage,
    fillRate,
    signalsCount,
    signalsHighest,
    generatedAt: new Date().toISOString(),
    generatorVersion: '1.0.0'
  };
}

// ── RENDER: Context Snippet (Livello 2 — inline nelle content skill) ──

export function renderContextSnippet(metrics, sliceType = 'pipeline', activeBriefs = []) {
  const m = metrics;
  const period = m.calendarPeriod ? m.calendarPeriod.replace('..', ' → ') : 'no calendar';
  const lines = [
    `── Editorial Context ──────────────────────`,
    `  ${m.siteId || '?'} | ${period}`,
    `  Pipeline: ${m.columns?.draft ?? 0} draft → ${m.columns?.ready ?? 0} ready → ${m.columns?.scheduled ?? 0} scheduled`,
    `  Posts: ${m.postsPublished ?? 0}/${m.postsTarget ?? '?'} pubblicati`,
    `───────────────────────────────────────────`,
  ];

  if (sliceType === 'pipeline' && activeBriefs.length > 0) {
    const briefSummary = activeBriefs
      .slice(0, 3)
      .map(b => `${b.briefId} (${b.status})`)
      .join(', ');
    const extra = activeBriefs.length > 3 ? ` +${activeBriefs.length - 3} more` : '';
    lines.splice(3, 0, `  Briefs: ${briefSummary}${extra}`);
  }

  if (sliceType === 'calendar' && m.nextDeadline) {
    lines.splice(3, 0, `  Next: ${m.nextDeadline.date} — "${m.nextDeadline.title?.substring(0, 40)}..."`);
  }

  if (sliceType === 'signals' && m.signalsCount > 0) {
    lines.splice(3, 0, `  Signals: ${m.signalsCount} anomalie | Top: ${m.signalsHighest?.entity} ${m.signalsHighest?.delta}`);
  }

  return lines.join('\n');
}

// ── CLI Entry Point ─────────────────────────────────────────────────
// Usage: node scripts/context-scanner.mjs --snippet --site=mysite [--slice=pipeline] [--month=2026-03]

async function cli() {
  const args = process.argv.slice(2);
  if (!args.includes('--snippet')) return;

  const siteArg = args.find(a => a.startsWith('--site='));
  if (!siteArg) {
    process.stderr.write('Error: --site=<site_id> is required\n');
    process.exit(1);
  }
  const siteId = siteArg.split('=')[1];

  const sliceArg = args.find(a => a.startsWith('--slice='));
  const sliceType = sliceArg ? sliceArg.split('=')[1] : 'pipeline';

  const monthArg = args.find(a => a.startsWith('--month='));
  const month = monthArg ? monthArg.split('=')[1] : undefined;

  try {
    const rawData = await scanContentState('.content-state', siteId, month);
    const metrics = aggregateMetrics(rawData);
    const snippet = renderContextSnippet(metrics, sliceType, rawData.briefs.active);
    process.stderr.write(snippet + '\n');
  } catch (err) {
    process.stderr.write(`Context snippet error: ${err.message}\n`);
    process.exit(1);
  }
}

// Only run CLI when executed directly (not imported as module)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('context-scanner.mjs') ||
  process.argv[1].endsWith('context-scanner')
);
if (isMainModule) {
  cli();
}

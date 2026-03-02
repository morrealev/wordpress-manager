# Signals Feed Schema

**Version**: 1.0.0
**Phase**: Content Intelligence (Phase 2)
**Location**: `.content-state/signals-feed.md`

## Overview

The `signals-feed.md` file bridges wp-analytics output and GenSignal input. It translates WordPress metrics collected by GA4, Plausible, GSC, and Core Web Vitals tools into the NormalizedEvent format, enabling GenSignal's pattern detection and scoring pipelines to operate on WordPress analytics data without custom adapters. Each feed is a point-in-time snapshot covering a defined measurement period with optional period-over-period delta calculations.

## Frontmatter Fields

The file uses YAML frontmatter to declare feed metadata.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `feed_id` | string | Yes | -- | Unique identifier. Format: `FEED-{site_id}-YYYY-MM` |
| `site_id` | string | Yes | -- | Must match a `.content-state/{site_id}.config.md` |
| `generated` | ISO 8601 | Yes | -- | Timestamp auto-set at generation time |
| `period` | string | Yes | -- | Measurement window. Format: `YYYY-MM-DD..YYYY-MM-DD` |
| `comparison_period` | string | No | -- | Baseline window. Auto-calculated: same duration offset backward |
| `source_tools` | string[] | Yes | -- | List of MCP tools that contributed data to this feed |
| `anomaly_threshold` | number | No | 30 | Percentage delta that qualifies an event as an anomaly |
| `status` | enum | No | generated | One of: `generated`, `reviewed`, `actioned` |

### Field Notes

- `feed_id` is deterministic: regenerating the feed for the same site and month produces the same ID
- `site_id` is validated against existing `.content-state/{site_id}.config.md` files
- `comparison_period` is omitted when no historical data exists (first run)
- `source_tools` lists only tools that returned data, not all tools attempted

## NormalizedEvent Format

Each event in the feed body represents a single metric observation for an entity during the measurement period.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity_id` | string | Yes | Format: `{EntityType}:{identifier}` |
| `relation` | string | Yes | The metric being measured |
| `value` | number | Yes | Metric value for the current period |
| `unit` | string | Yes | One of: `count`, `seconds`, `percentage`, `position` |
| `ts` | ISO 8601 | Yes | End of measurement period |
| `delta_pct` | integer | No | % change vs comparison period. Positive = increase. Omitted if no baseline |
| `provenance` | object | Yes | Data origin metadata |

### Entity Types

The `entity_id` field uses a typed prefix to identify the entity:

| Prefix | Format | Example |
|--------|--------|---------|
| `Page:` | `Page:{url_path}` | `Page:/cactus-water-benefici` |
| `Keyword:` | `Keyword:{search_term}` | `Keyword:acqua di cactus` |
| `Source:` | `Source:{source_name}` | `Source:linkedin` |
| `Site:` | `Site:{site_id}` | `Site:opencactus` |

### Valid Relations by Entity Type

**Page**

| Relation | Unit | Description |
|----------|------|-------------|
| `pageviews` | count | Total page views in the period |
| `sessions` | count | Sessions that included this page |
| `avg_engagement_time` | seconds | Mean engaged time on the page |
| `bounce_rate` | percentage | Non-engaged session rate |
| `conversions` | count | Conversion events on this page |

**Keyword**

| Relation | Unit | Description |
|----------|------|-------------|
| `search_impressions` | count | Times the page appeared in search results |
| `search_clicks` | count | Clicks from search results |
| `search_ctr` | percentage | Click-through rate from search |
| `search_position` | position | Average ranking position |

**Source**

| Relation | Unit | Description |
|----------|------|-------------|
| `referral_sessions` | count | Sessions from this traffic source |
| `referral_conversions` | count | Conversions from this traffic source |
| `referral_bounce_rate` | percentage | Bounce rate for sessions from this source |

**Site**

| Relation | Unit | Description |
|----------|------|-------------|
| `total_sessions` | count | Total sessions across all pages |
| `total_pageviews` | count | Total page views across all pages |
| `total_conversions` | count | Total conversions site-wide |
| `lcp` | seconds | Largest Contentful Paint (Core Web Vital) |
| `cls` | count | Cumulative Layout Shift (Core Web Vital, unitless score) |
| `inp` | seconds | Interaction to Next Paint (Core Web Vital) |
| `fcp` | seconds | First Contentful Paint |
| `ttfb` | seconds | Time to First Byte |

### Provenance Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_id` | string | Yes | MCP tool name that produced this data point (e.g., `ga4_top_pages`) |
| `site` | string | Yes | The `site_id` this data belongs to |

### GenSignal Compatibility

The NormalizedEvent format maps 1:1 to GenSignal's Harvest stage input:

- The `entity_id` format uses GenSignal's `{Type}:{identifier}` convention, so events can be ingested without transformation
- The `provenance` block enables GenSignal's `quality.corroboration` scoring by tracking which tool produced each data point
- Multiple events for the same entity from different tools strengthen corroboration scores
- The `delta_pct` field provides pre-computed trend data that GenSignal's Detect stage can use directly

## Body Structure

The Markdown body after frontmatter contains YAML code blocks organized by signal category.

### Section Layout

```
# Normalized Events

## Traffic Signals
(Page-level metrics from GA4/Plausible)

## Search Signals
(Keyword-level metrics from GSC)

## Source Signals
(Traffic source metrics from GA4)

## Performance Signals
(CWV metrics from CrUX/PageSpeed)

# Anomalies & Patterns
(Markdown table of detected anomalies)
```

### Traffic Signals

Contains `Page:` entity events sourced from `ga4_top_pages`, `ga4_report`, or `plausible_stats`. Each event is a YAML object in a fenced code block.

### Search Signals

Contains `Keyword:` entity events sourced from `gsc_query_analytics`. Captures search visibility and click behavior.

### Source Signals

Contains `Source:` entity events sourced from `ga4_traffic_sources`. Tracks referral performance by channel.

### Performance Signals

Contains `Site:` entity events sourced from `cwv_report` or `pagespeed_check`. Captures Core Web Vitals and loading metrics.

### Anomalies & Patterns

A Markdown table listing all events where `|delta_pct| >= anomaly_threshold`. Only events that exceed the threshold appear here.

| Column | Description |
|--------|-------------|
| Entity | The `entity_id` of the anomalous event |
| Metric | The `relation` that triggered the anomaly |
| Delta | The `delta_pct` value with sign (e.g., `+120%`) |
| Pattern Match | Name of the matched GenSignal pattern, or "Unclassified anomaly" |
| Action | Recommended action template |

## Delta Calculation Rules

Period-over-period deltas compare the current `period` to the `comparison_period`.

### Formula

```
delta_pct = round(((current - previous) / previous) * 100)
```

### Edge Cases

| Scenario | Result |
|----------|--------|
| `previous = 0` and `current > 0` | `delta_pct = +999` |
| `previous = 0` and `current = 0` | `delta_pct = 0` |
| No previous data available | Omit `delta_pct` entirely |
| Normal calculation | Round to nearest integer |

### Notes

- Values are always integers (no decimal places)
- Positive values indicate an increase, negative values a decrease
- The `comparison_period` frontmatter field records which period was used as baseline
- When `comparison_period` is omitted, no event will have a `delta_pct` field

## GenSignal Pattern Matching

Three patterns are detectable from WordPress analytics data alone. The wp-analytics Step 7 evaluates each anomaly against these patterns before writing the Anomalies & Patterns table.

### 1. Search Intent Shift

Users are clicking more on existing rankings, indicating growing search intent for the topic.

**Detection**: GSC shows `search_ctr` increasing while `search_position` remains stable -- users are clicking more on existing rankings without position changes.

**Trigger conditions** (either):
- `search_ctr` delta >= +20% sustained over the measurement period
- `search_impressions` delta >= +50% on keywords containing commercial modifiers (e.g., "comprare", "prezzo", "migliore", "acquistare")

**Data sources**: `gsc_query_analytics`

**Action template**: `"Investigate: content cluster opportunity"`

### 2. Early-Adopter Surge

A single traffic source is growing disproportionately compared to overall site traffic, signaling an emerging audience channel.

**Detection**: Single traffic source shows disproportionate growth vs other sources.

**Trigger conditions**:
- A single `Source:*` entity has `referral_sessions` delta >= +50%
- AND site-level `total_sessions` delta < +20%

**Data sources**: `ga4_traffic_sources`

**Action template**: `"Scale: increase posting frequency on {source}"`

### 3. Hype-to-Utility Crossover

Engagement metrics improve while raw pageviews plateau, indicating a shift from curiosity-driven to utility-driven traffic.

**Detection**: Engagement improving while raw pageviews plateau -- shift from curiosity to utility traffic.

**Trigger conditions** (all must be true):
- `avg_engagement_time` delta >= +15%
- `bounce_rate` delta <= -10%
- `pageviews` delta between -20% and +10%

**Data sources**: `ga4_top_pages`, `ga4_report`

**Action template**: `"Shift: add conversion touchpoints to high-engagement pages"`

### Unclassified Anomalies

Any anomaly (event with `|delta_pct| >= anomaly_threshold`) that does not match one of the three patterns above is labeled:

- **Pattern Match**: `"Unclassified anomaly"`
- **Action**: `"Review: investigate cause of {delta_pct} change in {relation}"`

## Status Lifecycle

```
generated --> reviewed --> actioned
```

| Status | Meaning | Set By |
|--------|---------|--------|
| `generated` | Created by wp-analytics Step 7. No human review yet | Automated |
| `reviewed` | User or Claude reviewed anomalies, confirmed or dismissed findings | Manual |
| `actioned` | Findings acted upon -- briefs created, campaigns launched, or changes deployed | Manual |

Status transitions are forward-only. A feed does not revert from `actioned` to `reviewed`.

## Integration Notes

### GenSignal

NormalizedEvent maps 1:1 to the GenSignal Harvest stage. The `provenance` block enables corroboration scoring. Multiple source tools reporting on the same entity strengthen the signal quality score.

### Phase 1 Bridge (wp-content-pipeline)

Anomalies with the action `"Investigate: content cluster opportunity"` feed the `wp-content-pipeline` skill by creating content briefs in `pipeline-active/`. The Search Intent Shift pattern is the primary trigger for new content ideation.

### Phase 3 Bridge (wp-editorial-planner)

The Anomalies & Patterns table provides data-driven topic suggestions for `wp-editorial-planner`. Each anomaly row can be converted into an editorial calendar entry with priority based on delta magnitude.

### Overwrite Semantics

`signals-feed.md` is overwritten each time Step 7 runs. It is not archived -- it is a point-in-time snapshot. The `comparison_period` field preserves the baseline reference so the context of delta calculations is never lost. For historical tracking, rely on the underlying analytics platforms (GA4, GSC) rather than feed archives.

## Validation Rules

Before writing a `signals-feed.md` file, Step 7 validates the following:

| Rule | Check |
|------|-------|
| `feed_id` format | Must follow `FEED-{site_id}-YYYY-MM` pattern |
| `site_id` exists | Must match an existing `.content-state/{site_id}.config.md` |
| Event completeness | Every event must have `entity_id`, `relation`, `value`, `unit`, `ts`, and `provenance` |
| Entity prefix | `entity_id` must use a recognized prefix: `Page:`, `Keyword:`, `Source:`, `Site:` |
| Relation validity | `relation` must be valid for the entity type (see Valid Relations table) |
| Delta type | `delta_pct` values must be integers when present |
| Threshold value | `anomaly_threshold` must be a positive number |

If any validation fails, Step 7 logs the error and does not write the file.

## Example Feed

A complete `signals-feed.md` for the opencactus site, February 2026.

````markdown
---
feed_id: "FEED-opencactus-2026-02"
site_id: opencactus
generated: "2026-03-01T09:00:00Z"
period: "2026-02-01..2026-02-28"
comparison_period: "2026-01-01..2026-01-31"
source_tools:
  - ga4_top_pages
  - ga4_traffic_sources
  - ga4_report
  - gsc_query_analytics
anomaly_threshold: 30
status: generated
---

# Normalized Events

## Traffic Signals

```yaml
- entity_id: "Page:/cactus-water-benefici"
  relation: pageviews
  value: 3240
  unit: count
  ts: "2026-02-28T23:59:59Z"
  delta_pct: +47
  provenance:
    source_id: ga4_top_pages
    site: opencactus

- entity_id: "Page:/cactus-water-benefici"
  relation: avg_engagement_time
  value: 185
  unit: seconds
  ts: "2026-02-28T23:59:59Z"
  delta_pct: +12
  provenance:
    source_id: ga4_top_pages
    site: opencactus

- entity_id: "Page:/prodotti"
  relation: pageviews
  value: 1850
  unit: count
  ts: "2026-02-28T23:59:59Z"
  delta_pct: +8
  provenance:
    source_id: ga4_top_pages
    site: opencactus
```

## Search Signals

```yaml
- entity_id: "Keyword:acqua di cactus"
  relation: search_impressions
  value: 8500
  unit: count
  ts: "2026-02-28T23:59:59Z"
  delta_pct: +120
  provenance:
    source_id: gsc_query_analytics
    site: opencactus

- entity_id: "Keyword:acqua di cactus benefici"
  relation: search_ctr
  value: 4.2
  unit: percentage
  ts: "2026-02-28T23:59:59Z"
  delta_pct: -8
  provenance:
    source_id: gsc_query_analytics
    site: opencactus
```

## Source Signals

```yaml
- entity_id: "Source:linkedin"
  relation: referral_sessions
  value: 420
  unit: count
  ts: "2026-02-28T23:59:59Z"
  delta_pct: +85
  provenance:
    source_id: ga4_traffic_sources
    site: opencactus
```

## Performance Signals

```yaml
- entity_id: "Site:opencactus"
  relation: lcp
  value: 2.1
  unit: seconds
  ts: "2026-02-28T23:59:59Z"
  provenance:
    source_id: ga4_report
    site: opencactus
```

# Anomalies & Patterns

| Entity | Metric | Delta | Pattern Match | Action |
|--------|--------|-------|---------------|--------|
| Keyword:acqua di cactus | search_impressions | +120% | Search Intent Shift | Investigate: content cluster opportunity |
| Source:linkedin | referral_sessions | +85% | Early-Adopter Surge | Scale: increase LinkedIn posting frequency |
| Page:/cactus-water-benefici | pageviews | +47% | Unclassified anomaly | Review: investigate cause of +47% change in pageviews |
````

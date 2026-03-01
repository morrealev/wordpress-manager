#!/usr/bin/env node
/**
 * content_gen_inspect.mjs — Detects prerequisites for AI content generation.
 *
 * Usage:
 *   node skills/wp-content-generation/scripts/content_gen_inspect.mjs [--cwd=/path/to/project]
 *
 * Checks:
 *   1. WP REST API access (WP_SITES_CONFIG) — required for publishing
 *   2. GSC access — optional, enhances keyword research step
 *   3. Existing content volume — for internal linking suggestions
 *   4. Schema tools availability — for structured data step
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const cwdFlag = args.find(a => a.startsWith('--cwd='));
const cwd = cwdFlag ? resolve(cwdFlag.split('=')[1]) : process.cwd();

const result = {
  content_generation: {
    ready: false,
    capabilities: {
      wp_rest_api: false,
      gsc_keywords: false,
      structured_data: false,
    },
    details: {},
  },
};

// Check WP REST API access
const sitesConfig = process.env.WP_SITES_CONFIG;
if (sitesConfig) {
  try {
    const config = JSON.parse(sitesConfig);
    const sites = Array.isArray(config) ? config : [config];
    if (sites.length > 0) {
      result.content_generation.capabilities.wp_rest_api = true;
      result.content_generation.details.sites_count = sites.length;
      result.content_generation.ready = true;

      // Check for GSC credentials
      const hasGsc = sites.some(s => s.gsc_credentials || s.gsc_service_account);
      result.content_generation.capabilities.gsc_keywords = hasGsc;

      // Structured data is available if REST API is available (sd_* tools use REST)
      result.content_generation.capabilities.structured_data = true;
    }
  } catch {
    result.content_generation.details.config_error = 'Invalid WP_SITES_CONFIG JSON';
  }
}

// Pipeline steps availability
result.content_generation.pipeline = {
  '1_brief': { available: true, note: 'Always available (Claude-native)' },
  '2_keyword_research': {
    available: result.content_generation.capabilities.gsc_keywords,
    note: result.content_generation.capabilities.gsc_keywords
      ? 'GSC available — real keyword data for research'
      : 'GSC not configured — will use semantic keyword suggestions',
  },
  '3_outline': { available: true, note: 'Always available (Claude-native)' },
  '4_draft': { available: true, note: 'Always available (Claude-native)' },
  '5_seo_optimize': { available: true, note: 'Always available (Claude-native + wp-content-optimization)' },
  '6_structured_data': {
    available: result.content_generation.capabilities.structured_data,
    note: result.content_generation.capabilities.structured_data
      ? 'sd_* tools available via REST API'
      : 'Requires WP REST API access',
  },
  '7_publish': {
    available: result.content_generation.capabilities.wp_rest_api,
    note: result.content_generation.capabilities.wp_rest_api
      ? 'create_content available via REST API'
      : 'Requires WP REST API access — can generate draft locally',
  },
};

// Summary
if (!result.content_generation.ready) {
  result.content_generation.details.note = 'WP REST API not configured. Can still generate content (Steps 1-5) but cannot publish or inject schema.';
} else {
  result.content_generation.details.note = 'Full pipeline available. All 7 steps can execute.';
}

console.log(JSON.stringify(result, null, 2));

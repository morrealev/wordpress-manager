#!/usr/bin/env node
/**
 * schema_inspect.mjs — Detects structured data plugins and JSON-LD presence.
 *
 * Usage:
 *   node skills/wp-structured-data/scripts/schema_inspect.mjs [--cwd=/path/to/project]
 *
 * Checks:
 *   1. Yoast SEO (adds Article/Organization/BreadcrumbList schemas)
 *   2. Rank Math SEO (adds Article/Product/FAQ/HowTo schemas)
 *   3. Schema Pro or WP Schema plugins
 *   4. WP_SITES_CONFIG environment for REST API access
 *   5. Theme-level JSON-LD output
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const args = process.argv.slice(2);
const cwdFlag = args.find(a => a.startsWith('--cwd='));
const cwd = cwdFlag ? resolve(cwdFlag.split('=')[1]) : process.cwd();

const result = {
  structured_data: {
    detected: false,
    plugins: [],
    has_rest_access: false,
    details: {},
  },
};

// Check for SEO/schema plugins in wp-content/plugins
const pluginsDir = join(cwd, 'wp-content', 'plugins');
const schemaPlugins = [
  { dir: 'wordpress-seo', name: 'Yoast SEO', schemas: ['Article', 'Organization', 'BreadcrumbList', 'WebSite', 'WebPage'] },
  { dir: 'seo-by-rank-math', name: 'Rank Math', schemas: ['Article', 'Product', 'FAQ', 'HowTo', 'LocalBusiness', 'Event'] },
  { dir: 'schema-pro', name: 'Schema Pro', schemas: ['Article', 'Product', 'FAQ', 'HowTo', 'LocalBusiness', 'Event', 'Recipe'] },
  { dir: 'wp-schema-pro', name: 'WP Schema Pro', schemas: ['Article', 'Product', 'FAQ'] },
  { dir: 'schema', name: 'Schema (Starter)', schemas: ['Article', 'Organization'] },
  { dir: 'schema-and-structured-data-for-wp', name: 'Schema & Structured Data for WP', schemas: ['Article', 'Product', 'FAQ', 'Event', 'Recipe'] },
];

if (existsSync(pluginsDir)) {
  for (const plugin of schemaPlugins) {
    if (existsSync(join(pluginsDir, plugin.dir))) {
      result.structured_data.detected = true;
      result.structured_data.plugins.push({
        name: plugin.name,
        directory: plugin.dir,
        auto_schemas: plugin.schemas,
      });
    }
  }
}

// Check for WP REST API access (needed for sd_inject and sd_list_schemas)
const sitesConfig = process.env.WP_SITES_CONFIG;
if (sitesConfig) {
  try {
    const config = JSON.parse(sitesConfig);
    const sites = Array.isArray(config) ? config : [config];
    result.structured_data.has_rest_access = sites.length > 0;
    result.structured_data.details.sites_count = sites.length;
  } catch {
    result.structured_data.details.config_error = 'Invalid WP_SITES_CONFIG JSON';
  }
}

// Check for theme-level JSON-LD in functions.php
const functionsPhp = join(cwd, 'functions.php');
const themeDir = join(cwd, 'wp-content', 'themes');
let hasThemeSchema = false;
if (existsSync(functionsPhp)) {
  const content = readFileSync(functionsPhp, 'utf8');
  if (content.includes('application/ld+json') || content.includes('schema.org')) {
    hasThemeSchema = true;
  }
}
result.structured_data.details.theme_schema = hasThemeSchema;

// Summary
if (result.structured_data.plugins.length > 0) {
  result.structured_data.details.note = 'Schema plugins detected. sd_inject will store in post meta alongside plugin schemas. Verify no conflicts.';
} else {
  result.structured_data.details.note = 'No schema plugins detected. sd_inject can manage all structured data via post meta.';
}

console.log(JSON.stringify(result, null, 2));

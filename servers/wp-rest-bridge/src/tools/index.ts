// src/tools/index.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { unifiedContentTools, unifiedContentHandlers } from './unified-content.js';
import { unifiedTaxonomyTools, unifiedTaxonomyHandlers } from './unified-taxonomies.js';
import { pluginTools, pluginHandlers } from './plugins.js';
import { mediaTools, mediaHandlers } from './media.js';
import { userTools, userHandlers } from './users.js';
import { pluginRepositoryTools, pluginRepositoryHandlers } from './plugin-repository.js';
import { commentTools, commentHandlers } from './comments.js';
import { searchTools, searchHandlers } from './search.js';

// Combine all tools
export const allTools: Tool[] = [
  ...unifiedContentTools,        // 8 tools
  ...unifiedTaxonomyTools,       // 8 tools
  ...pluginTools,                // 6 tools
  ...mediaTools,                 // 5 tools
  ...userTools,                  // 6 tools
  ...pluginRepositoryTools,      // 2 tools
  ...commentTools,               // 5 tools
  ...searchTools                 // 1 tool
];

// Combine all handlers
export const toolHandlers = {
  ...unifiedContentHandlers,
  ...unifiedTaxonomyHandlers,
  ...pluginHandlers,
  ...mediaHandlers,
  ...userHandlers,
  ...pluginRepositoryHandlers,
  ...commentHandlers,
  ...searchHandlers
};

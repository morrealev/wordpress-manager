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
import { wcProductTools, wcProductHandlers } from './wc-products.js';
import { wcOrderTools, wcOrderHandlers } from './wc-orders.js';
import { wcCustomerTools, wcCustomerHandlers } from './wc-customers.js';
import { wcCouponTools, wcCouponHandlers } from './wc-coupons.js';
import { wcReportTools, wcReportHandlers } from './wc-reports.js';
import { wcSettingTools, wcSettingHandlers } from './wc-settings.js';
import { multisiteSiteTools, multisiteSiteHandlers } from './multisite-sites.js';
import { multisiteNetworkTools, multisiteNetworkHandlers } from './multisite-network.js';
import { wcWebhookTools, wcWebhookHandlers } from './wc-webhooks.js';
import { mailchimpTools, mailchimpHandlers } from './mailchimp.js';
import { bufferTools, bufferHandlers } from './buffer.js';
import { sendgridTools, sendgridHandlers } from './sendgrid.js';
import { gscTools, gscHandlers } from './gsc.js';

// Combine all tools
export const allTools: Tool[] = [
  ...unifiedContentTools,        // 8 tools
  ...unifiedTaxonomyTools,       // 8 tools
  ...pluginTools,                // 6 tools
  ...mediaTools,                 // 5 tools
  ...userTools,                  // 6 tools
  ...pluginRepositoryTools,      // 2 tools
  ...commentTools,               // 5 tools
  ...searchTools,                // 1 tool
  ...wcProductTools,             // 7 tools
  ...wcOrderTools,               // 6 tools
  ...wcCustomerTools,            // 4 tools
  ...wcCouponTools,              // 4 tools
  ...wcReportTools,              // 5 tools
  ...wcSettingTools,             // 4 tools
  ...multisiteSiteTools,         // 5 tools
  ...multisiteNetworkTools,      // 5 tools
  ...wcWebhookTools,             // 4 tools
  ...mailchimpTools,             // 7 tools
  ...bufferTools,                // 5 tools
  ...sendgridTools,              // 6 tools
  ...gscTools,                   // 8 tools
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
  ...searchHandlers,
  ...wcProductHandlers,
  ...wcOrderHandlers,
  ...wcCustomerHandlers,
  ...wcCouponHandlers,
  ...wcReportHandlers,
  ...wcSettingHandlers,
  ...multisiteSiteHandlers,
  ...multisiteNetworkHandlers,
  ...wcWebhookHandlers,
  ...mailchimpHandlers,
  ...bufferHandlers,
  ...sendgridHandlers,
  ...gscHandlers,
};

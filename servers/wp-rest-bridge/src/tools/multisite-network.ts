// src/tools/multisite-network.ts — Multisite network admin (REST + WP-CLI hybrid)
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWordPressRequest } from '../wordpress.js';
import { executeWpCli, isMultisite } from '../wpcli.js';
import { z } from 'zod';

// ── Schemas ──────────────────────────────────────────────────────────

const msListNetworkPluginsSchema = z.object({
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msNetworkActivatePluginSchema = z.object({
  plugin_slug: z.string().describe('Plugin slug to network-activate (e.g., "akismet", "jetpack")'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msNetworkDeactivatePluginSchema = z.object({
  plugin_slug: z.string().describe('Plugin slug to network-deactivate'),
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msListSuperAdminsSchema = z.object({
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

const msGetNetworkSettingsSchema = z.object({
  site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();

// ── Tools ────────────────────────────────────────────────────────────

export const multisiteNetworkTools: Tool[] = [
  {
    name: 'ms_list_network_plugins',
    description: 'Lists all plugins on the multisite network with their activation status (uses REST API).',
    inputSchema: { type: 'object', properties: msListNetworkPluginsSchema.shape }
  },
  {
    name: 'ms_network_activate_plugin',
    description: 'Network-activates a plugin across all sites in the multisite network (uses wp-cli).',
    inputSchema: { type: 'object', properties: msNetworkActivatePluginSchema.shape }
  },
  {
    name: 'ms_network_deactivate_plugin',
    description: 'Network-deactivates a plugin from all sites in the multisite network (uses wp-cli).',
    inputSchema: { type: 'object', properties: msNetworkDeactivatePluginSchema.shape }
  },
  {
    name: 'ms_list_super_admins',
    description: 'Lists all Super Admin users in the multisite network (uses wp-cli).',
    inputSchema: { type: 'object', properties: msListSuperAdminsSchema.shape }
  },
  {
    name: 'ms_get_network_settings',
    description: 'Gets network-wide settings (site name, admin email, registration policy) via wp-cli.',
    inputSchema: { type: 'object', properties: msGetNetworkSettingsSchema.shape }
  }
];

// ── Helpers ──────────────────────────────────────────────────────────

function requireMultisite(siteId?: string): void {
  if (!isMultisite(siteId)) {
    throw new Error(
      `Site is not configured as multisite. ` +
      `Set is_multisite: true in WP_SITES_CONFIG.`
    );
  }
}

// ── Handlers ─────────────────────────────────────────────────────────

export const multisiteNetworkHandlers = {
  ms_list_network_plugins: async (params: z.infer<typeof msListNetworkPluginsSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await makeWordPressRequest('GET', 'plugins', undefined, {
        siteId: params.site_id
      });
      return {
        toolResult: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error listing network plugins: ${errorMessage}` }]
        }
      };
    }
  },

  ms_network_activate_plugin: async (params: z.infer<typeof msNetworkActivatePluginSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli(
        `plugin activate ${params.plugin_slug} --network`,
        params.site_id,
        { skipJson: true }
      );
      return {
        toolResult: {
          content: [{ type: 'text', text: result || `Plugin "${params.plugin_slug}" network-activated successfully.` }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error network-activating plugin: ${error.message}` }]
        }
      };
    }
  },

  ms_network_deactivate_plugin: async (params: z.infer<typeof msNetworkDeactivatePluginSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli(
        `plugin deactivate ${params.plugin_slug} --network`,
        params.site_id,
        { skipJson: true }
      );
      return {
        toolResult: {
          content: [{ type: 'text', text: result || `Plugin "${params.plugin_slug}" network-deactivated successfully.` }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error network-deactivating plugin: ${error.message}` }]
        }
      };
    }
  },

  ms_list_super_admins: async (params: z.infer<typeof msListSuperAdminsSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli('super-admin list', params.site_id, { skipJson: true });
      return {
        toolResult: {
          content: [{ type: 'text', text: result }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error listing super admins: ${error.message}` }]
        }
      };
    }
  },

  ms_get_network_settings: async (params: z.infer<typeof msGetNetworkSettingsSchema>) => {
    try {
      requireMultisite(params.site_id);
      const result = await executeWpCli('network meta list 1', params.site_id);
      return {
        toolResult: {
          content: [{ type: 'text', text: result }]
        }
      };
    } catch (error: any) {
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error getting network settings: ${error.message}` }]
        }
      };
    }
  }
};

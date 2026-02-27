// src/tools/plugins.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWordPressRequest } from '../wordpress.js';
import { WPPlugin } from '../types.js';
import { z } from 'zod';

// Note: Plugin operations require authentication with admin privileges
// and use a different endpoint than the standard WP API (wp-json/wp/v2/plugins)

// Make schema empty since the WordPress REST API plugins endpoint doesn't accept parameters
// in the same way as other endpoints
const listPluginsSchema = z.object({
  status: z.enum(['active', 'inactive']).optional().default('active').describe("Filter plugins by status (active, inactive)")
}).strict();

const getPluginSchema = z.object({
  plugin: z.string().describe("Plugin identifier in folder/file.php format (e.g., 'akismet/akismet.php', 'elementor/elementor.php')")
}).strict();

const activatePluginSchema = z.object({
  plugin: z.string().describe("Plugin identifier in folder/file.php format (e.g., 'akismet/akismet.php', 'elementor/elementor.php')")
}).strict();

const deactivatePluginSchema = z.object({
  plugin: z.string().describe("Plugin identifier in folder/file.php format (e.g., 'akismet/akismet.php', 'elementor/elementor.php')")
}).strict();

const createPluginSchema = z.object({
  slug: z.string({ required_error: "Plugin slug is required" }).describe("WordPress.org plugin directory slug, e.g., 'akismet', 'elementor', 'wordpress-seo'"),
  status: z.enum(['inactive', 'active']).optional().default('active').describe("Plugin activation status")
}).strict();

const deletePluginSchema = z.object({
  plugin: z.string().describe("Plugin identifier in folder/file.php format (e.g., 'akismet/akismet.php')")
}).strict();

type ListPluginsParams = z.infer<typeof listPluginsSchema>;
type GetPluginParams = z.infer<typeof getPluginSchema>;
type ActivatePluginParams = z.infer<typeof activatePluginSchema>;
type DeactivatePluginParams = z.infer<typeof deactivatePluginSchema>;
type CreatePluginParams = z.infer<typeof createPluginSchema>;
type DeletePluginParams = z.infer<typeof deletePluginSchema>;

// Define tool set for plugin operations
export const pluginTools: Tool[] = [
  {
    name: "list_plugins",
    description: "Lists all plugins with filtering options",
    inputSchema: { type: "object", properties: listPluginsSchema.shape }
  },
  {
    name: "get_plugin",
    description: "Retrieves plugin details",
    inputSchema: { type: "object", properties: getPluginSchema.shape }
  },
  {
    name: "activate_plugin",
    description: "Activates a plugin",
    inputSchema: { type: "object", properties: activatePluginSchema.shape }
  },
  {
    name: "deactivate_plugin",
    description: "Deactivates a plugin",
    inputSchema: { type: "object", properties: deactivatePluginSchema.shape }
  },
  {
    name: "create_plugin",
    description: "Creates a plugin from the WordPress.org repository",
    inputSchema: { type: "object", properties: createPluginSchema.shape }
  },
  {
    name: "delete_plugin",
    description: "Deletes an installed plugin (must be deactivated first)",
    inputSchema: { type: "object", properties: deletePluginSchema.shape }
  }
];

// Define handlers for each plugin operation
export const pluginHandlers = {
  list_plugins: async (params: z.infer<typeof listPluginsSchema>) => {
    try {
      const response = await makeWordPressRequest("GET", "plugins", params);
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error listing plugins: ${errorMessage}` }]
        }
      };
    }
  },
  get_plugin: async (params: z.infer<typeof getPluginSchema>) => {
    try {
      const response = await makeWordPressRequest("GET", `plugins/${params.plugin}`);
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error retrieving plugin: ${errorMessage}` }]
        }
      };
    }
  },
  activate_plugin: async (params: z.infer<typeof activatePluginSchema>) => {
    try {
      const response = await makeWordPressRequest("PUT", `plugins/${params.plugin}`, { status: 'active' });
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error activating plugin: ${errorMessage}` }]
        }
      };
    }
  },
  deactivate_plugin: async (params: z.infer<typeof deactivatePluginSchema>) => {
    try {
      const response = await makeWordPressRequest("PUT", `plugins/${params.plugin}`, { status: 'inactive' });
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error deactivating plugin: ${errorMessage}` }]
        }
      };
    }
  },
  create_plugin: async (params: z.infer<typeof createPluginSchema>) => {
    try {
      const response = await makeWordPressRequest("POST", "plugins", params);
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error creating plugin: ${errorMessage}` }]
        }
      };
    }
  },
  delete_plugin: async (params: z.infer<typeof deletePluginSchema>) => {
    try {
      const response = await makeWordPressRequest("DELETE", `plugins/${params.plugin}`);
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error deleting plugin: ${errorMessage}` }]
        }
      };
    }
  }
};
import { executeWpCli, isMultisite } from '../wpcli.js';
import { z } from 'zod';
// ── Schemas ──────────────────────────────────────────────────────────
const msListSitesSchema = z.object({
    site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();
const msGetSiteSchema = z.object({
    blog_id: z.number().describe('Blog ID of the sub-site to retrieve'),
    site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();
const msCreateSiteSchema = z.object({
    slug: z.string().describe('URL slug for the new sub-site (e.g., "blog", "shop")'),
    title: z.string().describe('Title of the new sub-site'),
    email: z.string().describe('Admin email for the new sub-site'),
    site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();
const msActivateSiteSchema = z.object({
    blog_id: z.number().describe('Blog ID of the sub-site'),
    active: z.boolean().describe('true to activate, false to deactivate'),
    site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();
const msDeleteSiteSchema = z.object({
    blog_id: z.number().describe('Blog ID of the sub-site to delete'),
    confirm: z.literal(true).describe('Must be true to confirm deletion (safety gate)'),
    site_id: z.string().optional().describe('Target site ID (defaults to active site)')
}).strict();
// ── Tools ────────────────────────────────────────────────────────────
export const multisiteSiteTools = [
    {
        name: 'ms_list_sites',
        description: 'Lists all sub-sites in a WordPress Multisite network. Requires wp-cli and is_multisite configuration.',
        inputSchema: { type: 'object', properties: msListSitesSchema.shape }
    },
    {
        name: 'ms_get_site',
        description: 'Gets details of a specific sub-site by blog ID.',
        inputSchema: { type: 'object', properties: msGetSiteSchema.shape }
    },
    {
        name: 'ms_create_site',
        description: 'Creates a new sub-site in the multisite network.',
        inputSchema: { type: 'object', properties: msCreateSiteSchema.shape }
    },
    {
        name: 'ms_activate_site',
        description: 'Activates or deactivates a sub-site in the multisite network.',
        inputSchema: { type: 'object', properties: msActivateSiteSchema.shape }
    },
    {
        name: 'ms_delete_site',
        description: 'Permanently deletes a sub-site. Requires confirm: true as safety gate.',
        inputSchema: { type: 'object', properties: msDeleteSiteSchema.shape }
    }
];
// ── Helpers ──────────────────────────────────────────────────────────
function requireMultisite(siteId) {
    if (!isMultisite(siteId)) {
        throw new Error(`Site is not configured as multisite. ` +
            `Set is_multisite: true in WP_SITES_CONFIG.`);
    }
}
// ── Handlers ─────────────────────────────────────────────────────────
export const multisiteSiteHandlers = {
    ms_list_sites: async (params) => {
        try {
            requireMultisite(params.site_id);
            const result = await executeWpCli('site list', params.site_id);
            return {
                toolResult: {
                    content: [{ type: 'text', text: result }]
                }
            };
        }
        catch (error) {
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error listing sites: ${error.message}` }]
                }
            };
        }
    },
    ms_get_site: async (params) => {
        try {
            requireMultisite(params.site_id);
            const result = await executeWpCli(`site list --blog_id=${params.blog_id}`, params.site_id);
            return {
                toolResult: {
                    content: [{ type: 'text', text: result }]
                }
            };
        }
        catch (error) {
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error getting site: ${error.message}` }]
                }
            };
        }
    },
    ms_create_site: async (params) => {
        try {
            requireMultisite(params.site_id);
            const result = await executeWpCli(`site create --slug=${params.slug} --title="${params.title}" --email=${params.email}`, params.site_id, { skipJson: true });
            return {
                toolResult: {
                    content: [{ type: 'text', text: result }]
                }
            };
        }
        catch (error) {
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error creating site: ${error.message}` }]
                }
            };
        }
    },
    ms_activate_site: async (params) => {
        try {
            requireMultisite(params.site_id);
            const action = params.active ? 'activate' : 'deactivate';
            const result = await executeWpCli(`site ${action} ${params.blog_id}`, params.site_id, { skipJson: true });
            return {
                toolResult: {
                    content: [{ type: 'text', text: result || `Site ${params.blog_id} ${action}d successfully.` }]
                }
            };
        }
        catch (error) {
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error ${params.active ? 'activating' : 'deactivating'} site: ${error.message}` }]
                }
            };
        }
    },
    ms_delete_site: async (params) => {
        try {
            requireMultisite(params.site_id);
            const result = await executeWpCli(`site delete ${params.blog_id} --yes`, params.site_id, { skipJson: true });
            return {
                toolResult: {
                    content: [{ type: 'text', text: result || `Site ${params.blog_id} deleted successfully.` }]
                }
            };
        }
        catch (error) {
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error deleting site: ${error.message}` }]
                }
            };
        }
    }
};

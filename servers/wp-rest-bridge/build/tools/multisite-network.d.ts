import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const msListNetworkPluginsSchema: z.ZodObject<{
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    site_id?: string | undefined;
}, {
    site_id?: string | undefined;
}>;
declare const msNetworkActivatePluginSchema: z.ZodObject<{
    plugin_slug: z.ZodString;
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    plugin_slug: string;
    site_id?: string | undefined;
}, {
    plugin_slug: string;
    site_id?: string | undefined;
}>;
declare const msNetworkDeactivatePluginSchema: z.ZodObject<{
    plugin_slug: z.ZodString;
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    plugin_slug: string;
    site_id?: string | undefined;
}, {
    plugin_slug: string;
    site_id?: string | undefined;
}>;
declare const msListSuperAdminsSchema: z.ZodObject<{
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    site_id?: string | undefined;
}, {
    site_id?: string | undefined;
}>;
declare const msGetNetworkSettingsSchema: z.ZodObject<{
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    site_id?: string | undefined;
}, {
    site_id?: string | undefined;
}>;
export declare const multisiteNetworkTools: Tool[];
export declare const multisiteNetworkHandlers: {
    ms_list_network_plugins: (params: z.infer<typeof msListNetworkPluginsSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_network_activate_plugin: (params: z.infer<typeof msNetworkActivatePluginSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_network_deactivate_plugin: (params: z.infer<typeof msNetworkDeactivatePluginSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_list_super_admins: (params: z.infer<typeof msListSuperAdminsSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_get_network_settings: (params: z.infer<typeof msGetNetworkSettingsSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
};
export {};

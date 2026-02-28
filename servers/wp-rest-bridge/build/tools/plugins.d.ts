import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const listPluginsSchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "inactive"]>>>;
}, "strict", z.ZodTypeAny, {
    status: "active" | "inactive";
}, {
    status?: "active" | "inactive" | undefined;
}>;
declare const getPluginSchema: z.ZodObject<{
    plugin: z.ZodString;
}, "strict", z.ZodTypeAny, {
    plugin: string;
}, {
    plugin: string;
}>;
declare const activatePluginSchema: z.ZodObject<{
    plugin: z.ZodString;
}, "strict", z.ZodTypeAny, {
    plugin: string;
}, {
    plugin: string;
}>;
declare const deactivatePluginSchema: z.ZodObject<{
    plugin: z.ZodString;
}, "strict", z.ZodTypeAny, {
    plugin: string;
}, {
    plugin: string;
}>;
declare const createPluginSchema: z.ZodObject<{
    slug: z.ZodString;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["inactive", "active"]>>>;
}, "strict", z.ZodTypeAny, {
    slug: string;
    status: "active" | "inactive";
}, {
    slug: string;
    status?: "active" | "inactive" | undefined;
}>;
declare const deletePluginSchema: z.ZodObject<{
    plugin: z.ZodString;
}, "strict", z.ZodTypeAny, {
    plugin: string;
}, {
    plugin: string;
}>;
export declare const pluginTools: Tool[];
export declare const pluginHandlers: {
    list_plugins: (params: z.infer<typeof listPluginsSchema>) => Promise<{
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
    get_plugin: (params: z.infer<typeof getPluginSchema>) => Promise<{
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
    activate_plugin: (params: z.infer<typeof activatePluginSchema>) => Promise<{
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
    deactivate_plugin: (params: z.infer<typeof deactivatePluginSchema>) => Promise<{
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
    create_plugin: (params: z.infer<typeof createPluginSchema>) => Promise<{
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
    delete_plugin: (params: z.infer<typeof deletePluginSchema>) => Promise<{
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

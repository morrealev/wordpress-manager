import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const searchPluginRepositorySchema: z.ZodObject<{
    search: z.ZodString;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    page: number;
    per_page: number;
    search: string;
}, {
    search: string;
    page?: number | undefined;
    per_page?: number | undefined;
}>;
declare const getPluginDetailsSchema: z.ZodObject<{
    slug: z.ZodString;
}, "strict", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
type SearchPluginRepositoryParams = z.infer<typeof searchPluginRepositorySchema>;
type GetPluginDetailsParams = z.infer<typeof getPluginDetailsSchema>;
export declare const pluginRepositoryTools: Tool[];
export declare const pluginRepositoryHandlers: {
    search_plugin_repository: (params: SearchPluginRepositoryParams) => Promise<{
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
    get_plugin_details: (params: GetPluginDetailsParams) => Promise<{
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

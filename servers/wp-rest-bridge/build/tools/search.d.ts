import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const wpSearchSchema: z.ZodObject<{
    search: z.ZodString;
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodString>;
    subtype: z.ZodOptional<z.ZodString>;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
    include_pagination: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    search: string;
    type?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    subtype?: string | undefined;
}, {
    search: string;
    type?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    subtype?: string | undefined;
}>;
type WpSearchParams = z.infer<typeof wpSearchSchema>;
export declare const searchTools: Tool[];
export declare const searchHandlers: {
    wp_search: (params: WpSearchParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
};
export {};

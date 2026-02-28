import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const listMediaSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
    include_pagination: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
}, {
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
}>;
declare const getMediaSchema: z.ZodObject<{
    id: z.ZodNumber;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: number;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
}, {
    id: number;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
}>;
declare const createMediaSchema: z.ZodObject<{
    title: z.ZodString;
    alt_text: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    source_url: z.ZodString;
}, "strict", z.ZodTypeAny, {
    title: string;
    source_url: string;
    description?: string | undefined;
    alt_text?: string | undefined;
    caption?: string | undefined;
}, {
    title: string;
    source_url: string;
    description?: string | undefined;
    alt_text?: string | undefined;
    caption?: string | undefined;
}>;
declare const editMediaSchema: z.ZodObject<{
    id: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    alt_text: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: number;
    title?: string | undefined;
    description?: string | undefined;
    alt_text?: string | undefined;
    caption?: string | undefined;
}, {
    id: number;
    title?: string | undefined;
    description?: string | undefined;
    alt_text?: string | undefined;
    caption?: string | undefined;
}>;
declare const deleteMediaSchema: z.ZodObject<{
    id: z.ZodNumber;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    id: number;
    force?: boolean | undefined;
}, {
    id: number;
    force?: boolean | undefined;
}>;
export declare const mediaTools: Tool[];
export declare const mediaHandlers: {
    list_media: (params: z.infer<typeof listMediaSchema>) => Promise<{
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
    get_media: (params: z.infer<typeof getMediaSchema>) => Promise<{
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
    create_media: (params: z.infer<typeof createMediaSchema>) => Promise<{
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
    edit_media: (params: z.infer<typeof editMediaSchema>) => Promise<{
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
    delete_media: (params: z.infer<typeof deleteMediaSchema>) => Promise<{
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

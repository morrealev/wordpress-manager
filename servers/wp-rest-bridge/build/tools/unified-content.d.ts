import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const listContentSchema: z.ZodObject<{
    content_type: z.ZodString;
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>>;
    categories: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>>;
    tags: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>>;
    parent: z.ZodOptional<z.ZodNumber>;
    orderby: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    after: z.ZodOptional<z.ZodString>;
    before: z.ZodOptional<z.ZodString>;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
    include_pagination: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content_type: string;
    search?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    slug?: string | undefined;
    status?: string | undefined;
    author?: number | number[] | undefined;
    categories?: number | number[] | undefined;
    tags?: number | number[] | undefined;
    parent?: number | undefined;
    orderby?: string | undefined;
    order?: "asc" | "desc" | undefined;
    after?: string | undefined;
    before?: string | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
}, {
    content_type: string;
    search?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    slug?: string | undefined;
    status?: string | undefined;
    author?: number | number[] | undefined;
    categories?: number | number[] | undefined;
    tags?: number | number[] | undefined;
    parent?: number | undefined;
    orderby?: string | undefined;
    order?: "asc" | "desc" | undefined;
    after?: string | undefined;
    before?: string | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
}>;
declare const getContentSchema: z.ZodObject<{
    content_type: z.ZodString;
    id: z.ZodNumber;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    content_type: string;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
}, {
    id: number;
    content_type: string;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
}>;
declare const createContentSchema: z.ZodObject<{
    content_type: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    excerpt: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodNumber>;
    parent: z.ZodOptional<z.ZodNumber>;
    categories: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    featured_media: z.ZodOptional<z.ZodNumber>;
    format: z.ZodOptional<z.ZodString>;
    menu_order: z.ZodOptional<z.ZodNumber>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    custom_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    content_type: string;
    status: string;
    title: string;
    content: string;
    slug?: string | undefined;
    author?: number | undefined;
    categories?: number[] | undefined;
    tags?: number[] | undefined;
    parent?: number | undefined;
    excerpt?: string | undefined;
    featured_media?: number | undefined;
    format?: string | undefined;
    menu_order?: number | undefined;
    meta?: Record<string, any> | undefined;
    custom_fields?: Record<string, any> | undefined;
}, {
    content_type: string;
    title: string;
    content: string;
    slug?: string | undefined;
    status?: string | undefined;
    author?: number | undefined;
    categories?: number[] | undefined;
    tags?: number[] | undefined;
    parent?: number | undefined;
    excerpt?: string | undefined;
    featured_media?: number | undefined;
    format?: string | undefined;
    menu_order?: number | undefined;
    meta?: Record<string, any> | undefined;
    custom_fields?: Record<string, any> | undefined;
}>;
declare const updateContentSchema: z.ZodObject<{
    content_type: z.ZodString;
    id: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodNumber>;
    parent: z.ZodOptional<z.ZodNumber>;
    categories: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    featured_media: z.ZodOptional<z.ZodNumber>;
    format: z.ZodOptional<z.ZodString>;
    menu_order: z.ZodOptional<z.ZodNumber>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    custom_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: number;
    content_type: string;
    slug?: string | undefined;
    status?: string | undefined;
    author?: number | undefined;
    categories?: number[] | undefined;
    tags?: number[] | undefined;
    parent?: number | undefined;
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    featured_media?: number | undefined;
    format?: string | undefined;
    menu_order?: number | undefined;
    meta?: Record<string, any> | undefined;
    custom_fields?: Record<string, any> | undefined;
}, {
    id: number;
    content_type: string;
    slug?: string | undefined;
    status?: string | undefined;
    author?: number | undefined;
    categories?: number[] | undefined;
    tags?: number[] | undefined;
    parent?: number | undefined;
    title?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    featured_media?: number | undefined;
    format?: string | undefined;
    menu_order?: number | undefined;
    meta?: Record<string, any> | undefined;
    custom_fields?: Record<string, any> | undefined;
}>;
declare const deleteContentSchema: z.ZodObject<{
    content_type: z.ZodString;
    id: z.ZodNumber;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: number;
    content_type: string;
    force?: boolean | undefined;
}, {
    id: number;
    content_type: string;
    force?: boolean | undefined;
}>;
declare const discoverContentTypesSchema: z.ZodObject<{
    refresh_cache: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    refresh_cache?: boolean | undefined;
}, {
    refresh_cache?: boolean | undefined;
}>;
declare const findContentByUrlSchema: z.ZodObject<{
    url: z.ZodString;
    update_fields: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        custom_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        status?: string | undefined;
        title?: string | undefined;
        content?: string | undefined;
        meta?: Record<string, any> | undefined;
        custom_fields?: Record<string, any> | undefined;
    }, {
        status?: string | undefined;
        title?: string | undefined;
        content?: string | undefined;
        meta?: Record<string, any> | undefined;
        custom_fields?: Record<string, any> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    update_fields?: {
        status?: string | undefined;
        title?: string | undefined;
        content?: string | undefined;
        meta?: Record<string, any> | undefined;
        custom_fields?: Record<string, any> | undefined;
    } | undefined;
}, {
    url: string;
    update_fields?: {
        status?: string | undefined;
        title?: string | undefined;
        content?: string | undefined;
        meta?: Record<string, any> | undefined;
        custom_fields?: Record<string, any> | undefined;
    } | undefined;
}>;
declare const getContentBySlugSchema: z.ZodObject<{
    slug: z.ZodString;
    content_types: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    slug: string;
    content_types?: string[] | undefined;
}, {
    slug: string;
    content_types?: string[] | undefined;
}>;
type ListContentParams = z.infer<typeof listContentSchema>;
type GetContentParams = z.infer<typeof getContentSchema>;
type CreateContentParams = z.infer<typeof createContentSchema>;
type UpdateContentParams = z.infer<typeof updateContentSchema>;
type DeleteContentParams = z.infer<typeof deleteContentSchema>;
type DiscoverContentTypesParams = z.infer<typeof discoverContentTypesSchema>;
type FindContentByUrlParams = z.infer<typeof findContentByUrlSchema>;
type GetContentBySlugParams = z.infer<typeof getContentBySlugSchema>;
export declare const unifiedContentTools: Tool[];
export declare const unifiedContentHandlers: {
    list_content: (params: ListContentParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_content: (params: GetContentParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    create_content: (params: CreateContentParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    update_content: (params: UpdateContentParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    delete_content: (params: DeleteContentParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    discover_content_types: (params: DiscoverContentTypesParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    find_content_by_url: (params: FindContentByUrlParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_content_by_slug: (params: GetContentBySlugParams) => Promise<{
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

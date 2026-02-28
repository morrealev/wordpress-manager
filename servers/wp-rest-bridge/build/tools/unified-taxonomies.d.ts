import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const discoverTaxonomiesSchema: z.ZodObject<{
    content_type: z.ZodOptional<z.ZodString>;
    refresh_cache: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content_type?: string | undefined;
    refresh_cache?: boolean | undefined;
}, {
    content_type?: string | undefined;
    refresh_cache?: boolean | undefined;
}>;
declare const listTermsSchema: z.ZodObject<{
    taxonomy: z.ZodString;
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    parent: z.ZodOptional<z.ZodNumber>;
    slug: z.ZodOptional<z.ZodString>;
    hide_empty: z.ZodOptional<z.ZodBoolean>;
    orderby: z.ZodOptional<z.ZodEnum<["id", "include", "name", "slug", "term_group", "description", "count"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
    include_pagination: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    taxonomy: string;
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    slug?: string | undefined;
    parent?: number | undefined;
    orderby?: "slug" | "id" | "description" | "name" | "include" | "term_group" | "count" | undefined;
    order?: "asc" | "desc" | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    hide_empty?: boolean | undefined;
}, {
    taxonomy: string;
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    slug?: string | undefined;
    parent?: number | undefined;
    orderby?: "slug" | "id" | "description" | "name" | "include" | "term_group" | "count" | undefined;
    order?: "asc" | "desc" | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    hide_empty?: boolean | undefined;
}>;
declare const getTermSchema: z.ZodObject<{
    taxonomy: z.ZodString;
    id: z.ZodNumber;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    taxonomy: string;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
}, {
    id: number;
    taxonomy: string;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
}>;
declare const createTermSchema: z.ZodObject<{
    taxonomy: z.ZodString;
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    parent: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    taxonomy: string;
    slug?: string | undefined;
    parent?: number | undefined;
    meta?: Record<string, any> | undefined;
    description?: string | undefined;
}, {
    name: string;
    taxonomy: string;
    slug?: string | undefined;
    parent?: number | undefined;
    meta?: Record<string, any> | undefined;
    description?: string | undefined;
}>;
declare const updateTermSchema: z.ZodObject<{
    taxonomy: z.ZodString;
    id: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    parent: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: number;
    taxonomy: string;
    slug?: string | undefined;
    parent?: number | undefined;
    meta?: Record<string, any> | undefined;
    description?: string | undefined;
    name?: string | undefined;
}, {
    id: number;
    taxonomy: string;
    slug?: string | undefined;
    parent?: number | undefined;
    meta?: Record<string, any> | undefined;
    description?: string | undefined;
    name?: string | undefined;
}>;
declare const deleteTermSchema: z.ZodObject<{
    taxonomy: z.ZodString;
    id: z.ZodNumber;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: number;
    taxonomy: string;
    force?: boolean | undefined;
}, {
    id: number;
    taxonomy: string;
    force?: boolean | undefined;
}>;
declare const assignTermsToContentSchema: z.ZodObject<{
    content_id: z.ZodNumber;
    content_type: z.ZodString;
    taxonomy: z.ZodString;
    terms: z.ZodArray<z.ZodUnion<[z.ZodNumber, z.ZodString]>, "many">;
    append: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content_type: string;
    taxonomy: string;
    content_id: number;
    terms: (string | number)[];
    append?: boolean | undefined;
}, {
    content_type: string;
    taxonomy: string;
    content_id: number;
    terms: (string | number)[];
    append?: boolean | undefined;
}>;
declare const getContentTermsSchema: z.ZodObject<{
    content_id: z.ZodNumber;
    content_type: z.ZodString;
    taxonomy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content_type: string;
    content_id: number;
    taxonomy?: string | undefined;
}, {
    content_type: string;
    content_id: number;
    taxonomy?: string | undefined;
}>;
type DiscoverTaxonomiesParams = z.infer<typeof discoverTaxonomiesSchema>;
type ListTermsParams = z.infer<typeof listTermsSchema>;
type GetTermParams = z.infer<typeof getTermSchema>;
type CreateTermParams = z.infer<typeof createTermSchema>;
type UpdateTermParams = z.infer<typeof updateTermSchema>;
type DeleteTermParams = z.infer<typeof deleteTermSchema>;
type AssignTermsToContentParams = z.infer<typeof assignTermsToContentSchema>;
type GetContentTermsParams = z.infer<typeof getContentTermsSchema>;
export declare const unifiedTaxonomyTools: Tool[];
export declare const unifiedTaxonomyHandlers: {
    discover_taxonomies: (params: DiscoverTaxonomiesParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    list_terms: (params: ListTermsParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_term: (params: GetTermParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    create_term: (params: CreateTermParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    update_term: (params: UpdateTermParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    delete_term: (params: DeleteTermParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    assign_terms_to_content: (params: AssignTermsToContentParams) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_content_terms: (params: GetContentTermsParams) => Promise<{
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

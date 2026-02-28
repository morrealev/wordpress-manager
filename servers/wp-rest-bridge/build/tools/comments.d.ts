import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const listCommentsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    after: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodArray<z.ZodNumber, "many">]>>;
    author_email: z.ZodOptional<z.ZodString>;
    author_exclude: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    post: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["approve", "hold", "spam", "trash"]>>;
    type: z.ZodOptional<z.ZodString>;
    orderby: z.ZodOptional<z.ZodEnum<["date", "date_gmt", "id", "include", "post", "parent", "type"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
    include_pagination: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    post?: number | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    status?: "approve" | "hold" | "spam" | "trash" | undefined;
    type?: string | undefined;
    author?: number | number[] | undefined;
    orderby?: "post" | "type" | "date" | "parent" | "id" | "include" | "date_gmt" | undefined;
    order?: "asc" | "desc" | undefined;
    after?: string | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    author_email?: string | undefined;
    author_exclude?: number[] | undefined;
}, {
    post?: number | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    status?: "approve" | "hold" | "spam" | "trash" | undefined;
    type?: string | undefined;
    author?: number | number[] | undefined;
    orderby?: "post" | "type" | "date" | "parent" | "id" | "include" | "date_gmt" | undefined;
    order?: "asc" | "desc" | undefined;
    after?: string | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    author_email?: string | undefined;
    author_exclude?: number[] | undefined;
}>;
declare const getCommentSchema: z.ZodObject<{
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
declare const createCommentSchema: z.ZodObject<{
    post: z.ZodNumber;
    author: z.ZodOptional<z.ZodNumber>;
    author_name: z.ZodOptional<z.ZodString>;
    author_email: z.ZodOptional<z.ZodString>;
    author_url: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    parent: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["approve", "hold"]>>;
}, "strict", z.ZodTypeAny, {
    post: number;
    content: string;
    status?: "approve" | "hold" | undefined;
    author?: number | undefined;
    parent?: number | undefined;
    author_email?: string | undefined;
    author_name?: string | undefined;
    author_url?: string | undefined;
}, {
    post: number;
    content: string;
    status?: "approve" | "hold" | undefined;
    author?: number | undefined;
    parent?: number | undefined;
    author_email?: string | undefined;
    author_name?: string | undefined;
    author_url?: string | undefined;
}>;
declare const updateCommentSchema: z.ZodObject<{
    id: z.ZodNumber;
    post: z.ZodOptional<z.ZodNumber>;
    author: z.ZodOptional<z.ZodNumber>;
    author_name: z.ZodOptional<z.ZodString>;
    author_email: z.ZodOptional<z.ZodString>;
    author_url: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    parent: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["approve", "hold", "spam", "trash"]>>;
}, "strict", z.ZodTypeAny, {
    id: number;
    post?: number | undefined;
    status?: "approve" | "hold" | "spam" | "trash" | undefined;
    author?: number | undefined;
    parent?: number | undefined;
    content?: string | undefined;
    author_email?: string | undefined;
    author_name?: string | undefined;
    author_url?: string | undefined;
}, {
    id: number;
    post?: number | undefined;
    status?: "approve" | "hold" | "spam" | "trash" | undefined;
    author?: number | undefined;
    parent?: number | undefined;
    content?: string | undefined;
    author_email?: string | undefined;
    author_name?: string | undefined;
    author_url?: string | undefined;
}>;
declare const deleteCommentSchema: z.ZodObject<{
    id: z.ZodNumber;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    id: number;
    force?: boolean | undefined;
}, {
    id: number;
    force?: boolean | undefined;
}>;
type ListCommentsParams = z.infer<typeof listCommentsSchema>;
type GetCommentParams = z.infer<typeof getCommentSchema>;
type CreateCommentParams = z.infer<typeof createCommentSchema>;
type UpdateCommentParams = z.infer<typeof updateCommentSchema>;
type DeleteCommentParams = z.infer<typeof deleteCommentSchema>;
export declare const commentTools: Tool[];
export declare const commentHandlers: {
    list_comments: (params: ListCommentsParams) => Promise<{
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
    get_comment: (params: GetCommentParams) => Promise<{
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
    create_comment: (params: CreateCommentParams) => Promise<{
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
    update_comment: (params: UpdateCommentParams) => Promise<{
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
    delete_comment: (params: DeleteCommentParams) => Promise<{
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

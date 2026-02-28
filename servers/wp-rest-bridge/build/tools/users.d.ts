import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const listUsersSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodEnum<["view", "embed", "edit"]>>;
    orderby: z.ZodOptional<z.ZodEnum<["id", "include", "name", "registered_date", "slug", "email", "url"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
    include_pagination: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    orderby?: "url" | "slug" | "id" | "name" | "include" | "registered_date" | "email" | undefined;
    order?: "asc" | "desc" | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    context?: "view" | "embed" | "edit" | undefined;
    roles?: string[] | undefined;
}, {
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    orderby?: "url" | "slug" | "id" | "name" | "include" | "registered_date" | "email" | undefined;
    order?: "asc" | "desc" | undefined;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    include_pagination?: boolean | undefined;
    context?: "view" | "embed" | "edit" | undefined;
    roles?: string[] | undefined;
}>;
declare const getUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    context: z.ZodOptional<z.ZodEnum<["view", "embed", "edit"]>>;
    _embed: z.ZodOptional<z.ZodBoolean>;
    _fields: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: number;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    context?: "view" | "embed" | "edit" | undefined;
}, {
    id: number;
    _embed?: boolean | undefined;
    _fields?: string | undefined;
    context?: "view" | "embed" | "edit" | undefined;
}>;
declare const getMeSchema: z.ZodObject<{
    context: z.ZodOptional<z.ZodEnum<["view", "embed", "edit"]>>;
    _fields: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    _fields?: string | undefined;
    context?: "view" | "embed" | "edit" | undefined;
}, {
    _fields?: string | undefined;
    context?: "view" | "embed" | "edit" | undefined;
}>;
declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    nickname: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    password: z.ZodString;
}, "strict", z.ZodTypeAny, {
    email: string;
    username: string;
    password: string;
    url?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    roles?: string[] | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    locale?: string | undefined;
    nickname?: string | undefined;
}, {
    email: string;
    username: string;
    password: string;
    url?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    roles?: string[] | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    locale?: string | undefined;
    nickname?: string | undefined;
}>;
declare const updateUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    nickname: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    password: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: number;
    url?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    roles?: string[] | undefined;
    username?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    locale?: string | undefined;
    nickname?: string | undefined;
    password?: string | undefined;
}, {
    id: number;
    url?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    roles?: string[] | undefined;
    username?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    locale?: string | undefined;
    nickname?: string | undefined;
    password?: string | undefined;
}>;
declare const deleteUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    force: z.ZodOptional<z.ZodBoolean>;
    reassign: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    id: number;
    force?: boolean | undefined;
    reassign?: number | undefined;
}, {
    id: number;
    force?: boolean | undefined;
    reassign?: number | undefined;
}>;
type ListUsersParams = z.infer<typeof listUsersSchema>;
type GetUserParams = z.infer<typeof getUserSchema>;
type CreateUserParams = z.infer<typeof createUserSchema>;
type UpdateUserParams = z.infer<typeof updateUserSchema>;
type DeleteUserParams = z.infer<typeof deleteUserSchema>;
export declare const userTools: Tool[];
export declare const userHandlers: {
    list_users: (params: ListUsersParams) => Promise<{
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
    get_user: (params: GetUserParams) => Promise<{
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
    get_me: (params: z.infer<typeof getMeSchema>) => Promise<{
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
    create_user: (params: CreateUserParams) => Promise<{
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
    update_user: (params: UpdateUserParams) => Promise<{
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
    delete_user: (params: DeleteUserParams) => Promise<{
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

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const wcListCustomersSchema: z.ZodObject<{
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<["all", "administrator", "editor", "author", "contributor", "subscriber", "customer"]>>>;
    orderby: z.ZodOptional<z.ZodEnum<["id", "name", "registered_date"]>>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strict", z.ZodTypeAny, {
    page: number;
    per_page: number;
    order: "asc" | "desc";
    role: "author" | "customer" | "all" | "administrator" | "editor" | "contributor" | "subscriber";
    search?: string | undefined;
    email?: string | undefined;
    orderby?: "id" | "name" | "registered_date" | undefined;
}, {
    search?: string | undefined;
    email?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    orderby?: "id" | "name" | "registered_date" | undefined;
    order?: "asc" | "desc" | undefined;
    role?: "author" | "customer" | "all" | "administrator" | "editor" | "contributor" | "subscriber" | undefined;
}>;
declare const wcGetCustomerSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
declare const wcCreateCustomerSchema: z.ZodObject<{
    email: z.ZodString;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    email: string;
    username?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    password?: string | undefined;
}, {
    email: string;
    username?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    password?: string | undefined;
}>;
declare const wcUpdateCustomerSchema: z.ZodObject<{
    id: z.ZodNumber;
    email: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: number;
    email?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
}, {
    id: number;
    email?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
}>;
export declare const wcCustomerTools: Tool[];
export declare const wcCustomerHandlers: {
    wc_list_customers: (params: z.infer<typeof wcListCustomersSchema>) => Promise<{
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
    wc_get_customer: (params: z.infer<typeof wcGetCustomerSchema>) => Promise<{
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
    wc_create_customer: (params: z.infer<typeof wcCreateCustomerSchema>) => Promise<{
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
    wc_update_customer: (params: z.infer<typeof wcUpdateCustomerSchema>) => Promise<{
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

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const wcListOrdersSchema: z.ZodObject<{
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed", "trash", "any"]>>;
    customer: z.ZodOptional<z.ZodNumber>;
    after: z.ZodOptional<z.ZodString>;
    before: z.ZodOptional<z.ZodString>;
    orderby: z.ZodOptional<z.ZodEnum<["date", "id", "title", "slug"]>>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strict", z.ZodTypeAny, {
    page: number;
    per_page: number;
    order: "asc" | "desc";
    status?: "trash" | "pending" | "any" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed" | undefined;
    orderby?: "slug" | "date" | "id" | "title" | undefined;
    after?: string | undefined;
    before?: string | undefined;
    customer?: number | undefined;
}, {
    page?: number | undefined;
    per_page?: number | undefined;
    status?: "trash" | "pending" | "any" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed" | undefined;
    orderby?: "slug" | "date" | "id" | "title" | undefined;
    order?: "asc" | "desc" | undefined;
    after?: string | undefined;
    before?: string | undefined;
    customer?: number | undefined;
}>;
declare const wcGetOrderSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
declare const wcUpdateOrderStatusSchema: z.ZodObject<{
    id: z.ZodNumber;
    status: z.ZodEnum<["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]>;
}, "strict", z.ZodTypeAny, {
    status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed";
    id: number;
}, {
    status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed";
    id: number;
}>;
declare const wcListOrderNotesSchema: z.ZodObject<{
    order_id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    order_id: number;
}, {
    order_id: number;
}>;
declare const wcCreateOrderNoteSchema: z.ZodObject<{
    order_id: z.ZodNumber;
    note: z.ZodString;
    customer_note: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    order_id: number;
    note: string;
    customer_note: boolean;
}, {
    order_id: number;
    note: string;
    customer_note?: boolean | undefined;
}>;
declare const wcCreateRefundSchema: z.ZodObject<{
    order_id: z.ZodNumber;
    amount: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    order_id: number;
    amount: string;
    reason?: string | undefined;
}, {
    order_id: number;
    amount: string;
    reason?: string | undefined;
}>;
export declare const wcOrderTools: Tool[];
export declare const wcOrderHandlers: {
    wc_list_orders: (params: z.infer<typeof wcListOrdersSchema>) => Promise<{
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
    wc_get_order: (params: z.infer<typeof wcGetOrderSchema>) => Promise<{
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
    wc_update_order_status: (params: z.infer<typeof wcUpdateOrderStatusSchema>) => Promise<{
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
    wc_list_order_notes: (params: z.infer<typeof wcListOrderNotesSchema>) => Promise<{
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
    wc_create_order_note: (params: z.infer<typeof wcCreateOrderNoteSchema>) => Promise<{
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
    wc_create_refund: (params: z.infer<typeof wcCreateRefundSchema>) => Promise<{
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

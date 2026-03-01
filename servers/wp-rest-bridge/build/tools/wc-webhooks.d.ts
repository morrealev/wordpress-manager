import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const wcListWebhooksSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["active", "paused", "disabled"]>>;
}, "strict", z.ZodTypeAny, {
    status?: "active" | "paused" | "disabled" | undefined;
}, {
    status?: "active" | "paused" | "disabled" | undefined;
}>;
declare const wcCreateWebhookSchema: z.ZodObject<{
    name: z.ZodString;
    topic: z.ZodString;
    delivery_url: z.ZodString;
    secret: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "paused", "disabled"]>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    topic: string;
    delivery_url: string;
    secret?: string | undefined;
    status?: "active" | "paused" | "disabled" | undefined;
}, {
    name: string;
    topic: string;
    delivery_url: string;
    secret?: string | undefined;
    status?: "active" | "paused" | "disabled" | undefined;
}>;
declare const wcUpdateWebhookSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    delivery_url: z.ZodOptional<z.ZodString>;
    secret: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "paused", "disabled"]>>;
}, "strict", z.ZodTypeAny, {
    id: number;
    secret?: string | undefined;
    status?: "active" | "paused" | "disabled" | undefined;
    name?: string | undefined;
    topic?: string | undefined;
    delivery_url?: string | undefined;
}, {
    id: number;
    secret?: string | undefined;
    status?: "active" | "paused" | "disabled" | undefined;
    name?: string | undefined;
    topic?: string | undefined;
    delivery_url?: string | undefined;
}>;
declare const wcDeleteWebhookSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const wcWebhookTools: Tool[];
export declare const wcWebhookHandlers: {
    wc_list_webhooks: (params: z.infer<typeof wcListWebhooksSchema>) => Promise<{
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
    wc_create_webhook: (params: z.infer<typeof wcCreateWebhookSchema>) => Promise<{
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
    wc_update_webhook: (params: z.infer<typeof wcUpdateWebhookSchema>) => Promise<{
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
    wc_delete_webhook: (params: z.infer<typeof wcDeleteWebhookSchema>) => Promise<{
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

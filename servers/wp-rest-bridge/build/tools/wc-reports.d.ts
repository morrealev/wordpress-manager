import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const wcGetSalesReportSchema: z.ZodObject<{
    period: z.ZodDefault<z.ZodOptional<z.ZodEnum<["week", "month", "last_month", "year"]>>>;
    date_min: z.ZodOptional<z.ZodString>;
    date_max: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    period: "week" | "month" | "last_month" | "year";
    date_min?: string | undefined;
    date_max?: string | undefined;
}, {
    period?: "week" | "month" | "last_month" | "year" | undefined;
    date_min?: string | undefined;
    date_max?: string | undefined;
}>;
declare const wcGetTopSellersSchema: z.ZodObject<{
    period: z.ZodDefault<z.ZodOptional<z.ZodEnum<["week", "month", "last_month", "year"]>>>;
    date_min: z.ZodOptional<z.ZodString>;
    date_max: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    period: "week" | "month" | "last_month" | "year";
    date_min?: string | undefined;
    date_max?: string | undefined;
}, {
    period?: "week" | "month" | "last_month" | "year" | undefined;
    date_min?: string | undefined;
    date_max?: string | undefined;
}>;
export declare const wcReportTools: Tool[];
export declare const wcReportHandlers: {
    wc_get_sales_report: (params: z.infer<typeof wcGetSalesReportSchema>) => Promise<{
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
    wc_get_top_sellers: (params: z.infer<typeof wcGetTopSellersSchema>) => Promise<{
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
    wc_get_orders_totals: () => Promise<{
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
    wc_get_products_totals: () => Promise<{
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
    wc_get_customers_totals: () => Promise<{
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

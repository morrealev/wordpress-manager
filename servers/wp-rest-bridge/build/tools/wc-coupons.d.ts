import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const wcListCouponsSchema: z.ZodObject<{
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    page: number;
    per_page: number;
    search?: string | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
}>;
declare const wcGetCouponSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
declare const wcCreateCouponSchema: z.ZodObject<{
    code: z.ZodString;
    discount_type: z.ZodDefault<z.ZodOptional<z.ZodEnum<["percent", "fixed_cart", "fixed_product"]>>>;
    amount: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    date_expires: z.ZodOptional<z.ZodString>;
    individual_use: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    product_ids: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    usage_limit: z.ZodOptional<z.ZodNumber>;
    usage_limit_per_user: z.ZodOptional<z.ZodNumber>;
    minimum_amount: z.ZodOptional<z.ZodString>;
    maximum_amount: z.ZodOptional<z.ZodString>;
    free_shipping: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    code: string;
    amount: string;
    discount_type: "percent" | "fixed_cart" | "fixed_product";
    individual_use: boolean;
    free_shipping: boolean;
    description?: string | undefined;
    date_expires?: string | undefined;
    product_ids?: number[] | undefined;
    usage_limit?: number | undefined;
    usage_limit_per_user?: number | undefined;
    minimum_amount?: string | undefined;
    maximum_amount?: string | undefined;
}, {
    code: string;
    amount: string;
    description?: string | undefined;
    discount_type?: "percent" | "fixed_cart" | "fixed_product" | undefined;
    date_expires?: string | undefined;
    individual_use?: boolean | undefined;
    product_ids?: number[] | undefined;
    usage_limit?: number | undefined;
    usage_limit_per_user?: number | undefined;
    minimum_amount?: string | undefined;
    maximum_amount?: string | undefined;
    free_shipping?: boolean | undefined;
}>;
declare const wcDeleteCouponSchema: z.ZodObject<{
    id: z.ZodNumber;
    force: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    id: number;
    force: boolean;
}, {
    id: number;
    force?: boolean | undefined;
}>;
export declare const wcCouponTools: Tool[];
export declare const wcCouponHandlers: {
    wc_list_coupons: (params: z.infer<typeof wcListCouponsSchema>) => Promise<{
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
    wc_get_coupon: (params: z.infer<typeof wcGetCouponSchema>) => Promise<{
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
    wc_create_coupon: (params: z.infer<typeof wcCreateCouponSchema>) => Promise<{
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
    wc_delete_coupon: (params: z.infer<typeof wcDeleteCouponSchema>) => Promise<{
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

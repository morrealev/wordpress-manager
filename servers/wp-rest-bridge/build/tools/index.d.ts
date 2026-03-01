import { Tool } from '@modelcontextprotocol/sdk/types.js';
export declare const allTools: Tool[];
export declare const toolHandlers: {
    wc_list_webhooks: (params: import("zod").TypeOf<import("zod").ZodObject<{
        status: import("zod").ZodOptional<import("zod").ZodEnum<["active", "paused", "disabled"]>>;
    }, "strict", import("zod").ZodTypeAny, {
        status?: "active" | "paused" | "disabled" | undefined;
    }, {
        status?: "active" | "paused" | "disabled" | undefined;
    }>>) => Promise<{
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
    wc_create_webhook: (params: import("zod").TypeOf<import("zod").ZodObject<{
        name: import("zod").ZodString;
        topic: import("zod").ZodString;
        delivery_url: import("zod").ZodString;
        secret: import("zod").ZodOptional<import("zod").ZodString>;
        status: import("zod").ZodOptional<import("zod").ZodEnum<["active", "paused", "disabled"]>>;
    }, "strict", import("zod").ZodTypeAny, {
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
    }>>) => Promise<{
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
    wc_update_webhook: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        name: import("zod").ZodOptional<import("zod").ZodString>;
        topic: import("zod").ZodOptional<import("zod").ZodString>;
        delivery_url: import("zod").ZodOptional<import("zod").ZodString>;
        secret: import("zod").ZodOptional<import("zod").ZodString>;
        status: import("zod").ZodOptional<import("zod").ZodEnum<["active", "paused", "disabled"]>>;
    }, "strict", import("zod").ZodTypeAny, {
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
    }>>) => Promise<{
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
    wc_delete_webhook: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>>) => Promise<{
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
    ms_list_network_plugins: (params: import("zod").TypeOf<import("zod").ZodObject<{
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        site_id?: string | undefined;
    }, {
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_network_activate_plugin: (params: import("zod").TypeOf<import("zod").ZodObject<{
        plugin_slug: import("zod").ZodString;
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        plugin_slug: string;
        site_id?: string | undefined;
    }, {
        plugin_slug: string;
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_network_deactivate_plugin: (params: import("zod").TypeOf<import("zod").ZodObject<{
        plugin_slug: import("zod").ZodString;
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        plugin_slug: string;
        site_id?: string | undefined;
    }, {
        plugin_slug: string;
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_list_super_admins: (params: import("zod").TypeOf<import("zod").ZodObject<{
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        site_id?: string | undefined;
    }, {
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_get_network_settings: (params: import("zod").TypeOf<import("zod").ZodObject<{
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        site_id?: string | undefined;
    }, {
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_list_sites: (params: import("zod").TypeOf<import("zod").ZodObject<{
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        site_id?: string | undefined;
    }, {
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_get_site: (params: import("zod").TypeOf<import("zod").ZodObject<{
        blog_id: import("zod").ZodNumber;
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        blog_id: number;
        site_id?: string | undefined;
    }, {
        blog_id: number;
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_create_site: (params: import("zod").TypeOf<import("zod").ZodObject<{
        slug: import("zod").ZodString;
        title: import("zod").ZodString;
        email: import("zod").ZodString;
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        email: string;
        slug: string;
        title: string;
        site_id?: string | undefined;
    }, {
        email: string;
        slug: string;
        title: string;
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_activate_site: (params: import("zod").TypeOf<import("zod").ZodObject<{
        blog_id: import("zod").ZodNumber;
        active: import("zod").ZodBoolean;
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        active: boolean;
        blog_id: number;
        site_id?: string | undefined;
    }, {
        active: boolean;
        blog_id: number;
        site_id?: string | undefined;
    }>>) => Promise<{
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
    ms_delete_site: (params: import("zod").TypeOf<import("zod").ZodObject<{
        blog_id: import("zod").ZodNumber;
        confirm: import("zod").ZodLiteral<true>;
        site_id: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        blog_id: number;
        confirm: true;
        site_id?: string | undefined;
    }, {
        blog_id: number;
        confirm: true;
        site_id?: string | undefined;
    }>>) => Promise<{
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
    wc_list_payment_gateways: () => Promise<{
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
    wc_list_shipping_zones: () => Promise<{
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
    wc_get_tax_classes: () => Promise<{
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
    wc_get_system_status: () => Promise<{
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
    wc_get_sales_report: (params: import("zod").TypeOf<import("zod").ZodObject<{
        period: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["week", "month", "last_month", "year"]>>>;
        date_min: import("zod").ZodOptional<import("zod").ZodString>;
        date_max: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        period: "week" | "month" | "last_month" | "year";
        date_min?: string | undefined;
        date_max?: string | undefined;
    }, {
        period?: "week" | "month" | "last_month" | "year" | undefined;
        date_min?: string | undefined;
        date_max?: string | undefined;
    }>>) => Promise<{
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
    wc_get_top_sellers: (params: import("zod").TypeOf<import("zod").ZodObject<{
        period: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["week", "month", "last_month", "year"]>>>;
        date_min: import("zod").ZodOptional<import("zod").ZodString>;
        date_max: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        period: "week" | "month" | "last_month" | "year";
        date_min?: string | undefined;
        date_max?: string | undefined;
    }, {
        period?: "week" | "month" | "last_month" | "year" | undefined;
        date_min?: string | undefined;
        date_max?: string | undefined;
    }>>) => Promise<{
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
    wc_list_coupons: (params: import("zod").TypeOf<import("zod").ZodObject<{
        per_page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        search: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        page: number;
        per_page: number;
        search?: string | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
    }>>) => Promise<{
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
    wc_get_coupon: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>>) => Promise<{
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
    wc_create_coupon: (params: import("zod").TypeOf<import("zod").ZodObject<{
        code: import("zod").ZodString;
        discount_type: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["percent", "fixed_cart", "fixed_product"]>>>;
        amount: import("zod").ZodString;
        description: import("zod").ZodOptional<import("zod").ZodString>;
        date_expires: import("zod").ZodOptional<import("zod").ZodString>;
        individual_use: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodBoolean>>;
        product_ids: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodNumber, "many">>;
        usage_limit: import("zod").ZodOptional<import("zod").ZodNumber>;
        usage_limit_per_user: import("zod").ZodOptional<import("zod").ZodNumber>;
        minimum_amount: import("zod").ZodOptional<import("zod").ZodString>;
        maximum_amount: import("zod").ZodOptional<import("zod").ZodString>;
        free_shipping: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodBoolean>>;
    }, "strict", import("zod").ZodTypeAny, {
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
    }>>) => Promise<{
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
    wc_delete_coupon: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        force: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodBoolean>>;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
        force: boolean;
    }, {
        id: number;
        force?: boolean | undefined;
    }>>) => Promise<{
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
    wc_list_customers: (params: import("zod").TypeOf<import("zod").ZodObject<{
        per_page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        search: import("zod").ZodOptional<import("zod").ZodString>;
        email: import("zod").ZodOptional<import("zod").ZodString>;
        role: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["all", "administrator", "editor", "author", "contributor", "subscriber", "customer"]>>>;
        orderby: import("zod").ZodOptional<import("zod").ZodEnum<["id", "name", "registered_date"]>>;
        order: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["asc", "desc"]>>>;
    }, "strict", import("zod").ZodTypeAny, {
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
    }>>) => Promise<{
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
    wc_get_customer: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>>) => Promise<{
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
    wc_create_customer: (params: import("zod").TypeOf<import("zod").ZodObject<{
        email: import("zod").ZodString;
        first_name: import("zod").ZodOptional<import("zod").ZodString>;
        last_name: import("zod").ZodOptional<import("zod").ZodString>;
        username: import("zod").ZodOptional<import("zod").ZodString>;
        password: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
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
    }>>) => Promise<{
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
    wc_update_customer: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        email: import("zod").ZodOptional<import("zod").ZodString>;
        first_name: import("zod").ZodOptional<import("zod").ZodString>;
        last_name: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
        email?: string | undefined;
        first_name?: string | undefined;
        last_name?: string | undefined;
    }, {
        id: number;
        email?: string | undefined;
        first_name?: string | undefined;
        last_name?: string | undefined;
    }>>) => Promise<{
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
    wc_list_orders: (params: import("zod").TypeOf<import("zod").ZodObject<{
        per_page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        status: import("zod").ZodOptional<import("zod").ZodEnum<["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed", "trash", "any"]>>;
        customer: import("zod").ZodOptional<import("zod").ZodNumber>;
        after: import("zod").ZodOptional<import("zod").ZodString>;
        before: import("zod").ZodOptional<import("zod").ZodString>;
        orderby: import("zod").ZodOptional<import("zod").ZodEnum<["date", "id", "title", "slug"]>>;
        order: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["asc", "desc"]>>>;
    }, "strict", import("zod").ZodTypeAny, {
        page: number;
        per_page: number;
        order: "asc" | "desc";
        status?: "trash" | "pending" | "any" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed" | undefined;
        orderby?: "id" | "slug" | "date" | "title" | undefined;
        after?: string | undefined;
        before?: string | undefined;
        customer?: number | undefined;
    }, {
        page?: number | undefined;
        per_page?: number | undefined;
        status?: "trash" | "pending" | "any" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed" | undefined;
        orderby?: "id" | "slug" | "date" | "title" | undefined;
        order?: "asc" | "desc" | undefined;
        after?: string | undefined;
        before?: string | undefined;
        customer?: number | undefined;
    }>>) => Promise<{
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
    wc_get_order: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>>) => Promise<{
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
    wc_update_order_status: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        status: import("zod").ZodEnum<["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]>;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
        status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed";
    }, {
        id: number;
        status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed";
    }>>) => Promise<{
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
    wc_list_order_notes: (params: import("zod").TypeOf<import("zod").ZodObject<{
        order_id: import("zod").ZodNumber;
    }, "strict", import("zod").ZodTypeAny, {
        order_id: number;
    }, {
        order_id: number;
    }>>) => Promise<{
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
    wc_create_order_note: (params: import("zod").TypeOf<import("zod").ZodObject<{
        order_id: import("zod").ZodNumber;
        note: import("zod").ZodString;
        customer_note: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodBoolean>>;
    }, "strict", import("zod").ZodTypeAny, {
        order_id: number;
        note: string;
        customer_note: boolean;
    }, {
        order_id: number;
        note: string;
        customer_note?: boolean | undefined;
    }>>) => Promise<{
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
    wc_create_refund: (params: import("zod").TypeOf<import("zod").ZodObject<{
        order_id: import("zod").ZodNumber;
        amount: import("zod").ZodString;
        reason: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        order_id: number;
        amount: string;
        reason?: string | undefined;
    }, {
        order_id: number;
        amount: string;
        reason?: string | undefined;
    }>>) => Promise<{
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
    wc_list_products: (params: import("zod").TypeOf<import("zod").ZodObject<{
        per_page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        search: import("zod").ZodOptional<import("zod").ZodString>;
        status: import("zod").ZodOptional<import("zod").ZodEnum<["draft", "pending", "private", "publish", "any"]>>;
        category: import("zod").ZodOptional<import("zod").ZodNumber>;
        tag: import("zod").ZodOptional<import("zod").ZodNumber>;
        sku: import("zod").ZodOptional<import("zod").ZodString>;
        stock_status: import("zod").ZodOptional<import("zod").ZodEnum<["instock", "outofstock", "onbackorder"]>>;
        orderby: import("zod").ZodOptional<import("zod").ZodEnum<["date", "id", "title", "slug", "price", "popularity", "rating"]>>;
        order: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["asc", "desc"]>>>;
    }, "strict", import("zod").ZodTypeAny, {
        page: number;
        per_page: number;
        order: "asc" | "desc";
        search?: string | undefined;
        status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
        orderby?: "id" | "slug" | "date" | "title" | "price" | "popularity" | "rating" | undefined;
        category?: number | undefined;
        tag?: number | undefined;
        sku?: string | undefined;
        stock_status?: "instock" | "outofstock" | "onbackorder" | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
        orderby?: "id" | "slug" | "date" | "title" | "price" | "popularity" | "rating" | undefined;
        order?: "asc" | "desc" | undefined;
        category?: number | undefined;
        tag?: number | undefined;
        sku?: string | undefined;
        stock_status?: "instock" | "outofstock" | "onbackorder" | undefined;
    }>>) => Promise<{
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
    wc_get_product: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>>) => Promise<{
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
    wc_create_product: (params: import("zod").TypeOf<import("zod").ZodObject<{
        name: import("zod").ZodString;
        type: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["simple", "grouped", "external", "variable"]>>>;
        status: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["draft", "pending", "private", "publish"]>>>;
        regular_price: import("zod").ZodOptional<import("zod").ZodString>;
        sale_price: import("zod").ZodOptional<import("zod").ZodString>;
        description: import("zod").ZodOptional<import("zod").ZodString>;
        short_description: import("zod").ZodOptional<import("zod").ZodString>;
        sku: import("zod").ZodOptional<import("zod").ZodString>;
        manage_stock: import("zod").ZodOptional<import("zod").ZodBoolean>;
        stock_quantity: import("zod").ZodOptional<import("zod").ZodNumber>;
        categories: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
            id: import("zod").ZodNumber;
        }, "strip", import("zod").ZodTypeAny, {
            id: number;
        }, {
            id: number;
        }>, "many">>;
        tags: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
            id: import("zod").ZodNumber;
        }, "strip", import("zod").ZodTypeAny, {
            id: number;
        }, {
            id: number;
        }>, "many">>;
        images: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
            src: import("zod").ZodString;
        }, "strip", import("zod").ZodTypeAny, {
            src: string;
        }, {
            src: string;
        }>, "many">>;
    }, "strict", import("zod").ZodTypeAny, {
        type: "simple" | "grouped" | "external" | "variable";
        status: "draft" | "pending" | "private" | "publish";
        name: string;
        categories?: {
            id: number;
        }[] | undefined;
        tags?: {
            id: number;
        }[] | undefined;
        description?: string | undefined;
        sku?: string | undefined;
        regular_price?: string | undefined;
        sale_price?: string | undefined;
        short_description?: string | undefined;
        manage_stock?: boolean | undefined;
        stock_quantity?: number | undefined;
        images?: {
            src: string;
        }[] | undefined;
    }, {
        name: string;
        type?: "simple" | "grouped" | "external" | "variable" | undefined;
        status?: "draft" | "pending" | "private" | "publish" | undefined;
        categories?: {
            id: number;
        }[] | undefined;
        tags?: {
            id: number;
        }[] | undefined;
        description?: string | undefined;
        sku?: string | undefined;
        regular_price?: string | undefined;
        sale_price?: string | undefined;
        short_description?: string | undefined;
        manage_stock?: boolean | undefined;
        stock_quantity?: number | undefined;
        images?: {
            src: string;
        }[] | undefined;
    }>>) => Promise<{
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
    wc_update_product: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        name: import("zod").ZodOptional<import("zod").ZodString>;
        status: import("zod").ZodOptional<import("zod").ZodEnum<["draft", "pending", "private", "publish"]>>;
        regular_price: import("zod").ZodOptional<import("zod").ZodString>;
        sale_price: import("zod").ZodOptional<import("zod").ZodString>;
        description: import("zod").ZodOptional<import("zod").ZodString>;
        short_description: import("zod").ZodOptional<import("zod").ZodString>;
        sku: import("zod").ZodOptional<import("zod").ZodString>;
        manage_stock: import("zod").ZodOptional<import("zod").ZodBoolean>;
        stock_quantity: import("zod").ZodOptional<import("zod").ZodNumber>;
        stock_status: import("zod").ZodOptional<import("zod").ZodEnum<["instock", "outofstock", "onbackorder"]>>;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
        status?: "draft" | "pending" | "private" | "publish" | undefined;
        description?: string | undefined;
        name?: string | undefined;
        sku?: string | undefined;
        stock_status?: "instock" | "outofstock" | "onbackorder" | undefined;
        regular_price?: string | undefined;
        sale_price?: string | undefined;
        short_description?: string | undefined;
        manage_stock?: boolean | undefined;
        stock_quantity?: number | undefined;
    }, {
        id: number;
        status?: "draft" | "pending" | "private" | "publish" | undefined;
        description?: string | undefined;
        name?: string | undefined;
        sku?: string | undefined;
        stock_status?: "instock" | "outofstock" | "onbackorder" | undefined;
        regular_price?: string | undefined;
        sale_price?: string | undefined;
        short_description?: string | undefined;
        manage_stock?: boolean | undefined;
        stock_quantity?: number | undefined;
    }>>) => Promise<{
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
    wc_delete_product: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        force: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodBoolean>>;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
        force: boolean;
    }, {
        id: number;
        force?: boolean | undefined;
    }>>) => Promise<{
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
    wc_list_product_categories: (params: import("zod").TypeOf<import("zod").ZodObject<{
        per_page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        search: import("zod").ZodOptional<import("zod").ZodString>;
        parent: import("zod").ZodOptional<import("zod").ZodNumber>;
        orderby: import("zod").ZodOptional<import("zod").ZodEnum<["id", "name", "slug", "count"]>>;
        order: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["asc", "desc"]>>>;
    }, "strict", import("zod").ZodTypeAny, {
        page: number;
        per_page: number;
        order: "asc" | "desc";
        search?: string | undefined;
        parent?: number | undefined;
        orderby?: "id" | "slug" | "name" | "count" | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        parent?: number | undefined;
        orderby?: "id" | "slug" | "name" | "count" | undefined;
        order?: "asc" | "desc" | undefined;
    }>>) => Promise<{
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
    wc_list_product_variations: (params: import("zod").TypeOf<import("zod").ZodObject<{
        product_id: import("zod").ZodNumber;
        per_page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        status: import("zod").ZodOptional<import("zod").ZodEnum<["draft", "pending", "private", "publish", "any"]>>;
    }, "strict", import("zod").ZodTypeAny, {
        page: number;
        per_page: number;
        product_id: number;
        status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
    }, {
        product_id: number;
        page?: number | undefined;
        per_page?: number | undefined;
        status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
    }>>) => Promise<{
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
    wp_search: (params: {
        search: string;
        type?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
        include_pagination?: boolean | undefined;
        subtype?: string | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    list_comments: (params: {
        post?: number | undefined;
        search?: string | undefined;
        type?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        status?: "approve" | "hold" | "spam" | "trash" | undefined;
        author?: number | number[] | undefined;
        orderby?: "post" | "id" | "type" | "date" | "parent" | "include" | "date_gmt" | undefined;
        order?: "asc" | "desc" | undefined;
        after?: string | undefined;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
        include_pagination?: boolean | undefined;
        author_email?: string | undefined;
        author_exclude?: number[] | undefined;
    }) => Promise<{
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
    get_comment: (params: {
        id: number;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
    }) => Promise<{
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
    create_comment: (params: {
        post: number;
        content: string;
        status?: "approve" | "hold" | undefined;
        author?: number | undefined;
        parent?: number | undefined;
        author_email?: string | undefined;
        author_name?: string | undefined;
        author_url?: string | undefined;
    }) => Promise<{
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
    update_comment: (params: {
        id: number;
        post?: number | undefined;
        status?: "approve" | "hold" | "spam" | "trash" | undefined;
        author?: number | undefined;
        parent?: number | undefined;
        content?: string | undefined;
        author_email?: string | undefined;
        author_name?: string | undefined;
        author_url?: string | undefined;
    }) => Promise<{
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
    delete_comment: (params: {
        id: number;
        force?: boolean | undefined;
    }) => Promise<{
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
    search_plugin_repository: (params: {
        search: string;
        page: number;
        per_page: number;
    }) => Promise<{
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
    get_plugin_details: (params: {
        slug: string;
    }) => Promise<{
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
    list_users: (params: {
        search?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        orderby?: "url" | "id" | "email" | "slug" | "name" | "include" | "registered_date" | undefined;
        order?: "asc" | "desc" | undefined;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
        include_pagination?: boolean | undefined;
        context?: "view" | "embed" | "edit" | undefined;
        roles?: string[] | undefined;
    }) => Promise<{
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
    get_user: (params: {
        id: number;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
        context?: "view" | "embed" | "edit" | undefined;
    }) => Promise<{
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
    get_me: (params: import("zod").TypeOf<import("zod").ZodObject<{
        context: import("zod").ZodOptional<import("zod").ZodEnum<["view", "embed", "edit"]>>;
        _fields: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        _fields?: string | undefined;
        context?: "view" | "embed" | "edit" | undefined;
    }, {
        _fields?: string | undefined;
        context?: "view" | "embed" | "edit" | undefined;
    }>>) => Promise<{
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
    create_user: (params: {
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
    }) => Promise<{
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
    update_user: (params: {
        id: number;
        url?: string | undefined;
        email?: string | undefined;
        slug?: string | undefined;
        description?: string | undefined;
        name?: string | undefined;
        roles?: string[] | undefined;
        username?: string | undefined;
        first_name?: string | undefined;
        last_name?: string | undefined;
        locale?: string | undefined;
        nickname?: string | undefined;
        password?: string | undefined;
    }) => Promise<{
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
    delete_user: (params: {
        id: number;
        force?: boolean | undefined;
        reassign?: number | undefined;
    }) => Promise<{
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
    list_media: (params: import("zod").TypeOf<import("zod").ZodObject<{
        page: import("zod").ZodOptional<import("zod").ZodNumber>;
        per_page: import("zod").ZodOptional<import("zod").ZodNumber>;
        search: import("zod").ZodOptional<import("zod").ZodString>;
        _embed: import("zod").ZodOptional<import("zod").ZodBoolean>;
        _fields: import("zod").ZodOptional<import("zod").ZodString>;
        include_pagination: import("zod").ZodOptional<import("zod").ZodBoolean>;
    }, "strict", import("zod").ZodTypeAny, {
        search?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
        include_pagination?: boolean | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
        include_pagination?: boolean | undefined;
    }>>) => Promise<{
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
    get_media: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        _embed: import("zod").ZodOptional<import("zod").ZodBoolean>;
        _fields: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
    }, {
        id: number;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
    }>>) => Promise<{
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
    create_media: (params: import("zod").TypeOf<import("zod").ZodObject<{
        title: import("zod").ZodString;
        alt_text: import("zod").ZodOptional<import("zod").ZodString>;
        caption: import("zod").ZodOptional<import("zod").ZodString>;
        description: import("zod").ZodOptional<import("zod").ZodString>;
        source_url: import("zod").ZodString;
    }, "strict", import("zod").ZodTypeAny, {
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
    }>>) => Promise<{
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
    edit_media: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        title: import("zod").ZodOptional<import("zod").ZodString>;
        alt_text: import("zod").ZodOptional<import("zod").ZodString>;
        caption: import("zod").ZodOptional<import("zod").ZodString>;
        description: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strict", import("zod").ZodTypeAny, {
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
    }>>) => Promise<{
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
    delete_media: (params: import("zod").TypeOf<import("zod").ZodObject<{
        id: import("zod").ZodNumber;
        force: import("zod").ZodOptional<import("zod").ZodBoolean>;
    }, "strict", import("zod").ZodTypeAny, {
        id: number;
        force?: boolean | undefined;
    }, {
        id: number;
        force?: boolean | undefined;
    }>>) => Promise<{
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
    list_plugins: (params: import("zod").TypeOf<import("zod").ZodObject<{
        status: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["active", "inactive"]>>>;
    }, "strict", import("zod").ZodTypeAny, {
        status: "active" | "inactive";
    }, {
        status?: "active" | "inactive" | undefined;
    }>>) => Promise<{
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
    get_plugin: (params: import("zod").TypeOf<import("zod").ZodObject<{
        plugin: import("zod").ZodString;
    }, "strict", import("zod").ZodTypeAny, {
        plugin: string;
    }, {
        plugin: string;
    }>>) => Promise<{
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
    activate_plugin: (params: import("zod").TypeOf<import("zod").ZodObject<{
        plugin: import("zod").ZodString;
    }, "strict", import("zod").ZodTypeAny, {
        plugin: string;
    }, {
        plugin: string;
    }>>) => Promise<{
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
    deactivate_plugin: (params: import("zod").TypeOf<import("zod").ZodObject<{
        plugin: import("zod").ZodString;
    }, "strict", import("zod").ZodTypeAny, {
        plugin: string;
    }, {
        plugin: string;
    }>>) => Promise<{
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
    create_plugin: (params: import("zod").TypeOf<import("zod").ZodObject<{
        slug: import("zod").ZodString;
        status: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["inactive", "active"]>>>;
    }, "strict", import("zod").ZodTypeAny, {
        slug: string;
        status: "active" | "inactive";
    }, {
        slug: string;
        status?: "active" | "inactive" | undefined;
    }>>) => Promise<{
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
    delete_plugin: (params: import("zod").TypeOf<import("zod").ZodObject<{
        plugin: import("zod").ZodString;
    }, "strict", import("zod").ZodTypeAny, {
        plugin: string;
    }, {
        plugin: string;
    }>>) => Promise<{
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
    discover_taxonomies: (params: {
        content_type?: string | undefined;
        refresh_cache?: boolean | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    list_terms: (params: {
        taxonomy: string;
        search?: string | undefined;
        page?: number | undefined;
        per_page?: number | undefined;
        slug?: string | undefined;
        parent?: number | undefined;
        orderby?: "id" | "slug" | "description" | "name" | "include" | "term_group" | "count" | undefined;
        order?: "asc" | "desc" | undefined;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
        include_pagination?: boolean | undefined;
        hide_empty?: boolean | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_term: (params: {
        id: number;
        taxonomy: string;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    create_term: (params: {
        name: string;
        taxonomy: string;
        slug?: string | undefined;
        parent?: number | undefined;
        meta?: Record<string, any> | undefined;
        description?: string | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    update_term: (params: {
        id: number;
        taxonomy: string;
        slug?: string | undefined;
        parent?: number | undefined;
        meta?: Record<string, any> | undefined;
        description?: string | undefined;
        name?: string | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    delete_term: (params: {
        id: number;
        taxonomy: string;
        force?: boolean | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    assign_terms_to_content: (params: {
        content_type: string;
        taxonomy: string;
        content_id: number;
        terms: (string | number)[];
        append?: boolean | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_content_terms: (params: {
        content_type: string;
        content_id: number;
        taxonomy?: string | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    list_content: (params: {
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
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_content: (params: {
        id: number;
        content_type: string;
        _embed?: boolean | undefined;
        _fields?: string | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    create_content: (params: {
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
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    update_content: (params: {
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
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    delete_content: (params: {
        id: number;
        content_type: string;
        force?: boolean | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    discover_content_types: (params: {
        refresh_cache?: boolean | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    find_content_by_url: (params: {
        url: string;
        update_fields?: {
            status?: string | undefined;
            title?: string | undefined;
            content?: string | undefined;
            meta?: Record<string, any> | undefined;
            custom_fields?: Record<string, any> | undefined;
        } | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
    get_content_by_slug: (params: {
        slug: string;
        content_types?: string[] | undefined;
    }) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError: boolean;
        };
    }>;
};

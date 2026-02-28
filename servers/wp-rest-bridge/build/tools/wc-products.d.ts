import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const wcListProductsSchema: z.ZodObject<{
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "pending", "private", "publish", "any"]>>;
    category: z.ZodOptional<z.ZodNumber>;
    tag: z.ZodOptional<z.ZodNumber>;
    sku: z.ZodOptional<z.ZodString>;
    stock_status: z.ZodOptional<z.ZodEnum<["instock", "outofstock", "onbackorder"]>>;
    orderby: z.ZodOptional<z.ZodEnum<["date", "id", "title", "slug", "price", "popularity", "rating"]>>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strict", z.ZodTypeAny, {
    page: number;
    per_page: number;
    order: "asc" | "desc";
    search?: string | undefined;
    status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
    orderby?: "slug" | "date" | "id" | "title" | "price" | "popularity" | "rating" | undefined;
    category?: number | undefined;
    tag?: number | undefined;
    sku?: string | undefined;
    stock_status?: "instock" | "outofstock" | "onbackorder" | undefined;
}, {
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
    orderby?: "slug" | "date" | "id" | "title" | "price" | "popularity" | "rating" | undefined;
    order?: "asc" | "desc" | undefined;
    category?: number | undefined;
    tag?: number | undefined;
    sku?: string | undefined;
    stock_status?: "instock" | "outofstock" | "onbackorder" | undefined;
}>;
declare const wcGetProductSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
declare const wcCreateProductSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodOptional<z.ZodEnum<["simple", "grouped", "external", "variable"]>>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["draft", "pending", "private", "publish"]>>>;
    regular_price: z.ZodOptional<z.ZodString>;
    sale_price: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    short_description: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    manage_stock: z.ZodOptional<z.ZodBoolean>;
    stock_quantity: z.ZodOptional<z.ZodNumber>;
    categories: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>, "many">>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        src: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        src: string;
    }, {
        src: string;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    status: "draft" | "pending" | "private" | "publish";
    type: "simple" | "grouped" | "external" | "variable";
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
    status?: "draft" | "pending" | "private" | "publish" | undefined;
    type?: "simple" | "grouped" | "external" | "variable" | undefined;
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
}>;
declare const wcUpdateProductSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "pending", "private", "publish"]>>;
    regular_price: z.ZodOptional<z.ZodString>;
    sale_price: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    short_description: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    manage_stock: z.ZodOptional<z.ZodBoolean>;
    stock_quantity: z.ZodOptional<z.ZodNumber>;
    stock_status: z.ZodOptional<z.ZodEnum<["instock", "outofstock", "onbackorder"]>>;
}, "strict", z.ZodTypeAny, {
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
}>;
declare const wcDeleteProductSchema: z.ZodObject<{
    id: z.ZodNumber;
    force: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    id: number;
    force: boolean;
}, {
    id: number;
    force?: boolean | undefined;
}>;
declare const wcListProductCategoriesSchema: z.ZodObject<{
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    parent: z.ZodOptional<z.ZodNumber>;
    orderby: z.ZodOptional<z.ZodEnum<["id", "name", "slug", "count"]>>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strict", z.ZodTypeAny, {
    page: number;
    per_page: number;
    order: "asc" | "desc";
    search?: string | undefined;
    parent?: number | undefined;
    orderby?: "slug" | "id" | "name" | "count" | undefined;
}, {
    page?: number | undefined;
    per_page?: number | undefined;
    search?: string | undefined;
    parent?: number | undefined;
    orderby?: "slug" | "id" | "name" | "count" | undefined;
    order?: "asc" | "desc" | undefined;
}>;
declare const wcListProductVariationsSchema: z.ZodObject<{
    product_id: z.ZodNumber;
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "pending", "private", "publish", "any"]>>;
}, "strict", z.ZodTypeAny, {
    page: number;
    per_page: number;
    product_id: number;
    status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
}, {
    product_id: number;
    page?: number | undefined;
    per_page?: number | undefined;
    status?: "draft" | "pending" | "private" | "publish" | "any" | undefined;
}>;
export declare const wcProductTools: Tool[];
export declare const wcProductHandlers: {
    wc_list_products: (params: z.infer<typeof wcListProductsSchema>) => Promise<{
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
    wc_get_product: (params: z.infer<typeof wcGetProductSchema>) => Promise<{
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
    wc_create_product: (params: z.infer<typeof wcCreateProductSchema>) => Promise<{
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
    wc_update_product: (params: z.infer<typeof wcUpdateProductSchema>) => Promise<{
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
    wc_delete_product: (params: z.infer<typeof wcDeleteProductSchema>) => Promise<{
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
    wc_list_product_categories: (params: z.infer<typeof wcListProductCategoriesSchema>) => Promise<{
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
    wc_list_product_variations: (params: z.infer<typeof wcListProductVariationsSchema>) => Promise<{
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

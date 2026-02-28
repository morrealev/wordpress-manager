interface WPContent {
    id: number;
    date: string;
    date_gmt: string;
    guid: {
        rendered: string;
    };
    modified: string;
    modified_gmt: string;
    slug: string;
    status: string;
    type: string;
    link: string;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
        protected: boolean;
    };
    excerpt: {
        rendered: string;
        protected: boolean;
    };
    author: number;
    featured_media: number;
    comment_status: string;
    ping_status: string;
    template: string;
    meta: Record<string, any>[];
    _links: Record<string, any>;
}
export interface WPPost extends WPContent {
    format: string;
    sticky: boolean;
    categories: number[];
    tags: number[];
}
export interface WPPage extends WPContent {
    parent: number;
    menu_order: number;
}
export interface WPCategory {
    id: number;
    count: number;
    description: string;
    link: string;
    name: string;
    slug: string;
    taxonomy: string;
    parent: number;
    meta: Record<string, any>[];
    _links: Record<string, any>;
}
export interface WPUser {
    id: number;
    username: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    url: string;
    description: string;
    link: string;
    locale: string;
    nickname: string;
    slug: string;
    roles: string[];
    registered_date: string;
    capabilities: Record<string, boolean>;
    extra_capabilities: Record<string, boolean>;
    avatar_urls: Record<string, string>;
    meta: Record<string, any>[];
    _links: Record<string, any>;
}
export interface WPPlugin {
    plugin: string;
    status: string;
    name: string;
    plugin_uri: string;
    author: string;
    author_uri: string;
    description: {
        raw: string;
        rendered: string;
    };
    version: string;
    network_only: boolean;
    requires_wp: string;
    requires_php: string;
    textdomain: string;
}
export interface WPComment {
    id: number;
    post: number;
    parent: number;
    author: number;
    author_name: string;
    author_url: string;
    author_email?: string;
    author_ip?: string;
    author_user_agent?: string;
    date: string;
    date_gmt: string;
    content: {
        rendered: string;
        raw?: string;
    };
    link: string;
    status: string;
    type: string;
    meta: Record<string, any>[];
    _links: Record<string, any>;
}
export interface WPCustomPost extends WPContent {
    [key: string]: any;
}
export interface WPPostType {
    slug: string;
    name: string;
    description: string;
    hierarchical: boolean;
    rest_base: string;
    supports: string[];
    taxonomies: string[];
    labels: Record<string, string>;
    _links: Record<string, any>;
}
export interface WPTaxonomy {
    slug: string;
    name: string;
    description: string;
    types: string[];
    hierarchical: boolean;
    rest_base: string;
    labels: Record<string, string>;
    _links: Record<string, any>;
}
export interface WPTerm {
    id: number;
    count: number;
    description: string;
    link: string;
    name: string;
    slug: string;
    taxonomy: string;
    parent: number;
    meta: Record<string, any>[];
    _links: Record<string, any>;
}
export interface WCProduct {
    id: number;
    name: string;
    slug: string;
    type: string;
    status: string;
    description: string;
    short_description: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    stock_quantity: number | null;
    stock_status: string;
    categories: {
        id: number;
        name: string;
        slug: string;
    }[];
    tags: {
        id: number;
        name: string;
        slug: string;
    }[];
    images: {
        id: number;
        src: string;
        name: string;
        alt: string;
    }[];
    attributes: {
        id: number;
        name: string;
        options: string[];
    }[];
    variations: number[];
    date_created: string;
    date_modified: string;
}
export interface WCOrder {
    id: number;
    status: string;
    currency: string;
    total: string;
    customer_id: number;
    billing: Record<string, string>;
    shipping: Record<string, string>;
    line_items: {
        id: number;
        name: string;
        product_id: number;
        quantity: number;
        total: string;
    }[];
    date_created: string;
    date_modified: string;
    payment_method: string;
    payment_method_title: string;
}
export interface WCCustomer {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    billing: Record<string, string>;
    shipping: Record<string, string>;
    orders_count: number;
    total_spent: string;
    date_created: string;
}
export interface WCCoupon {
    id: number;
    code: string;
    discount_type: string;
    amount: string;
    date_created: string;
    date_expires: string | null;
    usage_count: number;
    usage_limit: number | null;
    individual_use: boolean;
    product_ids: number[];
    minimum_amount: string;
    maximum_amount: string;
}
export {};

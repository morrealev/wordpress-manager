/**
 * Parse WP_SITES_CONFIG JSON and initialize all site clients
 */
export declare function initWordPress(): Promise<void>;
/**
 * Switch the active site
 */
export declare function switchSite(siteId: string): string;
/**
 * List all configured sites
 */
export declare function listSites(): string[];
/**
 * Get the active site ID
 */
export declare function getActiveSite(): string;
/**
 * Log to stderr (safe for MCP stdio transport)
 */
export declare function logToStderr(message: string): void;
export declare const logToFile: typeof logToStderr;
export interface WordPressRequestOptions {
    headers?: Record<string, string>;
    isFormData?: boolean;
    rawResponse?: boolean;
    siteId?: string;
    namespace?: string;
    timeout?: number;
    includePagination?: boolean;
}
export interface PaginatedResponse<T = any> {
    items: T;
    pagination: {
        total: number;
        totalPages: number;
        page: number;
        perPage: number;
    };
}
/**
 * Make a request to the WordPress API (active site or specific site).
 * Includes automatic retry with exponential backoff and concurrency limiting.
 */
export declare function makeWordPressRequest(method: string, endpoint: string, data?: any, options?: WordPressRequestOptions): Promise<any>;
/**
 * Check if a site has WooCommerce credentials configured.
 */
export declare function hasWooCommerce(siteId?: string): boolean;
/**
 * Make a request to the WooCommerce REST API.
 * Uses Consumer Key/Secret auth and wc/v3 namespace by default.
 */
export declare function makeWooCommerceRequest(method: string, endpoint: string, data?: any, options?: WordPressRequestOptions): Promise<any>;
/**
 * Search the WordPress.org Plugin Repository
 */
export declare function searchWordPressPluginRepository(searchQuery: string, page?: number, perPage?: number): Promise<any>;

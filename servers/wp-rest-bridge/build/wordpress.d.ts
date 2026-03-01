interface SiteConfig {
    id: string;
    url: string;
    username: string;
    password: string;
    wc_consumer_key?: string;
    wc_consumer_secret?: string;
    wp_path?: string;
    ssh_host?: string;
    ssh_user?: string;
    ssh_key?: string;
    ssh_port?: number;
    is_multisite?: boolean;
    mailchimp_api_key?: string;
    buffer_access_token?: string;
    sendgrid_api_key?: string;
    gsc_service_account_key?: string;
    gsc_site_url?: string;
    ga4_property_id?: string;
    ga4_service_account_key?: string;
    plausible_api_key?: string;
    plausible_base_url?: string;
    google_api_key?: string;
    slack_webhook_url?: string;
    slack_bot_token?: string;
}
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
 * Get the SiteConfig for a given site (needed by wpcli module).
 */
export declare function getSiteConfig(siteId?: string): SiteConfig | undefined;
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
export declare function hasMailchimp(siteId?: string): boolean;
export declare function makeMailchimpRequest(method: string, endpoint: string, data?: any, siteId?: string): Promise<any>;
export declare function hasBuffer(siteId?: string): boolean;
export declare function makeBufferRequest(method: string, endpoint: string, data?: any, siteId?: string): Promise<any>;
export declare function hasSendGrid(siteId?: string): boolean;
export declare function makeSendGridRequest(method: string, endpoint: string, data?: any, siteId?: string): Promise<any>;
export declare function hasGSC(siteId?: string): boolean;
export declare function getGSCSiteUrl(siteId?: string): string;
export declare function getGSCAuth(siteId?: string): Promise<any>;
export declare function hasGA4(siteId?: string): boolean;
export declare function getGA4PropertyId(siteId?: string): string;
export declare function getGA4Auth(siteId?: string): Promise<any>;
export declare function hasPlausible(siteId?: string): boolean;
export declare function makePlausibleRequest(method: string, endpoint: string, params?: Record<string, any>, siteId?: string): Promise<any>;
export declare function hasGoogleApiKey(siteId?: string): boolean;
export declare function getGoogleApiKey(siteId?: string): string;
export declare function hasSlackWebhook(siteId?: string): boolean;
export declare function getSlackWebhookUrl(siteId?: string): string;
export declare function hasSlackBot(siteId?: string): boolean;
export declare function makeSlackBotRequest(method: string, endpoint: string, data?: Record<string, any>, siteId?: string): Promise<any>;
/**
 * Search the WordPress.org Plugin Repository
 */
export declare function searchWordPressPluginRepository(searchQuery: string, page?: number, perPage?: number): Promise<any>;
export {};

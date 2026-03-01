// src/wordpress.ts - Multi-site WordPress REST API client
import axios from 'axios';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
// ── Concurrency Limiter ──────────────────────────────────────────────
// Simple FIFO semaphore to cap concurrent requests per site
class ConcurrencyLimiter {
    maxConcurrent;
    running = 0;
    queue = [];
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
    }
    async acquire() {
        if (this.running < this.maxConcurrent) {
            this.running++;
            return;
        }
        return new Promise((resolve) => {
            this.queue.push(() => {
                this.running++;
                resolve();
            });
        });
    }
    release() {
        this.running--;
        const next = this.queue.shift();
        if (next)
            next();
    }
}
// ── Module State ─────────────────────────────────────────────────────
const siteClients = new Map();
const siteLimiters = new Map();
const wcSiteClients = new Map();
const mcSiteClients = new Map();
const bufSiteClients = new Map();
const sgSiteClients = new Map();
const plSiteClients = new Map();
let activeSiteId = '';
const parsedSiteConfigs = new Map();
const MAX_CONCURRENT_PER_SITE = 5;
const DEFAULT_TIMEOUT_MS = parseInt(process.env.WP_REQUEST_TIMEOUT_MS || '30000', 10);
const MAX_RETRIES = 3;
// HTTP status codes that are safe to retry
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
// Network error codes that are safe to retry
const RETRYABLE_ERROR_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']);
// ── Initialization ───────────────────────────────────────────────────
/**
 * Parse WP_SITES_CONFIG JSON and initialize all site clients
 */
export async function initWordPress() {
    const sitesJson = process.env.WP_SITES_CONFIG;
    const defaultSite = process.env.WP_DEFAULT_SITE;
    if (!sitesJson) {
        // Fallback to legacy single-site env vars
        const url = process.env.WORDPRESS_API_URL;
        const username = process.env.WORDPRESS_USERNAME;
        const password = process.env.WORDPRESS_PASSWORD;
        if (!url) {
            throw new Error('No WordPress site configured. Set WP_SITES_CONFIG or WORDPRESS_API_URL.');
        }
        const siteId = 'default';
        await initSiteClient(siteId, url, username || '', password || '');
        activeSiteId = siteId;
        parsedSiteConfigs.set(siteId, { id: siteId, url, username: username || '', password: password || '' });
        logToStderr(`Initialized single site: ${url}`);
        return;
    }
    let sites;
    try {
        sites = JSON.parse(sitesJson);
    }
    catch {
        throw new Error('Invalid WP_SITES_CONFIG JSON format');
    }
    if (sites.length === 0) {
        throw new Error('WP_SITES_CONFIG contains no sites');
    }
    for (const site of sites) {
        await initSiteClient(site.id, site.url, site.username, site.password);
        parsedSiteConfigs.set(site.id, site);
        logToStderr(`Initialized site: ${site.id} (${site.url})`);
    }
    // Initialize WooCommerce clients for sites with WC credentials
    for (const site of sites) {
        if (site.wc_consumer_key && site.wc_consumer_secret) {
            await initWcClient(site.id, site.url, site.wc_consumer_key, site.wc_consumer_secret);
            logToStderr(`Initialized WooCommerce for site: ${site.id}`);
        }
        if (site.mailchimp_api_key) {
            await initMailchimpClient(site.id, site.mailchimp_api_key);
            logToStderr(`Initialized Mailchimp for site: ${site.id}`);
        }
        if (site.buffer_access_token) {
            await initBufferClient(site.id, site.buffer_access_token);
            logToStderr(`Initialized Buffer for site: ${site.id}`);
        }
        if (site.sendgrid_api_key) {
            await initSendGridClient(site.id, site.sendgrid_api_key);
            logToStderr(`Initialized SendGrid for site: ${site.id}`);
        }
        if (site.plausible_api_key) {
            await initPlausibleClient(site.id, site.plausible_api_key, site.plausible_base_url);
            logToStderr(`Initialized Plausible for site: ${site.id}`);
        }
    }
    activeSiteId = defaultSite || sites[0].id;
    logToStderr(`Active site: ${activeSiteId}`);
}
/**
 * Initialize a single site's Axios client.
 * baseURL now points to {site}/wp-json/ so that tools can use any namespace.
 */
async function initSiteClient(id, url, username, password) {
    let baseURL = url.endsWith('/') ? url : `${url}/`;
    // Strip existing wp-json path variants so we normalize to just /wp-json/
    const wpJsonIdx = baseURL.indexOf('/wp-json');
    if (wpJsonIdx !== -1) {
        baseURL = baseURL.substring(0, wpJsonIdx + 1);
    }
    baseURL = baseURL + 'wp-json/';
    const config = {
        baseURL,
        headers: { 'Content-Type': 'application/json' },
        timeout: DEFAULT_TIMEOUT_MS,
    };
    if (username && password) {
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        config.headers = {
            ...config.headers,
            'Authorization': `Basic ${auth}`,
        };
    }
    const client = axios.create(config);
    // Verify connection (using wp/v2 namespace)
    try {
        await client.get('wp/v2');
    }
    catch (error) {
        logToStderr(`Warning: Could not verify connection to ${url}: ${error.message}`);
        // Don't throw - the site might become available later
    }
    siteClients.set(id, client);
    siteLimiters.set(id, new ConcurrencyLimiter(MAX_CONCURRENT_PER_SITE));
}
/**
 * Initialize a WooCommerce client for a site (Consumer Key/Secret auth).
 */
async function initWcClient(id, url, consumerKey, consumerSecret) {
    let baseURL = url.endsWith('/') ? url : `${url}/`;
    const wpJsonIdx = baseURL.indexOf('/wp-json');
    if (wpJsonIdx !== -1) {
        baseURL = baseURL.substring(0, wpJsonIdx + 1);
    }
    baseURL = baseURL + 'wp-json/';
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const client = axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
        },
        timeout: DEFAULT_TIMEOUT_MS,
    });
    // Verify WooCommerce connection
    try {
        await client.get('wc/v3');
    }
    catch (error) {
        logToStderr(`Warning: Could not verify WooCommerce connection for ${id}: ${error.message}`);
    }
    wcSiteClients.set(id, client);
}
async function initMailchimpClient(id, apiKey) {
    const dc = apiKey.split('-').pop() || 'us21';
    const client = axios.create({
        baseURL: `https://${dc}.api.mailchimp.com/3.0/`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        timeout: DEFAULT_TIMEOUT_MS,
    });
    mcSiteClients.set(id, client);
}
async function initBufferClient(id, accessToken) {
    const client = axios.create({
        baseURL: 'https://api.bufferapp.com/1/',
        headers: {
            'Content-Type': 'application/json',
        },
        params: { access_token: accessToken },
        timeout: DEFAULT_TIMEOUT_MS,
    });
    bufSiteClients.set(id, client);
}
async function initSendGridClient(id, apiKey) {
    const client = axios.create({
        baseURL: 'https://api.sendgrid.com/v3/',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        timeout: DEFAULT_TIMEOUT_MS,
    });
    sgSiteClients.set(id, client);
}
async function initPlausibleClient(id, apiKey, baseUrl) {
    const client = axios.create({
        baseURL: (baseUrl || 'https://plausible.io') + '/api/v1/',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        timeout: DEFAULT_TIMEOUT_MS,
    });
    plSiteClients.set(id, client);
}
// ── Site Management ──────────────────────────────────────────────────
/**
 * Get the active site's client, or a specific site's client
 */
function getClient(siteId) {
    const id = siteId || activeSiteId;
    const client = siteClients.get(id);
    if (!client) {
        const available = Array.from(siteClients.keys()).join(', ');
        throw new Error(`Site "${id}" not found. Available sites: ${available}`);
    }
    return client;
}
function getLimiter(siteId) {
    const id = siteId || activeSiteId;
    let limiter = siteLimiters.get(id);
    if (!limiter) {
        limiter = new ConcurrencyLimiter(MAX_CONCURRENT_PER_SITE);
        siteLimiters.set(id, limiter);
    }
    return limiter;
}
/**
 * Switch the active site
 */
export function switchSite(siteId) {
    if (!siteClients.has(siteId)) {
        const available = Array.from(siteClients.keys()).join(', ');
        throw new Error(`Site "${siteId}" not found. Available: ${available}`);
    }
    activeSiteId = siteId;
    return activeSiteId;
}
/**
 * List all configured sites
 */
export function listSites() {
    return Array.from(siteClients.keys());
}
/**
 * Get the active site ID
 */
export function getActiveSite() {
    return activeSiteId;
}
/**
 * Get the SiteConfig for a given site (needed by wpcli module).
 */
export function getSiteConfig(siteId) {
    const id = siteId || activeSiteId;
    return parsedSiteConfigs.get(id);
}
// ── Logging ──────────────────────────────────────────────────────────
/**
 * Log to stderr (safe for MCP stdio transport)
 */
export function logToStderr(message) {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] ${message}\n`);
}
// Keep backward-compatible alias
export const logToFile = logToStderr;
// ── Retry Logic ──────────────────────────────────────────────────────
function isRetryableError(error, method) {
    // Network errors are always retryable
    if (error.code && RETRYABLE_ERROR_CODES.has(error.code)) {
        return true;
    }
    const status = error.response?.status;
    if (!status)
        return false;
    // For non-GET (mutating) methods, only retry on 429 (rate limit) — not 5xx
    // to avoid duplicate side-effects
    if (method !== 'GET') {
        return status === 429;
    }
    return RETRYABLE_STATUS_CODES.has(status);
}
function getRetryDelay(attempt, error) {
    // Respect Retry-After header on 429
    const retryAfter = error.response?.headers?.['retry-after'];
    if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds))
            return seconds * 1000;
    }
    // Exponential backoff: 1s, 2s, 4s + jitter (0–500ms)
    const base = Math.pow(2, attempt) * 1000;
    const jitter = Math.random() * 500;
    return base + jitter;
}
/**
 * Make a request to the WordPress API (active site or specific site).
 * Includes automatic retry with exponential backoff and concurrency limiting.
 */
export async function makeWordPressRequest(method, endpoint, data, options) {
    const siteId = options?.siteId || activeSiteId;
    const client = getClient(siteId);
    const limiter = getLimiter(siteId);
    const namespace = options?.namespace || 'wp/v2';
    // Build the full path: {namespace}/{endpoint}
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const path = `${namespace}/${cleanEndpoint}`;
    await limiter.acquire();
    try {
        return await executeWithRetry(client, method, path, data, siteId, options);
    }
    finally {
        limiter.release();
    }
}
async function executeWithRetry(client, method, path, data, siteId, options) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const requestConfig = {
                method,
                url: path,
                headers: options?.headers || {},
            };
            if (options?.timeout) {
                requestConfig.timeout = options.timeout;
            }
            if (method === 'GET') {
                requestConfig.params = data;
            }
            else if (options?.isFormData) {
                requestConfig.data = data;
            }
            else if (data) {
                requestConfig.data = data;
            }
            const response = await client.request(requestConfig);
            // Handle pagination metadata extraction
            if (options?.includePagination && method === 'GET') {
                const total = parseInt(response.headers['x-wp-total'] || '0', 10);
                const totalPages = parseInt(response.headers['x-wp-totalpages'] || '0', 10);
                const page = data?.page || 1;
                const perPage = data?.per_page || 10;
                return {
                    items: response.data,
                    pagination: { total, totalPages, page, perPage },
                };
            }
            return options?.rawResponse ? response : response.data;
        }
        catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES && isRetryableError(error, method)) {
                const delay = getRetryDelay(attempt, error);
                const status = error.response?.status || error.code || 'unknown';
                logToStderr(`[${siteId}] Retry ${attempt + 1}/${MAX_RETRIES} for ${method} ${path} (${status}), waiting ${Math.round(delay)}ms`);
                await sleep(delay);
                continue;
            }
            break;
        }
    }
    // All retries exhausted or non-retryable error
    const errorMessage = lastError.response?.data?.message || lastError.message;
    logToStderr(`[${siteId}] Error ${method} ${path}: ${errorMessage}`);
    throw lastError;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// ── WooCommerce Request Interface ────────────────────────────────
/**
 * Check if a site has WooCommerce credentials configured.
 */
export function hasWooCommerce(siteId) {
    const id = siteId || activeSiteId;
    return wcSiteClients.has(id);
}
/**
 * Get the WooCommerce client for a site.
 */
function getWcClient(siteId) {
    const id = siteId || activeSiteId;
    const client = wcSiteClients.get(id);
    if (!client) {
        throw new Error(`WooCommerce not configured for site "${id}". ` +
            `Add wc_consumer_key and wc_consumer_secret to WP_SITES_CONFIG.`);
    }
    return client;
}
/**
 * Make a request to the WooCommerce REST API.
 * Uses Consumer Key/Secret auth and wc/v3 namespace by default.
 */
export async function makeWooCommerceRequest(method, endpoint, data, options) {
    const siteId = options?.siteId || activeSiteId;
    const client = getWcClient(siteId);
    const limiter = getLimiter(siteId);
    const namespace = options?.namespace || 'wc/v3';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const path = `${namespace}/${cleanEndpoint}`;
    await limiter.acquire();
    try {
        return await executeWithRetry(client, method, path, data, siteId, options);
    }
    finally {
        limiter.release();
    }
}
// ── Mailchimp Request Interface ──────────────────────────────────
export function hasMailchimp(siteId) {
    const id = siteId || activeSiteId;
    return mcSiteClients.has(id);
}
export async function makeMailchimpRequest(method, endpoint, data, siteId) {
    const id = siteId || activeSiteId;
    const client = mcSiteClients.get(id);
    if (!client) {
        throw new Error(`Mailchimp not configured for site "${id}". Add mailchimp_api_key to WP_SITES_CONFIG.`);
    }
    const limiter = getLimiter(id);
    await limiter.acquire();
    try {
        const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
        return response.data;
    }
    finally {
        limiter.release();
    }
}
// ── Buffer Request Interface ─────────────────────────────────────
export function hasBuffer(siteId) {
    const id = siteId || activeSiteId;
    return bufSiteClients.has(id);
}
export async function makeBufferRequest(method, endpoint, data, siteId) {
    const id = siteId || activeSiteId;
    const client = bufSiteClients.get(id);
    if (!client) {
        throw new Error(`Buffer not configured for site "${id}". Add buffer_access_token to WP_SITES_CONFIG.`);
    }
    const limiter = getLimiter(id);
    await limiter.acquire();
    try {
        const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
        return response.data;
    }
    finally {
        limiter.release();
    }
}
// ── SendGrid Request Interface ───────────────────────────────────
export function hasSendGrid(siteId) {
    const id = siteId || activeSiteId;
    return sgSiteClients.has(id);
}
export async function makeSendGridRequest(method, endpoint, data, siteId) {
    const id = siteId || activeSiteId;
    const client = sgSiteClients.get(id);
    if (!client) {
        throw new Error(`SendGrid not configured for site "${id}". Add sendgrid_api_key to WP_SITES_CONFIG.`);
    }
    const limiter = getLimiter(id);
    await limiter.acquire();
    try {
        const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
        return response.data;
    }
    finally {
        limiter.release();
    }
}
// ── Google Search Console Interface ─────────────────────────────
const gscAuthClients = new Map();
export function hasGSC(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    return !!(site?.gsc_service_account_key && site?.gsc_site_url);
}
export function getGSCSiteUrl(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    if (!site?.gsc_site_url) {
        throw new Error(`GSC site URL not configured for site "${id}". Add gsc_site_url to WP_SITES_CONFIG.`);
    }
    return site.gsc_site_url;
}
export async function getGSCAuth(siteId) {
    const id = siteId || activeSiteId;
    // Return cached client if available
    if (gscAuthClients.has(id)) {
        return gscAuthClients.get(id);
    }
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    if (!site?.gsc_service_account_key) {
        throw new Error(`GSC not configured for site "${id}". Add gsc_service_account_key (path to JSON key file) to WP_SITES_CONFIG.`);
    }
    const keyContent = JSON.parse(readFileSync(site.gsc_service_account_key, 'utf-8'));
    const auth = new google.auth.GoogleAuth({
        credentials: keyContent,
        scopes: ['https://www.googleapis.com/auth/webmasters'],
    });
    const authClient = await auth.getClient();
    gscAuthClients.set(id, authClient);
    return authClient;
}
// ── Google Analytics 4 Interface ─────────────────────────────────
const ga4AuthClients = new Map();
export function hasGA4(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    return !!(site?.ga4_property_id && site?.ga4_service_account_key);
}
export function getGA4PropertyId(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    if (!site?.ga4_property_id) {
        throw new Error(`GA4 property not configured for site "${id}". Add ga4_property_id to WP_SITES_CONFIG.`);
    }
    return site.ga4_property_id;
}
export async function getGA4Auth(siteId) {
    const id = siteId || activeSiteId;
    if (ga4AuthClients.has(id))
        return ga4AuthClients.get(id);
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    if (!site?.ga4_service_account_key) {
        throw new Error(`GA4 not configured for site "${id}". Add ga4_service_account_key to WP_SITES_CONFIG.`);
    }
    const keyContent = JSON.parse(readFileSync(site.ga4_service_account_key, 'utf-8'));
    const auth = new google.auth.GoogleAuth({
        credentials: keyContent,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const authClient = await auth.getClient();
    ga4AuthClients.set(id, authClient);
    return authClient;
}
// ── Plausible Analytics Interface ────────────────────────────────
export function hasPlausible(siteId) {
    const id = siteId || activeSiteId;
    return plSiteClients.has(id);
}
export async function makePlausibleRequest(method, endpoint, params, siteId) {
    const id = siteId || activeSiteId;
    const client = plSiteClients.get(id);
    if (!client) {
        throw new Error(`Plausible not configured for site "${id}". Add plausible_api_key to WP_SITES_CONFIG.`);
    }
    const limiter = getLimiter(id);
    await limiter.acquire();
    try {
        const response = await client.request({ method, url: endpoint, params });
        return response.data;
    }
    finally {
        limiter.release();
    }
}
// ── Core Web Vitals Interface (Google API Key) ───────────────────
export function hasGoogleApiKey(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    return !!site?.google_api_key;
}
export function getGoogleApiKey(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    if (!site?.google_api_key) {
        throw new Error(`Google API key not configured for site "${id}". Add google_api_key to WP_SITES_CONFIG.`);
    }
    return site.google_api_key;
}
// ── Plugin Repository (External API) ────────────────────────────────
/**
 * Search the WordPress.org Plugin Repository
 */
export async function searchWordPressPluginRepository(searchQuery, page = 1, perPage = 10) {
    const apiUrl = 'https://api.wordpress.org/plugins/info/1.2/';
    const requestData = {
        action: 'query_plugins',
        request: {
            search: searchQuery,
            page,
            per_page: perPage,
            fields: {
                description: true,
                sections: false,
                tested: true,
                requires: true,
                rating: true,
                downloaded: true,
                downloadlink: true,
                last_updated: true,
                homepage: true,
                tags: true,
            },
        },
    };
    const response = await axios.post(apiUrl, requestData, {
        headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
}

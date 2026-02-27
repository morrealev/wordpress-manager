// src/wordpress.ts - Multi-site WordPress REST API client
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface SiteConfig {
  id: string;
  url: string;
  username: string;
  password: string;
}

// ── Concurrency Limiter ──────────────────────────────────────────────
// Simple FIFO semaphore to cap concurrent requests per site
class ConcurrencyLimiter {
  private running = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

// ── Module State ─────────────────────────────────────────────────────
const siteClients = new Map<string, AxiosInstance>();
const siteLimiters = new Map<string, ConcurrencyLimiter>();
let activeSiteId: string = '';

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
    logToStderr(`Initialized single site: ${url}`);
    return;
  }

  let sites: SiteConfig[];
  try {
    sites = JSON.parse(sitesJson);
  } catch {
    throw new Error('Invalid WP_SITES_CONFIG JSON format');
  }

  if (sites.length === 0) {
    throw new Error('WP_SITES_CONFIG contains no sites');
  }

  for (const site of sites) {
    await initSiteClient(site.id, site.url, site.username, site.password);
    logToStderr(`Initialized site: ${site.id} (${site.url})`);
  }

  activeSiteId = defaultSite || sites[0].id;
  logToStderr(`Active site: ${activeSiteId}`);
}

/**
 * Initialize a single site's Axios client.
 * baseURL now points to {site}/wp-json/ so that tools can use any namespace.
 */
async function initSiteClient(id: string, url: string, username: string, password: string) {
  let baseURL = url.endsWith('/') ? url : `${url}/`;

  // Strip existing wp-json path variants so we normalize to just /wp-json/
  const wpJsonIdx = baseURL.indexOf('/wp-json');
  if (wpJsonIdx !== -1) {
    baseURL = baseURL.substring(0, wpJsonIdx + 1);
  }
  baseURL = baseURL + 'wp-json/';

  const config: AxiosRequestConfig = {
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
  } catch (error: any) {
    logToStderr(`Warning: Could not verify connection to ${url}: ${error.message}`);
    // Don't throw - the site might become available later
  }

  siteClients.set(id, client);
  siteLimiters.set(id, new ConcurrencyLimiter(MAX_CONCURRENT_PER_SITE));
}

// ── Site Management ──────────────────────────────────────────────────

/**
 * Get the active site's client, or a specific site's client
 */
function getClient(siteId?: string): AxiosInstance {
  const id = siteId || activeSiteId;
  const client = siteClients.get(id);
  if (!client) {
    const available = Array.from(siteClients.keys()).join(', ');
    throw new Error(`Site "${id}" not found. Available sites: ${available}`);
  }
  return client;
}

function getLimiter(siteId?: string): ConcurrencyLimiter {
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
export function switchSite(siteId: string): string {
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
export function listSites(): string[] {
  return Array.from(siteClients.keys());
}

/**
 * Get the active site ID
 */
export function getActiveSite(): string {
  return activeSiteId;
}

// ── Logging ──────────────────────────────────────────────────────────

/**
 * Log to stderr (safe for MCP stdio transport)
 */
export function logToStderr(message: string) {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] ${message}\n`);
}

// Keep backward-compatible alias
export const logToFile = logToStderr;

// ── Retry Logic ──────────────────────────────────────────────────────

function isRetryableError(error: any, method: string): boolean {
  // Network errors are always retryable
  if (error.code && RETRYABLE_ERROR_CODES.has(error.code)) {
    return true;
  }

  const status = error.response?.status;
  if (!status) return false;

  // For non-GET (mutating) methods, only retry on 429 (rate limit) — not 5xx
  // to avoid duplicate side-effects
  if (method !== 'GET') {
    return status === 429;
  }

  return RETRYABLE_STATUS_CODES.has(status);
}

function getRetryDelay(attempt: number, error: any): number {
  // Respect Retry-After header on 429
  const retryAfter = error.response?.headers?.['retry-after'];
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
  }

  // Exponential backoff: 1s, 2s, 4s + jitter (0–500ms)
  const base = Math.pow(2, attempt) * 1000;
  const jitter = Math.random() * 500;
  return base + jitter;
}

// ── Request Interface ────────────────────────────────────────────────

export interface WordPressRequestOptions {
  headers?: Record<string, string>;
  isFormData?: boolean;
  rawResponse?: boolean;
  siteId?: string;
  namespace?: string;    // API namespace (default: 'wp/v2')
  timeout?: number;      // Per-request timeout override in ms
  includePagination?: boolean; // Return pagination metadata
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
export async function makeWordPressRequest(
  method: string,
  endpoint: string,
  data?: any,
  options?: WordPressRequestOptions
): Promise<any> {
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
  } finally {
    limiter.release();
  }
}

async function executeWithRetry(
  client: AxiosInstance,
  method: string,
  path: string,
  data: any,
  siteId: string,
  options?: WordPressRequestOptions
): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const requestConfig: any = {
        method,
        url: path,
        headers: options?.headers || {},
      };

      if (options?.timeout) {
        requestConfig.timeout = options.timeout;
      }

      if (method === 'GET') {
        requestConfig.params = data;
      } else if (options?.isFormData) {
        requestConfig.data = data;
      } else if (data) {
        requestConfig.data = data;
      }

      const response: AxiosResponse = await client.request(requestConfig);

      // Handle pagination metadata extraction
      if (options?.includePagination && method === 'GET') {
        const total = parseInt(response.headers['x-wp-total'] || '0', 10);
        const totalPages = parseInt(response.headers['x-wp-totalpages'] || '0', 10);
        const page = data?.page || 1;
        const perPage = data?.per_page || 10;

        return {
          items: response.data,
          pagination: { total, totalPages, page, perPage },
        } as PaginatedResponse;
      }

      return options?.rawResponse ? response : response.data;
    } catch (error: any) {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Plugin Repository (External API) ────────────────────────────────

/**
 * Search the WordPress.org Plugin Repository
 */
export async function searchWordPressPluginRepository(
  searchQuery: string,
  page: number = 1,
  perPage: number = 10
) {
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

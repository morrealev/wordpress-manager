// src/wordpress.ts - Multi-site WordPress REST API client
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface SiteConfig {
  id: string;
  url: string;
  username: string;
  password: string;
}

// Map of site ID to authenticated Axios client
const siteClients = new Map<string, AxiosInstance>();
let activeSiteId: string = '';

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
 * Initialize a single site's Axios client
 */
async function initSiteClient(id: string, url: string, username: string, password: string) {
  let baseURL = url.endsWith('/') ? url : `${url}/`;
  if (!baseURL.includes('/wp-json/wp/v2')) {
    baseURL = baseURL + 'wp-json/wp/v2/';
  } else if (!baseURL.endsWith('/')) {
    baseURL = baseURL + '/';
  }

  const config: AxiosRequestConfig = {
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  };

  if (username && password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    config.headers = {
      ...config.headers,
      'Authorization': `Basic ${auth}`,
    };
  }

  const client = axios.create(config);

  // Verify connection
  try {
    await client.get('');
  } catch (error: any) {
    logToStderr(`Warning: Could not verify connection to ${url}: ${error.message}`);
    // Don't throw - the site might become available later
  }

  siteClients.set(id, client);
}

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

/**
 * Log to stderr (safe for MCP stdio transport)
 */
export function logToStderr(message: string) {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] ${message}\n`);
}

// Keep backward-compatible alias
export const logToFile = logToStderr;

/**
 * Make a request to the WordPress API (active site or specific site)
 */
export async function makeWordPressRequest(
  method: string,
  endpoint: string,
  data?: any,
  options?: {
    headers?: Record<string, string>;
    isFormData?: boolean;
    rawResponse?: boolean;
    siteId?: string;
  }
) {
  const client = getClient(options?.siteId);
  const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  try {
    const requestConfig: any = {
      method,
      url: path,
      headers: options?.headers || {},
    };

    if (method === 'GET') {
      requestConfig.params = data;
    } else if (options?.isFormData) {
      requestConfig.data = data;
    } else if (data) {
      requestConfig.data = data;
    }

    const response = await client.request(requestConfig);
    return options?.rawResponse ? response : response.data;
  } catch (error: any) {
    const siteLabel = options?.siteId || activeSiteId;
    logToStderr(`[${siteLabel}] Error ${method} ${path}: ${error.message}`);
    throw error;
  }
}

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

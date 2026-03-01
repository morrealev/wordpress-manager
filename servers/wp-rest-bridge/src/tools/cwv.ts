// src/tools/cwv.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hasGoogleApiKey, getGoogleApiKey } from '../wordpress.js';
import axios from 'axios';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────

const cwvAnalyzeUrlSchema = z.object({
  url: z.string().describe('URL to analyze'),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile')
    .describe('Analysis strategy (default: mobile)'),
  categories: z.array(z.enum(['performance', 'accessibility', 'best-practices', 'seo'])).optional()
    .describe('Lighthouse categories to include (default: performance only)'),
}).strict();

const cwvBatchAnalyzeSchema = z.object({
  urls: z.array(z.string()).describe('Array of URLs to analyze (max 10)'),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile'),
}).strict();

const cwvGetFieldDataSchema = z.object({
  url: z.string().optional().describe('Specific URL for field data (omit for origin-level data)'),
  origin: z.string().optional().describe('Origin URL (e.g., https://mysite.com)'),
  form_factor: z.enum(['PHONE', 'DESKTOP', 'TABLET', 'ALL_FORM_FACTORS']).optional().default('ALL_FORM_FACTORS'),
}).strict();

const cwvComparePagesSchema = z.object({
  urls: z.array(z.string()).describe('URLs to compare (2-5)'),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const cwvTools: Tool[] = [
  {
    name: "cwv_analyze_url",
    description: "Analyzes Core Web Vitals for a URL via PageSpeed Insights (LCP, INP, CLS, FCP, TTFB)",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to analyze" },
        strategy: { type: "string", enum: ["mobile", "desktop"], description: "Strategy (default: mobile)" },
        categories: { type: "array", items: { type: "string", enum: ["performance", "accessibility", "best-practices", "seo"] }, description: "Categories to include" },
      },
      required: ["url"],
    },
  },
  {
    name: "cwv_batch_analyze",
    description: "Analyzes Core Web Vitals for multiple URLs (max 10) via PageSpeed Insights",
    inputSchema: {
      type: "object",
      properties: {
        urls: { type: "array", items: { type: "string" }, description: "URLs to analyze (max 10)" },
        strategy: { type: "string", enum: ["mobile", "desktop"], description: "Strategy (default: mobile)" },
      },
      required: ["urls"],
    },
  },
  {
    name: "cwv_get_field_data",
    description: "Gets real-user CWV field data from Chrome UX Report (28-day aggregate)",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Specific URL (omit for origin-level)" },
        origin: { type: "string", description: "Origin URL (e.g., https://mysite.com)" },
        form_factor: { type: "string", enum: ["PHONE", "DESKTOP", "TABLET", "ALL_FORM_FACTORS"], description: "Form factor (default: ALL)" },
      },
    },
  },
  {
    name: "cwv_compare_pages",
    description: "Compares Core Web Vitals across multiple pages and ranks optimization priority",
    inputSchema: {
      type: "object",
      properties: {
        urls: { type: "array", items: { type: "string" }, description: "URLs to compare (2-5)" },
        strategy: { type: "string", enum: ["mobile", "desktop"], description: "Strategy (default: mobile)" },
      },
      required: ["urls"],
    },
  },
];

// ── Handlers ────────────────────────────────────────────────────

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CRUX_BASE = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

function extractCWV(lighthouse: any) {
  const audits = lighthouse?.audits || {};
  return {
    lcp: audits['largest-contentful-paint']?.numericValue,
    fcp: audits['first-contentful-paint']?.numericValue,
    cls: audits['cumulative-layout-shift']?.numericValue,
    inp: audits['interaction-to-next-paint']?.numericValue,
    ttfb: audits['server-response-time']?.numericValue,
    performance_score: lighthouse?.categories?.performance?.score,
  };
}

export const cwvHandlers: Record<string, Function> = {
  cwv_analyze_url: async (params: z.infer<typeof cwvAnalyzeUrlSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { url, strategy, categories } = params;
      const apiKey = getGoogleApiKey();
      const queryParams: Record<string, any> = { url, key: apiKey, strategy: strategy || 'mobile' };
      queryParams.category = categories && categories.length > 0 ? categories : ['performance'];
      const response = await axios.get(PSI_BASE, { params: queryParams, timeout: 60000 });
      const cwv = extractCWV(response.data.lighthouseResult);
      const result = { url, strategy: strategy || 'mobile', cwv, fieldData: response.data.loadingExperience || null };
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error analyzing URL: ${errorMessage}` }] } };
    }
  },

  cwv_batch_analyze: async (params: z.infer<typeof cwvBatchAnalyzeSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { urls, strategy } = params;
      const limitedUrls = urls.slice(0, 10);
      const apiKey = getGoogleApiKey();
      const results = [];
      for (const url of limitedUrls) {
        try {
          const response = await axios.get(PSI_BASE, {
            params: { url, key: apiKey, strategy: strategy || 'mobile', category: 'performance' },
            timeout: 60000,
          });
          const cwv = extractCWV(response.data.lighthouseResult);
          results.push({ url, cwv, status: 'ok' });
        } catch (err: any) {
          results.push({ url, status: 'error', error: err.response?.data?.error?.message || err.message });
        }
      }
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] } };
    } catch (error: any) {
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error in batch analysis: ${error.message}` }] } };
    }
  },

  cwv_get_field_data: async (params: z.infer<typeof cwvGetFieldDataSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { url, origin, form_factor } = params;
      const apiKey = getGoogleApiKey();
      const requestBody: Record<string, any> = {};
      if (url) requestBody.url = url;
      else if (origin) requestBody.origin = origin;
      else return { toolResult: { isError: true, content: [{ type: "text", text: "Provide either url or origin parameter." }] } };
      if (form_factor && form_factor !== 'ALL_FORM_FACTORS') requestBody.formFactor = form_factor;
      const response = await axios.post(CRUX_BASE, requestBody, { params: { key: apiKey }, timeout: 30000 });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting CrUX data: ${errorMessage}` }] } };
    }
  },

  cwv_compare_pages: async (params: z.infer<typeof cwvComparePagesSchema>) => {
    if (!hasGoogleApiKey()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Google API key not configured. Add google_api_key to WP_SITES_CONFIG." }] } };
    }
    try {
      const { urls, strategy } = params;
      const limitedUrls = urls.slice(0, 5);
      const apiKey = getGoogleApiKey();
      const results = [];
      for (const url of limitedUrls) {
        try {
          const response = await axios.get(PSI_BASE, {
            params: { url, key: apiKey, strategy: strategy || 'mobile', category: 'performance' },
            timeout: 60000,
          });
          const cwv = extractCWV(response.data.lighthouseResult);
          results.push({ url, cwv });
        } catch (err: any) {
          results.push({ url, cwv: null, error: err.message });
        }
      }
      // Rank by worst LCP
      const ranked = results
        .filter(r => r.cwv)
        .sort((a, b) => (b.cwv!.lcp || 0) - (a.cwv!.lcp || 0))
        .map((r, i) => ({ ...r, priority: i + 1 }));
      return { toolResult: { content: [{ type: "text", text: JSON.stringify({ comparison: ranked, worst_first: true }, null, 2) }] } };
    } catch (error: any) {
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error comparing pages: ${error.message}` }] } };
    }
  },
};

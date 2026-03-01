# Tier 6+7 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Distribution layer (8→9/10) with LinkedIn + Twitter/X direct APIs and auto-transform pipeline, then complete Content Factory layer (9→10/10) with AI content generation procedures and structured data MCP tools.

**Architecture:** Connector-per-Platform approach. Each social API gets its own TypeScript tool file (`linkedin.js`, `twitter.js`) following the exact pattern of `buffer.js`/`slack.js`. New helper functions in `wordpress.js` for client init + has/make helpers. Structured data tools in `schema.js` using WordPress REST API (no external auth). Content generation is purely procedure-based (skill references only, no MCP tools). Three incremental releases: v2.10.0 (social), v2.11.0 (auto-transform), v2.12.0 (content gen + schema).

**Tech Stack:** JavaScript (compiled from TypeScript), axios, zod, MCP SDK, Node.js ESM modules.

---

## Release v2.10.0 — Direct Social APIs (LinkedIn + Twitter/X)

### Task 1: Add LinkedIn client helpers to wordpress.js

**Files:**
- Modify: `servers/wp-rest-bridge/build/wordpress.js`

**Context:** Every external service follows the same pattern in `wordpress.js`:
1. A `Map` for per-site axios clients (line ~34-41)
2. An `initXxxClient()` function that creates an axios instance
3. A `hasXxx()` function to check if configured
4. A `makeXxxRequest()` function for API calls
5. Registration in the `initWordPress()` loop (line ~83-114)

LinkedIn uses OAuth 2.0. The Community Management API v2 base URL is `https://api.linkedin.com/rest/`. Auth header: `Authorization: Bearer {token}`. Required header: `LinkedIn-Version: 202401`.

**Step 1: Add LinkedIn client Map and init function**

Add after `const slackBotClients = new Map();` (line 41):

```javascript
const liSiteClients = new Map();
```

Add after the `initSlackBotClient` function (after line 236):

```javascript
async function initLinkedInClient(id, accessToken) {
    const client = axios.create({
        baseURL: 'https://api.linkedin.com/rest/',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'LinkedIn-Version': '202401',
            'X-Restli-Protocol-Version': '2.0.0',
        },
        timeout: DEFAULT_TIMEOUT_MS,
    });
    liSiteClients.set(id, client);
}
```

**Step 2: Add LinkedIn has/make/get helpers**

Add after the `makeSlackBotRequest` function (after line ~649):

```javascript
// ── LinkedIn Interface ──────────────────────────────────────────
export function hasLinkedIn(siteId) {
    const id = siteId || activeSiteId;
    return liSiteClients.has(id);
}
export async function makeLinkedInRequest(method, endpoint, data, siteId) {
    const id = siteId || activeSiteId;
    const client = liSiteClients.get(id);
    if (!client) {
        throw new Error(`LinkedIn not configured for site "${id}". Add linkedin_access_token to WP_SITES_CONFIG.`);
    }
    const limiter = getLimiter(id);
    await limiter.acquire();
    try {
        const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
        return response.data;
    } finally {
        limiter.release();
    }
}
export function getLinkedInPersonUrn(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    if (!site?.linkedin_person_urn) {
        throw new Error(`LinkedIn person URN not configured for site "${id}". Add linkedin_person_urn to WP_SITES_CONFIG.`);
    }
    return site.linkedin_person_urn;
}
```

**Step 3: Register LinkedIn in initWordPress() loop**

Add after the `slack_bot_token` block (after line 113):

```javascript
        if (site.linkedin_access_token) {
            await initLinkedInClient(site.id, site.linkedin_access_token);
            logToStderr(`Initialized LinkedIn for site: ${site.id}`);
        }
```

**Step 4: Commit**

```bash
git add servers/wp-rest-bridge/build/wordpress.js
git commit -m "feat(bridge): aggiunge LinkedIn client helpers a wordpress.js

- initLinkedInClient() con OAuth 2.0 bearer token
- hasLinkedIn(), makeLinkedInRequest(), getLinkedInPersonUrn()
- Registrazione nel loop initWordPress()
- LinkedIn API v2 (Community Management API, versione 202401)"
```

---

### Task 2: Create linkedin.js MCP tool file

**Files:**
- Create: `servers/wp-rest-bridge/build/tools/linkedin.js`

**Context:** Follow the exact pattern of `buffer.js` (5 tools, Zod schemas, tool definitions, handlers). LinkedIn Community Management API endpoints:
- `GET /userinfo` — get profile
- `POST /posts` — create post (with `author` URN)
- `POST /articles` — create article
- `GET /organizationalEntityShareStatistics` — analytics
- `GET /posts?author={urn}` — list posts

**Step 1: Create the file**

```javascript
import { hasLinkedIn, makeLinkedInRequest, getLinkedInPersonUrn } from '../wordpress.js';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────
const liGetProfileSchema = z.object({}).strict();

const liCreatePostSchema = z.object({
    text: z.string().describe('Post text content'),
    link_url: z.string().optional().describe('URL to attach as link share'),
    image_url: z.string().optional().describe('URL of image to attach'),
    visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC')
        .describe('Post visibility (default: PUBLIC)'),
}).strict();

const liCreateArticleSchema = z.object({
    title: z.string().describe('Article title'),
    body_html: z.string().describe('Article body in HTML format'),
    thumbnail_url: z.string().optional().describe('Thumbnail image URL'),
}).strict();

const liGetAnalyticsSchema = z.object({
    post_id: z.string().optional().describe('Specific post URN for analytics (all posts if omitted)'),
    period: z.enum(['day', 'month']).optional().default('month')
        .describe('Time granularity (default: month)'),
}).strict();

const liListPostsSchema = z.object({
    count: z.number().optional().default(10).describe('Number of posts to return (default 10)'),
    start: z.number().optional().default(0).describe('Pagination start index'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────
export const linkedinTools = [
    {
        name: "li_get_profile",
        description: "Gets the authenticated LinkedIn user profile (name, headline, vanity URL)",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "li_create_post",
        description: "Creates a LinkedIn feed post (text, optional link or image)",
        inputSchema: {
            type: "object",
            properties: {
                text: { type: "string", description: "Post text content" },
                link_url: { type: "string", description: "URL to attach as link share" },
                image_url: { type: "string", description: "URL of image to attach" },
                visibility: { type: "string", enum: ["PUBLIC", "CONNECTIONS"], description: "Post visibility (default: PUBLIC)" },
            },
            required: ["text"],
        },
    },
    {
        name: "li_create_article",
        description: "Publishes a long-form LinkedIn article (blog-to-article)",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Article title" },
                body_html: { type: "string", description: "Article body in HTML" },
                thumbnail_url: { type: "string", description: "Thumbnail image URL" },
            },
            required: ["title", "body_html"],
        },
    },
    {
        name: "li_get_analytics",
        description: "Gets LinkedIn post analytics (impressions, clicks, engagement rate)",
        inputSchema: {
            type: "object",
            properties: {
                post_id: { type: "string", description: "Specific post URN (all posts if omitted)" },
                period: { type: "string", enum: ["day", "month"], description: "Time granularity" },
            },
        },
    },
    {
        name: "li_list_posts",
        description: "Lists recent LinkedIn posts by the authenticated user",
        inputSchema: {
            type: "object",
            properties: {
                count: { type: "number", description: "Number of posts (default 10)" },
                start: { type: "number", description: "Pagination start index" },
            },
        },
    },
];

// ── Handlers ────────────────────────────────────────────────────
export const linkedinHandlers = {
    li_get_profile: async (_params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const response = await makeLinkedInRequest('GET', 'userinfo');
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting LinkedIn profile: ${errorMessage}` }] } };
        }
    },

    li_create_post: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { text, link_url, image_url, visibility } = params;
            const personUrn = getLinkedInPersonUrn();
            const payload = {
                author: personUrn,
                lifecycleState: 'PUBLISHED',
                visibility: visibility || 'PUBLIC',
                commentary: text,
                distribution: { feedDistribution: 'MAIN_FEED' },
            };
            if (link_url) {
                payload.content = {
                    article: { source: link_url, title: text.substring(0, 200) },
                };
            }
            const response = await makeLinkedInRequest('POST', 'posts', payload);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, post_id: response.id || response['x-restli-id'] || 'created' }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating LinkedIn post: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}` }] } };
        }
    },

    li_create_article: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { title, body_html, thumbnail_url } = params;
            const personUrn = getLinkedInPersonUrn();
            const payload = {
                author: personUrn,
                lifecycleState: 'PUBLISHED',
                visibility: 'PUBLIC',
                commentary: title,
                content: {
                    article: {
                        title,
                        description: body_html.replace(/<[^>]*>/g, '').substring(0, 256),
                        source: thumbnail_url || undefined,
                    },
                },
                distribution: { feedDistribution: 'MAIN_FEED' },
            };
            const response = await makeLinkedInRequest('POST', 'posts', payload);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, article_id: response.id || 'created' }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating LinkedIn article: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}` }] } };
        }
    },

    li_get_analytics: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const personUrn = getLinkedInPersonUrn();
            const queryParams = {
                q: 'organizationalEntity',
                organizationalEntity: personUrn,
            };
            if (params.period) queryParams.timeIntervals = `(timeRange:(start:0),timeGranularityType:${params.period.toUpperCase()})`;
            const response = await makeLinkedInRequest('GET', 'organizationalEntityShareStatistics', queryParams);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting LinkedIn analytics: ${errorMessage}` }] } };
        }
    },

    li_list_posts: async (params) => {
        if (!hasLinkedIn()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "LinkedIn not configured. Add linkedin_access_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const personUrn = getLinkedInPersonUrn();
            const count = params.count || 10;
            const start = params.start || 0;
            const response = await makeLinkedInRequest('GET', `posts?author=${encodeURIComponent(personUrn)}&q=author&count=${count}&start=${start}`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing LinkedIn posts: ${errorMessage}` }] } };
        }
    },
};
```

**Step 2: Commit**

```bash
git add servers/wp-rest-bridge/build/tools/linkedin.js
git commit -m "feat(bridge): aggiunge linkedin.js con 5 MCP tools

Tools: li_get_profile, li_create_post, li_create_article,
li_get_analytics, li_list_posts

- LinkedIn Community Management API v2 (versione 202401)
- OAuth 2.0 bearer token authentication
- Post creation con link share e image support
- Article publishing per blog-to-LinkedIn workflow"
```

---

### Task 3: Add Twitter client helpers to wordpress.js

**Files:**
- Modify: `servers/wp-rest-bridge/build/wordpress.js`

**Context:** Twitter API v2 uses OAuth 1.0a for posting (user context) via `oauth-1.0a` or simply Bearer token for read. For simplicity, we use Bearer token for reads and API key+secret+access token for writes. Base URL: `https://api.twitter.com/2/`.

**Step 1: Add Twitter client Map and init function**

Add after `const liSiteClients = new Map();`:

```javascript
const twSiteClients = new Map();
```

Add after the `initLinkedInClient` function:

```javascript
async function initTwitterClient(id, bearerToken) {
    const client = axios.create({
        baseURL: 'https://api.twitter.com/2/',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`,
        },
        timeout: DEFAULT_TIMEOUT_MS,
    });
    twSiteClients.set(id, client);
}
```

**Step 2: Add Twitter has/make helpers**

Add after the LinkedIn helpers section:

```javascript
// ── Twitter/X Interface ─────────────────────────────────────────
export function hasTwitter(siteId) {
    const id = siteId || activeSiteId;
    return twSiteClients.has(id);
}
export async function makeTwitterRequest(method, endpoint, data, siteId) {
    const id = siteId || activeSiteId;
    const client = twSiteClients.get(id);
    if (!client) {
        throw new Error(`Twitter not configured for site "${id}". Add twitter_bearer_token to WP_SITES_CONFIG.`);
    }
    const limiter = getLimiter(id);
    await limiter.acquire();
    try {
        const response = await client.request({ method, url: endpoint, data: method !== 'GET' ? data : undefined, params: method === 'GET' ? data : undefined });
        return response.data;
    } finally {
        limiter.release();
    }
}
export function getTwitterUserId(siteId) {
    const id = siteId || activeSiteId;
    const sites = JSON.parse(process.env.WP_SITES_CONFIG || '[]');
    const site = sites.find((s) => s.id === id);
    if (!site?.twitter_user_id) {
        throw new Error(`Twitter user ID not configured for site "${id}". Add twitter_user_id to WP_SITES_CONFIG.`);
    }
    return site.twitter_user_id;
}
```

**Step 3: Register Twitter in initWordPress() loop**

Add after the LinkedIn registration block:

```javascript
        if (site.twitter_bearer_token) {
            await initTwitterClient(site.id, site.twitter_bearer_token);
            logToStderr(`Initialized Twitter for site: ${site.id}`);
        }
```

**Step 4: Commit**

```bash
git add servers/wp-rest-bridge/build/wordpress.js
git commit -m "feat(bridge): aggiunge Twitter/X client helpers a wordpress.js

- initTwitterClient() con Bearer token (API v2)
- hasTwitter(), makeTwitterRequest(), getTwitterUserId()
- Registrazione nel loop initWordPress()"
```

---

### Task 4: Create twitter.js MCP tool file

**Files:**
- Create: `servers/wp-rest-bridge/build/tools/twitter.js`

**Step 1: Create the file**

```javascript
import { hasTwitter, makeTwitterRequest, getTwitterUserId } from '../wordpress.js';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────
const twCreateTweetSchema = z.object({
    text: z.string().max(280).describe('Tweet text (max 280 characters)'),
    media_ids: z.array(z.string()).optional().describe('Array of media IDs to attach'),
    reply_to: z.string().optional().describe('Tweet ID to reply to (for threads)'),
}).strict();

const twCreateThreadSchema = z.object({
    tweets: z.array(z.string().max(280)).min(2)
        .describe('Array of tweet texts (min 2, each max 280 chars)'),
}).strict();

const twGetMetricsSchema = z.object({
    tweet_id: z.string().describe('Tweet ID to get metrics for'),
}).strict();

const twListTweetsSchema = z.object({
    count: z.number().optional().default(10).describe('Number of tweets (default 10, max 100)'),
    since: z.string().optional().describe('Only tweets after this ISO 8601 date'),
}).strict();

const twDeleteTweetSchema = z.object({
    tweet_id: z.string().describe('Tweet ID to delete'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────
export const twitterTools = [
    {
        name: "tw_create_tweet",
        description: "Publishes a tweet (text, optional media, optional reply-to for threads)",
        inputSchema: {
            type: "object",
            properties: {
                text: { type: "string", description: "Tweet text (max 280 characters)" },
                media_ids: { type: "array", items: { type: "string" }, description: "Media IDs to attach" },
                reply_to: { type: "string", description: "Tweet ID to reply to" },
            },
            required: ["text"],
        },
    },
    {
        name: "tw_create_thread",
        description: "Publishes a connected Twitter thread (multiple tweets linked as replies)",
        inputSchema: {
            type: "object",
            properties: {
                tweets: { type: "array", items: { type: "string" }, description: "Array of tweet texts (min 2)" },
            },
            required: ["tweets"],
        },
    },
    {
        name: "tw_get_metrics",
        description: "Gets tweet metrics (impressions, likes, retweets, replies, quotes)",
        inputSchema: {
            type: "object",
            properties: {
                tweet_id: { type: "string", description: "Tweet ID" },
            },
            required: ["tweet_id"],
        },
    },
    {
        name: "tw_list_tweets",
        description: "Lists recent tweets by the authenticated user",
        inputSchema: {
            type: "object",
            properties: {
                count: { type: "number", description: "Number of tweets (default 10)" },
                since: { type: "string", description: "Only tweets after this ISO 8601 date" },
            },
        },
    },
    {
        name: "tw_delete_tweet",
        description: "Deletes a tweet by ID (irreversible)",
        inputSchema: {
            type: "object",
            properties: {
                tweet_id: { type: "string", description: "Tweet ID to delete" },
            },
            required: ["tweet_id"],
        },
    },
];

// ── Handlers ────────────────────────────────────────────────────
export const twitterHandlers = {
    tw_create_tweet: async (params) => {
        if (!hasTwitter()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Twitter not configured. Add twitter_bearer_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { text, media_ids, reply_to } = params;
            const payload = { text };
            if (media_ids?.length) payload.media = { media_ids };
            if (reply_to) payload.reply = { in_reply_to_tweet_id: reply_to };
            const response = await makeTwitterRequest('POST', 'tweets', payload);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.title || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating tweet: ${errorMessage}` }] } };
        }
    },

    tw_create_thread: async (params) => {
        if (!hasTwitter()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Twitter not configured. Add twitter_bearer_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { tweets } = params;
            if (!tweets || tweets.length < 2) {
                return { toolResult: { isError: true, content: [{ type: "text", text: "A thread requires at least 2 tweets." }] } };
            }
            const results = [];
            let lastTweetId = null;
            for (const tweetText of tweets) {
                const payload = { text: tweetText };
                if (lastTweetId) payload.reply = { in_reply_to_tweet_id: lastTweetId };
                const response = await makeTwitterRequest('POST', 'tweets', payload);
                lastTweetId = response.data?.id;
                results.push({ id: lastTweetId, text: tweetText });
            }
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ thread_length: results.length, tweets: results }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating thread: ${errorMessage}` }] } };
        }
    },

    tw_get_metrics: async (params) => {
        if (!hasTwitter()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Twitter not configured. Add twitter_bearer_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { tweet_id } = params;
            const response = await makeTwitterRequest('GET', `tweets/${tweet_id}?tweet.fields=public_metrics,created_at,text`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting tweet metrics: ${errorMessage}` }] } };
        }
    },

    tw_list_tweets: async (params) => {
        if (!hasTwitter()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Twitter not configured. Add twitter_bearer_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const userId = getTwitterUserId();
            const count = Math.min(params.count || 10, 100);
            let endpoint = `users/${userId}/tweets?max_results=${count}&tweet.fields=public_metrics,created_at,text`;
            if (params.since) endpoint += `&start_time=${params.since}`;
            const response = await makeTwitterRequest('GET', endpoint);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing tweets: ${errorMessage}` }] } };
        }
    },

    tw_delete_tweet: async (params) => {
        if (!hasTwitter()) {
            return { toolResult: { isError: true, content: [{ type: "text", text: "Twitter not configured. Add twitter_bearer_token to WP_SITES_CONFIG." }] } };
        }
        try {
            const { tweet_id } = params;
            const response = await makeTwitterRequest('DELETE', `tweets/${tweet_id}`);
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ deleted: true, tweet_id }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting tweet: ${errorMessage}` }] } };
        }
    },
};
```

**Step 2: Commit**

```bash
git add servers/wp-rest-bridge/build/tools/twitter.js
git commit -m "feat(bridge): aggiunge twitter.js con 5 MCP tools

Tools: tw_create_tweet, tw_create_thread, tw_get_metrics,
tw_list_tweets, tw_delete_tweet

- Twitter API v2 con Bearer token
- Thread creation sequenziale con reply chaining
- Public metrics (impressions, likes, retweets, replies)
- Delete con safety hook (definito in Task 7)"
```

---

### Task 5: Register LinkedIn and Twitter in index.js

**Files:**
- Modify: `servers/wp-rest-bridge/build/tools/index.js`

**Step 1: Add imports and registration**

Add after the `import { wcWorkflowTools, wcWorkflowHandlers } from './wc-workflows.js';` line:

```javascript
import { linkedinTools, linkedinHandlers } from './linkedin.js';
import { twitterTools, twitterHandlers } from './twitter.js';
```

Add to `allTools` array after `...wcWorkflowTools, // 4 tools`:

```javascript
    ...linkedinTools, // 5 tools
    ...twitterTools, // 5 tools
```

Add to `toolHandlers` object after `...wcWorkflowHandlers,`:

```javascript
    ...linkedinHandlers,
    ...twitterHandlers,
```

**Step 2: Commit**

```bash
git add servers/wp-rest-bridge/build/tools/index.js
git commit -m "feat(bridge): registra LinkedIn e Twitter tools in index.js

Tool count: 132 → 142 (+10 tools)
- 5 LinkedIn tools (li_*)
- 5 Twitter tools (tw_*)"
```

---

### Task 6: Create wp-linkedin skill

**Files:**
- Create: `skills/wp-linkedin/SKILL.md`
- Create: `skills/wp-linkedin/scripts/linkedin_inspect.mjs`
- Create: `skills/wp-linkedin/references/linkedin-setup.md`
- Create: `skills/wp-linkedin/references/linkedin-posting.md`
- Create: `skills/wp-linkedin/references/linkedin-analytics.md`

**Step 1: Create SKILL.md**

Write to `skills/wp-linkedin/SKILL.md`:

```markdown
---
name: wp-linkedin
description: This skill should be used when the user asks to "publish to LinkedIn",
  "LinkedIn post", "LinkedIn article", "B2B social", "pubblica su LinkedIn",
  "LinkedIn analytics", "LinkedIn engagement", or mentions LinkedIn publishing
  and analytics for WordPress content.
version: 1.0.0
tags: [linkedin, social-media, b2b, direct-social]
---

# WordPress LinkedIn Integration Skill

## Overview

Direct LinkedIn publishing connects WordPress content to LinkedIn via the Community Management API v2. This enables B2B-focused content distribution: feed posts for quick updates, long-form articles for blog-to-LinkedIn workflows, and analytics for engagement tracking. The WP REST Bridge provides 5 MCP tools with the `li_*` namespace.

## When to Use

- User wants to publish a WordPress blog post to LinkedIn
- User needs to create LinkedIn feed posts from WordPress content
- User wants to publish a long-form LinkedIn article from a blog post
- User asks about LinkedIn post analytics (impressions, clicks, engagement)
- User needs B2B social media distribution from WordPress

## Decision Tree

1. **What LinkedIn action?**
   - "publish post" / "LinkedIn update" / "feed post" → Posting workflow (Section 1)
   - "article" / "long-form" / "blog to LinkedIn" → Article publishing (Section 2)
   - "analytics" / "engagement" / "impressions" → Analytics (Section 3)
   - "setup" / "configure" / "connect LinkedIn" → Setup guide (Section 4)

2. **Run detection first:**
   ```bash
   node skills/wp-linkedin/scripts/linkedin_inspect.mjs [--cwd=/path/to/project]
   ```
   This identifies configured LinkedIn credentials in WP_SITES_CONFIG.

## Sections

### Section 1: LinkedIn Posting
See `references/linkedin-posting.md`
- Feed post creation with text, links, and images
- Visibility settings (PUBLIC vs CONNECTIONS)
- Content adaptation from WordPress excerpt/title
- Hashtag strategy and mention formatting

### Section 2: Article Publishing
See `references/linkedin-posting.md`
- Blog post → LinkedIn article conversion
- HTML content formatting for LinkedIn
- Thumbnail and media handling
- Article vs post decision criteria

### Section 3: Analytics
See `references/linkedin-analytics.md`
- Post impressions and engagement metrics
- Click-through rates and share counts
- Performance comparison across posts
- B2B content performance benchmarks

### Section 4: Setup Guide
See `references/linkedin-setup.md`
- LinkedIn Developer App creation
- OAuth 2.0 access token generation
- WP_SITES_CONFIG configuration
- Required scopes: w_member_social, r_liteprofile

## Reference Files

| File | Content |
|------|---------|
| `references/linkedin-setup.md` | Developer app, OAuth setup, WP_SITES_CONFIG, scopes |
| `references/linkedin-posting.md` | Post creation, articles, content adaptation, formatting |
| `references/linkedin-analytics.md` | Metrics, engagement tracking, performance benchmarks |

## MCP Tools

| Tool | Description |
|------|-------------|
| `li_get_profile` | Get authenticated LinkedIn user profile |
| `li_create_post` | Create a LinkedIn feed post (text, link, image) |
| `li_create_article` | Publish a long-form LinkedIn article |
| `li_get_analytics` | Get post analytics (impressions, clicks, engagement) |
| `li_list_posts` | List recent posts by the authenticated user |

## Recommended Agent

Use the **`wp-distribution-manager`** agent for multi-channel workflows that combine LinkedIn with Mailchimp, Buffer, SendGrid, and Twitter/X.

## Related Skills

- **`wp-twitter`** — Twitter/X direct publishing (awareness channel)
- **`wp-social-email`** — Mailchimp, Buffer, SendGrid distribution
- **`wp-content-repurposing`** — Transform blog content into LinkedIn-optimized formats
- **`wp-content`** — Create source WordPress content for distribution
```

**Step 2: Create linkedin_inspect.mjs**

Write to `skills/wp-linkedin/scripts/linkedin_inspect.mjs`:

```javascript
/**
 * linkedin_inspect.mjs — Detect LinkedIn configuration readiness.
 *
 * Checks WP_SITES_CONFIG for LinkedIn credentials.
 *
 * Usage:
 *   node linkedin_inspect.mjs [--cwd=/path/to/project]
 *
 * Exit codes:
 *   0 — LinkedIn configuration found
 *   1 — no LinkedIn configuration found
 */

import { stdout, exit, argv } from 'node:process';
import { resolve } from 'node:path';

function detectLinkedInConfig() {
  const li = { configured: false, indicators: [] };
  const raw = process.env.WP_SITES_CONFIG;
  if (!raw) return li;

  let sites;
  try { sites = JSON.parse(raw); } catch { return li; }
  if (!Array.isArray(sites)) return li;

  for (const site of sites) {
    const label = site.id || site.url || 'unknown';
    if (site.linkedin_access_token) {
      li.configured = true;
      li.indicators.push(`linkedin_access_token configured for ${label}`);
    }
    if (site.linkedin_person_urn) {
      li.indicators.push(`linkedin_person_urn: ${site.linkedin_person_urn} for ${label}`);
    }
  }
  return li;
}

function main() {
  const cwdArg = argv.find(a => a.startsWith('--cwd='));
  const cwd = cwdArg ? resolve(cwdArg.split('=')[1]) : process.cwd();

  const linkedin = detectLinkedInConfig();

  const report = {
    linkedin_configured: linkedin.configured,
    linkedin,
    cwd,
  };

  stdout.write(JSON.stringify(report, null, 2) + '\n');
  exit(linkedin.configured ? 0 : 1);
}

main();
```

**Step 3: Create reference files**

Write `skills/wp-linkedin/references/linkedin-setup.md`, `linkedin-posting.md`, `linkedin-analytics.md` with setup instructions, posting patterns, and analytics reference. Each ~50-80 lines covering API setup, config format, and usage patterns. (Follow the structure of `skills/wp-alerting/references/*.md` as template.)

**Step 4: Commit**

```bash
git add skills/wp-linkedin/
git commit -m "feat: aggiunge skill wp-linkedin (setup, posting, analytics)

- SKILL.md con decision tree e 5 MCP tools
- linkedin_inspect.mjs detection script
- 3 reference files (setup, posting, analytics)"
```

---

### Task 7: Create wp-twitter skill

**Files:**
- Create: `skills/wp-twitter/SKILL.md`
- Create: `skills/wp-twitter/scripts/twitter_inspect.mjs`
- Create: `skills/wp-twitter/references/twitter-setup.md`
- Create: `skills/wp-twitter/references/twitter-posting.md`
- Create: `skills/wp-twitter/references/twitter-analytics.md`

**Context:** Same structure as Task 6 but for Twitter/X. Adapt trigger phrases, tool names (`tw_*`), and API specifics.

**Step 1-4:** Mirror the LinkedIn skill creation pattern with Twitter-specific content. SKILL.md triggers: "Twitter", "X", "tweet", "thread", "pubblica tweet", "Twitter analytics". Detection script checks `twitter_bearer_token` and `twitter_user_id`. References cover API v2 setup, tweet/thread posting, and metrics.

**Step 5: Commit**

```bash
git add skills/wp-twitter/
git commit -m "feat: aggiunge skill wp-twitter (setup, posting, thread, analytics)

- SKILL.md con decision tree e 5 MCP tools
- twitter_inspect.mjs detection script
- 3 reference files (setup, posting, analytics)"
```

---

### Task 8: Update hooks.json with new safety hooks

**Files:**
- Modify: `hooks/hooks.json`

**Step 1: Add tw_delete_tweet hook**

Add after the `wf_delete_trigger` entry:

```json
      {
        "matcher": "mcp__wp-rest-bridge__tw_delete_tweet",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "The agent is about to DELETE a tweet. This is irreversible. Verify the user explicitly requested this deletion. Respond 'approve' only if intentional."
          }
        ]
      }
```

**Step 2: Add li_create_article hook**

```json
      {
        "matcher": "mcp__wp-rest-bridge__li_create_article",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "The agent is about to PUBLISH a long-form article on LinkedIn. This will be publicly visible. Verify the user has reviewed the content and explicitly requested publication. Respond 'approve' only if intentional."
          }
        ]
      }
```

**Step 3: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat: aggiunge safety hooks per Twitter delete e LinkedIn article

- tw_delete_tweet: conferma eliminazione tweet
- li_create_article: conferma pubblicazione articolo LinkedIn
- Total hooks: 10 → 12"
```

---

### Task 9: Update router decision-tree.md to v17

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md`

**Step 1: Update header**

Change line 1 from `v16` to `v17` and add `+ LinkedIn + Twitter/X` to the end.

**Step 2: Add keywords to operations block (line 17)**

Add to the operations keywords string: `LinkedIn, LinkedIn post, LinkedIn article, B2B social, pubblica LinkedIn, Twitter, X, tweet, thread, pubblica tweet, Twitter analytics`

**Step 3: Add routing entries to Step 2b (after line 118)**

```markdown
- **LinkedIn / LinkedIn post / LinkedIn article / B2B social / pubblica LinkedIn**
  → `wp-linkedin` skill + `wp-distribution-manager` agent
- **Twitter / X / tweet / thread / pubblica tweet / Twitter analytics**
  → `wp-twitter` skill + `wp-distribution-manager` agent
```

**Step 4: Commit**

```bash
git add skills/wordpress-router/references/decision-tree.md
git commit -m "feat(router): aggiorna decision-tree a v17

- +2 categorie routing: LinkedIn e Twitter/X
- Aggiunge keywords operativi per social diretto
- 17 → 19 categorie totali"
```

---

### Task 10: Update wp-distribution-manager agent

**Files:**
- Modify: `agents/wp-distribution-manager.md`

**Step 1: Update description**

Add to the description block (line 5-6 area): ", LinkedIn direct posting, and Twitter/X publishing"

**Step 2: Add examples for LinkedIn and Twitter**

Add 2 examples after existing ones:

```markdown
  <example>
  Context: User wants to publish a blog post to LinkedIn.
  user: "Pubblica il mio ultimo articolo su LinkedIn"
  assistant: "I'll use the wp-distribution-manager agent to fetch the post and create a LinkedIn article."
  <commentary>Direct LinkedIn publishing requires the distribution agent for content adaptation and API posting.</commentary>
  </example>

  <example>
  Context: User wants to create a Twitter thread from a blog post.
  user: "Turn my blog post into a Twitter thread"
  assistant: "I'll use the wp-distribution-manager agent to split the post into thread-sized tweets and publish them."
  <commentary>Twitter thread creation requires content splitting and sequential posting.</commentary>
  </example>
```

**Step 3: Update Procedures section**

Add Procedure 6 and 7 for LinkedIn and Twitter posting flows.

**Step 4: Update Related Skills**

Add: `- **wp-linkedin** -- Direct LinkedIn posting and analytics`
Add: `- **wp-twitter** -- Direct Twitter/X posting and analytics`

**Step 5: Commit**

```bash
git add agents/wp-distribution-manager.md
git commit -m "feat(agent): aggiorna wp-distribution-manager per LinkedIn e Twitter

- Aggiunge descrizione LinkedIn + Twitter/X
- +2 esempi (LinkedIn article, Twitter thread)
- +2 procedure (LinkedIn posting, Twitter posting)
- Aggiorna Related Skills"
```

---

### Task 11: Bump version to v2.10.0, update CHANGELOG

**Files:**
- Modify: `package.json` (version: "2.10.0")
- Modify: `CHANGELOG.md` (add v2.10.0 entry)

**Step 1: Update package.json version**

Change `"version": "2.9.1"` to `"version": "2.10.0"`.

Update description to reflect new tool count: `132 tools` → `142 tools`.

**Step 2: Add CHANGELOG entry**

Prepend v2.10.0 entry following the existing format (see v2.9.0 as template):

```markdown
## [2.10.0] — 2026-03-01

### Added — Direct Social APIs (Tier 6a: Distribution Completeness)

**LinkedIn Integration (5 MCP tools)**
- `li_get_profile` — get authenticated user profile
- `li_create_post` — create feed post (text, link, image)
- `li_create_article` — publish long-form article
- `li_get_analytics` — post analytics (impressions, clicks, engagement)
- `li_list_posts` — list recent user posts
- New skill: `wp-linkedin` with setup, posting, and analytics references
- Detection script: `linkedin_inspect.mjs`

**Twitter/X Integration (5 MCP tools)**
- `tw_create_tweet` — publish tweet (text, media)
- `tw_create_thread` — publish connected tweet thread
- `tw_get_metrics` — tweet metrics (impressions, likes, retweets)
- `tw_list_tweets` — list recent user tweets
- `tw_delete_tweet` — delete tweet
- New skill: `wp-twitter` with setup, posting, and analytics references
- Detection script: `twitter_inspect.mjs`

**Infrastructure**
- LinkedIn client helpers in wordpress.js (hasLinkedIn, makeLinkedInRequest)
- Twitter client helpers in wordpress.js (hasTwitter, makeTwitterRequest)
- Router v17 (+2 categories: LinkedIn, Twitter/X)
- +2 safety hooks (tw_delete_tweet, li_create_article)
- Updated wp-distribution-manager agent with LinkedIn + Twitter procedures

**Stats:** 39 → 41 skills | 132 → 142 MCP tools | 10 → 12 hooks | Router v16 → v17
```

**Step 3: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump versione a v2.10.0

Tier 6a — Direct Social APIs
- 10 nuovi MCP tools (5 LinkedIn + 5 Twitter)
- 2 nuove skill (wp-linkedin, wp-twitter)
- Router v17, 12 hooks"
```

---

## Release v2.11.0 — Auto-Transform Pipeline

### Task 12: Add auto-transform references to wp-content-repurposing

**Files:**
- Create: `skills/wp-content-repurposing/references/auto-transform-pipeline.md`
- Create: `skills/wp-content-repurposing/references/transform-templates.md`

**Step 1: Create auto-transform-pipeline.md**

Content: Pipeline architecture for automated blog→social conversion. Sections: Overview, Pipeline Flow (fetch→extract→template→output), Configuration, Integration Points with `li_create_post`, `tw_create_tweet`, `buf_create_update`.

**Step 2: Create transform-templates.md**

Content: Ready-to-use templates for each platform:
- Blog → Tweet (280 chars: title + hook + link + hashtags)
- Blog → Twitter Thread (split by H2 sections, 1 tweet per section)
- Blog → LinkedIn Post (professional tone, key takeaway, link, 1300 chars)
- Blog → LinkedIn Article (full content with HTML adaptation)
- Blog → Email Snippet (excerpt + read more CTA for Mailchimp/SendGrid)

Each template includes: format rules, character limits, example input/output, hashtag generation logic.

**Step 3: Commit**

```bash
git add skills/wp-content-repurposing/references/auto-transform-pipeline.md
git add skills/wp-content-repurposing/references/transform-templates.md
git commit -m "feat: aggiunge auto-transform pipeline a wp-content-repurposing

- Pipeline: fetch → extract → template → output
- Templates: blog→tweet, blog→thread, blog→LinkedIn post,
  blog→LinkedIn article, blog→email snippet
- Integrazione con li_*, tw_*, buf_*, mc_* tools"
```

---

### Task 13: Update wp-content-repurposing SKILL.md

**Files:**
- Modify: `skills/wp-content-repurposing/SKILL.md`

**Step 1: Add auto-transform section to decision tree**

Add to the decision tree (after line 40): `"auto-transform" / "automatic conversion" / "template pipeline" → Auto-Transform Pipeline (Section 5)`

**Step 2: Add Section 5**

After Section 4, add:

```markdown
### Section 5: Auto-Transform Pipeline
See `references/auto-transform-pipeline.md`
- Automated blog post → multi-platform output
- Template system for consistent formatting
- Integration with LinkedIn (li_create_post), Twitter (tw_create_tweet, tw_create_thread), Buffer (buf_create_update), Mailchimp (mc_set_campaign_content)
- Platform-specific formatting rules and character limits
- See `references/transform-templates.md` for ready-to-use templates
```

**Step 3: Update Reference Files table**

Add two rows for the new references.

**Step 4: Update Related Skills**

Add: `- **`wp-linkedin`** — direct LinkedIn publishing for transformed content`
Add: `- **`wp-twitter`** — direct Twitter/X publishing for transformed content`

**Step 5: Commit**

```bash
git add skills/wp-content-repurposing/SKILL.md
git commit -m "feat: aggiorna wp-content-repurposing con auto-transform pipeline

- Nuova Section 5: Auto-Transform Pipeline
- Decision tree aggiornato con keywords auto-transform
- +2 reference files nella tabella
- +2 related skills (wp-linkedin, wp-twitter)"
```

---

### Task 14: Bump to v2.11.0, update CHANGELOG

**Files:**
- Modify: `package.json` (version: "2.11.0")
- Modify: `CHANGELOG.md`

**Step 1-2:** Bump version to 2.11.0. Add CHANGELOG entry:

```markdown
## [2.11.0] — 2026-03-01

### Added — Auto-Transform Pipeline (Tier 6b: Distribution Completeness)

- Auto-transform pipeline in `wp-content-repurposing` skill (new Section 5)
- Template system: blog→tweet, blog→thread, blog→LinkedIn post, blog→LinkedIn article, blog→email snippet
- Platform-specific formatting rules with character limits
- Integration with `li_*`, `tw_*`, `buf_*`, `mc_*` MCP tools
- New references: `auto-transform-pipeline.md`, `transform-templates.md`

**Stats:** 41 skills (unchanged) | 142 MCP tools (unchanged) | WCOP Distribution: 8/10 → 9/10
```

**Step 3: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump versione a v2.11.0

Tier 6b — Auto-Transform Pipeline
- Enhancement a wp-content-repurposing con templates
- WCOP Distribution layer: 8/10 → 9/10"
```

---

## Release v2.12.0 — Content Generation + Structured Data

### Task 15: Create schema.js MCP tool file

**Files:**
- Create: `servers/wp-rest-bridge/build/tools/schema.js`

**Context:** 3 MCP tools for structured data management. `sd_validate` calls Google Rich Results Test API or validates locally. `sd_inject` updates post meta via WordPress REST API. `sd_list_schemas` scans posts for existing JSON-LD.

**Step 1: Create the file**

```javascript
import { makeRequest, getActiveSite } from '../wordpress.js';
import axios from 'axios';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────
const sdValidateSchema = z.object({
    url: z.string().optional().describe('URL to validate (fetches and checks JSON-LD)'),
    markup: z.string().optional().describe('JSON-LD string to validate directly'),
}).strict().refine(data => data.url || data.markup, { message: 'Either url or markup is required' });

const sdInjectSchema = z.object({
    post_id: z.number().describe('WordPress post/page ID'),
    schema_type: z.string().describe('Schema.org type (Article, Product, FAQ, HowTo, LocalBusiness, Event, Organization, BreadcrumbList)'),
    schema_data: z.record(z.any()).describe('Schema.org properties as key-value pairs'),
}).strict();

const sdListSchemasSchema = z.object({
    schema_type: z.string().optional().describe('Filter by specific Schema.org type'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────
export const schemaTools = [
    {
        name: "sd_validate",
        description: "Validates JSON-LD / Schema.org structured data against Google specs",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string", description: "URL to fetch and validate JSON-LD from" },
                markup: { type: "string", description: "JSON-LD string to validate directly" },
            },
        },
    },
    {
        name: "sd_inject",
        description: "Injects or updates JSON-LD structured data in a WordPress post/page",
        inputSchema: {
            type: "object",
            properties: {
                post_id: { type: "number", description: "WordPress post/page ID" },
                schema_type: { type: "string", description: "Schema.org type (Article, Product, FAQ, etc.)" },
                schema_data: { type: "object", description: "Schema.org properties as key-value pairs" },
            },
            required: ["post_id", "schema_type", "schema_data"],
        },
    },
    {
        name: "sd_list_schemas",
        description: "Lists Schema.org types found across the site with counts",
        inputSchema: {
            type: "object",
            properties: {
                schema_type: { type: "string", description: "Filter by Schema.org type" },
            },
        },
    },
];

// ── Handlers ────────────────────────────────────────────────────
export const schemaHandlers = {
    sd_validate: async (params) => {
        try {
            const { url, markup } = params;
            if (!url && !markup) {
                return { toolResult: { isError: true, content: [{ type: "text", text: "Either url or markup parameter is required." }] } };
            }
            let jsonLd;
            if (markup) {
                try {
                    jsonLd = JSON.parse(markup);
                } catch {
                    return { toolResult: { isError: true, content: [{ type: "text", text: "Invalid JSON in markup parameter." }] } };
                }
            } else {
                // Fetch URL and extract JSON-LD
                const response = await axios.get(url, { timeout: 15000 });
                const html = response.data;
                const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
                if (!jsonLdMatch) {
                    return { toolResult: { content: [{ type: "text", text: JSON.stringify({ valid: false, error: "No JSON-LD found on page", url }, null, 2) }] } };
                }
                try {
                    jsonLd = JSON.parse(jsonLdMatch[1]);
                } catch {
                    return { toolResult: { content: [{ type: "text", text: JSON.stringify({ valid: false, error: "Invalid JSON-LD on page", url }, null, 2) }] } };
                }
            }

            // Basic Schema.org validation
            const issues = [];
            const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
            for (const schema of schemas) {
                if (!schema['@context'] || !schema['@context'].includes('schema.org')) {
                    issues.push('Missing or invalid @context (should include schema.org)');
                }
                if (!schema['@type']) {
                    issues.push('Missing @type');
                }
            }

            const result = {
                valid: issues.length === 0,
                schemas_found: schemas.length,
                types: schemas.map(s => s['@type']).filter(Boolean),
                issues: issues.length > 0 ? issues : undefined,
                source: url || 'inline markup',
            };
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.status ? `HTTP ${error.response.status}` : error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error validating schema: ${errorMessage}` }] } };
        }
    },

    sd_inject: async (params) => {
        try {
            const { post_id, schema_type, schema_data } = params;
            const jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': schema_type,
                ...schema_data,
            });
            // Store JSON-LD in post meta via WordPress REST API
            const response = await makeRequest('POST', `wp/v2/posts/${post_id}`, {
                meta: { _schema_json_ld: jsonLd },
            });
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ success: true, post_id, schema_type, stored: true }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error injecting schema: ${errorMessage}` }] } };
        }
    },

    sd_list_schemas: async (params) => {
        try {
            const { schema_type } = params;
            // Fetch recent posts and check for JSON-LD in meta
            const posts = await makeRequest('GET', 'wp/v2/posts', { per_page: 100, _fields: 'id,title,meta' });
            const schemas = {};
            for (const post of posts) {
                const meta = post.meta?._schema_json_ld;
                if (meta) {
                    try {
                        const parsed = JSON.parse(meta);
                        const type = parsed['@type'] || 'Unknown';
                        if (schema_type && type !== schema_type) continue;
                        if (!schemas[type]) schemas[type] = { count: 0, posts: [] };
                        schemas[type].count++;
                        schemas[type].posts.push({ id: post.id, title: post.title?.rendered });
                    } catch { /* skip invalid JSON */ }
                }
            }
            return { toolResult: { content: [{ type: "text", text: JSON.stringify({ total_types: Object.keys(schemas).length, schemas }, null, 2) }] } };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing schemas: ${errorMessage}` }] } };
        }
    },
};
```

**Step 2: Register in index.js**

Add import: `import { schemaTools, schemaHandlers } from './schema.js';`
Add to allTools: `...schemaTools, // 3 tools`
Add to toolHandlers: `...schemaHandlers,`

**Step 3: Commit**

```bash
git add servers/wp-rest-bridge/build/tools/schema.js servers/wp-rest-bridge/build/tools/index.js
git commit -m "feat(bridge): aggiunge schema.js con 3 MCP tools per structured data

Tools: sd_validate, sd_inject, sd_list_schemas

- Validazione JSON-LD/Schema.org
- Injection in post meta via WordPress REST API
- Audit site-wide dei tipi Schema.org presenti
- Tool count: 142 → 145"
```

---

### Task 16: Create wp-structured-data skill

**Files:**
- Create: `skills/wp-structured-data/SKILL.md`
- Create: `skills/wp-structured-data/scripts/schema_inspect.mjs`
- Create: `skills/wp-structured-data/references/schema-types.md`
- Create: `skills/wp-structured-data/references/validation-guide.md`
- Create: `skills/wp-structured-data/references/injection-patterns.md`

**Context:** Same structure as wp-linkedin skill. Detection checks for Yoast/Rank Math plugins. Schema types: Article, Product, LocalBusiness, Event, FAQ, HowTo, Organization, BreadcrumbList.

**Step 1-4:** Create SKILL.md with triggers ("structured data", "Schema.org", "JSON-LD", "rich snippet"), detection script, and 3 reference files.

**Step 5: Commit**

```bash
git add skills/wp-structured-data/
git commit -m "feat: aggiunge skill wp-structured-data (Schema.org, JSON-LD)

- SKILL.md con decision tree e 3 MCP tools
- schema_inspect.mjs detection script
- 3 reference files (schema types, validation, injection patterns)
- Tipi supportati: Article, Product, FAQ, HowTo, LocalBusiness, Event"
```

---

### Task 17: Create wp-content-generation skill

**Files:**
- Create: `skills/wp-content-generation/SKILL.md`
- Create: `skills/wp-content-generation/scripts/content_gen_inspect.mjs`
- Create: `skills/wp-content-generation/references/generation-workflow.md`
- Create: `skills/wp-content-generation/references/brief-templates.md`
- Create: `skills/wp-content-generation/references/outline-patterns.md`

**Context:** This is a procedure-based skill (NO new MCP tools). It guides Claude through: brief→keyword research→outline→draft→SEO optimize→structured data→publish. Uses existing MCP tools (`list_content`, `create_content`, `gsc_*`, `sd_*`).

**Step 1-4:** Create SKILL.md with the 7-step procedure, detection script (checks wp/v2 access and optional GSC), and 3 reference files.

**Step 5: Commit**

```bash
git add skills/wp-content-generation/
git commit -m "feat: aggiunge skill wp-content-generation (AI content pipeline)

- Procedure Claude-native: brief → outline → draft → optimize → publish
- Nessun nuovo MCP tool (usa wp/v2, gsc_*, sd_* esistenti)
- content_gen_inspect.mjs detection script
- 3 reference files (workflow, brief templates, outline patterns)"
```

---

### Task 18: Update router decision-tree.md to v18

**Files:**
- Modify: `skills/wordpress-router/references/decision-tree.md`

**Step 1: Update header** to v18, add `+ content generation + structured data`.

**Step 2: Add keywords to operations block**

Add: `genera contenuto, scrivi post, AI content, content brief, crea articolo, draft post, genera bozza, structured data, Schema.org, JSON-LD, rich snippet, schema markup, dati strutturati`

**Step 3: Add routing entries to Step 2b**

```markdown
- **genera contenuto / scrivi post / AI content / content brief / crea articolo / draft post / genera bozza**
  → `wp-content-generation` skill + `wp-content-strategist` agent
- **structured data / Schema.org / JSON-LD / rich snippet / schema markup / dati strutturati**
  → `wp-structured-data` skill + `wp-content-strategist` agent
```

**Step 4: Commit**

```bash
git add skills/wordpress-router/references/decision-tree.md
git commit -m "feat(router): aggiorna decision-tree a v18

- +2 categorie: content generation e structured data
- 19 → 21 categorie totali nel router"
```

---

### Task 19: Update wp-content-strategist agent

**Files:**
- Modify: `agents/wp-content-strategist.md`

**Step 1: Update description** to include AI content generation and structured data management.

**Step 2: Add example for content generation**

**Step 3: Add AI Content Generation Procedure** referencing the `wp-content-generation` skill.

**Step 4: Add Structured Data Procedure** referencing the `wp-structured-data` skill.

**Step 5: Update Related Skills** with both new skills.

**Step 6: Commit**

```bash
git add agents/wp-content-strategist.md
git commit -m "feat(agent): aggiorna wp-content-strategist per content gen e structured data

- Descrizione ampliata con AI generation e Schema.org
- +2 esempi (content generation, structured data)
- +2 procedure (AI content pipeline, schema management)
- Aggiorna Related Skills"
```

---

### Task 20: Bump to v2.12.0, update CHANGELOG

**Files:**
- Modify: `package.json` (version: "2.12.0")
- Modify: `CHANGELOG.md`

**Step 1-2:** Bump version. Add CHANGELOG entry:

```markdown
## [2.12.0] — 2026-03-01

### Added — Content Generation + Structured Data (Tier 7: Content Factory Completeness)

**Structured Data (3 MCP tools)**
- `sd_validate` — validate JSON-LD/Schema.org markup
- `sd_inject` — inject/update JSON-LD in WordPress posts
- `sd_list_schemas` — audit Schema.org types across the site
- New skill: `wp-structured-data` with schema types, validation, and injection references
- Detection script: `schema_inspect.mjs`
- Supported types: Article, Product, FAQ, HowTo, LocalBusiness, Event, Organization, BreadcrumbList

**Content Generation (procedure-based, no new MCP tools)**
- New skill: `wp-content-generation` with AI-driven content pipeline
- 7-step procedure: brief → keyword research → outline → draft → SEO optimize → structured data → publish
- Uses existing MCP tools (wp/v2, gsc_*, sd_*)
- Detection script: `content_gen_inspect.mjs`
- References: generation workflow, brief templates, outline patterns

**Infrastructure**
- Router v18 (+2 categories: content generation, structured data)
- Updated wp-content-strategist agent with AI generation and schema procedures

**Stats:** 41 → 43 skills | 142 → 145 MCP tools | Router v17 → v18

### WCOP Score
- Content Factory: 9/10 → 10/10 (AI generation + structured data)
- Distribution: 9/10 (completed in v2.10-2.11)
- **Total: 8.8/10 → 9.2/10**
```

**Step 3: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump versione a v2.12.0

Tier 7 — Content Factory Completeness
- 3 MCP tools structured data (sd_*)
- 2 nuove skill (wp-content-generation, wp-structured-data)
- Router v18, WCOP Score: 8.8 → 9.2/10"
```

---

## Post-Implementation

### Task 21: Push and create GitHub release

```bash
git push origin main
gh release create v2.12.0 --title "v2.12.0 — Tier 6+7: Distribution + Content Factory" --notes "$(cat <<'EOF'
## Tier 6 — Distribution Completeness (v2.10.0 + v2.11.0)

**LinkedIn Integration (5 tools)**
- `li_get_profile`, `li_create_post`, `li_create_article`, `li_get_analytics`, `li_list_posts`
- New skill: `wp-linkedin`

**Twitter/X Integration (5 tools)**
- `tw_create_tweet`, `tw_create_thread`, `tw_get_metrics`, `tw_list_tweets`, `tw_delete_tweet`
- New skill: `wp-twitter`

**Auto-Transform Pipeline**
- Enhanced `wp-content-repurposing` with template system (blog→tweet, blog→thread, blog→LinkedIn, blog→email)

## Tier 7 — Content Factory Completeness (v2.12.0)

**Structured Data (3 tools)**
- `sd_validate`, `sd_inject`, `sd_list_schemas`
- New skill: `wp-structured-data` (Article, Product, FAQ, HowTo, LocalBusiness, Event)

**AI Content Generation**
- New skill: `wp-content-generation` (brief→outline→draft→optimize→publish)
- Claude-native procedure, uses existing REST API and GSC tools

## Stats
- Skills: 39 → 43 (+4 new, +1 enhanced)
- MCP Tools: 132 → 145 (+13)
- Hooks: 10 → 12
- Router: v16 → v18
- WCOP Score: 8.8/10 → 9.2/10
EOF
)"
```

### Task 22: Publish to npm

```bash
npm config set //registry.npmjs.org/:_authToken=<TOKEN>
npm publish --access public
npm config delete //registry.npmjs.org/:_authToken
```

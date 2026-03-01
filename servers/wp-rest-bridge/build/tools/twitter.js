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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting tweet: ${errorMessage}` }] } };
        }
    },
};

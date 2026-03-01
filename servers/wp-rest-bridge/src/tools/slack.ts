// src/tools/slack.ts — Slack integration tools (3 tools)
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hasSlackWebhook, getSlackWebhookUrl, hasSlackBot, makeSlackBotRequest } from '../wordpress.js';
import axios from 'axios';
import { z } from 'zod';

// ── Zod Schemas ─────────────────────────────────────────────────

const slackSendAlertSchema = z.object({
  text: z.string().describe('Alert message text (supports Slack markdown)'),
  channel: z.string().optional().describe('Override channel (webhook default if omitted)'),
  username: z.string().optional().default('WP Monitor').describe('Bot display name'),
  icon_emoji: z.string().optional().default(':warning:').describe('Bot icon emoji'),
  blocks: z.array(z.any()).optional().describe('Slack Block Kit blocks (optional, overrides text for rich formatting)'),
}).strict();

const slackSendMessageSchema = z.object({
  channel: z.string().describe('Channel ID or name (e.g., #general or C01234ABC)'),
  text: z.string().describe('Message text (required as fallback even with blocks)'),
  blocks: z.array(z.any()).optional().describe('Slack Block Kit blocks for rich formatting'),
  thread_ts: z.string().optional().describe('Thread timestamp for threaded replies'),
}).strict();

const slackListChannelsSchema = z.object({
  limit: z.number().optional().default(100).describe('Max channels to return (default 100)'),
  types: z.string().optional().default('public_channel').describe('Channel types (default: public_channel)'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const slackTools: Tool[] = [
  {
    name: "slack_send_alert",
    description: "Sends an alert notification to Slack via Incoming Webhook (zero-config, no Bot Token needed)",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Alert message text (Slack markdown)" },
        channel: { type: "string", description: "Override channel (optional)" },
        username: { type: "string", description: "Bot display name (default: WP Monitor)" },
        icon_emoji: { type: "string", description: "Bot icon emoji (default: :warning:)" },
        blocks: { type: "array", items: { type: "object" }, description: "Block Kit blocks (optional)" },
      },
      required: ["text"],
    },
  },
  {
    name: "slack_send_message",
    description: "Sends a message to a Slack channel via Bot Token (supports Block Kit, threads)",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Channel ID or name" },
        text: { type: "string", description: "Message text (fallback for blocks)" },
        blocks: { type: "array", items: { type: "object" }, description: "Block Kit blocks" },
        thread_ts: { type: "string", description: "Thread timestamp for replies" },
      },
      required: ["channel", "text"],
    },
  },
  {
    name: "slack_list_channels",
    description: "Lists Slack workspace channels via Bot Token",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max channels (default 100)" },
        types: { type: "string", description: "Channel types (default: public_channel)" },
      },
    },
  },
];

// ── Handlers ────────────────────────────────────────────────────

export const slackHandlers: Record<string, Function> = {
  slack_send_alert: async (params: z.infer<typeof slackSendAlertSchema>) => {
    if (!hasSlackWebhook()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Slack webhook not configured. Add slack_webhook_url to WP_SITES_CONFIG." }] } };
    }
    try {
      const { text, channel, username, icon_emoji, blocks } = params;
      const webhookUrl = getSlackWebhookUrl();
      const payload: Record<string, any> = { text, username: username || 'WP Monitor', icon_emoji: icon_emoji || ':warning:' };
      if (channel) payload.channel = channel;
      if (blocks) payload.blocks = blocks;
      await axios.post(webhookUrl, payload, { timeout: 10000 });
      return { toolResult: { content: [{ type: "text", text: "Alert sent successfully to Slack." }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error sending Slack alert: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}` }] } };
    }
  },

  slack_send_message: async (params: z.infer<typeof slackSendMessageSchema>) => {
    if (!hasSlackBot()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Slack Bot not configured. Add slack_bot_token to WP_SITES_CONFIG." }] } };
    }
    try {
      const { channel, text, blocks, thread_ts } = params;
      const payload: Record<string, any> = { channel, text };
      if (blocks) payload.blocks = blocks;
      if (thread_ts) payload.thread_ts = thread_ts;
      const response = await makeSlackBotRequest('POST', 'chat.postMessage', payload);
      if (!response.ok) {
        return { toolResult: { isError: true, content: [{ type: "text", text: `Slack API error: ${response.error}` }] } };
      }
      return { toolResult: { content: [{ type: "text", text: JSON.stringify({ ok: true, channel: response.channel, ts: response.ts }, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error sending Slack message: ${errorMessage}` }] } };
    }
  },

  slack_list_channels: async (params: z.infer<typeof slackListChannelsSchema>) => {
    if (!hasSlackBot()) {
      return { toolResult: { isError: true, content: [{ type: "text", text: "Slack Bot not configured. Add slack_bot_token to WP_SITES_CONFIG." }] } };
    }
    try {
      const { limit, types } = params;
      const response = await makeSlackBotRequest('GET', `conversations.list?limit=${limit || 100}&types=${types || 'public_channel'}`);
      if (!response.ok) {
        return { toolResult: { isError: true, content: [{ type: "text", text: `Slack API error: ${response.error}` }] } };
      }
      const channels = (response.channels || []).map((ch: any) => ({
        id: ch.id, name: ch.name, topic: ch.topic?.value, num_members: ch.num_members,
      }));
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(channels, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing Slack channels: ${errorMessage}` }] } };
    }
  },
};

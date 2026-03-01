// src/tools/wc-workflows.ts — Workflow automation trigger tools (4 tools)
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWordPressRequest } from '../wordpress.js';
import { z } from 'zod';

const WF_NAMESPACE = 'wp-manager/v1';

// ── Zod Schemas ─────────────────────────────────────────────────

const actionSchema = z.object({
  channel: z.enum(['slack', 'email', 'webhook']).describe('Notification channel'),
  template: z.string().describe('Message template (supports {{variable}} placeholders)'),
  recipients: z.array(z.string()).describe('Recipients (emails, Slack channels, or webhook URLs)'),
}).strict();

const conditionsSchema = z.record(z.any())
  .describe('Trigger conditions object (structure depends on trigger type)');

const wfListTriggersSchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).optional()
    .describe('Filter by trigger status (default: all)'),
  type: z.enum(['schedule', 'hook', 'content']).optional()
    .describe('Filter by trigger type'),
  limit: z.number().optional().default(50)
    .describe('Max triggers to return (default 50)'),
}).strict();

const wfCreateTriggerSchema = z.object({
  name: z.string().describe('Trigger name (human-readable identifier)'),
  type: z.enum(['schedule', 'hook', 'content'])
    .describe('Trigger type: schedule (cron-based), hook (WP action/filter), content (post lifecycle)'),
  conditions: conditionsSchema,
  actions: z.array(actionSchema).min(1)
    .describe('Actions to execute when trigger fires'),
  status: z.enum(['active', 'inactive']).optional()
    .describe('Initial status (default: active)'),
  description: z.string().optional()
    .describe('Human-readable description of what this trigger does'),
}).strict();

const wfUpdateTriggerSchema = z.object({
  trigger_id: z.number().describe('Trigger ID to update'),
  name: z.string().optional().describe('Updated trigger name'),
  status: z.enum(['active', 'inactive']).optional()
    .describe('Updated trigger status'),
  conditions: conditionsSchema.optional(),
  actions: z.array(actionSchema).optional()
    .describe('Updated actions array'),
  description: z.string().optional()
    .describe('Updated description'),
}).strict();

const wfDeleteTriggerSchema = z.object({
  trigger_id: z.number().describe('Trigger ID to delete'),
}).strict();

// ── Tool Definitions ────────────────────────────────────────────

export const wcWorkflowTools: Tool[] = [
  {
    name: "wf_list_triggers",
    description: "Lists all configured workflow triggers (scheduled events, WP hooks, content lifecycle) with their status, conditions, and actions",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "inactive", "all"],
          description: "Filter by trigger status (default: all)",
        },
        type: {
          type: "string",
          enum: ["schedule", "hook", "content"],
          description: "Filter by trigger type",
        },
        limit: {
          type: "number",
          description: "Max triggers to return (default 50)",
        },
      },
    },
  },
  {
    name: "wf_create_trigger",
    description: "Creates a new workflow trigger that fires Slack alerts, emails, or webhook notifications on scheduled events, WP hooks, or content lifecycle changes",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Trigger name (human-readable identifier)" },
        type: {
          type: "string",
          enum: ["schedule", "hook", "content"],
          description: "Trigger type: schedule (cron), hook (WP action/filter), content (post lifecycle)",
        },
        conditions: {
          type: "object",
          description: "Trigger conditions (structure depends on type)",
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              channel: { type: "string", enum: ["slack", "email", "webhook"], description: "Notification channel" },
              template: { type: "string", description: "Message template (supports {{variable}} placeholders)" },
              recipients: { type: "array", items: { type: "string" }, description: "Recipients list" },
            },
            required: ["channel", "template", "recipients"],
          },
          description: "Actions to execute when trigger fires",
        },
        status: {
          type: "string",
          enum: ["active", "inactive"],
          description: "Initial status (default: active)",
        },
        description: { type: "string", description: "What this trigger does" },
      },
      required: ["name", "type", "conditions", "actions"],
    },
  },
  {
    name: "wf_update_trigger",
    description: "Updates an existing workflow trigger (name, status, conditions, actions, or description)",
    inputSchema: {
      type: "object",
      properties: {
        trigger_id: { type: "number", description: "Trigger ID to update" },
        name: { type: "string", description: "Updated trigger name" },
        status: {
          type: "string",
          enum: ["active", "inactive"],
          description: "Updated trigger status",
        },
        conditions: {
          type: "object",
          description: "Updated trigger conditions",
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              channel: { type: "string", enum: ["slack", "email", "webhook"], description: "Notification channel" },
              template: { type: "string", description: "Message template" },
              recipients: { type: "array", items: { type: "string" }, description: "Recipients list" },
            },
            required: ["channel", "template", "recipients"],
          },
          description: "Updated actions array",
        },
        description: { type: "string", description: "Updated description" },
      },
      required: ["trigger_id"],
    },
  },
  {
    name: "wf_delete_trigger",
    description: "Deletes a workflow trigger (stops all associated automation and notifications)",
    inputSchema: {
      type: "object",
      properties: {
        trigger_id: { type: "number", description: "Trigger ID to delete" },
      },
      required: ["trigger_id"],
    },
  },
];

// ── Handlers ────────────────────────────────────────────────────

export const wcWorkflowHandlers: Record<string, Function> = {
  wf_list_triggers: async (params: z.infer<typeof wfListTriggersSchema>) => {
    try {
      const queryParts: string[] = [];
      if (params.status && params.status !== 'all') queryParts.push(`status=${params.status}`);
      if (params.type) queryParts.push(`type=${params.type}`);
      if (params.limit) queryParts.push(`per_page=${params.limit}`);
      const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await makeWordPressRequest('GET', `workflows${query}`, undefined, {
        namespace: WF_NAMESPACE,
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing workflow triggers: ${errorMessage}` }] } };
    }
  },

  wf_create_trigger: async (params: z.infer<typeof wfCreateTriggerSchema>) => {
    try {
      const { name, type, conditions, actions, status, description } = params;
      const body: Record<string, any> = { name, type, conditions, actions };
      if (status) body.status = status;
      if (description) body.description = description;
      const response = await makeWordPressRequest('POST', 'workflows', body, {
        namespace: WF_NAMESPACE,
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error creating workflow trigger: ${errorMessage}` }] } };
    }
  },

  wf_update_trigger: async (params: z.infer<typeof wfUpdateTriggerSchema>) => {
    try {
      const { trigger_id, ...updates } = params;
      const response = await makeWordPressRequest('PUT', `workflows/${trigger_id}`, updates, {
        namespace: WF_NAMESPACE,
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error updating workflow trigger: ${errorMessage}` }] } };
    }
  },

  wf_delete_trigger: async (params: z.infer<typeof wfDeleteTriggerSchema>) => {
    try {
      const response = await makeWordPressRequest('DELETE', `workflows/${params.trigger_id}?force=true`, undefined, {
        namespace: WF_NAMESPACE,
      });
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return { toolResult: { isError: true, content: [{ type: "text", text: `Error deleting workflow trigger: ${errorMessage}` }] } };
    }
  },
};

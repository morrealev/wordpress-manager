#!/usr/bin/env node
// src/server.ts - WP REST Bridge MCP Server (multi-site)
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { allTools, toolHandlers } from './tools/index.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'wp-rest-bridge',
  version: '1.1.0',
});

// Register multi-site management tools
server.tool(
  'switch_site',
  { site_id: z.string().describe('Site ID to switch to (e.g., "opencactus", "bioinagro")') },
  async (args) => {
    const { switchSite } = await import('./wordpress.js');
    try {
      const newSite = switchSite(args.site_id);
      return { content: [{ type: 'text', text: `Switched to site: ${newSite}` }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'list_sites',
  {},
  async () => {
    const { listSites, getActiveSite } = await import('./wordpress.js');
    const sites = listSites();
    const active = getActiveSite();
    const result = sites.map(s => `${s === active ? '● ' : '  '}${s}`).join('\n');
    return { content: [{ type: 'text', text: `Configured sites:\n${result}` }] };
  }
);

server.tool(
  'get_active_site',
  {},
  async () => {
    const { getActiveSite } = await import('./wordpress.js');
    return { content: [{ type: 'text', text: getActiveSite() }] };
  }
);

// Convert a JSON Schema property to a Zod type, or return as-is if already Zod
function toZodType(prop: any, isRequired: boolean): z.ZodTypeAny {
  if (prop instanceof z.ZodType) return prop;
  let zodType: z.ZodTypeAny;
  switch (prop.type) {
    case 'string': zodType = z.string(); break;
    case 'number': case 'integer': zodType = z.number(); break;
    case 'boolean': zodType = z.boolean(); break;
    case 'array': zodType = z.array(z.any()); break;
    case 'object': zodType = z.record(z.any()); break;
    default: zodType = z.any();
  }
  if (prop.description) zodType = zodType.describe(prop.description);
  if (!isRequired) zodType = zodType.optional();
  return zodType;
}

// Register all WordPress content tools from the ported modules
for (const tool of allTools) {
  const handler = toolHandlers[tool.name as keyof typeof toolHandlers];
  if (!handler) continue;

  const wrappedHandler = async (args: any) => {
    const result = await handler(args);
    return {
      content: result.toolResult.content.map((item: { type: string; text: string }) => ({
        ...item,
        type: 'text' as const,
      })),
      isError: result.toolResult.isError,
    };
  };

  const props = tool.inputSchema.properties || {};
  const required: string[] = (tool.inputSchema as any).required || [];
  const zodShape: Record<string, z.ZodTypeAny> = {};
  for (const [key, prop] of Object.entries(props)) {
    zodShape[key] = toZodType(prop, required.includes(key));
  }
  server.tool(tool.name, zodShape, wrappedHandler);
}

async function main() {
  const { logToStderr, initWordPress } = await import('./wordpress.js');
  logToStderr('Starting WP REST Bridge MCP server...');

  try {
    await initWordPress();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToStderr('WP REST Bridge MCP server running on stdio');
  } catch (error) {
    logToStderr(`Failed to initialize: ${error}`);
    process.exit(1);
  }
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught exception: ${error}\n`);
  process.exit(1);
});

main().catch((error) => {
  process.stderr.write(`Startup error: ${error}\n`);
  process.exit(1);
});

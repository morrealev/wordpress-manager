// src/tools/search.ts - Global WordPress search across all content types
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWordPressRequest } from '../wordpress.js';
import { z } from 'zod';

const wpSearchSchema = z.object({
  search: z.string().describe("Search term to find across all content types"),
  page: z.number().optional().describe("Page number (default 1)"),
  per_page: z.number().min(1).max(100).optional().describe("Items per page (default 10, max 100)"),
  type: z.string().optional().describe("Limit to a specific content type (post, page, etc.)"),
  subtype: z.string().optional().describe("Limit to a specific subtype"),
  _embed: z.boolean().optional().describe("Inline related resources"),
  _fields: z.string().optional().describe("Comma-separated list of fields to return"),
  include_pagination: z.boolean().optional().describe("Include pagination metadata in response")
});

type WpSearchParams = z.infer<typeof wpSearchSchema>;

export const searchTools: Tool[] = [
  {
    name: "wp_search",
    description: "Searches across all WordPress content types (posts, pages, custom types) using the native /search endpoint",
    inputSchema: { type: "object", properties: wpSearchSchema.shape }
  }
];

export const searchHandlers = {
  wp_search: async (params: WpSearchParams) => {
    try {
      const { include_pagination, ...queryParams } = params;
      const response = await makeWordPressRequest('GET', 'search', queryParams, {
        includePagination: include_pagination,
      });

      return {
        toolResult: {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
          isError: false
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: 'text', text: `Error searching WordPress: ${errorMessage}` }],
        },
      };
    }
  }
};

// src/tools/media.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWordPressRequest } from '../wordpress.js';
import { z } from 'zod';

// MIME type to file extension map
const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
};

function getExtFromMime(contentType?: string): string | undefined {
  if (!contentType) return undefined;
  // Strip charset and params: "image/jpeg; charset=utf-8" → "image/jpeg"
  const mime = contentType.split(';')[0].trim().toLowerCase();
  return MIME_EXT_MAP[mime];
}

function getExtFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(\w{2,5})$/);
    return match ? match[1].toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

// Schema for listing media items
const listMediaSchema = z.object({
  page: z.number().optional().describe("Page number"),
  per_page: z.number().min(1).max(100).optional().describe("Items per page"),
  search: z.string().optional().describe("Search term for media"),
  _embed: z.boolean().optional().describe("Inline related resources"),
  _fields: z.string().optional().describe("Comma-separated list of fields to return"),
  include_pagination: z.boolean().optional().describe("Include pagination metadata in response")
}).strict();

// Schema for getting a single media item
const getMediaSchema = z.object({
  id: z.number().describe("Media ID"),
  _embed: z.boolean().optional().describe("Inline related resources"),
  _fields: z.string().optional().describe("Comma-separated list of fields to return")
}).strict();

// Schema for creating a new media item
const createMediaSchema = z.object({
  title: z.string().describe("Media title"),
  alt_text: z.string().optional().describe("Alternate text for the media"),
  caption: z.string().optional().describe("Caption of the media"),
  description: z.string().optional().describe("Description of the media"),
  source_url: z.string().describe("Source URL of the media file")
}).strict();

// Schema for editing an existing media item
const editMediaSchema = z.object({
  id: z.number().describe("Media ID to edit"),
  title: z.string().optional().describe("Media title"),
  alt_text: z.string().optional().describe("Alternate text for the media"),
  caption: z.string().optional().describe("Caption of the media"),
  description: z.string().optional().describe("Description of the media")
}).strict();

// Schema for deleting a media item
const deleteMediaSchema = z.object({
  id: z.number().describe("Media ID to delete"),
  force: z.boolean().optional().describe("Force deletion bypassing trash")
}).strict();

// Define the tool set for media operations
export const mediaTools: Tool[] = [
  {
    name: "list_media",
    description: "Lists media items with filtering and pagination options",
    inputSchema: { type: "object", properties: listMediaSchema.shape }
  },
  {
    name: "get_media",
    description: "Gets a single media item by ID",
    inputSchema: { type: "object", properties: getMediaSchema.shape }
  },
  {
    name: "create_media",
    description: "Creates a new media item",
    inputSchema: { type: "object", properties: createMediaSchema.shape }
  },
  {
    name: "edit_media",
    description: "Updates an existing media item",
    inputSchema: { type: "object", properties: editMediaSchema.shape }
  },
  {
    name: "delete_media",
    description: "Deletes a media item",
    inputSchema: { type: "object", properties: deleteMediaSchema.shape }
  }
];

// Define handlers for each media operation
export const mediaHandlers = {
  list_media: async (params: z.infer<typeof listMediaSchema>) => {
    try {
      const { include_pagination, ...queryParams } = params;
      const response = await makeWordPressRequest("GET", "media", queryParams, {
        includePagination: include_pagination,
      });
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error listing media: ${errorMessage}` }]
        }
      };
    }
  },
  get_media: async (params: z.infer<typeof getMediaSchema>) => {
    try {
      const queryParams: any = {};
      if (params._embed) queryParams._embed = true;
      if (params._fields) queryParams._fields = params._fields;
      const response = await makeWordPressRequest("GET", `media/${params.id}`, queryParams);
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error getting media: ${errorMessage}` }]
        }
      };
    }
  },
  create_media: async (params: z.infer<typeof createMediaSchema>) => {
    try {
      if (params.source_url && params.source_url.startsWith('http')) {
        // Download the media file from the URL and upload as multipart form-data
        const axios = (await import('axios')).default;
        const FormData = (await import('form-data')).default;
        const fileRes = await axios.get(params.source_url, { responseType: 'arraybuffer' });
        // Derive extension from content-type header or source URL
        const ext = getExtFromMime(fileRes.headers['content-type'])
          || getExtFromUrl(params.source_url)
          || 'jpg';
        const basename = params.title ? params.title.replace(/\s+/g, '_') : 'upload';
        const filename = `${basename}.${ext}`;

        const form = new FormData();
        form.append('file', Buffer.from(fileRes.data), {
          filename: filename,
          contentType: fileRes.headers['content-type'] || 'application/octet-stream'
        });
        // Append additional fields if provided
        if (params.title) form.append('title', params.title);
        if (params.alt_text) form.append('alt_text', params.alt_text);
        if (params.caption) form.append('caption', params.caption);
        if (params.description) form.append('description', params.description);

        // Use the enhanced makeWordPressRequest function with FormData support
        // Media uploads get a longer timeout (120s)
        const response = await makeWordPressRequest(
          'POST',
          'media',
          form,
          {
            isFormData: true,
            headers: form.getHeaders(),
            rawResponse: true,
            timeout: 120000
          }
        );
        return {
          toolResult: {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
          }
        };
      } else {
        const response = await makeWordPressRequest("POST", "media", params);
        return {
          toolResult: {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
          }
        };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error creating media: ${errorMessage}` }]
        }
      };
    }
  },
  edit_media: async (params: z.infer<typeof editMediaSchema>) => {
    try {
      const { id, ...updateData } = params;
      const response = await makeWordPressRequest("POST", `media/${id}`, updateData);
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error editing media: ${errorMessage}` }]
        }
      };
    }
  },
  delete_media: async (params: z.infer<typeof deleteMediaSchema>) => {
    try {
      const { id, ...deleteData } = params;
      const response = await makeWordPressRequest("DELETE", `media/${id}`, deleteData);
      return {
        toolResult: {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
        }
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      return {
        toolResult: {
          isError: true,
          content: [{ type: "text", text: `Error deleting media: ${errorMessage}` }]
        }
      };
    }
  }
};

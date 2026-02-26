// src/tools/media.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { makeWordPressRequest } from '../wordpress.js';
import { z } from 'zod';

// Schema for listing media items
const listMediaSchema = z.object({
  page: z.number().optional().describe("Page number"),
  per_page: z.number().min(1).max(100).optional().describe("Items per page"),
  search: z.string().optional().describe("Search term for media")
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
      const response = await makeWordPressRequest("GET", "media", params);
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
  create_media: async (params: z.infer<typeof createMediaSchema>) => {
    try {
      if (params.source_url && params.source_url.startsWith('http')) {
        // Download the media file from the URL and upload as multipart form-data
        const axios = (await import('axios')).default;
        const FormData = (await import('form-data')).default;
        const fileRes = await axios.get(params.source_url, { responseType: 'arraybuffer' });
        // Derive a filename from the title or fallback
        const filename = params.title ? `${params.title.replace(/\s+/g, '_')}.jpg` : 'upload.jpg';

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
        const response = await makeWordPressRequest(
          'POST', 
          'media', 
          form, 
          {
            isFormData: true,
            headers: form.getHeaders(),
            rawResponse: true
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

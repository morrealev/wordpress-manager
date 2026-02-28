import { makeWordPressRequest } from '../wordpress.js';
import { z } from 'zod';
// Schema for listing comments
const listCommentsSchema = z.object({
    page: z.number().optional().describe("Page number (default 1)"),
    per_page: z.number().min(1).max(100).optional().describe("Items per page (default 10, max 100)"),
    search: z.string().optional().describe("Search term for comment content"),
    after: z.string().optional().describe("ISO8601 date string to get comments published after this date"),
    author: z.union([z.number(), z.array(z.number())]).optional().describe("Author ID or array of IDs"),
    author_email: z.string().email().optional().describe("Author email address"),
    author_exclude: z.array(z.number()).optional().describe("Array of author IDs to exclude"),
    post: z.number().optional().describe("Post ID to retrieve comments for"),
    status: z.enum(['approve', 'hold', 'spam', 'trash']).optional().describe("Comment status"),
    type: z.string().optional().describe("Comment type"),
    orderby: z.enum(['date', 'date_gmt', 'id', 'include', 'post', 'parent', 'type']).optional().describe("Sort comments by parameter"),
    order: z.enum(['asc', 'desc']).optional().describe("Order sort attribute ascending or descending"),
    _embed: z.boolean().optional().describe("Inline related resources"),
    _fields: z.string().optional().describe("Comma-separated list of fields to return"),
    include_pagination: z.boolean().optional().describe("Include pagination metadata in response")
});
// Schema for getting a single comment
const getCommentSchema = z.object({
    id: z.number().describe("Comment ID"),
    _embed: z.boolean().optional().describe("Inline related resources"),
    _fields: z.string().optional().describe("Comma-separated list of fields to return")
}).strict();
// Schema for creating a comment
const createCommentSchema = z.object({
    post: z.number().describe("The ID of the post object the comment is for"),
    author: z.number().optional().describe("The ID of the user object, if the author is a registered user"),
    author_name: z.string().optional().describe("Display name for the comment author"),
    author_email: z.string().email().optional().describe("Email address for the comment author"),
    author_url: z.string().url().optional().describe("URL for the comment author"),
    content: z.string().describe("The content of the comment"),
    parent: z.number().optional().describe("The ID of the parent comment"),
    status: z.enum(['approve', 'hold']).optional().describe("State of the comment")
}).strict();
// Schema for updating a comment
const updateCommentSchema = z.object({
    id: z.number().describe("Comment ID"),
    post: z.number().optional().describe("The ID of the post object the comment is for"),
    author: z.number().optional().describe("The ID of the user object, if the author is a registered user"),
    author_name: z.string().optional().describe("Display name for the comment author"),
    author_email: z.string().email().optional().describe("Email address for the comment author"),
    author_url: z.string().url().optional().describe("URL for the comment author"),
    content: z.string().optional().describe("The content of the comment"),
    parent: z.number().optional().describe("The ID of the parent comment"),
    status: z.enum(['approve', 'hold', 'spam', 'trash']).optional().describe("State of the comment")
}).strict();
// Schema for deleting a comment
const deleteCommentSchema = z.object({
    id: z.number().describe("Comment ID"),
    force: z.boolean().optional().describe("Whether to bypass trash and force deletion")
}).strict();
// Define the tools
export const commentTools = [
    {
        name: "list_comments",
        description: "Lists comments with filtering, sorting, and pagination options",
        inputSchema: { type: "object", properties: listCommentsSchema.shape }
    },
    {
        name: "get_comment",
        description: "Gets a comment by ID",
        inputSchema: { type: "object", properties: getCommentSchema.shape }
    },
    {
        name: "create_comment",
        description: "Creates a new comment",
        inputSchema: { type: "object", properties: createCommentSchema.shape }
    },
    {
        name: "update_comment",
        description: "Updates an existing comment",
        inputSchema: { type: "object", properties: updateCommentSchema.shape }
    },
    {
        name: "delete_comment",
        description: "Deletes a comment",
        inputSchema: { type: "object", properties: deleteCommentSchema.shape }
    }
];
// Implement the handlers
export const commentHandlers = {
    list_comments: async (params) => {
        try {
            const { include_pagination, ...queryParams } = params;
            const response = await makeWordPressRequest('GET', "comments", queryParams, {
                includePagination: include_pagination,
            });
            return {
                toolResult: {
                    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
                },
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error listing comments: ${errorMessage}` }],
                },
            };
        }
    },
    get_comment: async (params) => {
        try {
            const queryParams = {};
            if (params._embed)
                queryParams._embed = true;
            if (params._fields)
                queryParams._fields = params._fields;
            const response = await makeWordPressRequest('GET', `comments/${params.id}`, queryParams);
            return {
                toolResult: {
                    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
                },
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error getting comment: ${errorMessage}` }],
                },
            };
        }
    },
    create_comment: async (params) => {
        try {
            const response = await makeWordPressRequest('POST', "comments", params);
            const comment = response;
            return {
                toolResult: {
                    content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }],
                },
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error creating comment: ${errorMessage}` }],
                },
            };
        }
    },
    update_comment: async (params) => {
        try {
            const { id, ...updateData } = params;
            const response = await makeWordPressRequest('POST', `comments/${id}`, updateData);
            const comment = response;
            return {
                toolResult: {
                    content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }],
                },
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error updating comment: ${errorMessage}` }],
                },
            };
        }
    },
    delete_comment: async (params) => {
        try {
            const response = await makeWordPressRequest('DELETE', `comments/${params.id}`, { force: params.force });
            const comment = response;
            return {
                toolResult: {
                    content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }],
                },
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return {
                toolResult: {
                    isError: true,
                    content: [{ type: 'text', text: `Error deleting comment: ${errorMessage}` }],
                },
            };
        }
    }
};

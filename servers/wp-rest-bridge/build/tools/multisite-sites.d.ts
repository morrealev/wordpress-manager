import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
declare const msListSitesSchema: z.ZodObject<{
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    site_id?: string | undefined;
}, {
    site_id?: string | undefined;
}>;
declare const msGetSiteSchema: z.ZodObject<{
    blog_id: z.ZodNumber;
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    blog_id: number;
    site_id?: string | undefined;
}, {
    blog_id: number;
    site_id?: string | undefined;
}>;
declare const msCreateSiteSchema: z.ZodObject<{
    slug: z.ZodString;
    title: z.ZodString;
    email: z.ZodString;
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    email: string;
    slug: string;
    title: string;
    site_id?: string | undefined;
}, {
    email: string;
    slug: string;
    title: string;
    site_id?: string | undefined;
}>;
declare const msActivateSiteSchema: z.ZodObject<{
    blog_id: z.ZodNumber;
    active: z.ZodBoolean;
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    active: boolean;
    blog_id: number;
    site_id?: string | undefined;
}, {
    active: boolean;
    blog_id: number;
    site_id?: string | undefined;
}>;
declare const msDeleteSiteSchema: z.ZodObject<{
    blog_id: z.ZodNumber;
    confirm: z.ZodLiteral<true>;
    site_id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    blog_id: number;
    confirm: true;
    site_id?: string | undefined;
}, {
    blog_id: number;
    confirm: true;
    site_id?: string | undefined;
}>;
export declare const multisiteSiteTools: Tool[];
export declare const multisiteSiteHandlers: {
    ms_list_sites: (params: z.infer<typeof msListSitesSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_get_site: (params: z.infer<typeof msGetSiteSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_create_site: (params: z.infer<typeof msCreateSiteSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_activate_site: (params: z.infer<typeof msActivateSiteSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
    ms_delete_site: (params: z.infer<typeof msDeleteSiteSchema>) => Promise<{
        toolResult: {
            content: {
                type: string;
                text: string;
            }[];
            isError?: undefined;
        };
    } | {
        toolResult: {
            isError: boolean;
            content: {
                type: string;
                text: string;
            }[];
        };
    }>;
};
export {};

// src/types/wordpress-types.ts

// Common fields for WordPress Posts and Pages
interface WPContent {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: Record<string, any>[];
  _links: Record<string, any>;
}

// WordPress Post type
export interface WPPost extends WPContent {
  format: string;
  sticky: boolean;
  categories: number[];
  tags: number[];
}

// WordPress Page type
export interface WPPage extends WPContent {
  parent: number;
  menu_order: number;
}

// WordPress Category type
export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: Record<string, any>[];
  _links: Record<string, any>;
}

// WordPress User type
export interface WPUser {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  url: string;
  description: string;
  link: string;
  locale: string;
  nickname: string;
  slug: string;
  roles: string[];
  registered_date: string;
  capabilities: Record<string, boolean>;
  extra_capabilities: Record<string, boolean>;
  avatar_urls: Record<string, string>;
  meta: Record<string, any>[];
  _links: Record<string, any>;
}

// WordPress Plugin type
export interface WPPlugin {
  plugin: string;
  status: string;
  name: string;
  plugin_uri: string;
  author: string;
  author_uri: string;
  description: {
    raw: string;
    rendered: string;
  };
  version: string;
  network_only: boolean;
  requires_wp: string;
  requires_php: string;
  textdomain: string;
}

// WordPress Comment type
export interface WPComment {
  id: number;
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_url: string;
  author_email?: string; // May not be returned based on permissions
  author_ip?: string; // May not be returned based on permissions
  author_user_agent?: string; // May not be returned based on permissions
  date: string;
  date_gmt: string;
  content: {
    rendered: string;
    raw?: string; // May not be returned based on permissions
  };
  link: string;
  status: string;
  type: string;
  meta: Record<string, any>[];
  _links: Record<string, any>;
}

// WordPress Custom Post Type
export interface WPCustomPost extends WPContent {
  // Custom post types can have any additional fields
  [key: string]: any;
}

// WordPress Post Type definition
export interface WPPostType {
  slug: string;
  name: string;
  description: string;
  hierarchical: boolean;
  rest_base: string;
  supports: string[];
  taxonomies: string[];
  labels: Record<string, string>;
  _links: Record<string, any>;
}

// WordPress Taxonomy definition
export interface WPTaxonomy {
  slug: string;
  name: string;
  description: string;
  types: string[];
  hierarchical: boolean;
  rest_base: string;
  labels: Record<string, string>;
  _links: Record<string, any>;
}

// WordPress Term (for taxonomies)
export interface WPTerm {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: Record<string, any>[];
  _links: Record<string, any>;
}
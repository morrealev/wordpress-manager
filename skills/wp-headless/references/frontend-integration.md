# Frontend Integration

Use this file when connecting a JavaScript frontend framework to a headless WordPress backend.

## Next.js integration

### Data fetching (App Router)

```js
// lib/wordpress.js
const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://wp.example.com';

export async function getPosts(page = 1, perPage = 10) {
    const res = await fetch(
        `${WP_URL}/wp-json/wp/v2/posts?page=${page}&per_page=${perPage}&_embed`,
        { next: { revalidate: 60 } } // ISR: revalidate every 60 seconds
    );
    if (!res.ok) throw new Error('Failed to fetch posts');
    return {
        posts: await res.json(),
        totalPages: Number(res.headers.get('X-WP-TotalPages')),
    };
}

export async function getPost(slug) {
    const res = await fetch(
        `${WP_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`,
        { next: { revalidate: 60 } }
    );
    const posts = await res.json();
    return posts[0] || null;
}

export async function getPage(slug) {
    const res = await fetch(
        `${WP_URL}/wp-json/wp/v2/pages?slug=${slug}&_embed`,
        { next: { revalidate: 300 } }
    );
    const pages = await res.json();
    return pages[0] || null;
}
```

### Page components

```jsx
// app/blog/page.js
import { getPosts } from '@/lib/wordpress';

export default async function BlogPage() {
    const { posts } = await getPosts();

    return (
        <main>
            <h1>Blog</h1>
            {posts.map((post) => (
                <article key={post.id}>
                    <h2>
                        <a href={`/blog/${post.slug}`}>{post.title.rendered}</a>
                    </h2>
                    <div dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                </article>
            ))}
        </main>
    );
}

// app/blog/[slug]/page.js
import { getPost, getPosts } from '@/lib/wordpress';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
    const { posts } = await getPosts(1, 100);
    return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }) {
    const post = await getPost(params.slug);
    if (!post) notFound();

    return (
        <article>
            <h1>{post.title.rendered}</h1>
            <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
        </article>
    );
}
```

### ISR (Incremental Static Regeneration)

```js
// Revalidate on demand via webhook (see webhooks.md)
// app/api/revalidate/route.js
import { revalidatePath } from 'next/cache';

export async function POST(request) {
    const secret = request.headers.get('x-revalidate-secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
        return Response.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const { path } = await request.json();
    revalidatePath(path);
    return Response.json({ revalidated: true });
}
```

## Nuxt 3 integration

### Composable

```js
// composables/useWordPress.js
export function useWordPress() {
    const config = useRuntimeConfig();
    const wpUrl = config.public.wpUrl;

    async function getPosts(page = 1) {
        return useFetch(`${wpUrl}/wp-json/wp/v2/posts`, {
            params: { page, per_page: 10, _embed: true },
        });
    }

    async function getPost(slug) {
        const { data } = await useFetch(`${wpUrl}/wp-json/wp/v2/posts`, {
            params: { slug, _embed: true },
        });
        return data.value?.[0] || null;
    }

    return { getPosts, getPost };
}
```

### nuxt.config.ts

```ts
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            wpUrl: process.env.WP_URL || 'https://wp.example.com',
        },
    },
    routeRules: {
        '/blog/**': { isr: 60 }, // Revalidate every 60s
        '/': { isr: 300 },
    },
});
```

## Astro integration

### Data fetching

```astro
---
// src/pages/blog/[slug].astro
import Layout from '@/layouts/Layout.astro';

export async function getStaticPaths() {
    const res = await fetch(`${import.meta.env.WP_URL}/wp-json/wp/v2/posts?per_page=100`);
    const posts = await res.json();

    return posts.map((post) => ({
        params: { slug: post.slug },
        props: { post },
    }));
}

const { post } = Astro.props;
---

<Layout title={post.title.rendered}>
    <article>
        <h1 set:html={post.title.rendered} />
        <div set:html={post.content.rendered} />
    </article>
</Layout>
```

## WPGraphQL with frontend frameworks

### Apollo Client (React/Next.js)

```js
// lib/apollo.js
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
    link: new HttpLink({
        uri: `${process.env.NEXT_PUBLIC_WP_URL}/graphql`,
    }),
    cache: new InMemoryCache(),
});

export default client;
```

### urql (lightweight alternative)

```js
import { Client, cacheExchange, fetchExchange } from 'urql';

const client = new Client({
    url: `${process.env.NEXT_PUBLIC_WP_URL}/graphql`,
    exchanges: [cacheExchange, fetchExchange],
});
```

## Rendering WordPress content

### Sanitizing HTML content

```jsx
// React: dangerouslySetInnerHTML (ensure source is trusted)
<div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />

// With DOMPurify for extra safety
import DOMPurify from 'isomorphic-dompurify';

function WPContent({ html }) {
    const clean = DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    });
    return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### Handling WordPress images

```jsx
// Replace WordPress image URLs with optimized versions
function optimizeImages(html, wpUrl) {
    // Replace with Next.js Image optimization
    return html.replace(
        /src="([^"]*wp-content\/uploads\/[^"]*)"/g,
        (match, url) => `src="/_next/image?url=${encodeURIComponent(url)}&w=1200&q=80"`
    );
}
```

### WordPress blocks in React

```jsx
// Parse block content into React components
function renderBlock(block) {
    switch (block.blockName) {
        case 'core/paragraph':
            return <p dangerouslySetInnerHTML={{ __html: block.innerHTML }} />;
        case 'core/heading':
            return <h2 dangerouslySetInnerHTML={{ __html: block.innerHTML }} />;
        case 'core/image':
            return <figure dangerouslySetInnerHTML={{ __html: block.innerHTML }} />;
        default:
            return <div dangerouslySetInnerHTML={{ __html: block.innerHTML }} />;
    }
}
```

## SEO in headless WordPress

### Yoast SEO integration

```js
// Fetch Yoast data from REST API
// Requires Yoast SEO plugin (adds yoast_head to REST responses)
export async function getPostSEO(slug) {
    const res = await fetch(
        `${WP_URL}/wp-json/wp/v2/posts?slug=${slug}&_fields=yoast_head_json`
    );
    const posts = await res.json();
    return posts[0]?.yoast_head_json || {};
}
```

```jsx
// app/blog/[slug]/page.js
export async function generateMetadata({ params }) {
    const seo = await getPostSEO(params.slug);
    return {
        title: seo.title,
        description: seo.description,
        openGraph: {
            title: seo.og_title,
            description: seo.og_description,
            images: seo.og_image ? [{ url: seo.og_image[0].url }] : [],
        },
    };
}
```

## Preview mode

```js
// app/api/preview/route.js (Next.js)
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const slug = searchParams.get('slug');

    if (secret !== process.env.WP_PREVIEW_SECRET) {
        return Response.json({ error: 'Invalid secret' }, { status: 401 });
    }

    draftMode().enable();
    redirect(`/blog/${slug}`);
}
```

## Verification

```bash
# Test REST API from frontend origin
curl -H "Origin: https://app.example.com" \
  https://wp.example.com/wp-json/wp/v2/posts?per_page=1

# Test _embed returns featured images
curl -s "https://wp.example.com/wp-json/wp/v2/posts?_embed&per_page=1" | \
  jq '.[0]._embedded["wp:featuredmedia"][0].source_url'

# Test ISR revalidation
curl -X POST https://app.example.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: YOUR_SECRET" \
  -d '{"path": "/blog/hello-world"}'
```

# API Layer Choice

Use this file when deciding between REST API and WPGraphQL for a headless WordPress project.

## Comparison matrix

| Criterion | REST API | WPGraphQL |
|-----------|----------|-----------|
| Built into core | Yes (since 4.7) | Plugin required |
| Data fetching | Fixed endpoints, multiple requests | Single query, exact fields |
| Over-fetching | Common (returns all fields) | Eliminated (request only what you need) |
| Under-fetching | Common (need multiple requests) | Eliminated (nested queries) |
| Caching | HTTP caching (CDN-friendly) | Requires custom caching layer |
| Learning curve | Lower (familiar REST patterns) | Higher (GraphQL query language) |
| Community/ecosystem | Largest | Growing, strong Gatsby/Next.js integration |
| Real-time | Polling or custom | Subscriptions (with extensions) |
| Authentication | Cookie, Application Passwords, JWT | Same as REST + GraphQL-specific |
| File uploads | Native multipart | Requires separate REST endpoint |
| Performance | Predictable | Faster for complex pages, slower for simple |
| Debugging | Standard HTTP tools | Requires GraphQL client (GraphiQL) |

## When to choose REST API

- **Simple content sites** — blog, portfolio, brochure
- **CDN-heavy architecture** — REST responses cache naturally at edge
- **Team unfamiliar with GraphQL** — lower learning curve
- **Third-party integrations** — most services expect REST
- **WooCommerce headless** — WooCommerce REST API is mature and well-documented
- **Mobile apps** — REST is universal across platforms
- **Server-side rendering with few queries** — ISR/SSG pages that make 1-3 API calls

## When to choose WPGraphQL

- **Complex page compositions** — homepage with posts, categories, menus, options, custom fields
- **Component-driven frontend** — React/Vue components that each declare their data needs
- **Gatsby projects** — gatsby-source-wordpress uses WPGraphQL natively
- **Deeply nested data** — posts → author → posts → categories in one query
- **Multiple content types per page** — dashboard-style layouts
- **Rapid frontend development** — frontend devs query exactly what they need

## Hybrid approach

Use both:

```
REST API → Simple CRUD, file uploads, WooCommerce, webhooks
WPGraphQL → Complex page data fetching, component queries
```

This is common in production. Example:
- Blog listing page: WPGraphQL (needs posts + categories + featured images + author in one query)
- Contact form submission: REST API (simple POST)
- WooCommerce cart/checkout: WooCommerce REST API
- Media upload: REST API (multipart form data)

## REST API quick setup for headless

```php
// Register custom endpoint
add_action('rest_api_init', function() {
    register_rest_route('myapp/v1', '/homepage', [
        'methods'  => 'GET',
        'callback' => 'get_homepage_data',
        'permission_callback' => '__return_true',
    ]);
});

function get_homepage_data() {
    return [
        'hero'  => get_field('hero', 'option'),
        'posts' => get_posts(['numberposts' => 6, 'post_type' => 'post']),
        'menu'  => wp_get_nav_menu_items('primary'),
    ];
}
```

## WPGraphQL quick setup for headless

```bash
wp plugin install wp-graphql --activate
```

```graphql
# Single query for a complex homepage
query Homepage {
  posts(first: 6) {
    nodes {
      title
      excerpt
      uri
      featuredImage {
        node {
          sourceUrl(size: MEDIUM_LARGE)
          altText
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
    }
  }
  menus(where: { location: PRIMARY }) {
    nodes {
      menuItems {
        nodes {
          label
          url
        }
      }
    }
  }
}
```

## Performance considerations

### REST API

```
Homepage data:
  GET /wp-json/wp/v2/posts?per_page=6          → 1 request
  GET /wp-json/wp/v2/categories                  → 1 request
  GET /wp-json/wp/v2/media/{id} (per post)       → 6 requests
  GET /wp-json/wp/v2/menus/primary               → 1 request
  Total: 9 requests, ~150KB response (with over-fetching)
```

### WPGraphQL

```
Homepage data:
  POST /graphql (single query)                   → 1 request
  Total: 1 request, ~25KB response (exact fields only)
```

### Mitigation for REST over-fetching

```php
// Use _fields parameter to reduce payload
// GET /wp-json/wp/v2/posts?_fields=id,title,excerpt,featured_media

// Or create custom endpoints that aggregate data
register_rest_route('myapp/v1', '/homepage', [
    'callback' => function() {
        // Return exactly what the frontend needs
    }
]);
```

## Decision checklist

1. What is the team's GraphQL experience? (low → REST)
2. How many API calls per page? (>3 → consider WPGraphQL)
3. Is edge caching critical? (yes → REST preferred)
4. Using Gatsby? (yes → WPGraphQL)
5. Using WooCommerce? (yes → REST for commerce, WPGraphQL for content)
6. How nested is the data model? (deeply nested → WPGraphQL)

# Data Sources for Programmatic SEO

Use this file when connecting structured data (WordPress REST API, WPGraphQL, external APIs, CSV imports) to programmatic page generation, including quality gates and freshness strategies.

## WordPress REST API as Data Source

The REST API provides paginated, filterable access to all WordPress content:

### Pagination for Large Datasets

```bash
# Fetch all posts with pagination (100 per page max)
GET /wp-json/wp/v2/posts?per_page=100&page=1
# Check X-WP-TotalPages header for total pages

# Fetch with filters
GET /wp-json/wp/v2/location?per_page=100&status=publish&orderby=title

# Embed related data (featured image, author, terms)
GET /wp-json/wp/v2/posts?_embed&per_page=50
```

### Filtering and Search

| Parameter | Description | Example |
|-----------|-------------|---------|
| `categories` | Filter by category ID | `?categories=5,12` |
| `tags` | Filter by tag ID | `?tags=8` |
| `search` | Full-text search | `?search=miami` |
| `before`/`after` | Date range | `?after=2024-01-01T00:00:00` |
| `meta_key`/`meta_value` | Custom field filter (requires plugin) | `?meta_key=city&meta_value=Miami` |
| `orderby` | Sort: date, title, modified, rand | `?orderby=title&order=asc` |

### Custom REST Fields

Expose CPT meta for programmatic consumption:

```php
register_rest_field('location', 'seo_data', [
    'get_callback' => function ($post) {
        return [
            'city'        => get_post_meta($post['id'], 'city', true),
            'state'       => get_post_meta($post['id'], 'state', true),
            'population'  => (int) get_post_meta($post['id'], 'population', true),
            'coordinates' => [
                'lat' => (float) get_post_meta($post['id'], 'lat', true),
                'lng' => (float) get_post_meta($post['id'], 'lng', true),
            ],
        ];
    },
]);
```

## WPGraphQL Queries for Programmatic Content

WPGraphQL is more efficient for complex, nested data fetching:

### Batch Queries with Fragments

```graphql
fragment LocationFields on Location {
  id
  title
  slug
  locationMeta {
    city
    state
    population
    latitude
    longitude
  }
  seo {
    title
    metaDesc
    canonical
  }
}

query AllLocations($first: Int!, $after: String) {
  locations(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      ...LocationFields
    }
  }
}
```

### Advantages over REST API for Programmatic SEO

| Aspect | REST API | WPGraphQL |
|--------|----------|-----------|
| Payload size | Full objects, many unused fields | Only requested fields |
| Nested data | Multiple requests or `_embed` | Single query with relations |
| Pagination | Offset-based (slow at high pages) | Cursor-based (consistent speed) |
| Batch queries | N requests for N types | 1 request with aliases |

## Custom REST Endpoints

Register specialized endpoints for aggregated programmatic data:

```php
add_action('rest_api_init', function () {
    register_rest_route('programmatic-seo/v1', '/page-data', [
        'methods'  => 'GET',
        'callback' => function ($request) {
            $type = $request->get_param('type') ?? 'location';
            $posts = get_posts([
                'post_type'      => $type,
                'posts_per_page' => -1,
                'post_status'    => 'publish',
            ]);
            return array_map(function ($post) {
                return [
                    'slug'    => $post->post_name,
                    'title'   => $post->post_title,
                    'content' => apply_filters('the_content', $post->post_content),
                    'meta'    => get_post_meta($post->ID),
                ];
            }, $posts);
        },
        'permission_callback' => '__return_true',
    ]);
});
```

## External Data Integration

### CSV Import → CPT

```bash
# Workflow:
# 1. Parse CSV with Node.js or WP-CLI
# 2. Create WordPress posts via REST API

# WP-CLI approach:
wp post create --post_type=location --post_title="Plumbing in Miami" \
  --post_status=publish --meta_input='{"city":"Miami","state":"FL","zip":"33101"}'

# MCP tool approach (in loop):
create_content(type="location", title="Plumbing in Miami", status="publish",
  meta={"city": "Miami", "state": "FL", "zip": "33101"})
```

### API Sync → WordPress

For data from external APIs (property listings, job boards, etc.):

1. **Cron-based sync:** WP-Cron or system cron triggers API fetch + `wp_insert_post()`
2. **Webhook-based sync:** External service sends webhooks → WordPress receiver updates CPT
3. **Manual import:** Admin uploads CSV → background job creates/updates posts

## Data Freshness Strategies

| Strategy | Trigger | Use Case |
|----------|---------|----------|
| Cron update | Scheduled (hourly/daily) | Price updates, stock changes |
| Webhook revalidation | External event | Order status, inventory sync |
| On-demand ISR | Manual admin action | Content corrections, new pages |
| Build-time SSG | Git push / deploy | Static directories, rarely changing data |

### Webhook-Triggered Revalidation

```javascript
// Next.js API route for on-demand ISR
// POST /api/revalidate?secret=TOKEN&path=/services/miami
export default async function handler(req, res) {
  if (req.query.secret !== process.env.REVALIDATION_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  await res.revalidate(req.query.path);
  return res.json({ revalidated: true });
}
```

## Content Quality Gates

Before publishing programmatic pages, enforce minimum quality standards:

| Gate | Threshold | Action if Fails |
|------|-----------|-----------------|
| Word count | >= 300 words | Block publish, flag for review |
| Required fields | All template vars populated | Block publish, log missing fields |
| SEO score | Title + meta desc + H1 present | Warning, auto-generate from template |
| Duplicate check | No existing page with same slug | Skip creation, log duplicate |
| Image present | Featured image or OG image set | Warning, use category default image |
| Schema valid | JSON-LD parses without errors | Block publish, fix template |

**Implementation:** Add validation in the bulk creation loop before calling `create_content`.

## Decision Checklist

1. Is REST API or WPGraphQL better for this dataset? → Complex nesting = WPGraphQL; simple = REST
2. Are all needed fields exposed via API? → Register `rest_field` or GraphQL fields if not
3. How will data stay fresh? → Choose cron/webhook/ISR based on update frequency
4. Are quality gates enforced before publish? → Never publish without validation
5. Can the data source handle bulk queries? → Test pagination at expected scale

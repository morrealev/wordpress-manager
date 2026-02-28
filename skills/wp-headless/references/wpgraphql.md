# WPGraphQL

Use this file when setting up and using WPGraphQL for headless WordPress.

## Installation

```bash
wp plugin install wp-graphql --activate

# Verify
wp graphql --help
curl -s http://localhost:8888/graphql -H "Content-Type: application/json" \
  -d '{"query": "{ generalSettings { title } }"}' | jq
```

GraphQL IDE: `http://localhost:8888/wp-admin/admin.php?page=graphiql-ide`

## Common queries

### Posts

```graphql
# List posts with pagination
query GetPosts($first: Int = 10, $after: String) {
  posts(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      databaseId
      title
      slug
      date
      excerpt
      content
      uri
      featuredImage {
        node {
          sourceUrl(size: LARGE)
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      author {
        node {
          name
          avatar {
            url
          }
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
      tags {
        nodes {
          name
          slug
        }
      }
    }
  }
}
```

### Single post by slug

```graphql
query GetPost($slug: ID!) {
  post(id: $slug, idType: SLUG) {
    title
    content
    date
    modified
    seo {
      title
      metaDesc
      opengraphImage {
        sourceUrl
      }
    }
    author {
      node {
        name
        description
      }
    }
  }
}
```

### Pages

```graphql
query GetPage($uri: String!) {
  pageBy(uri: $uri) {
    title
    content
    template {
      templateName
    }
    children {
      nodes {
        ... on Page {
          title
          uri
        }
      }
    }
  }
}
```

### Menus

```graphql
query GetMenu {
  menus(where: { location: PRIMARY }) {
    nodes {
      menuItems(first: 50) {
        nodes {
          id
          label
          url
          parentId
          cssClasses
          target
        }
      }
    }
  }
}
```

### Custom Post Types

```php
// Register CPT with GraphQL support
register_post_type('product', [
    'label'               => 'Products',
    'public'              => true,
    'show_in_graphql'     => true,
    'graphql_single_name' => 'product',
    'graphql_plural_name' => 'products',
]);
```

```graphql
query GetProducts {
  products(first: 12) {
    nodes {
      title
      slug
      productFields {   # ACF field group
        price
        sku
      }
    }
  }
}
```

### Custom Taxonomies

```php
register_taxonomy('product_category', 'product', [
    'label'               => 'Product Categories',
    'show_in_graphql'     => true,
    'graphql_single_name' => 'productCategory',
    'graphql_plural_name' => 'productCategories',
]);
```

## ACF integration

```bash
wp plugin install wpgraphql-acf --activate
```

ACF fields are automatically exposed when the field group's "Show in GraphQL" setting is enabled.

```graphql
query GetPostWithACF {
  post(id: "hello-world", idType: SLUG) {
    title
    customFields {       # ACF field group name (camelCase)
      subtitle
      heroImage {
        sourceUrl
        altText
      }
      features {         # Repeater field
        title
        description
      }
    }
  }
}
```

## Custom resolvers

```php
// Add custom field to existing type
add_action('graphql_register_types', function() {
    register_graphql_field('Post', 'readingTime', [
        'type'        => 'Int',
        'description' => 'Estimated reading time in minutes',
        'resolve'     => function($post) {
            $content = get_post_field('post_content', $post->databaseId);
            $word_count = str_word_count(strip_tags($content));
            return max(1, ceil($word_count / 200));
        },
    ]);
});

// Add custom root query
add_action('graphql_register_types', function() {
    register_graphql_field('RootQuery', 'siteOptions', [
        'type'        => 'SiteOptions',
        'description' => 'Global site options',
        'resolve'     => function() {
            return [
                'phone'   => get_option('site_phone'),
                'address' => get_option('site_address'),
            ];
        },
    ]);

    register_graphql_object_type('SiteOptions', [
        'fields' => [
            'phone'   => ['type' => 'String'],
            'address' => ['type' => 'String'],
        ],
    ]);
});
```

## Mutations

```graphql
# Create a comment (authenticated)
mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    success
    comment {
      id
      content
      date
      author {
        node {
          name
        }
      }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "commentOn": 1,
    "content": "Great post!",
    "author": "John"
  }
}
```

## Performance

### Query complexity limits

WPGraphQL enforces query depth and complexity limits by default.

```php
// Adjust limits in wp-config.php or plugin
add_filter('graphql_max_query_amount', function() {
    return 100; // max nodes per query (default: 100)
});
```

### Persisted queries

```php
// Register a persisted query
add_action('graphql_register_types', function() {
    register_graphql_query_alias('homepage', '
        query Homepage {
            posts(first: 6) { nodes { title slug excerpt } }
            menus(where: { location: PRIMARY }) { nodes { menuItems { nodes { label url } } } }
        }
    ');
});
```

### Object caching

WPGraphQL integrates with WordPress object cache. Use Redis or Memcached for production:

```bash
wp plugin install wp-graphql-smart-cache --activate
```

## Verification

```bash
# Test GraphQL endpoint
curl -s http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ posts(first: 1) { nodes { title } } }"}' | jq

# Check schema introspection
curl -s http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}' | jq '.data.__schema.types | length'

# Verify CPT is registered in schema
curl -s http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __type(name: \"Product\") { name fields { name } } }"}' | jq
```

# Webhook Payload Formats

## Standard WordPress Webhook Payload

When using the mu-plugin approach, payloads follow this structure:

```json
{
  "event": "post.published",
  "timestamp": "2026-02-28T14:30:00+00:00",
  "site_url": "https://example.com",
  "data": {
    "id": 123,
    "title": "Post Title",
    "slug": "post-title",
    "type": "post",
    "url": "https://example.com/post-title/"
  }
}
```

### Event Types

| Event | Data Fields |
|-------|-------------|
| `post.published` | id, title, slug, type, url |
| `post.updated` | id, title, slug, type, url |
| `term.updated` | id, name, slug, taxonomy |
| `user.created` | id, username, email, role |
| `menu.updated` | menu_id |

## WooCommerce Webhook Payloads

WooCommerce sends the full resource object as the payload.

### Order Created Payload (truncated)

```json
{
  "id": 456,
  "status": "processing",
  "currency": "EUR",
  "total": "29.99",
  "customer_id": 12,
  "billing": {
    "first_name": "Mario",
    "last_name": "Rossi",
    "email": "mario@example.com",
    "phone": "+39 123 456 7890",
    "address_1": "Via Roma 1",
    "city": "Palermo",
    "state": "PA",
    "postcode": "90100",
    "country": "IT"
  },
  "line_items": [
    {
      "id": 1,
      "name": "Cactus Water - Dolce",
      "product_id": 78,
      "quantity": 6,
      "total": "29.99"
    }
  ],
  "date_created": "2026-02-28T14:30:00",
  "payment_method": "stripe",
  "payment_method_title": "Credit Card"
}
```

### Product Updated Payload (truncated)

```json
{
  "id": 78,
  "name": "Cactus Water - Dolce",
  "slug": "cactus-water-dolce",
  "type": "simple",
  "status": "publish",
  "price": "4.99",
  "regular_price": "5.99",
  "sale_price": "4.99",
  "stock_quantity": 150,
  "stock_status": "instock",
  "categories": [
    { "id": 3, "name": "Beverages", "slug": "beverages" }
  ]
}
```

## Custom Payload Formatting

### Minimal Payload (reduce bandwidth)

If the receiving service only needs specific fields, format a custom payload in the mu-plugin:

```php
send_webhook('order.created', [
    'order_id' => $order->get_id(),
    'total'    => $order->get_total(),
    'email'    => $order->get_billing_email(),
    'items'    => count($order->get_items()),
]);
```

### Enriched Payload (add computed fields)

```php
send_webhook('post.published', [
    'id'         => $post->ID,
    'title'      => $post->post_title,
    'url'        => get_permalink($post),
    'word_count' => str_word_count(wp_strip_all_tags($post->post_content)),
    'categories' => wp_get_post_categories($post->ID, ['fields' => 'names']),
    'author'     => get_the_author_meta('display_name', $post->post_author),
]);
```

## Content-Type Headers

| Format | Content-Type | When to Use |
|--------|-------------|-------------|
| JSON | `application/json` | Default, most integrations |
| Form-encoded | `application/x-www-form-urlencoded` | Legacy systems |
| XML | `application/xml` | SOAP integrations |

WooCommerce always sends `application/json`. The mu-plugin approach defaults to JSON but can be customized.

## Payload Size Considerations

- **WooCommerce**: Full resource payloads can be large (5-50 KB for orders with many items)
- **Custom payloads**: Keep under 1 MB for reliability
- **Truncation strategy**: For large content fields, send an ID + URL instead of the full body
- **Batch events**: If multiple events fire in quick succession, consider debouncing on the receiving end

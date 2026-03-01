# Supported Schema.org Types

## Type Reference

### Article
**Use for:** Blog posts, news articles, how-to articles
**Rich result:** Article rich result with headline, image, date, author
**Required properties:**
- `headline` — article title (max 110 chars for rich result)
- `image` — featured image URL (min 696px wide)
- `datePublished` — ISO 8601 date
- `author` — `{ "@type": "Person", "name": "Author Name" }`

**Recommended:** `dateModified`, `publisher`, `description`

**WordPress mapping:**
```json
{
  "headline": "post.title.rendered",
  "image": "featured_media URL",
  "datePublished": "post.date",
  "dateModified": "post.modified",
  "author": { "@type": "Person", "name": "post.author.name" }
}
```

### Product
**Use for:** WooCommerce products, product pages
**Rich result:** Product snippet with price, availability, rating
**Required properties:**
- `name` — product name
- `image` — product image URL
- `offers` — `{ "@type": "Offer", "price": "19.99", "priceCurrency": "EUR", "availability": "https://schema.org/InStock" }`

**Recommended:** `description`, `sku`, `brand`, `aggregateRating`, `review`

### FAQ
**Use for:** FAQ pages, Q&A sections within posts
**Rich result:** FAQ accordion in search results
**Required properties:**
- `mainEntity` — array of Question objects

**Structure:**
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is cactus water?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cactus water is a beverage made from Sicilian prickly pear..."
      }
    }
  ]
}
```

### HowTo
**Use for:** Tutorial posts, step-by-step guides
**Rich result:** How-to rich result with steps
**Required properties:**
- `name` — how-to title
- `step` — array of HowToStep objects

**Structure:**
```json
{
  "@type": "HowTo",
  "name": "How to Make Cactus Water Smoothie",
  "step": [
    { "@type": "HowToStep", "text": "Blend 200ml cactus water with ice" },
    { "@type": "HowToStep", "text": "Add fresh fruit of your choice" }
  ]
}
```

**Recommended:** `totalTime` (ISO 8601 duration), `estimatedCost`, `image`

### LocalBusiness
**Use for:** Business location pages, contact pages
**Rich result:** Knowledge panel with business info
**Required properties:**
- `name` — business name
- `address` — PostalAddress object
- `telephone` — phone number

**Recommended:** `openingHoursSpecification`, `geo`, `image`, `priceRange`

### Event
**Use for:** Event listings, webinar pages, course dates
**Rich result:** Event rich result with date, location, tickets
**Required properties:**
- `name` — event name
- `startDate` — ISO 8601 date
- `location` — Place or VirtualLocation object

**Recommended:** `endDate`, `image`, `description`, `offers`, `performer`

### Organization
**Use for:** About pages, company profiles
**Rich result:** Knowledge panel
**Required properties:**
- `name` — organization name
- `url` — website URL

**Recommended:** `logo`, `contactPoint`, `sameAs` (social profile URLs)

### BreadcrumbList
**Use for:** Navigation breadcrumbs on any page
**Rich result:** Breadcrumb trail in search results
**Required properties:**
- `itemListElement` — array of ListItem objects with position, name, item URL

## Content Type → Schema Type Mapping

| WordPress Content | Recommended Schema | Notes |
|-------------------|-------------------|-------|
| Blog post | Article | Auto-map title, date, author |
| Product (WooCommerce) | Product | Map price, stock, reviews |
| FAQ page | FAQPage | Extract Q&A pairs from content |
| Tutorial post | HowTo | Extract steps from H2/H3 or ordered lists |
| About page | Organization | Company info, social links |
| Contact page | LocalBusiness | Address, phone, hours |
| Event post | Event | Date, location, ticket info |
| Any page with breadcrumbs | BreadcrumbList | Navigation hierarchy |

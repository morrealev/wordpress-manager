# Location-Based SEO

Use this file when creating city/location pages at scale — service-area combinations, LocalBusiness schema, geo-targeting, and NAP consistency.

## City/Location Page Patterns

Location pages combine a service or product with a geographic area:

| Pattern | Template | Scale |
|---------|----------|-------|
| Service + City | "Plumbing in {city}" | services × cities |
| Store + City | "{brand} Store in {city}" | stores × locations |
| Restaurant + Area | "Best {cuisine} in {neighborhood}" | cuisines × neighborhoods |
| Real estate + City | "Homes for Sale in {city}" | property types × cities |

**Content formula for each page:**
1. H1: `{Service} in {City}`
2. Intro paragraph (50–80 words) with local context
3. Service details section (150–200 words)
4. Local information (population, area facts, nearby landmarks)
5. FAQ section (3–5 questions) with local keywords
6. CTA with phone number and address

## LocalBusiness Schema Markup

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{business_name} — {city}",
  "description": "{service_description} in {city}",
  "url": "https://example.com/{service}/{city}",
  "telephone": "{phone}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{street}",
    "addressLocality": "{city}",
    "addressRegion": "{state}",
    "postalCode": "{zip}",
    "addressCountry": "{country_code}"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{lat}",
    "longitude": "{lng}"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ],
  "areaServed": {
    "@type": "City",
    "name": "{city}"
  }
}
```

**Schema variations by business type:**
- `@type: "Restaurant"` — add `servesCuisine`, `menu`, `priceRange`
- `@type: "MedicalBusiness"` — add `medicalSpecialty`
- `@type: "Store"` — add `paymentAccepted`, `currenciesAccepted`

## Geo-Targeting Configuration

### Google Search Console
1. Set geographic target per property (if using country-specific domains)
2. Submit location-specific sitemap: `/sitemap-locations.xml`
3. Monitor "Search results" by country/city in Performance report

### WordPress Implementation
- Use ACF or custom fields for lat/lng storage
- Store city, state, zip as separate meta fields (not combined string)
- Create a `location` taxonomy for hierarchical grouping (country → state → city)

## NAP Consistency

**NAP = Name, Address, Phone** — must be identical across all location pages.

| Element | Rule | Example |
|---------|------|---------|
| Name | Exact legal business name | "Smith Plumbing LLC" (not "Smith's Plumbing") |
| Address | USPS-standardized format | "123 Main St, Ste 100" (not "123 Main Street Suite 100") |
| Phone | E.164 format in schema, formatted for display | `+15551234567` schema, `(555) 123-4567` display |

**Verification:** Cross-check NAP against Google Business Profile, Yelp, and BBB listings.

## Local Keyword Research Methodology

1. **Seed keywords:** core service terms (plumbing, dentist, attorney)
2. **Location modifiers:** city names, neighborhoods, zip codes, "near me"
3. **Intent modifiers:** "best", "affordable", "emergency", "24/7"
4. **Combine:** `{intent} {service} in {location}` → "emergency plumber in Miami"
5. **Validate:** Check search volume via keyword tools; prioritize cities with volume > 100/mo
6. **Cluster:** Group by parent topic to avoid cannibalization

## WordPress CPT for Locations

```php
// fields: city, state, zip, lat, lng, population, local_description
register_post_type('service_location', [
    'public'       => true,
    'show_in_rest' => true,
    'supports'     => ['title', 'editor', 'custom-fields', 'thumbnail'],
    'taxonomies'   => ['service_type', 'region'],
    'rewrite'      => ['slug' => 'services'],
]);

// Expose custom fields via REST API
register_rest_field('service_location', 'location_meta', [
    'get_callback' => function ($post) {
        return [
            'city'       => get_post_meta($post['id'], 'city', true),
            'state'      => get_post_meta($post['id'], 'state', true),
            'zip'        => get_post_meta($post['id'], 'zip', true),
            'lat'        => get_post_meta($post['id'], 'lat', true),
            'lng'        => get_post_meta($post['id'], 'lng', true),
            'population' => get_post_meta($post['id'], 'population', true),
        ];
    },
    'schema' => ['type' => 'object'],
]);
```

## Decision Checklist

1. Does the business serve multiple geographic areas? → Yes = location pages justified
2. Is there search volume for `{service} in {city}` queries? → Validate before building
3. Are NAP details consistent across all listings? → Audit before publishing
4. Does each location page have 300+ words of unique content? → Avoid thin pages
5. Is LocalBusiness schema valid per Google's Rich Results Test? → Test before deploy

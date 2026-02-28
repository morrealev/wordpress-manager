# Content Integrity

## Unauthorized Content Change Detection

### Content Snapshot Baseline

Create a baseline of published content to detect unauthorized changes:

```bash
# Export content hashes via WP-CLI
wp post list --post_type=post,page --post_status=publish \
  --fields=ID,post_title,post_modified,post_author --format=json > content-baseline.json

# Count published content
wp post list --post_type=post --post_status=publish --format=count
wp post list --post_type=page --post_status=publish --format=count
```

### WP REST Bridge Monitoring

Use WP REST Bridge tools to track content changes:

1. `list_content` with `per_page: 100, orderby: "modified", order: "desc"` — get recently modified content
2. Compare modification dates with expected edit window
3. Flag content modified outside business hours or by unexpected users

### Change Detection Script

```bash
#!/bin/bash
# content-monitor.sh — Detect content changes since last check

SITE_URL="$1"
BASELINE="content-baseline.json"
CURRENT=$(mktemp)

# Get current content snapshot
wp post list --post_type=post,page --post_status=publish \
  --fields=ID,post_title,post_modified,post_author \
  --format=json --url="$SITE_URL" > "$CURRENT"

# Compare
NEW_POSTS=$(jq -s '.[1] - .[0] | map(.ID)' "$BASELINE" "$CURRENT")
MODIFIED=$(jq -s '
  [.[0][] as $old | .[1][] |
   select(.ID == $old.ID and .post_modified != $old.post_modified) |
   {ID, post_title, old_modified: $old.post_modified, new_modified: .post_modified}]
' "$BASELINE" "$CURRENT")

echo "New posts: $NEW_POSTS"
echo "Modified: $MODIFIED"

# Update baseline
cp "$CURRENT" "$BASELINE"
rm "$CURRENT"
```

## Broken Link Checking

### Using WP-CLI

```bash
# Check for broken internal links (requires broken-link-checker plugin or custom script)
wp eval '
  $posts = get_posts(["numberposts" => -1, "post_status" => "publish"]);
  foreach ($posts as $post) {
    preg_match_all("/href=[\"'\''](https?:\/\/[^\"'\'']+)/", $post->post_content, $matches);
    foreach ($matches[1] as $url) {
      $response = wp_remote_head($url, ["timeout" => 10]);
      $code = wp_remote_retrieve_response_code($response);
      if ($code >= 400 || is_wp_error($response)) {
        echo "BROKEN: Post {$post->ID} -> $url (HTTP $code)\n";
      }
    }
  }
'
```

### External Link Check with curl

```bash
#!/bin/bash
# check-links.sh — Check external links in recent posts

SITE_URL="https://example.com"
LOG_FILE="broken-links.log"

# Get URLs from recent posts via REST API
URLS=$(curl -s "$SITE_URL/wp-json/wp/v2/posts?per_page=50&_fields=id,link,content" | \
  jq -r '.[].content.rendered' | \
  grep -oP 'href="(https?://[^"]+)"' | \
  sed 's/href="//;s/"//' | sort -u)

echo "Checking $(echo "$URLS" | wc -l) links..."

for URL in $URLS; do
  HTTP_CODE=$(curl -sL -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$URL")
  if [ "$HTTP_CODE" -ge 400 ] || [ "$HTTP_CODE" -eq 0 ]; then
    echo "BROKEN ($HTTP_CODE): $URL" >> "$LOG_FILE"
  fi
done
```

## Comment Spam Monitoring

### Via WP REST Bridge

1. `list_comments` with `status: "hold"` — check moderation queue size
2. `list_comments` with `status: "spam"` — track spam volume
3. Alert if spam rate exceeds threshold

### Spam Metrics

```bash
# Count pending comments
wp comment list --status=hold --format=count

# Count spam comments
wp comment list --status=spam --format=count

# Count comments in last 24h
wp comment list --after="$(date -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)" --format=count
```

Alert thresholds:
- **Warning**: > 50 spam comments in 24h
- **Critical**: > 200 spam comments in 24h (possible attack)
- **Warning**: > 20 pending comments (moderation backlog)

## Media File Integrity

### Check for Unexpected Files

```bash
# PHP files in uploads directory (should not exist)
find /path/to/wordpress/wp-content/uploads -name "*.php" -type f

# Executable files in uploads
find /path/to/wordpress/wp-content/uploads -type f -executable

# Recently modified files in uploads (last 24h)
find /path/to/wordpress/wp-content/uploads -type f -mtime -1 -not -name "*.jpg" \
  -not -name "*.png" -not -name "*.gif" -not -name "*.webp" -not -name "*.pdf"
```

### Media Count Baseline

```bash
# Total media items
wp media list --format=count

# By mime type
wp media list --fields=post_mime_type --format=csv | sort | uniq -c | sort -rn
```

## SEO Health Indicators

### Sitemap Check

```bash
# Verify sitemap exists and is valid
curl -sL -o /dev/null -w "%{http_code}" https://example.com/sitemap.xml
curl -sL -o /dev/null -w "%{http_code}" https://example.com/sitemap_index.xml

# Count URLs in sitemap
curl -s https://example.com/sitemap.xml | grep -c "<loc>"
```

### Robots.txt Check

```bash
# Verify robots.txt
curl -s https://example.com/robots.txt

# Check for common issues
curl -s https://example.com/robots.txt | grep -i "disallow: /"
```

## Monitoring Schedule

| Check | Frequency | Alert Condition |
|-------|-----------|----------------|
| Content snapshot | Daily | New/modified content outside expected window |
| Broken links | Weekly | Any HTTP 404/500 on internal links |
| Comment spam | Every 6h | > 50 spam in 24h |
| Media integrity | Daily | PHP files in uploads |
| Sitemap validity | Weekly | HTTP != 200 or empty sitemap |
| Robots.txt | Weekly | Unexpected disallow rules |

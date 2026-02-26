# Cross-Platform Migration Strategies

## WordPress.com → Self-Hosted WordPress

### Method 1: WXR Export (Content Only)
1. WordPress.com Admin → Tools → Export → All content
2. Download the .xml file (WXR format)
3. On destination: Tools → Import → WordPress Importer
4. Upload the WXR file
5. Map authors and import attachments

**Limitations**: Doesn't transfer themes, plugins, or custom settings

### Method 2: WordPress.com MCP (if available)
1. Use WordPress.com MCP to read content
2. Use WP REST Bridge to write content to destination
3. Advantage: More control over content transformation

### Method 3: Guided Transfer (WordPress.com feature)
WordPress.com Business/eCommerce plans offer guided transfer:
1. Request transfer in WordPress.com settings
2. WordPress.com packages site files and database
3. Download package and import to new hosting

## Self-Hosted → Self-Hosted

### Method 1: Full Server Migration (Recommended)
```bash
# On source
mysqldump -u root -p wordpress_db > backup.sql
tar -czf wp-files.tar.gz -C /var/www/html .

# Transfer
scp backup.sql wp-files.tar.gz user@destination:/tmp/

# On destination
mysql -u root -p new_db < /tmp/backup.sql
tar -xzf /tmp/wp-files.tar.gz -C /var/www/html/
wp search-replace 'old-url.com' 'new-url.com' --all-tables
```

### Method 2: Plugin-Based Migration
Plugins like All-in-One WP Migration, Duplicator, or UpdraftPlus:
1. Install migration plugin on source
2. Create migration package
3. Install same plugin on destination
4. Import package
5. Update URLs

### Method 3: API-Based Content Transfer
For content-only migration between two accessible sites:
1. Enumerate content on source via `list_content`
2. For each content piece: `get_content` → transform → `create_content` on destination
3. Handle media separately: download from source, upload to destination
4. Update internal links

## Content-Only Migrations

### WXR (WordPress eXtended RSS)
- Standard WordPress export format
- Includes: posts, pages, comments, categories, tags, custom fields
- Does NOT include: themes, plugins, settings, users (partial)
- Good for: Moving content between WordPress installations

### REST API Transfer
- Programmatic content transfer via WP REST Bridge
- Includes: any content accessible via API
- Advantage: Can transform content during transfer
- Advantage: Can selectively migrate (filter by date, category, etc.)

### Database-Level Transfer
- Direct database export/import
- Includes: everything in the database
- Requires: URL search-replace after transfer
- Risk: Higher, as database structure must match

## URL Search and Replace

After any migration, URLs in the database need updating:

### Serialized Data Safe Methods
```bash
# wp-cli (recommended)
wp search-replace 'https://old.com' 'https://new.com' --all-tables --precise

# Better Search Replace plugin (GUI-based)
# Settings → Better Search Replace → search/replace in all tables
```

### Never Use Raw SQL for URL Replace
```sql
-- DON'T DO THIS — breaks serialized data
UPDATE wp_posts SET post_content = REPLACE(post_content, 'old.com', 'new.com');
```
Serialized PHP data (in wp_options, wp_postmeta) contains string length prefixes. Raw SQL REPLACE corrupts these.

## DNS Migration Checklist

1. **48h before**: Lower TTL to 300 (5 minutes)
2. **Migration day**: Perform migration, verify on new host
3. **DNS switch**: Update A record to new host IP
4. **Monitor**: Check propagation via DNS checker tools
5. **48h after**: Raise TTL back to 3600 (1 hour)
6. **1 week after**: Decommission old hosting (if confirmed working)

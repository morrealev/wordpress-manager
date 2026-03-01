# GSC Setup

## Overview

Google Search Console integration requires a Google Cloud service account with Search Console API access. The service account's JSON key file is configured in `WP_SITES_CONFIG`, enabling all 8 GSC MCP tools to authenticate and query search data for your WordPress site.

## Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Search Console API** (also called "Search Console API" or "Webmasters API") under APIs & Services → Library

### Step 2: Create a Service Account

1. Navigate to IAM & Admin → Service Accounts
2. Click **Create Service Account**
3. Name it (e.g., `wp-search-console`) and add a description
4. No additional roles are needed at the project level
5. Click **Done**

### Step 3: Generate JSON Key File

1. Click on the newly created service account
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key** → **JSON**
4. Download the JSON key file and store it securely

The JSON key file contains:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "wp-search-console@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### Step 4: Grant Search Console Access

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (site)
3. Navigate to **Settings** → **Users and permissions**
4. Click **Add user**
5. Enter the service account email (e.g., `wp-search-console@your-project.iam.gserviceaccount.com`)
6. Set permission to **Full** (for read access and sitemap management) or **Restricted** (read-only)

### Step 5: Configure WP_SITES_CONFIG

Add GSC credentials to your site configuration:

```json
{
  "sites": [{
    "name": "my-site",
    "url": "https://example.com",
    "gsc": {
      "gsc_service_account_key": "/path/to/service-account-key.json",
      "gsc_site_url": "https://example.com/"
    }
  }]
}
```

**Important notes on `gsc_site_url`:**
- Use the exact property URL as it appears in Search Console
- For domain properties, use `sc-domain:example.com`
- For URL-prefix properties, use the full URL with trailing slash: `https://example.com/`
- The value must match exactly — a mismatch will result in 403 errors

## Verification

After configuration, verify the setup works:

```
Tool: gsc_list_sites
Returns: Array of verified sites with siteUrl, permissionLevel
```

You should see your site listed with `permissionLevel` of `siteOwner` or `siteFullUser`.

## Permissions and Scopes

The service account requires the following OAuth scope:

- `https://www.googleapis.com/auth/webmasters.readonly` — for read-only access (search analytics, URL inspection, sitemap listing)
- `https://www.googleapis.com/auth/webmasters` — for full access (includes sitemap submission and deletion)

The MCP tools automatically request the appropriate scope based on the operation.

## Troubleshooting

- **403 Forbidden**: The service account email has not been added to Search Console, or `gsc_site_url` does not match the property URL
- **404 Not Found**: The site URL format is incorrect (missing trailing slash or wrong protocol)
- **Authentication errors**: The JSON key file path is invalid or the file is malformed
- **No data returned**: The site may be newly verified; Search Console data takes 24-48 hours to populate

## Best Practices

- **Key file security**: Store the JSON key file outside the project directory; never commit it to version control
- **Least privilege**: Use **Restricted** permission if you only need read access (search analytics, URL inspection)
- **Separate accounts**: Use a dedicated service account per project to isolate access
- **Key rotation**: Rotate service account keys periodically (every 90 days recommended)
- **Domain property**: Prefer domain-level properties (`sc-domain:example.com`) over URL-prefix properties for complete data coverage

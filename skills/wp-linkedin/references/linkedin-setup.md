# LinkedIn Setup Guide

## Prerequisites

- LinkedIn Developer account (https://www.linkedin.com/developers/)
- WordPress site with WP REST Bridge configured
- LinkedIn personal or company page

## 1. Create LinkedIn Developer App

1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in: App name, LinkedIn Page, Privacy policy URL, App logo
4. Under "Products", request access to **Community Management API**
5. Wait for approval (usually instant for personal posting)

## 2. Generate OAuth 2.0 Token

### Required Scopes
- `w_member_social` — Write access to post content
- `r_liteprofile` — Read basic profile info
- `openid` — OpenID Connect (for userinfo endpoint)

### Token Generation
1. In your LinkedIn app → Auth tab → OAuth 2.0 settings
2. Add redirect URL: `https://localhost:8080/callback`
3. Use the OAuth 2.0 authorization flow:
   ```
   https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=w_member_social%20r_liteprofile%20openid
   ```
4. Exchange the authorization code for an access token
5. Token expires in 60 days — set a reminder to refresh

## 3. Configure WP_SITES_CONFIG

Add to your site configuration:

```json
{
  "id": "mysite",
  "url": "https://mysite.com/wp-json/",
  "username": "admin",
  "password": "app-password",
  "linkedin_access_token": "AQV...",
  "linkedin_person_urn": "urn:li:person:ABC123"
}
```

### Finding Your Person URN
Use `li_get_profile` tool after configuring the access token. The `sub` field in the response contains your person URN.

## 4. Verify Configuration

Run the detection script:
```bash
node skills/wp-linkedin/scripts/linkedin_inspect.mjs
```

Expected output: `linkedin_configured: true` with indicators listing configured credentials.

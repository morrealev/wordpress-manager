# Schedule-Based Triggers

## WP-Cron Built-in Intervals

| Interval | Hook Name | Frequency |
|----------|-----------|-----------|
| `hourly` | `wp_scheduled_event` | Every hour |
| `twicedaily` | `wp_scheduled_event` | Every 12 hours |
| `daily` | `wp_scheduled_event` | Every 24 hours |
| `weekly` | `wp_scheduled_event` | Every 7 days |

## Custom Cron Intervals

Register custom intervals via `cron_schedules` filter:

```php
add_filter('cron_schedules', function ($schedules) {
    $schedules['every_15_minutes'] = [
        'interval' => 900,
        'display'  => 'Every 15 Minutes',
    ];
    $schedules['every_monday_9am'] = [
        'interval' => 604800, // weekly
        'display'  => 'Weekly (Monday 9am)',
    ];
    return $schedules;
});
```

Schedule a recurring event:

```php
if (!wp_next_scheduled('wpm_weekly_report')) {
    wp_schedule_event(
        strtotime('next Monday 09:00'),
        'weekly',
        'wpm_weekly_report'
    );
}
add_action('wpm_weekly_report', 'generate_weekly_performance_report');
```

## Scheduled Content Publishing

WordPress natively supports future-dated posts via `publish_future_post` hook:

- Set post status to `future` with a future `post_date`
- WP-Cron fires `publish_future_post` at the scheduled time
- Trigger workflow actions on publish (e.g., notify Slack)

Trigger config example:

```json
{
  "type": "schedule",
  "event": "publish_future_post",
  "actions": [
    { "channel": "slack", "message": "New post published: {{post_title}}" }
  ]
}
```

## Recurring Health Check Triggers

Common scheduled workflow patterns:

| Trigger | Interval | Purpose |
|---------|----------|---------|
| Performance report | Weekly | CWV scores, uptime stats |
| Plugin update check | Daily | Security and compatibility |
| Content freshness | Weekly | Stale draft detection |
| Backup verification | Daily | Confirm last backup age |
| SSL expiry check | Daily | Certificate renewal reminder |

## External Cron Setup (Server Cron)

When `DISABLE_WP_CRON` is `true`, use server-side cron:

```bash
# crontab entry — fire WP-Cron every 5 minutes
*/5 * * * * wget -qO- https://example.com/wp-cron.php > /dev/null 2>&1

# Alternative with curl
*/5 * * * * curl -s https://example.com/wp-cron.php > /dev/null 2>&1

# WP-CLI approach (recommended for reliability)
*/5 * * * * cd /var/www/html && wp cron event run --due-now > /dev/null 2>&1
```

**When to use external cron:**
- High-traffic sites (WP-Cron adds latency to page loads)
- Sites behind caching layers that block `wp-cron.php`
- When precise timing is required (WP-Cron is visitor-triggered)

## Example: Weekly Performance Report Every Monday 9am

```json
{
  "name": "Weekly Performance Report",
  "type": "schedule",
  "schedule": "weekly",
  "first_run": "2026-03-02T09:00:00Z",
  "actions": [
    {
      "channel": "slack",
      "template": "weekly_report",
      "variables": { "site": "{{site_url}}", "period": "last_7_days" }
    },
    {
      "channel": "email",
      "to": "team@example.com",
      "subject": "Weekly WP Report — {{site_url}}",
      "template": "weekly_report_email"
    }
  ],
  "status": "active"
}
```

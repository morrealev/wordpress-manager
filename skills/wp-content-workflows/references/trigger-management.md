# Trigger Management

## Listing and Filtering Triggers

Use `wf_list_triggers` to retrieve all registered triggers:

```json
// List all triggers
{ "tool": "wf_list_triggers" }

// Filter by status
{ "tool": "wf_list_triggers", "status": "active" }
{ "tool": "wf_list_triggers", "status": "inactive" }

// Filter by type
{ "tool": "wf_list_triggers", "type": "schedule" }
{ "tool": "wf_list_triggers", "type": "content_lifecycle" }
{ "tool": "wf_list_triggers", "type": "action_hook" }
```

### Trigger List Response Format

| Field | Description |
|-------|-------------|
| `id` | Unique trigger identifier |
| `name` | Human-readable trigger name |
| `type` | `schedule`, `content_lifecycle`, or `action_hook` |
| `event` | The WordPress event or cron schedule |
| `status` | `active` or `inactive` |
| `actions` | Array of action channel configurations |
| `last_fired` | Timestamp of last execution (null if never) |
| `fire_count` | Total number of times fired |
| `created_at` | Creation timestamp |

## Activate/Deactivate Without Deleting

Toggle triggers on or off without losing configuration:

```json
// Deactivate a trigger
{ "tool": "wf_update_trigger", "id": "trg_001", "status": "inactive" }

// Reactivate a trigger
{ "tool": "wf_update_trigger", "id": "trg_001", "status": "active" }
```

**Use cases for deactivation:**
- Temporarily silence during maintenance windows
- Pause triggers during site migration
- Debug by isolating triggers one at a time
- Seasonal triggers (e.g., holiday sale workflows)

## Testing Triggers (Dry-Run Mode)

Test a trigger without executing real actions:

```json
{
  "tool": "wf_update_trigger",
  "id": "trg_001",
  "dry_run": true
}
```

Dry-run behavior:
- Evaluates conditions against current site state
- Resolves all template variables with real data
- Logs the fully rendered action payloads
- Does NOT send Slack messages, emails, or webhooks
- Returns the rendered output for review

### Manual Test Fire

Force a trigger to execute once (real actions):

```json
{
  "tool": "wf_update_trigger",
  "id": "trg_001",
  "test_fire": true
}
```

**Warning:** `test_fire` sends real messages. Use `dry_run` first to verify payload format.

## Trigger Audit Log

Every trigger execution is logged:

| Field | Description |
|-------|-------------|
| `trigger_id` | ID of the trigger that fired |
| `timestamp` | When the trigger fired |
| `event` | WordPress event that caused the fire |
| `actions_executed` | List of actions taken (channel + status) |
| `dry_run` | Whether this was a dry-run execution |
| `error` | Error message if any action failed |
| `duration_ms` | Total execution time in milliseconds |

Query audit logs via the WordPress admin or REST API for debugging and compliance.

## Bulk Operations

### Enable/Disable All Triggers

```json
// Disable all triggers (maintenance mode)
{ "tool": "wf_update_trigger", "bulk": true, "status": "inactive" }

// Re-enable all triggers
{ "tool": "wf_update_trigger", "bulk": true, "status": "active" }
```

### Export/Import Triggers

Export all trigger configurations as JSON for backup or migration:

```json
// Export triggers
{ "tool": "wf_list_triggers", "format": "export" }
```

The export includes full trigger config without runtime data (fire_count, last_fired). Import by creating triggers from the exported JSON array.

### Bulk Delete

Remove all inactive or stale triggers:

```json
// Delete a specific trigger (requires confirmation)
{ "tool": "wf_delete_trigger", "id": "trg_001" }
```

The `wf_delete_trigger` tool has a safety hook that requires explicit confirmation before deletion.

## Cleanup: Removing Stale Triggers

A trigger is considered stale if:
- Status is `inactive` for more than 30 days
- `last_fired` is null and `created_at` is older than 30 days
- Referenced hook or event no longer exists (e.g., plugin deactivated)

### Cleanup Workflow

1. List inactive triggers: `wf_list_triggers` with `status: "inactive"`
2. Review each trigger's `last_fired` and `created_at`
3. Identify stale triggers based on criteria above
4. Delete stale triggers with `wf_delete_trigger`
5. Verify remaining triggers are all active and functional

### Recommended Maintenance Schedule

| Task | Frequency | Tool |
|------|-----------|------|
| Review trigger list | Weekly | `wf_list_triggers` |
| Test critical triggers | Monthly | `wf_update_trigger` (dry_run) |
| Clean stale triggers | Monthly | `wf_delete_trigger` |
| Export trigger backup | Before updates | `wf_list_triggers` (export) |
| Audit log review | Weekly | WordPress admin |

#!/bin/bash
# backup-reminder.sh — Backup reminder hook for destructive operations
# Prints a warning to stderr reminding the user to backup before major operations.
# This is an advisory hook (always exits 0) — it doesn't block operations.
# Called as a PreToolUse command hook for import/deploy/delete operations.

set -euo pipefail

TOOL_NAME="${MCP_TOOL_NAME:-unknown}"

cat <<MSG >&2
[wordpress-manager] Reminder: You are about to run '$TOOL_NAME'.
Consider creating a backup first if you haven't recently:
  /wordpress-manager:wp-backup create
MSG

# Advisory only — always allow
exit 0

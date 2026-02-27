#!/bin/bash
# backup-reminder.sh — Backup reminder hook for destructive operations
# Prints a warning to stderr reminding the user to backup before major operations.
# This is an advisory hook (always exits 0) — it doesn't block operations.
# Called as a PreToolUse command hook for hosting_importWordpressWebsite.
#
# Claude Code PreToolUse hooks receive tool input as JSON on stdin.
# We read the tool name from stdin if jq is available, otherwise fall back.

set -euo pipefail

# Read tool name from stdin JSON (Claude Code passes {"tool_name": "...", "tool_input": {...}})
TOOL_NAME="unknown"
if command -v jq &>/dev/null; then
    INPUT=$(cat)
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
else
    # Consume stdin to avoid broken pipe
    cat > /dev/null
fi

cat <<MSG >&2
[wordpress-manager] Reminder: You are about to run '$TOOL_NAME'.
Consider creating a backup first if you haven't recently:
  /wordpress-manager:wp-backup create
MSG

# Advisory only — always allow
exit 0

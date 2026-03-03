#!/usr/bin/env bash
set -euo pipefail

# ─── Start Claude Code Session ───
# Usage: bash start-claude.sh "<prompt>" [max-iterations]
# Starts a Claude Code ralph loop in the project directory

PROMPT="${1:-}"
MAX_ITER="${2:-10}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SESSION_NAME="claude-$(basename "$PROJECT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/claude-$(date +%Y%m%d-%H%M%S).log"

if [ -z "$PROMPT" ]; then
  echo "Usage: bash start-claude.sh \"<prompt>\" [max-iterations]"
  echo ""
  echo "Example:"
  echo "  bash start-claude.sh \"Add a contact form page\" 5"
  exit 1
fi

# Create logs directory
mkdir -p "$LOG_DIR"

echo "=== Starting Claude Code Session ==="
echo "Project:    $PROJECT_DIR"
echo "Session:    $SESSION_NAME"
echo "Prompt:     $PROMPT"
echo "Max Iter:   $MAX_ITER"
echo "Log:        $LOG_FILE"
echo ""

# Check if tmux session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Session '$SESSION_NAME' already exists. Attaching..."
  tmux attach-session -t "$SESSION_NAME"
  exit 0
fi

# Start tmux session with ralph loop
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR" \
  "bash -c '
    ITERATION=0
    while [ \$ITERATION -lt $MAX_ITER ]; do
      ITERATION=\$((ITERATION + 1))
      echo \"[Iteration \$ITERATION/$MAX_ITER] $(date)\" | tee -a \"$LOG_FILE\"

      OUTPUT=\$(claude --dangerously-skip-permissions -p \"$PROMPT\" 2>&1)
      echo \"\$OUTPUT\" | tee -a \"$LOG_FILE\"

      if echo \"\$OUTPUT\" | grep -q \"TASK_COMPLETE\"; then
        echo \"[DONE] Task completed at iteration \$ITERATION\" | tee -a \"$LOG_FILE\"
        break
      fi

      echo \"[RETRY] Output did not contain TASK_COMPLETE, retrying...\" | tee -a \"$LOG_FILE\"
      sleep 2
    done

    if [ \$ITERATION -ge $MAX_ITER ]; then
      echo \"[MAX_ITER] Reached max iterations ($MAX_ITER)\" | tee -a \"$LOG_FILE\"
    fi

    echo \"Press any key to close...\"
    read -n 1
  '"

echo "Session started in tmux: $SESSION_NAME"
echo "Attach: tmux attach -t $SESSION_NAME"
echo "Logs:   tail -f $LOG_FILE"

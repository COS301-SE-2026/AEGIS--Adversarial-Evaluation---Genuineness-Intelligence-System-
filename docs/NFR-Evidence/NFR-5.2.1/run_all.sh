#!/usr/bin/env bash

# Folder this script lives in, and the repo root three levels above it
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
FAILURES=0

# Runs one check: writes a header, captures all output, records the exit code
run_check() {
  local file="$1"
  local label="$2"
  local dir="$3"
  local status
  shift 3
  local out="$SCRIPT_DIR/$file"

  {
    echo "Command: $label"
    echo "Date: $(date +%F)"
    echo
  } > "$out"

  (cd "$REPO_ROOT/$dir" && "$@") >> "$out" 2>&1
  status=$?

  echo "Exit code: $status" >> "$out"
  echo "$file -> exit code $status"

  if [ "$status" -ne 0 ]; then
    FAILURES=$((FAILURES + 1))
  fi
}

run_check backend-lint.txt "flake8 app" backend flake8 app
run_check backend-types.txt "python -m mypy --config-file mypy.ini app" backend python -m mypy --config-file mypy.ini app
run_check backend-coverage-services.txt "python -m pytest tests/ --cov=app/services --cov-report=term-missing --cov-fail-under=80" backend python -m pytest tests/ --cov=app/services --cov-report=term-missing --cov-fail-under=80
run_check frontend-lint.txt "pnpm --dir frontend lint" . pnpm --dir frontend lint
run_check frontend-types.txt "npx tsc --noEmit" frontend npx tsc --noEmit

# pytest rewrites this tracked file on every run, so put it back
git -C "$REPO_ROOT" restore --worktree -- backend/.coverage 2>/dev/null

echo
echo "$FAILURES check(s) failed. See the evidence files for details."
[ "$FAILURES" -eq 0 ]

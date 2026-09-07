#!/usr/bin/env bash
# Commit only explicitly named generated files. Never force push or swallow conflicts.
set -euo pipefail
message=${1:?Provide a commit message}
shift
if [[ $# -eq 0 ]]; then
  echo "::error::No generated paths were provided."
  exit 1
fi
branch=${TARGET_BRANCH:-main}
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add -A -- "$@"
if git diff --cached --quiet; then
  echo 'No generated content changes.'
  exit 0
fi
git commit -m "$message"
for attempt in 1 2 3; do
  git fetch origin "$branch"
  previous_head=$(git rev-parse HEAD)
  if ! git rebase "origin/$branch"; then
    git rebase --abort
    echo '::error::Generated changes conflict with a newer commit; leaving main unchanged.'
    exit 1
  fi
  # A concurrent human edit may change the build after the original validation.
  if [[ $(git rev-parse HEAD) != "$previous_head" ]]; then
    npm ci --no-audit --no-fund
    npm run build:cosmic
    git diff --exit-code -- assets/cosmic/app.min.js
  fi
  bundle exec jekyll build
  python scripts/site_doctor/doctor.py --check --strict --only data asset --no-visual
  if git push origin "HEAD:$branch"; then
    exit 0
  fi
  sleep "$((attempt * 2))"
done
echo '::error::Unable to push generated content after three attempts.'
exit 1

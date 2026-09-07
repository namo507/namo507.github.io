#!/usr/bin/env bash
set -euo pipefail
image=${1:-namo507-portfolio:ci}
name="portfolio-check-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
cleanup() {
  docker logs "$name" || true
  docker rm -f "$name" >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker run --detach --init --name "$name" --publish 127.0.0.1:4000:4000 "$image"
healthy=false
for attempt in $(seq 1 45); do
  state=$(docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' "$name")
  if [[ "$state" == 'running healthy' ]]; then
    healthy=true
    break
  fi
  if [[ "$state" == *unhealthy* || "$state" == exited* ]]; then
    break
  fi
  sleep 2
done
if [[ "$healthy" != true ]]; then
  echo "::error::Docker did not become healthy: $state"
  exit 1
fi
python scripts/ci/check_http.py http://127.0.0.1:4000
if [[ ${DOCKER_VISUAL_AUDIT:-0} == 1 ]]; then
  SITE_BASE_URL=http://127.0.0.1:4000 \
    VISUAL_REPORT_DIR=scripts/site_doctor/reports/docker \
    node scripts/site_doctor/visual_audit.mjs
fi
# Verify that the running image recovers from a real process restart.
docker restart "$name" >/dev/null
for attempt in $(seq 1 45); do
  state=$(docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' "$name")
  if [[ "$state" == 'running healthy' ]]; then
    python scripts/ci/check_http.py http://127.0.0.1:4000
    exit 0
  fi
  sleep 2
done
echo '::error::Docker failed to recover after restart.'
exit 1

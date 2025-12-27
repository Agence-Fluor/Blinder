#!/usr/bin/env bash
set -euo pipefail

# deploy.sh
# Usage:
#   ./deploy.sh user@host /remote/path ["remote command"]
#
# Example:
#   ./deploy.sh user@server /var/www/myapp "systemctl restart myapp"
#   ./deploy.sh user@server /var/www/myapp

if [ $# -lt 2 ]; then
  echo "Usage: $0 user@host /remote/path [\"remote command\"]" >&2
  exit 1
fi

# Get args
REMOTE="$1"
REMOTE_PATH="$2"
shift 2

#npm run build

ssh $REMOTE """
  cp /home/ubuntu/af-k8s/storage/bl/nginx/config/maintenance.conf.off /home/ubuntu/af-k8s/storage/bl/nginx/config/default.conf
  kubectl rollout restart deployment/nginx -n bl
  rm -rf /home/ubuntu/af-k8s/storage/bl/nginx/app
"""

# Ensure remote dir exists
ssh "$REMOTE" "mkdir -p -- '$REMOTE_PATH'"

cd dist

# Run rsync: include everything except excluded
RSYNC_CMD=(rsync -avz --delete ./ "${REMOTE}:${REMOTE_PATH%/}/" --exclude-from="../.distignore" )

echo "Running rsync..."
"${RSYNC_CMD[@]}"


cd ..

echo $REMOTE

ssh $REMOTE """
  cp /home/ubuntu/af-k8s/storage/bl/nginx/config/app.conf.off /home/ubuntu/af-k8s/storage/bl/nginx/config/default.conf
  kubectl rollout restart deployment/nginx -n bl
"""

echo "Deploy finished."

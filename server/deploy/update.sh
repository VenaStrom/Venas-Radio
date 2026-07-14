#!/bin/bash
set -euo pipefail

REPO=/home/vr/Venas-Radio
SERVER="$REPO/server"

source /home/vr/.nvm/nvm.sh

cd "$REPO"
git fetch --all
# Attached branch rather than a detached HEAD at origin/main, so the build can
# resolve the branch name.
git checkout -B main origin/main --force

cd "$SERVER"
corepack enable
yarn install --immutable --immutable-cache
yarn prisma generate
# There is no emit step; the service runs the TypeScript directly via tsx.
# This is purely a typecheck + lint gate before restarting.
yarn build

chmod +x "$SERVER"/deploy/*.sh
chown -R vr:vr "$REPO"

systemctl daemon-reload
systemctl restart vr-start

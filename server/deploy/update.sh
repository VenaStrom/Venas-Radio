#!/bin/bash
set -euo pipefail

# Wrapped in a function so bash parses the whole file before running any of it:
# the checkout below overwrites this very script, and bash otherwise reads
# lazily from a byte offset into whatever the new version happens to be.
main() {
  # Root only orchestrates (the systemctl calls at the end); everything that
  # touches the repo or node runs as vr. That keeps every file vr-owned and
  # nvm a per-user concern root never sources — when root ran the build
  # directly it littered root-owned artifacts (node_modules, corepack symlinks
  # in vr's nvm bin, yarn caches) and a trailing chown -R papered over it.
  runuser -u vr -- bash -c '
    set -euo pipefail
    source ~/.nvm/nvm.sh

    cd /home/vr/Venas-Radio
    git fetch --all
    # Attached branch rather than a detached HEAD at origin/android, so the
    # build can resolve the branch name.
    git checkout -B android origin/android --force

    cd server
    corepack enable
    yarn install --immutable --immutable-cache
    yarn prisma generate
    # There is no emit step; the service runs the TypeScript directly via tsx.
    # This is purely a typecheck + lint gate before restarting.
    yarn build

    chmod +x deploy/*.sh
  '

  systemctl daemon-reload
  systemctl restart vr-start
}

main "$@"

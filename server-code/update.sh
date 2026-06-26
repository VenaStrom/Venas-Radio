#!/bin/bash

cd /home/vr/Venas-Radio
source /home/vr/.nvm/nvm.sh

git fetch --all
# Check out main as an attached branch (not a detached HEAD at origin/main) so
# the build can resolve the branch name. A detached HEAD reports "HEAD", which
# the app treats as a non-main/experimental build (orange icon + header tint)
# and which makes the build rewrite public/icons/audio-lines.svg, dirtying the tree.
git checkout -B main origin/main --force
systemctl daemon-reload

# Build
corepack enable
yarn install --immutable --immutable-cache
yarn prisma generate
yarn build

# Make /server-code executable
chmod +x server-code/*
chown -R vr:vr /home/vr/Venas-Radio

# Restart the service
systemctl restart vr-start
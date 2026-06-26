#!/bin/bash

cd /home/vr/Venas-Radio
source /home/vr/.nvm/nvm.sh

git fetch --all
git checkout origin/main --force
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
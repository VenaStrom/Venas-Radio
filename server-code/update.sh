#!/bin/bash

cd /home/vr/Venas-Radio

git fetch --all
git checkout origin/main --force

# Build
yarn install --frozen-lockfile
yarn prisma generate
yarn build

# Make /server-code executable
chmod +x server-code/*

# Restart the service
sudo systemctl daemon-reload
sudo systemctl restart vr-radio-start
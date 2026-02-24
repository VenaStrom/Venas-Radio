#!/bin/bash

cd /home/vr/Venas-Radio

git fetch --all
git checkout origin/dev --force
sudo systemctl daemon-reload

# Build
yarn install --frozen-lockfile
yarn prisma generate
yarn build

# Make /server-code executable
chmod +x server-code/*

# Restart the service
sudo systemctl restart vr-radio-start
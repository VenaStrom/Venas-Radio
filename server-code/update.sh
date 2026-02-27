#!/bin/bash

cd /root/Venas-Radio

git fetch --all
git checkout origin/main --force
sudo systemctl daemon-reload

# Build
yarn install --frozen-lockfile
yarn prisma generate
yarn build

# Make /server-code executable
chmod +x server-code/*

# Allow vr to read /root/Venas-Radio
sudo chown -R vr:vr /root/Venas-Radio
sudo chown -R vr:vr /root/.nvm

# Restart the service
sudo systemctl restart vr-radio-start
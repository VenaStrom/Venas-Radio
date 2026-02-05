#!/bin/bash

cd /root/Venas-Radio

git fetch --all
git checkout origin/main --force

# Build
yarn install --frozen-lockfile
yarn build

# Make /server-code executable
chmod +x server-code/

# Reboot
systemctl restart vr-radio-start
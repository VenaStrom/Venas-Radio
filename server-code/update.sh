#!/bin/bash

cd /root/Venas-Radio

git fetch --all
git checkout origin/main --force
systemctl daemon-reload

# Build
yarn install --frozen-lockfile
yarn prisma generate
yarn build

# Make /server-code executable
chmod +x server-code/*

# Allow vr to read /root/Venas-Radio
chown -R vr:vr /root/Venas-Radio
chown -R vr:vr /root/.nvm
chown vr:vr /bin/bash

# Restart the service
systemctl restart vr-start
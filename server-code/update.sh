#!/bin/bash

cd /home/vr/Venas-Radio

git fetch --all
git checkout origin/main --force

# Build
yarn install
yarn build

# Make /server-code executable
chmod +x server-code/*

# Restart
reboot
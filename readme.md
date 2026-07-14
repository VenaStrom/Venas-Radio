# Vena's Radio

A radio player by and for Vena, built on [Sveriges Radio's open API](https://api.sr.se/api/documentation/v2/index.html).

## Why

I was growing tired of the SR Play app on Android since it had a bunch of bugs that really bugged me, so I decided to make my own version. This is a remake and improvement of [SR-Play-For-Me](https://github.com/VenaStrom/SR-Play-For-Me).

## Layout

```
android/   Native Android client (Kotlin, Compose, Media3)
server/    Backend (Node, Express, Prisma, MariaDB)
```

The two are independent builds that share no code — only the API contract, of
which `server/prisma/schema.prisma` is the source of truth.

### Why native

Background audio was the whole reason. Earlier versions were a web app, where
Chrome supplied the foreground service and media notification. The recurring
failure was audio cutting out on track changes: a backgrounded browser that
swaps `audio.src` and calls `play()` gets treated as a fresh playback attempt
with no user gesture, so autoplay policy blocks it and audio focus drops. Media3
holds focus across playlist transitions because playback lives in a foreground
service rather than a browser tab.

The web client was removed in favour of the Android app. Its history is on the
`main` branch.

## android/

Open the `android/` directory in Android Studio (not the repo root).

Currently a scaffold: P1/P2/P3 live streams as a Media3 playlist, to verify
background playback and track switching before the real port begins.

## server/

```sh
cd server
yarn install
yarn prisma generate
yarn dev        # tsx --watch on src/api/server.ts
yarn start      # same, without the watcher
yarn lint       # tsc --noEmit + eslint
yarn api:types  # regenerate SR API types from api.sr.se
```

Needs `DATABASE_URL` in `server/.env`.

There is no build/emit step. `tsx` runs the TypeScript directly and resolves the
`@/*` aliases, so `yarn build` is only a typecheck + lint gate.

### Dev ops and hosting

- Proxmox, Debian 13 VM
- `server/deploy/update.sh` builds and restarts the `vr-start` systemd unit

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

### Build

```sh
cd android
./gradlew :app:assembleDebug   # build the APK
./gradlew installDebug         # build + install to the connected device
./gradlew clean                # nuke build output
./gradlew javaToolchains       # list JDKs Gradle can see (see JDK note below)
```

The debug build has `applicationIdSuffix = ".debug"`, so the installed package is
`se.venastrom.vradio.debug` — that's the id to pass to `adb`.

Launch and watch playback:

```sh
adb shell am start -n se.venastrom.vradio.debug/se.venastrom.vradio.MainActivity
adb logcat -s ExoPlayerImpl:V MediaSessionService:V AudioFocus:V
```

### JDK note

There is no JDK on the dev machine — the `java-21`/`java-25` Ubuntu packages and
VS Code's bundled Java are all **JRE-only** (no `javac`, no `jlink`). AGP's
JdkImageTransform needs `jlink`, so `app/build.gradle.kts` pins a Java toolchain
and lets Gradle auto-provision a real Temurin JDK into `~/.gradle/jdks/`. Without
that pin, Gradle's auto-detection silently selects a JRE and the build fails with
either `jlink does not exist` or `does not provide [JAVA_COMPILER]`.

Do not add `gradle/gradle-daemon-jvm.properties`. Gradle generates it on
`./gradlew wrapper`, and it pins the daemon to whatever JDK version it found —
which on this machine resolves to VS Code's JRE stub and breaks the build.

### AGP 9 note

AGP 9 has built-in Kotlin support. Applying `org.jetbrains.kotlin.android` is a
hard error, and `kotlin.compilerOptions.jvmTarget` defaults to
`android.compileOptions.targetCompatibility`, so there is no `kotlin {}` block.
The Compose compiler plugin is still applied separately.

`compileSdk`/`targetSdk` are 37; current AndroidX refuses to compile against 36.

### Dev loop

Android Studio's Run button (`Shift+F10`) is the fast path: it builds, installs
and launches in one step. Enable **Live Edit** (Settings → Editor → Live Edit) to
push `@Composable` edits to the running app without a rebuild.

Live Edit only covers composables. Changes to `PlaybackService` — i.e. most of the
early work — need a full reinstall, so the loop there is Run, or from a terminal:

```sh
./gradlew installDebug && adb shell am start -n se.venastrom.vradio.debug/se.venastrom.vradio.MainActivity
```

### Device setup (Samsung)

On the phone:

1. Settings → About phone → Software information → tap **Build number** 7×.
2. Settings → Developer options → **USB debugging** → on.
3. Replug the cable, then accept the *Allow USB debugging?* prompt and tick
   **Always allow from this computer**.

`adb devices` should then list the phone. If it says `no permissions`, Linux needs
a udev rule for Samsung (vendor `04e8`); `unauthorized` means the on-device prompt
was not accepted.

Plugging in without step 2 leaves the phone in MTP mode, where `lsusb` sees it but
`adb` does not.

**Samsung battery optimization will silently kill background playback.** One UI is
aggressive about suspending background apps, which looks exactly like the bug this
app exists to fix. Before trusting any background-audio test:

- Settings → Battery → **Background usage limits** → ensure the app is not under
  *Sleeping apps* / *Deep sleeping apps*.
- Add it to **Never sleeping apps**.

### Verifying background playback

The scaffold exists to test one thing — the failure mode that killed the web
version. Track switching, not plain playback:

1. Press play, confirm audio.
2. Background the app (home button), lock the screen.
3. Hit **next** on the lock screen notification.

Audio should switch channels without dropping. Media3 populates next/previous in
the notification automatically because the playlist has more than one item.

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

# Setup notes

This repo is an **Android app only** (Gradle + Kotlin WebView wrapper). There is no web
application source here, so the Base44 preview cannot show the Android UI.

## What runs in the sandbox

`docker-compose.base44.yml` serves `site/` (static download landing page) on host port 3000
with `python3 -m http.server` from the `python:3.12-slim` image. Static files are read from
the bind mount on every request, so edits appear on refresh.

## Rebuilding the downloadable APK

`site/app-release.apk` is a committed build artifact. After changing Android code, rebuild
and copy it, otherwise the download button keeps serving the old build:

```bash
gradle assembleRelease
cp app/build/outputs/apk/release/app-release.apk site/app-release.apk
```

The sandbox host has no JDK/Android SDK. A build can be run in a container (works with the
already-installed SDK at `/tmp/androidsdk`):

```bash
docker run --rm --user root -v "$PWD":/src -v /tmp/androidsdk:/sdk \
  -v /tmp/gradle-home:/gh -w /src -e ANDROID_HOME=/sdk -e GRADLE_USER_HOME=/gh \
  gradle:8.9-jdk17 bash -c 'echo sdk.dir=/sdk > local.properties && gradle assembleRelease --no-daemon'
```

## Verifying Android changes

The Android app can't be launched here, so verify the packaged result after a build:

```bash
/tmp/androidsdk/build-tools/35.0.0/aapt dump badging site/app-release.apk
```

- `application: ... icon='res/....xml'` confirms the adaptive launcher icon is packaged.
- `uses-implied-feature: android.hardware.screen.portrait` confirms the portrait lock.

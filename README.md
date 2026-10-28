# SDL - Shubh Dhan Lakshmi

Android WebView wrapper around https://shubhdhanlakshmi-beta-version.base44.app, plus the
admin dashboard that configures it.

- Locked to portrait, immersive fullscreen
- Configurable launch screen, logo shape/fit/size, first page and offline screen (see below)
- Back button navigates web history
- File / camera upload support for KYC documents
- UPI, tel: and mailto: links open in the matching app

## Admin dashboard

`server/` is a small Express + Postgres service that serves the dashboard at `/` and the
settings API the phone reads at launch.

- Sign in with `ADMIN_PASSWORD` (development default `admin123` — change it).
- Settings live in Postgres (`app_config`), so they survive restarts and redeploys.
- Public read-only endpoint the app calls: `GET /api/config`.
- Notifications: `POST /api/admin/notifications` sends a message to every phone, and the app
  picks it up on its next launch from `GET /api/notifications?after=<lastId>`. Changing the APK
  version in the panel sends an update notification automatically.

Locally: `docker compose -f docker-compose.base44.yml up -d` → http://localhost:3000

## Point the app at the dashboard

1. Deploy `server/` and its database to Render — create a Blueprint from `render.yaml`.
2. Set `SDL_CONFIG_API` in `gradle.properties` to that service's URL (no trailing slash).
3. Rebuild the APK.

The app fetches the settings on launch (2.5s timeout), caches them, and applies them; the
cached copy is used when the backend or the network is unavailable. With `SDL_CONFIG_API`
empty the app never calls the network and uses its built-in defaults.

## What the dashboard controls

| Setting | Effect in the app |
| --- | --- |
| Website address + first page | URL opened on launch |
| Logo image, shape (rounded/round/square), fit (crop/whole), size (% of screen width) | Logo drawn on the launch screen |
| Loading screen on/off, animation, background, progress bar, minimum time | The launch screen |
| Offline screen on/off, title, message, button | Screen shown when the device loses internet |

The phone launcher icon stays the packaged artwork (`mipmap-*`); the dashboard logo is the
in-app launch screen logo. `drawable/ic_launcher_foreground_inset.xml` keeps that artwork inside
the Android adaptive-icon safe zone, so the launcher mask no longer crops it.

Notifications are delivered when the app opens (it asks the backend for anything new); they need
no push service, but the APK only receives them once `SDL_CONFIG_API` points at this backend.

## Download page

`site/` is the landing page with the **Download APK** button, served at `/download`.
Refresh `site/app-release.apk` after any app change:

```bash
gradle assembleRelease
cp app/build/outputs/apk/release/app-release.apk site/app-release.apk
```

## Build an APK

Push to GitHub -> Actions -> "Build APK" -> download the artifact.

Or locally: `gradle assembleRelease` (output: `app/build/outputs/apk/release/`).
Signed with the debug key, so it sideloads directly.

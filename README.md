# SDL - Shubh Dhan Lakshmi

Android WebView wrapper around https://shubhdhanlakshmi-beta-version.base44.app, plus the
admin dashboard that configures it.

- Locked to portrait, immersive fullscreen
- Configurable launch screen, logo shape/fit, first page and offline screen (see below)
- Back button navigates web history
- File / camera upload support for KYC documents
- UPI, tel: and mailto: links open in the matching app

## Admin dashboard

`server/` is a small Express + Postgres service that serves the dashboard at `/` and the
settings API the phone reads at launch.

- Sign in with `ADMIN_PASSWORD` (development default `admin123` — change it).
- Settings live in Postgres (`app_config`), so they survive restarts and redeploys.
- Public read-only endpoint the app calls: `GET /api/config`.

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
| Logo image, shape (rounded/round/square), fit (crop/whole) | Logo drawn on the launch screen |
| Loading screen on/off, animation, background, progress bar, minimum time | The launch screen |
| Offline screen on/off, title, message, button | Screen shown when the device loses internet |

The phone launcher icon stays the packaged artwork (`mipmap-*`); the dashboard logo is the
in-app launch screen logo.

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

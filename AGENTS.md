# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.db.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.db.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## Local Dev Environment (Base44 sandbox)

- Run the app with `docker compose -f docker-compose.base44.yml up -d` and open http://localhost:3000 (Vite dev server, live reload).
- Dependencies are installed inside the container on every start from `package-lock.json`; do not install them on the host.
- Build check: `docker compose -f docker-compose.base44.yml exec -T web npm run build` (compiles all modules and catches broken imports — the exported snapshot has had truncated/missing files restored this way).
- The app talks to the Base44 backend through `src/api/base44Client.js`, which creates the SDK client for app `6a65ccde323b932e9e9dc990` (`VITE_BASE44_APP_ID` overrides it) and installs it as `globalThis.__B44_DB__` before React mounts. Most source files read the client from that global.
- `vite.config.js` proxies `^/api/(apps|app-logs)` to `https://base44.app` only when `BASE44_PREVIEW_MODE=1`, because the Base44 Vite plugin skips its own platform proxy in the preview sandbox. With the flag unset the app keeps the plugin's original behavior.
- Entities and backend functions are live in the preview. Signed out, entity reads return public data (the app is `public_without_login`) and authenticated functions such as `lookupPincode` answer `Authentication required to view users` (HTTP 500 from the platform); signed-in flows need a real login.
- `AppSettings` is a single-record entity read with `db.entities.AppSettings.list()` and updated by id (`s[0].id`).

## App traffic dashboard (admin)

- Admin → **App Traffic** (`src/components/admin/AdminTraffic.jsx`) shows total APK downloads, last-7-days downloads, page views, active sessions, top screens and web-vs-Android split.
- Data comes from two admin-only entities, `AppDownload` and `AppEvent`, written only by the `trackDownload` and `trackEvent` backend functions (service role, no sign-in required).
- `src/components/TrafficTracker.jsx` (mounted in `App.jsx`) posts one `AppEvent` per page per session; `src/lib/appTraffic.js` holds the beacon helpers and the session id.
- Downloads are counted in `src/pages/DownloadApp.jsx` and `src/components/DownloadAppModal.jsx` when the user taps the Android download.
- These are new backend artifacts: in a preview that predates their deployment the function calls answer 404 and the tables do not exist, so the dashboard shows zeros until the app's backend has them. Play Store installs are not counted here — Play Console owns those.

## Android APK

- `./scripts/build-apk.sh` (or `npm run apk`) builds a sideloadable APK: web bundle → `npx cap sync android` → Gradle `assembleDebug` inside the `android` compose service (JDK 21 + Android SDK 36; behind the `apk` profile so `up -d` never starts it) → copy to `public/download/SDL - Shubh Dhan Lakshmi.apk`, downloadable from the preview at `/download/SDL%20-%20Shubh%20Dhan%20Lakshmi.apk` (the download link in `src/pages/DownloadApp.jsx` and `src/components/DownloadAppModal.jsx` uses the same encoded name).
- The script deletes `public/download/` before the web build so an old APK never gets bundled into the new one. A plain `npm run build` (the publish build) copies whatever is there into the deployed site.
- Android project: `android/`, Capacitor 8, applicationId `com.shubhdhanlakshmi.sdl`, minSdk 24, targetSdk 36.
- The app runs immersive full screen: `MainActivity` draws edge to edge and hides the status and navigation bars (swipe from an edge shows them briefly). Because a fullscreen WebView is never resized for the soft keyboard, `MainActivity` also applies the IME insets to the WebView, so the page shrinks instead of being covered — do not remove that listener, and keep the status bar flag out of `styles.xml`'s `AppTheme.NoActionBar`.
- Launcher icons come from `scripts/build-android-icons.sh` (Pillow in a one-off python container), which reads `assets/android-icon.png` and reproduces the supplied appicon.co pack: the foreground layer is the whole artwork at 66% of the 108dp layer (the pack's 676/1024 safe-zone size, so the launcher mask never clips the tagline or the diyas), the background layer is the same artwork stretched over the full layer and blurred so a mask reveal shows the artwork's own colours, flat `ic_launcher.png` is the artwork as supplied, and `ic_launcher_round.png` is the same artwork cropped to a circle. Do not run `npx capacitor-assets generate --android` on the launcher icons — its fixed 16.7% inset crops the tagline and the diyas out of the circular mask. Splash screens still come from `assets/splash.png` via `npx capacitor-assets generate --android --splashBackgroundColor "#FF6B35"`.
- The adaptive icon XMLs (`mipmap-anydpi-v26/ic_launcher*.xml`) reference the two mipmap layers directly, with no inset.
- The WebView has no same-origin backend, so `src/lib/apiBase.js` reads `VITE_BASE44_API_BASE_URL` (empty by default → relative requests, unchanged for web) and the APK build points it at `https://base44.app`. That origin answers `Access-Control-Allow-Origin: *`, so cross-origin calls use the bearer token instead of cookies (`src/lib/authMfa.js`, `src/pages/OAuthConsent.jsx`).
- Hardware back navigation is wired in `src/main.jsx` through `@capacitor/app` and only runs on native.
- The APK is debug-signed: fine for sideloading, but a Play Store release needs a real keystore (`assembleRelease` + signing config).
- `./scripts/build-aab.sh` (or `npm run aab`) builds the Google Play upload bundle: same web bundle + `bundleRelease`, signed with `android/keystore/keystore.properties` (git-ignored) and copied to `public/download/sdl.aab`. targetSdk is 36 because Play requires it; the release build fails if the keystore is missing. Bump `versionCode` in `android/app/build.gradle` for every upload. Keystore setup is documented in `android/KEYSTORE.md`.

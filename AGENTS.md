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
- Downloads are counted in `src/pages/DownloadsPage.jsx` and `src/components/DownloadAppModal.jsx` when the user taps an APK download.
- Since the app update of 2026-11-12 the modal also writes `AppDownload` itself when it has a signed-in `user` (`platform` android/ios), which the entity RLS now allows for `data.user_id === user.id`; visitors without a session still go through `trackDownload`, and the entity's `platform` enum carries `pwa` for the web build.
- These are new backend artifacts: in a preview that predates their deployment the function calls answer 404 and the tables do not exist, so the dashboard shows zeros until the app's backend has them. Play Store installs are not counted here — Play Console owns those.
- Since the 2026-11-13 export the app also records device + IP location on each app open (`AppVisit`, written in `UserAppShell`) and on each download (`AppDownload`), through `src/lib/deviceInfo.js` (user-agent parsing + `https://ipwho.is` for city/region/country, never blocking). Admin → Overview → **Total Downloads** opens `src/components/admin/AdminDownloads.jsx`, the drill-down for traffic, download clicks, installed-app users, devices and locations.
- The app update popup (`AppUpdatePrompt`) only shows for users who run the installed app (`app_installed`, set on download and on install) and only when `app_version` is not already the published version; `sendAppUpdate` counts just those users (`sent_count`).
- `VITE_APP_TRAFFIC_ENABLED` (default on) controls the beacons and the dashboard reads. The sandbox compose sets it to `false`, because the hosted backend does not have the new entities/functions yet and every beacon would otherwise 404 on each page load; unset (the published build), tracking runs as designed.

## Downloads page

- `/downloads` (`src/pages/DownloadsPage.jsx`, public route in `App.jsx`) lists every published file with its absolute URL and a copy button: the customer APK, the admin APK, the Play upload bundle (`sdl.aab`) and the Play Store screenshots ZIP, all under `public/download/`.
- Each card asks the dev server for the file size with a `HEAD` request, so the page reflects whatever the last APK/AAB build actually produced instead of hardcoded sizes. A missing file shows "Coming Soon" and its button is disabled.
- `src/components/DownloadAppModal.jsx` links to it ("Customer APK, admin APK and play store files"), and download clicks are counted through `trackDownload("downloads_page", file)` like the modal.
- Links are built from `import.meta.env.BASE_URL`, so they stay correct on GitHub Pages (`/<repo>/download/...`) as well as on `/`.
- Each card also shows a GitHub URL (`src/lib/githubDownloads.js`): `https://sdlloan1.github.io/sdlapk/download/<file>` served by the Pages build, and `https://raw.githubusercontent.com/sdlloan1/sdlapk/main/public/download/<file>` for the raw bytes. Both point at `main`, so a rebuilt artifact only appears there after it is merged to `main` and the Pages workflow finishes. Pages sends APKs as `application/vnd.android.package-archive`, which is what makes Android download and install them.

## Logo (protected asset)

- `assets/brand-logo.png` is the approved SDL logo and the only source of truth. `public/logo.png` and `assets/android-icon.png` must stay byte-identical to it (all three share sha256 `92d6bb31…`).
- The user approved this artwork explicitly and wants it to survive every future code change, source export and rebuild — never replace, recolor, crop, re-export or regenerate it.
- `scripts/verify-logo.sh` enforces it: it runs as npm `prebuild` before every `npm run build` (so the web bundle, both APKs and the Play bundle are covered), restores any file that drifted from `assets/brand-logo.png`, and reports what it restored. `npm run verify:logo` only checks.
- To change the logo on purpose: replace `assets/brand-logo.png`, copy it over `public/logo.png` and `assets/android-icon.png`, then run `./scripts/build-android-icons.sh`. Do not do this without the user's explicit go-ahead.
- `index.html` (favicon), `public/manifest.json` (PWA icon) and `src/lib/sdlUtils.js` (`SDL_LOGO`) all point at `/logo.png`, so the web build uses the protected file.

## App source sync (exported app updates)

- The app is also edited in the hosted Base44 builder and re-exported as a zip; applying an export means copying its `src/` and `base44/` over this repo **without** dropping the local/APK adaptation layer. Keep these files from this repo when an export overwrites them: `assets/brand-logo.png`, `public/logo.png`, `assets/android-icon.png`, `src/api/base44Client.js`, `src/lib/apiBase.js`, `src/lib/app-params.js` (default app id), `src/lib/AuthContext.jsx` (no-app-id guard, `apiUrl`), `src/lib/authMfa.js` (`apiUrl`, cross-origin credentials), `src/lib/logout.js`, `src/lib/pushNotifications.js`, `src/main.jsx` (client import, Capacitor back button, `NetworkGate`), `vite.config.js` (preview proxy), `src/App.jsx` (`ADMIN_APP` routes, `TrafficTracker`), `src/pages/Admin.jsx` (traffic tab), `src/pages/AdminLogin.jsx`, `src/pages/AdminPage.jsx` (`adminOnly`), `src/components/UserAppShell.jsx`, `src/components/DownloadAppModal.jsx`, `src/pages/OAuthConsent.jsx`, `src/pages/app/ProfilePage.jsx`, plus the repo-only files (`appTraffic.js`, `TrafficTracker.jsx`, `AdminTraffic.jsx`, `NoNetworkScreen.jsx`, `logout.js`, `pushNotifications.js`). Re-apply `logoutToLogin(navigate)` where an export falls back to `db.auth.logout("/login")`.
- Exports arrive with truncated files (e.g. `AdminNotepad.jsx`, `WhatsAppShareModal.jsx` were cut mid-function) and some export-only artifacts (a stray `const db = …` line before `<!doctype html>` in `index.html`). `npm run build` names the truncated file; restore that file from git. Keep this repo's `index.html`, which uses the local favicon and the fullscreen viewport meta.
- Exports point images at `https://media.base44.com/...` (`SDL_LOGO` in `sdlUtils.js`/`qrBranded.js`, `TermsModal`, `AdminSettings`, `Onboarding`, `NeuAuthLayout`). Keep the local `` `${import.meta.env.BASE_URL}logo.png` `` versions — that is the protected logo, and it is the only image source the APK build can bundle.
- The `shubhdhanlakshmi-beta-version2` export was diffed against this repo: identical component bodies, only the export format (`import { base44 }` instead of the `globalThis.__B44_DB__` stub) and the remote logo URLs differ. Do not "apply" it file-by-file without checking for a real feature delta — it would only revert the logo, the fixed brand name and the local adaptation layer.
- `base44/entities/AppDownload.jsonc` is a union: the export's `user_name` plus this repo's `file_name`, `referrer`, `source`, `user_agent` that `trackDownload` writes.

## KYC submission

- KYC goes through the `submitKyc` backend function (`base44/functions/submitKyc/entry.ts`), invoked from `KycOnboarding.jsx` (`db.functions.invoke("submitKyc", { ...profile })`) and from `LoanPage.jsx` re-apply (`{ reapply: true }`). The function writes only borrower-supplied fields and sets `kyc_status`, `registration_complete`, attempt counters and limits itself with the service role, so the client no longer writes those fields (the `User` entity RLS rejects that). Do not go back to `db.entities.User.update` for KYC — that was the "not allowed to modify data.kyc_status" bug.

## Android APK

- `./scripts/build-apk.sh` (or `npm run apk`) builds a sideloadable APK: web bundle → `npx cap sync android` → Gradle `assembleDebug` inside the `android` compose service (JDK 21 + Android SDK 36; behind the `apk` profile so `up -d` never starts it) → copy to `public/download/SDL - Shubh Dhan Lakshmi.apk`, downloadable from the preview at `/download/SDL%20-%20Shubh%20Dhan%20Lakshmi.apk` (`src/components/DownloadAppModal.jsx` and the `/downloads` page use the same encoded name).
- The script deletes `public/download/` before the web build so an old APK never gets bundled into the new one. A plain `npm run build` (the publish build) copies whatever is there into the deployed site.
- Android project: `android/`, Capacitor 8, applicationId `com.shubhdhanlakshmi.sdl`, minSdk 24, targetSdk 36.
- Background notifications: `SdlBackgroundService` (started from `MainActivity.onCreate`) is a `specialUse` foreground service that keeps the app process — and with it the 30 s notification poll in `UserAppShell` — alive after the user leaves the app, so loan, repayment and wallet alerts reach the phone's notification tray. Android requires a visible notification for such a service, so it shows a silent, low-priority "SDL is active" entry (`sdl-background` channel, `ic_stat_sdl` icon); it never makes a sound. The manifest needs `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_SPECIAL_USE` and `android:foregroundServiceType="specialUse"` with its `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` property — Android 14+ rejects the start without them. Polling stops if the user swipes the app out of recents (the WebView is destroyed); alerts then appear on the next launch.
- The app runs immersive full screen: `MainActivity` draws edge to edge and hides the status and navigation bars (swipe from an edge shows them briefly). Because a fullscreen WebView is never resized for the soft keyboard, `MainActivity` also applies the IME insets to the WebView, so the page shrinks instead of being covered — do not remove that listener, and keep the status bar flag out of `styles.xml`'s `AppTheme.NoActionBar`.
- Launcher icons come from `scripts/build-android-icons.sh` (Pillow in a one-off python container), which reads `assets/android-icon.png` and reproduces the icon set shipped in the user's `SDL-Shubh-Dhan-Lakshmi.apk` (commit `3ceab4e`): the foreground layer is the whole artwork at 66% of the 108dp layer (the pack's 676/1024 safe-zone size, so the launcher mask never clips the tagline or the diyas), the background layer is the same artwork stretched over the full layer and blurred so a mask reveal shows the artwork's own colours, flat `ic_launcher.png` is the artwork as supplied, and `ic_launcher_round.png` is the same artwork cropped to a circle. Do not change this icon set without the user's explicit go-ahead — they want the launcher icon to stay exactly as in that APK. Splash screens still come from `assets/splash.png` via `npx capacitor-assets generate --android --splashBackgroundColor "#FF6B35"`.
- The adaptive icon XMLs (`mipmap-anydpi-v26/ic_launcher*.xml`) reference the two mipmap layers directly, with no inset.
- The WebView has no same-origin backend, so `src/lib/apiBase.js` reads `VITE_BASE44_API_BASE_URL` (empty by default → relative requests, unchanged for web) and the APK build points it at `https://base44.app`. That origin answers `Access-Control-Allow-Origin: *`, so cross-origin calls use the bearer token instead of cookies (`src/lib/authMfa.js`, `src/pages/OAuthConsent.jsx`).
- Hardware back navigation is wired in `src/main.jsx` through `@capacitor/app` and only runs on native.
- The APK is debug-signed: fine for sideloading, but a Play Store release needs a real keystore (`assembleRelease` + signing config).
- `./scripts/build-admin-apk.sh` (or `npm run apk:admin`) builds the admin-only APK at `public/download/SDL Admin - Shubh Dhan Lakshmi.apk`: the web bundle is compiled with `VITE_ADMIN_APP=true`, so the app opens `/sdlsubr1250noida/login`, every customer route redirects there, and an account whose role is not `admin` gets an "Admins only" screen with a sign-out button (`AdminPage` `adminOnly`). The build also sets `SDL_ADMIN_APP=true`, which makes Gradle use applicationId `com.shubhdhanlakshmi.sdl.admin` and the launcher label "SDL Admin", so it installs next to the customer app instead of replacing it. Both flags are build-time only; a normal build is unchanged.
- `./scripts/build-aab.sh` (or `npm run aab`) builds the Google Play upload bundle: same web bundle + `bundleRelease`, signed with `android/keystore/keystore.properties` (git-ignored) and copied to `public/download/sdl.aab`. targetSdk is 36 because Play requires it; the release build fails if the keystore is missing. Bump `versionCode` in `android/app/build.gradle` for every upload. Keystore setup is documented in `android/KEYSTORE.md`.

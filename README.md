# SDL - Shubh Dhan Lakshmi (Android)

Android WebView wrapper around https://shubhdhanlakshmi-beta-version.base44.app

- Locked to portrait
- Immersive fullscreen (system bars auto-hide)
- Back button navigates web history
- File / camera upload support for KYC documents
- UPI, tel: and mailto: links open in the matching app

## App icon

The launcher icon is the SDL artwork in `app/src/main/res/mipmap-*` (legacy + adaptive),
with the master 512px image at `drawable-nodpi/logo.png` (also used for the splash screen).

## Download page

`site/` is a static landing page with the **Download APK** button. It is served in the
sandbox on port 3000 by `docker-compose.base44.yml`.

`site/app-release.apk` is the APK that button downloads - refresh it after any app change:

```bash
gradle assembleRelease
cp app/build/outputs/apk/release/app-release.apk site/app-release.apk
```

## Build an APK

Push to GitHub -> Actions -> "Build APK" -> download the artifact.

Or locally: gradle assembleRelease

Output: app/build/outputs/apk/release/app-release.apk
Signed with the debug key, so it sideloads directly.

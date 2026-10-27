# SDL - Shubh Dhan Lakshmi (Android)

WebView wrapper around https://shubhdhanlakshmi-beta-version.base44.app

- Locked to portrait
- Immersive fullscreen (system bars auto-hide)
- Back button navigates web history
- File / camera upload support for KYC documents
- UPI, tel: and mailto: links open in the matching app

## Build an APK

Push to GitHub -> Actions -> "Build APK" -> download the artifact.

Or locally: gradle assembleRelease

Output: app/build/outputs/apk/release/app-release.apk
Signed with the debug key, so it sideloads directly.

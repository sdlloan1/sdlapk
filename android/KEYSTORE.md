# Google Play upload key

`android/keystore/` is git-ignored, so the upload keystore never lands in the repo.
It has to survive every rebuild and every machine that publishes a release.

## Files

- `android/keystore/sdl-upload.jks` — the upload keystore (PKCS12).
- `android/keystore/keystore.properties` — read by `android/app/build.gradle`:

```properties
storeFile=keystore/sdl-upload.jks
storePassword=<password>
keyAlias=sdl
keyPassword=<password>
```

`storeFile` is relative to the `android/` directory.

## Creating a keystore (one time)

```bash
keytool -genkeypair -v -keystore android/keystore/sdl-upload.jks \
  -alias sdl -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Shubh Dhan Lakshmi, O=SDL, L=Noida, ST=Uttar Pradesh, C=IN"
```

Keep a backup of the `.jks` and its password somewhere safe. With Play App Signing
Google holds the app signing key, so a lost upload key can be reset from Play Console,
but a lost keystore still means a support round trip.

## Building

```bash
npm run aab   # -> public/download/sdl.aab
```

Upload that `.aab` in Play Console. Bump `versionCode` in `android/app/build.gradle`
for every upload — Play rejects a bundle that reuses a version code.

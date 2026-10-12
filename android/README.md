# KosRent Android app

This Trusted Web Activity opens `https://kosrent.vedtechnologies.co.in` using the user's browser, with a Custom Tab fallback. It uses the existing PWA and Google sign-in, not an embedded WebView. No Android location, contacts, storage, notification or payment permissions are requested. Native push notifications are not implemented.

Package: `in.co.vedtechnologies.kosrent` · version: `1.0.0` (code 1) · target SDK: 36 · minimum SDK: 24 (Android 7.0+).

Generated with Google's Bubblewrap from this repository's PWA assets, then changed to use Maven Central, a verified Gradle distribution and environment-based release signing. The generated sources and icons are checked in. Java 21, Android SDK 36, Build Tools 36 and Gradle 8.11.1 were used for validation. Use Android Studio or the included Gradle wrapper to build. Keep the Gradle checksum verification enabled.

```sh
cd android
# Install SDK packages using Android Studio or sdkmanager, and set ANDROID_HOME.
# The debug APK is for device testing, not Google Play upload.
./gradlew --max-workers=2 assembleDebug
```

For a signed release, supply the existing upload key through these environment variables; never commit it or its password:

```sh
export KOSRENT_UPLOAD_STORE_FILE=/private/path/upload-key.jks
export KOSRENT_UPLOAD_KEY_ALIAS=kosrent-upload
# Supply KOSRENT_UPLOAD_STORE_PASSWORD and KOSRENT_UPLOAD_KEY_PASSWORD securely.
./gradlew --max-workers=2 bundleRelease assembleRelease
```

`app/build/outputs/bundle/release/app-release.aab` is the Play upload bundle. `app/build/outputs/apk/release/app-release.apk` is for direct device testing. Without all signing variables, the release is unsigned. Keep the upload key backed up securely; increment `versionCode` and `versionName` before uploading a later release.

## Website verification after Play enrollment

Google Play App Signing normally uses a different certificate from the local upload key. Copy **App signing key certificate → SHA-256 certificate fingerprint** from the app's App integrity page in Play Console. Set `ANDROID_SHA256_FINGERPRINTS` in the website's hosting environment and redeploy. Multiple fingerprints, including a direct-test APK certificate, can be comma-separated.

The server publishes `/.well-known/assetlinks.json` for this package only when valid fingerprints are configured. With no fingerprints it returns 404 rather than a misleading placeholder. Verify the deployed URL returns HTTP 200 JSON with the **Play app signing certificate**, without authentication or redirects. Until verification succeeds, the app may show a browser toolbar.

App creation, Play identity/payment, the final Play signing certificate, hosted settings, real Google login, real-device testing and Play review require the owner's accounts. An Android build does not complete those steps or guarantee store acceptance. See `../play-store/README.md`.

The local signed bundle and APK are saved outside the checkout in `/workspace/releases/`. Upload signing material is stored privately in `/workspace/release-private/`; keep the keystore and its password backed up securely, separately from public source code. These local paths are not GitHub files.

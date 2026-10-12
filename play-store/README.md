# Release status and owner steps

The Android project and release listing are prepared. This is not a published app. The owner does not yet have a Google Play Console developer account.

1. Create the account at https://play.google.com/console/signup using the owner's Google account. Choose the truthful account type, pay Google's displayed registration fee and complete identity/device/organisation verification as required. The assistant cannot perform personal identity verification or pay on the owner's behalf.
2. Configure a real public operator name, support email and business correspondence address in the website's `OPERATOR_NAME`, `SUPPORT_EMAIL` and `BUSINESS_ADDRESS` settings. Public policies must not display “Not configured.” Review the privacy notice and operating commitments before submitting.
3. Deploy the changes from GitHub and verify the live health endpoint, Google login, photo upload, listings, call links, chat reporting/blocking and account deletion. Google OAuth's authorised JavaScript origin is `https://kosrent.vedtechnologies.co.in`, and its redirect URI is `https://kosrent.vedtechnologies.co.in/auth/google/callback`.
4. Create a free app named KosRent in Play Console and upload the signed release `.aab` using Play App Signing. Keep the locally generated upload-key backup and password privately. Do not upload an unsigned bundle or debug APK.
5. Set the Play **app signing** SHA-256 certificate in `ANDROID_SHA256_FINGERPRINTS` on the website, redeploy and verify `https://kosrent.vedtechnologies.co.in/.well-known/assetlinks.json`. The upload certificate alone does not verify a Play-installed app.
6. Complete the current forms shown by Play Console: app access instructions, truthful content rating/audience, advertising declaration, Data safety and other applicable declarations. The app contains user-created property listings and private conversations. Review `data-safety.md` with the actual hosting/runtime configuration. Do not invent a reviewer account or bypass Google authentication. Provide working reviewer access and accurate instructions.
7. Use `android/store_icon.png` (512×512) and `play-store/feature-graphic.png` (1024×500), and supply actual Android screenshots following the Console's current requirements. Capture screenshots from the deployed release on a real device, with permission for any visible personal information.
8. Test the signed app on Android, including Google sign-in and returning to the app, keyboard/back navigation, file selection, offline behaviour, reporting/blocking and deletion. Complete the testing track and duration the Console requires for this account. Submit for production review only after these checks pass.

Local automated checks use isolated PostgreSQL and synthetic signed sessions. They cannot verify real Google OAuth or actual Android behaviour. The live database health check passes and Google login redirects to Google with the correct custom-domain callback. Real Google account completion, deployed changes and Android-device behaviour remain unverified. Play registration/signing enrollment have not occurred. The live operator name, support email and business address were unset during inspection. No claim of Google review approval is made.

Google's current Console requirements take precedence over this checklist. Helpful official references:

- https://support.google.com/googleplay/android-developer/answer/13327111 (account deletion)
- https://support.google.com/googleplay/android-developer/answer/10787469 (Data safety)
- https://support.google.com/googleplay/android-developer/answer/14151465 (testing requirements)
- https://support.google.com/googleplay/android-developer/answer/11926878 (target API requirements; API 36 required for new apps from August 31, 2026)
- https://github.com/GoogleChromeLabs/bubblewrap

Keep the first release free. Digital listing charges may have additional Play billing requirements and are not enabled by this preparation.

# Release status and owner steps

The Android project and release listing are prepared. The owner has created a personal Google Play Console developer account. Completion of account verification, Play App Signing enrollment and production publication are not confirmed from this workspace.

1. Open the existing account at https://play.google.com/console and finish any remaining identity, contact-phone or device verification tasks shown on its Home page. The assistant cannot perform personal identity verification on the owner's behalf.
2. Configure the owner's real public legal/operator name and business correspondence address in the website's `OPERATOR_NAME` and `BUSINESS_ADDRESS` settings; the owner must supply these details. The public developer/support email is `rathodar110@gmail.com`, also used as the default when `SUPPORT_EMAIL` is unset. An explicit `SUPPORT_EMAIL` overrides the support address. Unset identity/address fields are omitted from public policies rather than filled with invented information. Review the privacy notice and operating commitments before submitting.
3. Deploy the changes from GitHub and verify the live health endpoint, Google login, photo upload, listings, call links, chat reporting/blocking and account deletion. Google OAuth's authorised JavaScript origin is `https://kosrent.vedtechnologies.co.in`, and its redirect URI is `https://kosrent.vedtechnologies.co.in/auth/google/callback`.
4. Create a free app named KosRent in Play Console and upload the signed release `.aab` using Play App Signing. Keep the locally generated upload-key backup and password privately. Do not upload an unsigned bundle or debug APK.
5. Set the Play **app signing** SHA-256 certificate in `ANDROID_SHA256_FINGERPRINTS` on the website, redeploy and verify `https://kosrent.vedtechnologies.co.in/.well-known/assetlinks.json`. The upload certificate alone does not verify a Play-installed app.
6. Complete the current forms shown by Play Console: app access instructions, truthful content rating/audience, advertising declaration, Data safety and other applicable declarations. The app contains user-created property listings and private conversations. Review `data-safety.md` with the actual hosting/runtime configuration. Do not invent a reviewer account or bypass Google authentication. Provide working reviewer access and accurate instructions.
7. Use `android/store_icon.png` (512×512) and `play-store/feature-graphic.png` (1024×500), and supply actual Android screenshots following the Console's current requirements. Capture screenshots from the deployed release on a real device, with permission for any visible personal information.
8. Test the signed app on Android, including Google sign-in and returning to the app, keyboard/back navigation, file selection, offline behaviour, reporting/blocking and deletion. Complete the testing track and duration the Console requires for this account. Submit for production review only after these checks pass.

Local automated checks use isolated PostgreSQL and synthetic signed sessions. They cannot verify real Google OAuth or actual Android behaviour. The user has reported successful sign-in on the Chrome-installed website; the signed Android package still needs real-device checks. The live operator name and business address were unset during inspection and require owner input. The public developer/support email has been supplied. Current Play account verification, signing enrollment and publication must be checked in the owner's Console; no claim of Google review approval is made.

Google's current Console requirements take precedence over this checklist. Helpful official references:

- https://support.google.com/googleplay/android-developer/answer/13327111 (account deletion)
- https://support.google.com/googleplay/android-developer/answer/10787469 (Data safety)
- https://support.google.com/googleplay/android-developer/answer/14151465 (testing requirements)
- https://support.google.com/googleplay/android-developer/answer/11926878 (target API requirements; API 36 required for new apps from August 31, 2026)
- https://github.com/GoogleChromeLabs/bubblewrap

Keep the first release free. Digital listing charges may have additional Play billing requirements and are not enabled by this preparation.

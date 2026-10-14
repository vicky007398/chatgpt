# KosRent Play Store release handoff

The owner reports that developer-account setup is complete. Owner screenshots show KosRent created in Play Console with version **1.0.1** available on the internal and closed-testing tracks; production is not yet active. The operator is **Ved Technologies**, with public developer/support email **rathodar110@gmail.com**. The owner requested **no address be published on the website**. Do not repeat account-signup questions or invent an address; Google may separately require verified legal/address details and public developer fields inside Play Console.

## Prepared material

| Item | Where to use it |
| --- | --- |
| App name, descriptions, category, contact links and release notes | [listing.md](listing.md) → Grow users → Store presence → Main store listing (or the Console's current equivalent) |
| Reviewable data-type and deletion entries | [data-safety.md](data-safety.md) → App content → Data safety |
| Actual login/navigation and reviewer access instructions | [app-access.md](app-access.md) → App content → App access |
| Audience, ads, financial features, content rating and testing guidance | [declarations.md](declarations.md) → the corresponding App content forms |
| Store icon | `android/store_icon.png` — 512×512 |
| Feature graphic | `play-store/feature-graphic.png` — 1024×500 |
| Android source and release-signing instructions | [../android/README.md](../android/README.md) |
| Privacy policy | https://kosrent.vedtechnologies.co.in/legal/privacy |
| Terms | https://kosrent.vedtechnologies.co.in/legal/terms |
| Account deletion | https://kosrent.vedtechnologies.co.in/delete-account |

The candidate is a free Kosamba rental app with Google sign-in, owner listings/photos, saved homes, private messaging, report/block tools, account deletion and an admin-only usage dashboard. It does not collect rent, deposits or listing fees. Do not enable manual UPI fees as part of the first Play release.

Download the signed [Play upload bundle](https://kosrent.vedtechnologies.co.in/downloads/kosrent-1.0.1.aab) or the [complete release pack](https://kosrent.vedtechnologies.co.in/downloads/kosrent-play-store-1.0.1.zip) directly in your browser. [SHA-256 checksums](https://kosrent.vedtechnologies.co.in/downloads/SHA256SUMS.txt) identify these public files. Private signing keys and passwords are not included.

## Play Console status and remaining steps

1. **App creation and listing.** KosRent is created in Play Console. Confirm the listing/contact/policy entries and actual candidate graphics/screenshots have been submitted for review.
2. **Testing release.** Owner screenshots show version **1.0.1** on the internal and closed-testing tracks. The signed local candidate is version **1.0.1**, version code **2**. Release outputs and private upload-key material are stored outside Git. Keep the upload key/password backed up securely and do not share them in chat or source.
3. **Verify website association for Play-delivered builds.** The public SHA-256 fingerprint supplied from **Protected with Play → Manage Play app signing → App signing key certificate** is included in the server's Digital Asset Links response. After deployment, check https://kosrent.vedtechnologies.co.in/.well-known/assetlinks.json returns the correct package and both direct-APK and Play app-signing fingerprints. The certificate used for a locally installed APK is not proof that a Play-installed build is verified.
4. **Submit truthful App content forms.** The documents contain specific proposed entries. The actual IARC rating comes from the questionnaire. Review production log/back-up practices and third-party arrangements before finalising Data safety. Validate unrestricted reviewer access to the restricted features; no reviewer credential has been fabricated.
5. **Complete real Android/test-track checks.** Sign in with Google, return to the app, upload a photo, publish/edit/mark-rented/remove a test listing, chat between two accounts, report/block, exercise keyboard/back navigation and the offline fallback, and delete a disposable test account. Confirm a Play-installed build has the intended toolbar-free verified app view on the KosRent domain; Google authentication itself uses a secure browser screen.
6. **Complete the testing requirement shown by the account and submit for production review.** Newer personal accounts commonly require at least 12 opted-in testers continuously for 14 days and a production-access application. Follow this account's actual Console requirement. Real testing and Google's review cannot be completed by generating a bundle locally.

Local automated tests use isolated PostgreSQL and synthetic sessions. They do not establish real Google OAuth, Android-device behaviour, tester participation or Google approval. The owner has reported successful Chrome-installed-app login, which is a different installation channel from the Play release.

## Items that cannot be marked complete from this workspace

- Confirming the Play-signed app opens without the browser toolbar on testers' real devices after the website association deploys.
- Actual production log/back-up retention and review of provider data-processing arrangements.
- Reliable reviewer login resources, real Android installation and any required closed-test participation/results.
- Production-access application, submission and Google's review decision.

These are specific Console/provider/device actions, not additional signup fees or a demand to republish the owner's address. The repository's prepared documents and Android build do not claim they have already happened.

Google's current Console requirements take precedence over the handoff:

- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Reviewer access: https://support.google.com/googleplay/android-developer/answer/9859455
- Personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Target API: https://support.google.com/googleplay/android-developer/answer/11926878
- Android wrapper tooling: https://github.com/GoogleChromeLabs/bubblewrap

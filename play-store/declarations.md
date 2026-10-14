# Content, audience and release declarations

Prepared for the inspected free KosRent release on 13 October 2026, operated by **Ved Technologies**. Use the current form wording in the owner's Console; do not claim a rating or production approval until Google supplies it.

## Proposed app-content answers

| Declaration | Entry for the inspected release |
| --- | --- |
| Privacy policy | `https://kosrent.vedtechnologies.co.in/legal/privacy` |
| Ads | **No** third-party/developer monetisation ads are included in the inspected release. Free owner-submitted rental listings are the app's main content. Reassess if banners, sponsored placements or an advertising SDK are introduced. |
| Target audience | **18 and over**: the rental-listing terms are for adults. Do not target children or select child age bands merely to widen distribution. This audience choice is not a claim of enforced identity/age verification. |
| App access | Restricted functionality; use `app-access.md` and validate actual reviewer access |
| User-generated content | **Yes**: property listings/photos and report text |
| Users can communicate with each other | **Yes**: private one-to-one in-app text conversations |
| Reporting / blocking | **Yes**: listing reports, chat-user reports, chat-user blocking. The operator must actually monitor and act on reports. |
| In-app purchases / subscriptions | **No** for the current free release. No listing payment flow is enabled. |
| Gambling / contests for money | **No** in the inspected functionality |
| Financial features | Rental ads show asking rent/deposit, but KosRent does not provide banking, lending, investment, insurance, transfers or collect tenancy payments. Select no financial-service features if those are the current form choices. Do not classify rent/deposit display as payment processing. |
| Health features | None in the inspected functionality |
| News / government affiliation | Not a news app and no government affiliation is claimed |
| Precise device location | Not requested or collected by the inspected app; property addresses are entered by users |
| Broad photo/media permissions | Not requested; users choose individual photos through a browser file picker |
| Background notifications | Not implemented; do not claim or request push capabilities |
| Account deletion | Available in Profile and at the public deletion URL |

## Content rating questionnaire

Choose **Utility, productivity, communication, or other** if that is the available IARC category matching this home-rental app. Answer **Yes** when asked whether users can exchange messages or share user-created content; answer according to the exact question rather than marking every question No. The app is not a social dating service and does not intentionally offer sexual, violent, gambling, drug or other adult entertainment content. User-generated content exists, and reporting/blocking does not make that answer No.

Select moderation/safety capabilities only where the implementation matches the question. Listing text is validated and reports can be reviewed; new listings publish immediately. Do not claim human review before publication, verified landlords, automated moderation of every image, parental controls, end-to-end encryption or an age-verification system. The operator must review actual public content before finalising the questionnaire. IARC calculates the rating; this document does not predetermine it.

## UGC operation that the operator must maintain

The app provides acceptance of Terms/Privacy before posting, published conduct rules, reporting and blocking. Operational review is still required: monitor reports and support email, investigate abusive or misleading material, remove prohibited listings, and respond to legitimate privacy/deletion requests. These are continuing operator duties, not tasks that an automated build can mark permanently complete. Review fixtures must use authorised test data.

## Testing and production access

The owner reports that setup of the **personal** Play developer account is complete. No account-setup confirmation is needed again. Owner screenshots show KosRent created with version **1.0.1** available to internal and closed testers. The closed test's required opt-in period, production-access application and production publication remain outstanding.

For personal accounts subject to Google's newer production-access requirement, the standard closed-test requirement is at least **12 opted-in testers continuously for 14 days**, followed by a production-access application. Follow the exact requirement and eligibility shown in this account's Console; an internal test does not substitute for a required closed test. Real testers must use the app and the operator must answer the production-access questions truthfully. Do not fabricate tester participation or test results.

1. In the existing Console account, click Create app and create KosRent as an English-language, free App. Select House & Home and initial India distribution in the relevant fields. Enrol in Play App Signing and upload the signed version 1.0.1/code 2 candidate AAB to the appropriate test track.
2. Configure the website's Digital Asset Links with the **Play app-signing SHA-256 certificate**, and verify a Play-installed build on a real phone. The local APK/upload certificate is a different role; authorising it does not authorise Google's independently signed Play delivery.
3. Test real Google sign-in, app return without an unexpected browser toolbar, photo upload, two-account messaging/report/block, keyboard/back behaviour, offline fallback and account deletion.
4. Complete any required closed test and production-access application, then submit the actual tested release for review.

None of these steps is marked complete merely because local automated tests pass. The Console's app-signing, testing and review status must be checked in the owner's account.

## Facts confirmed and items still external

**Confirmed by the owner:** developer-account setup complete; operator/business name Ved Technologies; public contact `rathodar110@gmail.com`; no address to be published on the website. Google may separately request verified legal/address details and display fields under its own rules; those are handled in the Console.

**Still to establish outside the repository:**

- Production hosting/log/back-up retention and restore-deletion practices for the Data safety and Privacy Notice review.
- Reliable reviewer access and any credentials/resources required by the Console.
- Actual Play app-signing certificate after enrollment.
- Real test-track participation/results and any required production-access application.

Official guidance:

- Closed testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Content rating: https://support.google.com/googleplay/android-developer/answer/9859655
- Target audience: https://support.google.com/googleplay/android-developer/answer/9867159
- User-generated content: https://support.google.com/googleplay/android-developer/answer/9876937
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111

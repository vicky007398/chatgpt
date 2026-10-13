# Data safety — proposed entries for the current release

Prepared from the repository on 13 October 2026 for **Ved Technologies**, with public contact **rathodar110@gmail.com**. These are reviewable entries, not proof that the form was submitted. Check the actual production hosting, logs, backups and third-party terms before using answers marked **confirm**. The Android app opens the production website, so its website data flows are part of this declaration.

## Initial answers

| Console question | Proposed answer and evidence |
| --- | --- |
| Does the app collect or share any required user data types? | **Yes.** Account, listing and chat data leave the device and are stored in PostgreSQL. |
| Is all collected user data encrypted in transit? | **Yes for the inspected production app flows:** website/API and Google authentication use HTTPS. **Confirm** production provider connections and operational tools before submitting. This is not a claim of end-to-end encryption. |
| Account creation methods | **OAuth** (Google). The app receives verified Google identity; it does not collect a Google password. |
| Account deletion URL | `https://kosrent.vedtechnologies.co.in/delete-account` |
| Can users request account deletion? | **Yes.** Profile → Delete account, or the deletion URL without installing the app. Sign in as that account and explicitly confirm deletion. |
| Can users request some or all data deletion without deleting their account? | Support requests are described in the Privacy Notice. Use `https://kosrent.vedtechnologies.co.in/legal/privacy` only after the operator confirms they will process these requests. Removing a listing hides it; it does **not** erase its stored records. |
| Independent security review / certification | Do not claim one: no independent certification is evidenced. |
| Advertising ID / ad SDK | None configured in the inspected app or Android wrapper. Do not declare advertising identifiers solely because property listings are advertisements. |

## Data-type entries

Select all applicable collected types below. None of these stored data are processed only ephemerally. “Optional” describes the app as a whole: guest browsing exists, while signing in and using specific features requires their associated data. If a Console question is scoped to a feature, the required-for-feature column explains that difference.

| Google data type | What is collected | Collected | Shared* | Required for feature / optional overall | Purpose boxes |
| --- | --- | --- | --- | --- | --- |
| Personal info → Name | Google profile name and entered listing owner name | Yes | No* | Required for sign-in or posting; optional for guest browsing | App functionality; Account management |
| Personal info → Email address | Verified Google account email | Yes | No* | Required for sign-in; optional for guest browsing | App functionality; Account management; Fraud prevention, security and compliance |
| Personal info → User IDs | Google subject/account ID and account-linked identifiers | Yes | No* | Required for sign-in; optional for guest browsing | App functionality; Account management; Analytics; Fraud prevention, security and compliance |
| Personal info → Phone number | Owner-entered Indian contact number in a listing | Yes | No* | Required to post a home; optional for viewers who do not post | App functionality |
| Personal info → Address | Exact listed-property address/locality and optional property map link | Yes | No* | Address/locality required to post; map link optional | App functionality |
| Photos and videos → Photos | Uploaded property images, up to five per listing | Yes | No* | Optional | App functionality |
| Messages → Other in-app messages | Private chat text, participants and timestamps | Yes | No* | Optional: only when using chat | App functionality; Fraud prevention, security and compliance |
| App activity → App interactions | Saved homes, conversation read position and one account-linked activity day for signed-in usage | Yes | No* | Optional for guest browsing; activity is recorded automatically after sign-in with no separate analytics opt-out | App functionality; Analytics |
| App activity → Other user-generated content | Listing description/details, report text, block records and policy acceptance | Yes | No* | Posting, reports and blocking are optional; acceptance required to post | App functionality; Fraud prevention, security and compliance |
| Device or other IDs | Essential browser/session identifiers and temporary login-attempt/session identifiers | Yes | No* | Used for authentication; no advertising identifier | App functionality; Account management; Fraud prevention, security and compliance |

For each selected type, use **Collected: Yes**, **Processed ephemerally: No**, the relevant purposes, and the optional/required distinction above. Account information is associated with the signed-in account; it is not anonymous merely because the dashboard displays aggregate counts. Favourites kept only in a guest's browser do not by themselves constitute server collection, but account favourites are collected.

### Meaning of the proposed “Shared: No” entries

Google's sharing definition excludes some transfers. The inspected flows consist of infrastructure/service-provider processing and user-initiated publication or direct messaging that the user reasonably expects. Listing creation explicitly tells the owner that their contact number is displayed; submitting a listing publishes its contents, and sending a chat delivers it to the participant. Google handles authentication and Railway is the documented hosting/database provider. No sale of data, advertising network or unrelated third-party analytics transfer is configured in the inspected code.

The **No*** proposals depend on these flows meeting Google's current exceptions and the production providers acting as service providers for these purposes. Confirm those arrangements. If the operator sends data to any other party outside these exceptions, change the relevant row to **Shared: Yes** and declare the actual purposes. Do not assume that every transfer qualifies automatically.

### Visibility and location

The guest feed shows listing summaries, including the submitted owner name, locality, advertised rent/deposit, furnishing and property photos. Full property address, owner phone number, map link and description are available to signed-in viewers. Published/rented-listing photos are accessible to visitors with their URLs. Listing and owner/account identifiers also appear in API responses. Do not promise that a listing photo or owner name is private.

The app does **not** request device GPS/location permissions or obtain the user's/device's current location. A manually entered property address is declared under **Personal info → Address** above. Do not select precise/approximate device location solely because rentals have addresses. Reassess if device location, location derived from IP, or a user's own location is later collected.

### Fields that require a production decision

| Potential type | What must be confirmed |
| --- | --- |
| App info and performance → Crash logs / Diagnostics | No native crash/diagnostics SDK is configured. Review actual Railway/application/access logging for app-linked errors, identifiers or diagnostics. Declare applicable collection; an empty SDK list is not proof that logs collect nothing. |
| Device or other IDs / IP-derived data | Rate limiting processes connection IPs when no account ID is available. Confirm provider access-log storage, use and retention; do not claim no infrastructure metadata. |
| Financial info → Purchase history / Other financial info | Current code disables payment collection and renewal submission. Listing rent/deposit amounts are advertised terms, not in-app purchase history. Legacy UPI-reference/renewal records may exist. Confirm whether any active release flow or support process collects financial data and how historical records are handled. No bank password, card details or UPI PIN is requested. |

Do not add location, contacts, audio, calendar, health or installed-app inventory claims without an actual collection flow. The Android wrapper requests no location, contacts, broad storage, notification or payment permission; selected photos are uploaded through the browser's file picker.

## Retention and deletion evidence

| Records | Inspected behaviour |
| --- | --- |
| Signed-in daily activity | Up to 90 days, then pruned; removed with the account |
| Temporary app sign-in attempts/profile | Ten-minute expiry; expired attempts are periodically removed |
| Login sessions | One-year cookie/session maximum; logout destroys that session; deletion revokes stored sessions for that account |
| User profile, listing/photo/chat/report/favourite/block records | Stored for service operation; no general automatic age-based deletion is implemented. Account deletion removes the associated active database records. |
| Hosted backups / access logs | **Operator/provider confirmation required:** actual schedule, retention and deletion/restoration procedures are not established by source code |

Deleting an account removes its listings, uploaded photos, favourites, reports, payment-reference records, user-block records, daily activity and conversations involving the account, including both participants' messages. It does not delete another user's Google account or unrelated content. Copies other users saved cannot be recalled. Backups can retain copies until rotation; the operator must avoid reintroducing deleted accounts if restoring a backup.

The public Privacy Notice and this declaration must remain consistent. The operator is Ved Technologies and public developer contact is `rathodar110@gmail.com`. The owner requested no address be published on the website; Google may separately require legal/address details in the Console. No address is invented here.

Official definitions and form guidance: https://support.google.com/googleplay/android-developer/answer/10787469

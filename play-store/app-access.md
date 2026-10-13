# Reviewer access — ready-to-paste instructions

## App access declaration

Select **All or some functionality is restricted**. Guest users can browse listing summaries. Google sign-in is required for owner phone numbers, full details, server-saved homes, posting, reporting, messaging and account deletion. Do not select unrestricted access.

The entries below each fit a 500-character instructions field. Add up to five instruction sets if the current Console supports them. They describe actual navigation, not supplied credentials. Leave credential values unfilled until the operator has a real authorised reviewer-access arrangement; do not claim they are optional if the Console requires them.

### Google sign-in

**Instruction name:** Google sign-in

**Other instructions:**

```text
KosRent is a free home-rental app for Kosamba, Surat, operated by Ved Technologies. Open Profile → Continue with Google and use a verified Google account. No purchase is needed. Google opens a secure browser screen. After sign-in, close that screen using X if it remains open and return to KosRent. The service covers Kosamba but reviewers need not be physically there. Support: rathodar110@gmail.com.
```

### Browse homes and contact owners

**Instruction name:** Browse homes and contact owners

**Other instructions:**

```text
Home shows owner-submitted rentals. Sign in, open a home to see the address and owner phone, and use the call link if needed. Save a home, then open Saved. Tap Report listing in home details to submit a reason. Listings are not ownership-verified. Rent and deposits are displayed property terms; KosRent does not collect them. Use authorised test data and avoid making unwanted calls to real owners.
```

### Publish and manage a home

**Instruction name:** Publish and manage a home

**Other instructions:**

```text
Tap Rent out a home. Enter Kosamba locality, property address, 1/2/3 BHK, monthly rent, deposit, furnishing, owner name and Indian mobile number. Photos (up to five), area, description and map link are optional. Accept the adult-use/policy checkbox and submit. The home publishes immediately. Profile → My listings provides edit, mark rented and remove. Use authorised data in a clearly labelled review test listing; remove it after review.
```

### Messaging, reports and blocking

**Instruction name:** Messaging, reports and blocking

**Other instructions:**

```text
Sign in with a second account and open the first account's listing → Chat with owner. A user cannot chat with their own listing. Chats shows conversations. Use Report user or Block user in a conversation; unblock with the same account. Messages update while the app is open; no background push is provided. Admin moderation/usage analytics belong to the authorised operator account and are not paid customer features.
```

### Account deletion

**Instruction name:** Account deletion

**Other instructions:**

```text
Profile → Delete account opens https://kosrent.vedtechnologies.co.in/delete-account. Sign in with the same Google account if asked, then explicitly confirm deletion. Test only with a disposable account: this removes its KosRent listings, photos and conversations, including both participants' messages. It does not delete the Google account. Contact rathodar110@gmail.com for other data/support requests.
```

## Reviewer access still to validate

No reviewer credentials have been created or fabricated. A reviewer using Google sign-in must actually be able to access restricted functions; the navigation instructions alone do not prove that. Check the current Console requirements for third-party sign-in and provide the working reviewer login resources it requires in protected fields.

Before submission, verify with a fresh non-admin account that:

1. Google OAuth is available to the reviewer's account. A Google Auth Platform project in **Testing** may limit access to named test users. Complete the appropriate OAuth audience/publication configuration rather than assuming that an arbitrary reviewer account can sign in.
2. No owner-dependent one-time code, approval, phone verification or invitation blocks review. Supplied access must remain valid throughout review.
3. No geography/IP restriction prevents review. Kosamba-only listing content does not require the reviewer to be physically in Kosamba.
4. A real second test account and authorised test listing/conversation are available if Play requires a reproducible messaging fixture.
5. Any requested admin-function review uses a controlled arrangement. Do not share the owner's personal Google password, publish credentials in Git or whitelist a fabricated address.

Keep credentials private to Console. Support/email entries and these instructions are safe to publish; passwords, recovery codes, session cookies and tokens are not.

Official guidance: https://support.google.com/googleplay/android-developer/answer/9859455

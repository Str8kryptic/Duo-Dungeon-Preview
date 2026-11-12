# Duo Dungeon — Email Template & Authentication Redesign Manifest

**Status:** Audit complete; implementation not started  
**Environment audited:** Supabase Development project, `xuxwwpfeenaaxzfspiiq`  
**Repository context:** Duo Dungeon Preview  
**Scope:** Supabase Auth email presentation and the existing account-verification/password-recovery flows

## 1. Objective

Redesign the account-verification and password-recovery emails so they share the approved **Ancient Dungeon Crypt** visual identity used by Duo Dungeon.

This is a presentation-only redesign. Supabase Auth remains responsible for issuing, validating, and consuming authentication links/tokens. The existing client-side authentication calls, redirect destinations, session handling, and password update behavior must remain unchanged.

## 2. Evidence captured from Development

The following values and body content were observed in the Development Supabase Dashboard under Authentication → Email Templates. Screenshots were supplied during the audit.

### 2.1 Confirm Signup

- **Current subject:** `Confirm your email address`
- **Current heading:** `Confirm your email address`
- **Current instruction:** `Follow the link below to confirm this email address and finish signing up.`
- **Current link label:** `Confirm email address`
- **Current link target variable:** `{{ .ConfirmationURL }}`
- **Current hosted body:** Basic HTML consisting of the heading, instruction paragraph, and confirmation link.
- **Hosted appearance:** Default/minimal template; no Duo Dungeon visual treatment is present in the captured source.

### 2.2 Reset Password

- **Current subject:** `Reset your password`
- **Current heading:** `Reset your password`
- **Current instruction:** `We received a request to reset your password. Follow the link below to choose a new one.`
- **Current link label:** `Reset password`
- **Current link target variable:** `{{ .ConfirmationURL }}`
- **Current security notice:** `If you didn't request this, you can safely ignore this email.`
- **Hosted appearance:** Basic HTML; no Duo Dungeon visual treatment is present in the captured source.

### 2.3 Available template variables

The Development dashboard displayed these seven variables for both inspected templates:

- `{{ .ConfirmationURL }}`
- `{{ .Token }}`
- `{{ .TokenHash }}`
- `{{ .SiteURL }}`
- `{{ .Email }}`
- `{{ .Data }}`
- `{{ .RedirectTo }}`

**Required handling:** Preserve the existing `{{ .ConfirmationURL }}` link target in both templates. The other variables are available but should not be added unless a documented design or functional need requires them. Do not construct authentication URLs manually or expose raw tokens in the email.

## 3. Existing repository implementation

The repository-side audit identified:

- `emails/confirm-account.html` — a branded confirmation-email HTML file already exists in the repository.
- `auth.js` — contains the existing signup, confirmation-resend, password-reset, recovery-session, and password-update behavior.
- The inspected repository did not expose a tracked `supabase/config.toml` email-template configuration that would automatically synchronize the hosted dashboard templates.

The GitHub confirmation HTML and the hosted Development Confirm Signup template are separate sources. A repository commit alone does **not** update a hosted Supabase email template. Hosted templates must be deliberately installed in the appropriate Supabase project after review.

The hosted Development Reset Password template is currently basic as captured. No matching branded hosted recovery template was confirmed during this audit.

## 4. Authentication behavior that must not change

The following behavior was confirmed in the existing `auth.js` inspection and is protected from this visual redesign.

### Signup and confirmation

- Signup continues to use `client.auth.signUp(...)`.
- The existing signup email redirect remains `./?welcome=1`.
- Confirmation delivery continues to be handled by Supabase Auth.
- The existing resend path continues to use `client.auth.resend({ type: "signup", ... })`.
- The resend redirect remains `./?welcome=1`.
- The email's primary confirmation link continues to use `{{ .ConfirmationURL }}`.

### Password recovery

- Recovery requests continue to use `client.auth.resetPasswordForEmail(...)`.
- The recovery redirect remains `./?resetPassword=1`.
- The email's reset link continues to use `{{ .ConfirmationURL }}`.
- Existing recovery-session detection, including the `PASSWORD_RECOVERY` event handling, remains unchanged.
- Password changes continue to use `client.auth.updateUser({ password: ... })`.

### Explicitly out of scope

Do not change:

- Supabase Auth APIs or authentication method selection.
- Signup, confirmation, resend, recovery, or password-update logic.
- Redirect URLs, query parameters, callback/session detection, or URL allowlists.
- Token generation, token types, token expiry, or verification requirements.
- SMTP/provider configuration, sender identity, delivery settings, or security notifications.
- Account creation, login, logout, or account deletion behavior.
- Production Supabase settings or Production email templates.

## 5. Approved visual direction

Apply the approved **Ancient Dungeon Crypt** direction:

- Dark, atmospheric dungeon palette.
- Weathered stone surfaces and restrained iron framing.
- Antique gold accents used sparingly for hierarchy and important actions.
- Strong contrast and clear typography.
- Consistent Duo Dungeon wordmark/branding.
- Subtle dungeon atmosphere without sacrificing clarity or trust.
- Responsive, narrow email layout suitable for mobile screens.
- Robust table-based structure and inline CSS for broad email-client compatibility.
- Meaningful text links as fallbacks when buttons or styling are unavailable.
- Accessible contrast, readable type sizes, descriptive link text, and sensible spacing.
- Do not depend on JavaScript, external web fonts, background images, or advanced CSS for essential content.

The two emails should look like members of the same system but remain immediately distinguishable by purpose.

## 6. Template-specific redesign requirements

### 6.1 Confirm Signup

Retain the existing subject initially unless a subject change is separately proposed and approved.

The redesigned body should include:

1. Duo Dungeon branding.
2. A concise welcome/registration confirmation message.
3. A prominent **Confirm email address** action.
4. A visible fallback URL/link for clients that do not render the button.
5. A brief security note explaining that an unrequested signup can be ignored.
6. A restrained branded footer.

The button and fallback must both use the exact existing Supabase placeholder:

`{{ .ConfirmationURL }}`

### 6.2 Reset Password

Retain the existing subject initially unless a subject change is separately proposed and approved.

The redesigned body should include:

1. Duo Dungeon branding consistent with Confirm Signup.
2. A direct explanation that a password-reset request was received.
3. A prominent **Reset password** action.
4. A visible fallback URL/link.
5. The existing security instruction that an unrequested reset can safely be ignored.
6. A concise footer; avoid promotional content or confusing game narrative.

The button and fallback must both use the exact existing Supabase placeholder:

`{{ .ConfirmationURL }}`

## 7. Implementation and review sequence

1. Create and review the repository-side design specification.
2. Prepare the confirmation and recovery HTML as separate templates.
3. Review the HTML source for valid structure, placeholder preservation, mobile layout, and email-client-safe styling.
4. Compare each proposed template against the audited Development dashboard version.
5. Obtain approval before installing either template in Supabase Development.
6. Install only in the Development project.
7. Test real signup, confirmation, resend, recovery request, recovery link, recovery session, and password update flows using test accounts.
8. Verify the rendered emails on mobile and desktop, including fallback links.
9. Record test results and obtain explicit approval before any Production work.
10. Treat Production template installation as a separate, explicitly approved operation.

## 8. Development acceptance checklist

### Visual and content checks

- [ ] Both emails share the Ancient Dungeon Crypt visual system.
- [ ] Each email clearly communicates its own purpose.
- [ ] Subjects are confirmed before any hosted-template update.
- [ ] Primary action is visually obvious and readable.
- [ ] Fallback link is present and usable.
- [ ] Security wording is present and accurate.
- [ ] Layout is readable on narrow mobile screens.
- [ ] Essential content remains understandable when images/styles are unavailable.
- [ ] No unnecessary promotional content is included.

### Authentication and template checks

- [ ] Both templates retain `{{ .ConfirmationURL }}` as the action URL.
- [ ] No raw token is exposed or manually assembled into a URL.
- [ ] Signup still reaches the existing `?welcome=1` destination.
- [ ] Confirmation resend still works.
- [ ] Password recovery still reaches the existing `?resetPassword=1` destination.
- [ ] Recovery session detection still works.
- [ ] Password update still works.
- [ ] No authentication source code or Supabase Auth settings were changed as part of the email styling work.

### Environment and release checks

- [ ] Development only during initial implementation and testing.
- [ ] No Production template or configuration changes.
- [ ] No SMTP or sender-setting changes.
- [ ] Test results documented.
- [ ] Explicit approval received before Production promotion.

## 9. Audit limitations and outstanding evidence

This audit directly inspected the two Development hosted templates shown in the supplied screenshots and inspected the repository's confirmation HTML and authentication client code.

The audit did **not** establish the live contents or settings of every other Supabase email template (for example, email change, invite, magic link, reauthentication, or security notifications). It also did not independently verify sender identity, SMTP settings, delivery logs, or the exact Production-hosted template contents. Those are outside this two-template redesign scope and must not be assumed.

The repository-side confirmation HTML is not proof that the same HTML is currently installed in Supabase.

## 10. Change-control statement

This manifest is documentation only. Creating or merging it does not install email templates, change authentication behavior, update Supabase settings, send emails, or deploy the application.

**Production remains protected. No Production action is authorized by this manifest.**

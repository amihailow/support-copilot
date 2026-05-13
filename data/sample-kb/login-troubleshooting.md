# Login Troubleshooting Guide

This guide covers the most common login issues and resolution steps.

## "Invalid credentials" error

1. Ask the customer to verify Caps Lock is off and they are using the correct email.
2. Confirm they are logging in at app.example.com and not the legacy auth.example.com domain (deprecated in March 2025).
3. If still failing, send a password reset link from the admin panel.

## Two-factor authentication issues

If the customer cannot receive the 2FA code:

- For SMS: check that the phone number on file is correct. Carrier delivery can take up to 5 minutes in some regions.
- For authenticator apps: confirm the customer's device clock is synced to network time. Time drift over 30 seconds breaks TOTP codes.
- Backup codes: each user has 8 single-use backup codes generated at 2FA setup. They can be regenerated from Settings > Security.

If the customer has lost access to both SMS and the authenticator and has no backup codes, an admin must verify identity through a video call before disabling 2FA.

## Account locked after failed attempts

Accounts are auto-locked after 10 failed login attempts within 1 hour. Locks expire after 30 minutes. To unlock manually, an admin can use the "Unlock account" action in the admin panel. Always confirm the customer's identity before manual unlock.

## SSO (SAML / OIDC) issues

For enterprise SSO customers, login failures usually fall into one of:

- IdP metadata expired - the customer's IT admin must refresh the metadata in their identity provider.
- Email mismatch - the IdP must return the same email that is registered on the account.
- IdP-initiated vs SP-initiated flow - we support both, but the IdP must be configured for the correct relay state.

Direct enterprise SSO issues to the dedicated `enterprise-support@example.com` queue.

# Privacy Policy for Schedulr Extension

**Effective Date:** 1 March 2026

Thank you for using "Schedulr," an extension that helps you import your timetable from the MMU CliC platform into your calendar. I value your privacy and am committed to being transparent about how your data is handled. This Privacy Policy explains what information is collected, why it is needed, and how it is stored and protected.

## 1. Information I Collect

### Google Account Information (via OAuth 2.0)

When you authenticate with Google, the Extension initiates a standard OAuth 2.0 authorization code flow. The authorization code is sent securely to my backend (Cloudflare Workers), which exchanges it with Google for the following tokens:

- **Access token**: used to make Google Calendar API calls on your behalf.
- **Refresh token**: used to obtain a new access token when the current one expires, so you don't need to re-authenticate every session.
- **ID token**: decoded server-side to extract your Google account's display name, email address, and unique account identifier (`sub`). This is used to identify your account in the system.

### Data stored in the backend database (Supabase)

The following information is stored securely on my backend to enable the OAuth session management:

- **users table**: Your Google email address, display name, and Google account `sub` (a unique, opaque identifier assigned by Google).
- **oauth_tokens table**: Your access token, refresh token, token expiry timestamp, and the list of OAuth scopes granted.
- **sessions table**: A randomly generated session token (UUID), session expiry time (30 minutes), your IP address at the time of login, and your browser's User-Agent string. These are used solely to validate active sessions and prevent session hijacking.

### Data stored locally in your browser

The Extension stores the following locally on your device only:

- Your session token and its expiry time.
- Your Google email address (for display purposes in the extension UI).

### Timetable Data

The Extension reads your timetable from the CliC page you have open and uses it to construct calendar events. This data is processed locally in your browser and sent directly to the Google Calendar API — it is never stored on my servers.

## 2. How I Use Your Information

- **Authentication & Session Management**: Your Google account details and tokens are stored on the backend solely to manage your authenticated session. Sessions expire after 30 minutes of inactivity.
- **Google Calendar Integration**: Your access token is used server-side to make authorised requests to the Google Calendar API.
- **Security**: Your IP address and User-Agent are recorded at login time to help detect and prevent session hijacking.
- **Timetable Processing**: Timetable data is processed locally or sent directly to Google Calendar. It is never stored on my servers.

## 3. Data Sharing and Disclosure

I do **not** sell, rent, or share your personal data with any third parties for commercial or marketing purposes. Your data is used exclusively within Schedulr to provide the timetable import service. The only external services that receive your data are Google (for Calendar API calls), Supabase (database provider), and Cloudflare (backend API hosting).

## 4. Data Retention and Deletion

Your account information and OAuth tokens are retained for as long as you use the Extension. Sessions automatically expire after 30 minutes of inactivity.

**To delete your data**: If you wish to have all your data removed from the backend database, please contact me at [aidenchan0397@gmail.com](mailto:aidenchan0397@gmail.com) with your Google email address and I will delete your records promptly.

## 5. Security

I take reasonable steps to protect your data, including the use of HTTPS for all communications and secured storage for tokens and session data. However, no system is 100% secure.

## 6. Your Consent

By installing and using the Schedulr extension, you consent to this Privacy Policy and the handling of your data as described above.

## 7. Changes to This Privacy Policy

I may update this Privacy Policy from time to time and will update the effective date accordingly.

## 8. Contact Me

If you have any questions, concerns, or data deletion requests regarding this Privacy Policy, please contact me at [aidenchan0397@gmail.com](mailto:aidenchan0397@gmail.com).

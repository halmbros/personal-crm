# Personal CRM

A single-page HTML dashboard that reads live contact data from Google Sheets.

## Quick Start

1. Open `index.html` in a browser, or serve locally:
   ```
   npx serve .
   ```
2. Contacts load automatically from the connected Google Sheet.

## Write-Back (Optional)

To enable saving edits back to the sheet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add your origin to Authorized JavaScript Origins
4. Paste the Client ID into `OAUTH_CLIENT_ID` in `index.html`
5. Click "Sign In to Edit" in the app header

# Personal CRM

A single-page HTML dashboard that reads live contact data from Google Sheets.

## Quick Start

1. Open `index.html` in a browser, or serve locally: `npx serve .`
2. Contacts load automatically from the connected Google Sheet.

## Setup (to connect your own data)

This repo ships with placeholder values — it won't pull live data until you plug in your own:

1. **Get a Google Sheets API key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create an API key, restrict it to the **Google Sheets API**
   - Replace `YOUR_GOOGLE_SHEETS_API_KEY` in `index.html` with your key

2. **Point it at your own sheet**
   - Replace `YOUR_GOOGLE_SHEET_ID` in `index.html` (appears twice) with your sheet's ID (the long string in your sheet's URL)
   - Your sheet needs columns matching the structure described in `CLAUDE.md`

## Write-Back (Optional)

To enable saving edits back to the sheet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add your origin to Authorized JavaScript Origins
4. Paste the Client ID into `OAUTH_CLIENT_ID` in `index.html`
5. Click "Sign In to Edit" in the app header
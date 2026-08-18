# General Principles

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them. Don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask for clarification.
- Don't be sycophantic. If the requested approach is suboptimal, say why.
- Present tradeoffs and surface inconsistencies proactively.
- Before writing complex logic from scratch, search for established open source libraries that solve the problem. Prefer well-maintained, widely-adopted packages over custom implementations. If a good library exists, recommend it and explain the tradeoff vs building it yourself.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Prefer flat, readable code over clever indirection.
- Delete dead code you introduced. Don't leave orphaned imports or unused variables.
- The test: Would a senior engineer say this is overcomplicated? If yes, simplify.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code or issues, mention it in a comment. Don't delete it.
- Never remove or rewrite comments you don't fully understand.
- Never touch code orthogonal to the task at hand.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless explicitly asked.
- The test: Every changed line should trace directly to the request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" -> Write tests for invalid inputs, then make them pass
- "Fix the bug" -> Write a test that reproduces it, then make it pass
- "Refactor X" -> Ensure tests pass before and after

For multi-step tasks, state a brief plan:
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**Visual Testing:** Use Playwright for visual and end-to-end tests. Write tests that assert on actual rendered output, not just DOM structure. For CLI or terminal-based output, use a PTY to capture and assert on real terminal output. Don't mock rendering — test what the user sees.

## 5. Managing Confusion and Uncertainty

Seek clarity before writing code.

- If the codebase has patterns you don't recognize, ask about them before changing anything.
- If a requirement conflicts with existing behavior, flag it.
- If you're about to make a guess, label it as a guess and ask for confirmation.
- Prefer asking one good clarifying question over producing a wrong implementation.

## 6. Code Review Mindset

Treat every output as if it will be reviewed line by line.

- Every diff should be small, clean, and explainable.
- No drive-by refactoring or "improvements" bundled into a feature change.
- No renaming, reformatting, or reorganizing unless that IS the task.
- If a change requires context to understand, add a brief inline comment explaining why.

---

# Personal CRM

Single-page HTML app that reads/writes contact data from a Google Sheet and displays it as a CRM dashboard.

## Architecture

- **Single file**: `index.html` — no build tools, no dependencies, no framework
- **Data source**: Google Sheets API v4 (read via API key, write via OAuth 2.0)
- **Sheet ID**: `YOUR_GOOGLE_SHEET_ID` (see README for setup)
- **Tab**: `To Dos 2026` (range `A:M`)
- **Storage**: All data fetched live from sheet; local edits update in-memory until saved back

## Sheet Structure

- Columns A-B are internal (empty / Done checkbox)
- Columns C-O hold contact data: Name, Firm, Position in Firm, Location, Contact Quality, Status, Plan, Contact/Status Note, Motive, Reached Out, Result of Reachouts, Next Date, Notes
- Section header rows have text only in column B (e.g. "Personal", "Recent HHs"), rest empty
- Column header row has "Name" or "Task" in column C — skip during parsing

## Key Features

- Dark mode UI
- Contacts grouped by section headers detected from sheet
- Row color-coding by Status: Chase (red), Hold (grey), Reach Out (orange), Contact Undecided (yellow)
- Urgency left-border flags (red/orange/yellow/grey/green) based on Status + Next Date
- OVERDUE / DUE SOON badges on contacts based on Next Date vs today
- Daily Digest modal showing actionable contacts sorted by urgency
- Click-to-edit slide-in panel with Save back to Google Sheet (requires OAuth)
- Search bar filtering across all fields

## OAuth Setup (for write-back)

1. Create OAuth 2.0 Client ID at Google Cloud Console
2. Set Authorized JavaScript Origins to your serving origin
3. Paste Client ID into `OAUTH_CLIENT_ID` constant in `index.html`

## Dev Notes

- Serve via local HTTP server for OAuth to work (`file://` won't work for OAuth)
- API key is embedded in the HTML (read-only access)
- Date parsing handles ISO, DD/MM/YYYY, and MM/DD/YYYY formats

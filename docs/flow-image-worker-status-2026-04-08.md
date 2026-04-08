# Flow Image Worker Status Report (2026-04-08)

## Scope
This report summarizes what was attempted on Ubuntu for Flow image generation and what succeeded/failed.

## Successes
- Pulled and used latest repo updates that support Flow worker CDP mode (`FLOW_BROWSER_CDP_URL`).
- Confirmed Chrome CDP endpoint is running and reachable on `127.0.0.1:9223`.
- Confirmed Flow UI can be opened and inspected via automation.
- Implemented and tested a script path that captures exactly one image output candidate (instead of collecting many UI images).
- Added and pushed helper script commit for one-image capture logic in repo (`tools/flow/generate-one-image.js`).
- Added and pushed generated artifact image to repo under `artifacts/flow-images/2026-04-08/`.

## Failures / Blockers
- `flowMedia:batchGenerateImages` often returns HTTP `403` with:
  - `PERMISSION_DENIED`
  - `reCAPTCHA evaluation failed`
  - `PUBLIC_ERROR_UNUSUAL_ACTIVITY`
- Storage-state/cookie-only mode is unstable for live generation.
- Current CDP browser session was observed redirecting to Google Account sign-in/sign-up pages, so editor prompt textbox was not available.
- Because editor state/login was not guaranteed, prompt submission could fail before generation.

## Root Cause
- The blocking issue is not image download code anymore.
- The main issue is Google auth/session + reCAPTCHA risk evaluation bound to real browser state.
- Without a live, logged-in, valid editor session in Chrome CDP, generation cannot be treated as reliable.

## What Was Changed Technically
- Generation strategy was shifted away from generic DOM image scraping.
- Script now targets Flow generation network path (`flowMedia:batchGenerateImages`) and extracts output URL from API response when available.
- Added fallback diagnostics (button list/state) for quicker failure point identification.

## Current Recommended Run Mode
1. Run real Chrome with CDP on Ubuntu.
2. Login Google manually in that Chrome profile.
3. Open the exact Flow project editor and keep it in editor state.
4. Run generator in CDP mode (`FLOW_BROWSER_CDP_URL=http://127.0.0.1:9223`).
5. Accept success only when API returns `200` and one output image is saved.

## Notes
- Sensitive credential/session values were provided during debugging; they should be considered exposed and rotated.

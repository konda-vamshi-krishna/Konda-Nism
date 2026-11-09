## 2026-11-09 - Prevent XSS in File Upload Validation
**Vulnerability:** XSS vulnerability in `js/app.js` during validation of staged files when rendering file paths and names via `.innerHTML`.
**Learning:** File metadata originating from client drops or file selection dialogs (e.g., `file.name`, `file.path`) must be treated as untrusted user input. Using it directly inside `.innerHTML` opens the door to XSS.
**Prevention:** Always sanitize dynamic or user-provided data using a helper like `escapeHTML()` before interpolating it into the DOM via `innerHTML` to prevent Cross-Site Scripting (XSS).

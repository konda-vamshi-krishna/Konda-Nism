## 2024-05-15 - [XSS via File Drop]
**Vulnerability:** Untrusted user input (`file.name` and `file.path`) was being directly interpolated into `innerHTML` during drag-and-drop or file selection, leading to XSS vulnerabilities.
**Learning:** File metadata originating from client drops or file selection dialogs must be treated as untrusted user input and sanitized before being injected into the DOM.
**Prevention:** Always sanitize dynamic or user-provided data using a helper like `escapeHTML` when using `innerHTML` in a Vanilla JS codebase.

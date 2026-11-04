## 2026-11-04 - [Missing XSS Sanitization helper]
**Vulnerability:** innerHTML is used extensively without an escapeHTML helper function.
**Learning:** There is no escapeHTML helper function in js/app.js despite being noted in memory.
**Prevention:** I need to add an escapeHTML function and use it to sanitize all dynamic user inputs injected into innerHTML.

## 2025-02-14 - XSS Vulnerability in DOM Injections
**Vulnerability:** Widespread Cross-Site Scripting (XSS) due to untrusted data being interpolated into template strings assigned to `.innerHTML` in `js/app.js`.
**Learning:** The application heavily relies on dynamic DOM updates using `.innerHTML` without built-in sanitization. User inputs, JSON file contents, and error messages were being blindly inserted, allowing execution of arbitrary scripts.
**Prevention:** Always use the `escapeHTML()` helper function introduced in `js/app.js` when assigning dynamic content to `.innerHTML`, or prefer using `textContent` for plain text data.

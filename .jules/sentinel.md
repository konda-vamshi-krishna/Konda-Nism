## 2024-05-24 - Cross-Site Scripting (XSS) via File Name
**Vulnerability:** In `validateStagedFiles` (`js/app.js`), user-controlled file paths (`file.path`) and names (`file.name`) were being directly interpolated into DOM elements using `.innerHTML`.
**Learning:** This occurs when file metadata from client drop/selection events is assumed to be safe. Because this data is attacker-controlled, it can contain malicious HTML/JS payloads.
**Prevention:** Always escape user-controlled file names/paths before rendering them to the DOM, using a sanitization function like `escapeHTML` (which we need to add) or safe methods like `textContent`.

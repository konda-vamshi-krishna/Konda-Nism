## 2024-05-24 - [Fix XSS via .innerHTML]
**Vulnerability:** Found multiple XSS vulnerabilities in `js/app.js` where user-provided data (from JSON files, like `chapter.title`, `section.heading`, `q.question`, etc.) was directly assigned to DOM elements via `.innerHTML` without sanitization.
**Learning:** Vanilla JS PWAs without modern framework safeguards (like React's `{}` or Vue's `v-bind`) are inherently vulnerable to XSS if `.innerHTML` is used for dynamic content.
**Prevention:** Implement a global `escapeHTML` helper function and wrap all dynamic data in it before interpolation into HTML strings used for `.innerHTML` assignment. Avoid `.innerHTML` entirely when `textContent` is sufficient.

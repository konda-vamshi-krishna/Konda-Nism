## 2026-11-03 - [Fix Vanilla JS XSS Vulnerabilities in innerHTML]
**Vulnerability:** [Multiple instances of dynamic/user-supplied content being directly injected via \`.innerHTML\` (e.g. course titles, flashcard content, quiz answers) leading to DOM-based XSS.]
**Learning:** [Vanilla JS codebases heavily relying on template literals for rendering DOM elements often miss HTML sanitization, which creates critical XSS paths if any injected property can be influenced by users or malicious API responses.]
**Prevention:** [Always use an \`escapeHTML\` helper (or DOMPurify) before inserting variables into \`.innerHTML\` templates. If only inserting text, prefer \`textContent\`.]

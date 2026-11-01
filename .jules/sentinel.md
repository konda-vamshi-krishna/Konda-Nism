## 2024-05-15 - Unsanitized `.innerHTML` Assignments in Core UI Rendering
**Vulnerability:** XSS vulnerability found in `renderActiveQuestion` and `renderFlashcard` where dynamic user-provided/external content (e.g., question text, options, explanations, and flashcard contents) was assigned directly to `innerHTML` without sanitization.
**Learning:** In vanilla JavaScript codebases, directly setting `innerHTML` with unsanitized external JSON data exposes the application to XSS attacks. The issue existed due to reliance on template literals containing raw object properties.
**Prevention:** Always use an HTML sanitization helper (e.g., `escapeHTML`) to encode dynamic content before inserting it into the DOM via `innerHTML`, or prefer using safer methods like `textContent` where applicable.

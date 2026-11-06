## 2026-11-06 - Flashcard Keyboard Accessibility
**Learning:** Adding screen reader instructions dynamically directly into an aria-label overrides meaningful visual text. When a component requires hidden instructional text, it is much safer to render a `.sr-only` visually hidden block linked by `aria-describedby` so the actual textual content remains accessible.
**Action:** Default to using `aria-describedby` linked to `.sr-only` blocks for complex interactive elements instead of modifying `aria-label`.

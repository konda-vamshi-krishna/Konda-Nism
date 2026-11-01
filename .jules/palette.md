## 2026-11-01 - Interactive Div Keyboard Accessibility
**Learning:** Custom interactive elements (like the study flashcards) using `onclick` on `div`s lacked inherent keyboard accessibility, ignoring screen readers and keyboard users entirely.
**Action:** Always pair `onclick` actions on custom elements with `tabindex="0"`, appropriate `role`, `aria-label`, and specific `keydown` listeners (e.g., Space/Enter to trigger, Arrow keys to navigate) scoped to the active view.

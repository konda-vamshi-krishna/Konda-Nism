## 2024-03-14 - Semantic Interactive Elements and ARIA
**Learning:** Found a pattern where interactive elements like custom drawers and modal triggers were built using non-semantic tags like `<div>` and `<span>` lacking appropriate `role`, `aria-label`, and `aria-expanded`/`aria-controls`/`aria-modal` attributes.
**Action:** When implementing custom components like drawers, modals, or toggleable icons (e.g. bookmarks), always ensure semantic tags (`<button>`) are used and properly paired with dynamic state ARIA attributes (`aria-pressed`, `aria-expanded`).

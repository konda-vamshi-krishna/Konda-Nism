## 2024-05-19 - Inner Loop DOM Access Pattern
**Learning:** In this Vanilla JS PWA codebase, dynamically rendering interactive lists (like the test question grid) using frequent `document.getElementById` and `appendChild` within `for` loops causes noticeable layout thrashing.
**Action:** When performing bulk DOM manipulations in this codebase, always cache the parent container, use `DocumentFragment` for batched insertions, and iterate over `container.children` instead of running document-wide O(n) element ID lookups.

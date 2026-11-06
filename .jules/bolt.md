## 2025-02-12 - Prevent O(n) DOM lookups during test loops
**Learning:** Found O(n) DOM loop lookups combined with missing `DocumentFragment` when building and restyling the main exam grid structure (`js/app.js`), leading to extreme layout thrashing for 100+ item tests on mobile browsers.
**Action:** Always batch DOM insertions with `DocumentFragment` and cache container nodes before loops to access `.children[i]` directly rather than running `document.getElementById` O(n) times.

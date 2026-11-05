## 2024-11-05 - Optimize Grid Re-renders
**Learning:** Found an anti-pattern in the codebase where `document.getElementById` is repeatedly called inside a loop during test grid updates (O(n) DOM lookups). Given the Vanilla JS architecture of this PWA, this causes layout thrashing and slows down exam simulations significantly as the number of questions grows.
**Action:** Always cache container elements, utilize `container.children` for array-like index access, and use `DocumentFragment` for batch DOM insertions when rendering multiple child nodes.

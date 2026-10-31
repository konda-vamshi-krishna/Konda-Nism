## 2024-05-20 - O(n) DOM Lookups inside rendering loops
**Learning:** Found an O(n) DOM lookup pattern `document.getElementById` inside a loop in `updateGridStyles` in `js/app.js` combined with iterative element insertions in `buildActiveGrid` causing layout thrashing.
**Action:** Always prefer caching DOM container references and accessing `container.children` to avoid O(n) lookup overhead. Use `DocumentFragment` for batch DOM insertions.

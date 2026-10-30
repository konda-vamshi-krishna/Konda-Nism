## 2024-05-18 - [DOM Manipulation Optimization]
**Learning:** O(n) DOM lookups (`document.getElementById` inside a loop) cause significant layout thrashing.
**Action:** Always cache container elements and use `container.children` and use `DocumentFragment` for batch DOM insertions.

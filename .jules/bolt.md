## 2024-03-22 - Optimizing DOM mutations in Vanilla JS loops
**Learning:** In this Vanilla JS codebase, performing O(n) DOM lookups (like `document.getElementById`) inside loops or directly mutating the DOM causes significant performance degradation (layout thrashing) especially for grid rendering.
**Action:** Use `DocumentFragment` to batch inserting new elements, and use `container.children[i]` to quickly access elements inside loops instead of querying the document.

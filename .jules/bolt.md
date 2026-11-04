## 2026-11-04 - Optimize DOM insertions and lookups
**Learning:** Found O(n) DOM lookups in loops and direct DOM appends causing layout thrashing.
**Action:** Use DocumentFragment for batch insertions and access cached `container.children` instead of `getElementById` in loops.

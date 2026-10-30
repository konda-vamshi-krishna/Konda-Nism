## 2026-10-30 - DOM Reflow Optimizations
**Learning:** O(n) DOM lookups in `updateGridStyles` and direct `appendChild` calls in `buildActiveGrid` loops cause excessive layout thrashing.
**Action:** Use `DocumentFragment` for batching DOM insertions and cache container element to access its children directly in loops to minimize reflows.

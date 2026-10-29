
## 2024-05-19 - DOM Lookup in Loop Bottleneck
**Learning:** Found a performance bottleneck where `document.getElementById` was being called inside a loop over test questions in `updateGridStyles()`. This caused O(n) layout/query thrashing for every answer selected or navigated.
**Action:** Always cache the container element outside the loop and use `container.children[i]` or `DocumentFragment` (as applied to `buildActiveGrid()`) to batch DOM changes and eliminate repeated queries.

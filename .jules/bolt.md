## 2024-11-10 - O(N) DOM and Storage Bottlenecks
**Learning:** Found significant main thread stuttering potential caused by running `localStorage.getItem`, `JSON.parse`, and `document.getElementById` inside O(n) rendering loops (`updateGridStyles` and `setupTestSelectors`).
**Action:** Always hoist expensive synchronous storage operations outside loops. Cache DOM containers and use `container.children[i]` for O(1) access instead of O(n) `getElementById` lookups.

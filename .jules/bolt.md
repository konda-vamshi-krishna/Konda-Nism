## 2024-05-18 - Grid Rendering Optimization
**Learning:** The simulator uses `updateGridStyles` to refresh the progress grid on *every single question interaction*. Since it used `document.getElementById` in an O(N) loop across all questions, it caused layout thrashing and high JS execution time proportional to the test size.
**Action:** Always cache the container element and use O(1) relative lookups (`container.children[i]`) and `DocumentFragment` for batch DOM insertions in Vanilla JS architectures where state updates frequently trigger full-list re-renders.

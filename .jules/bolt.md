## 2024-11-04 - Optimize DOM manipulations in test simulator grid
**Learning:** O(n) DOM lookups in a loop (`document.getElementById` for each question button) and direct `appendChild` in the simulator grid creation lead to significant layout thrashing during test mode generation, which gets visibly slow with longer exams (e.g. 100 questions).
**Action:** Always prefer retrieving container element references once, using `container.children[i]` for index-based updates, and batching layout generation with `DocumentFragment` before attaching to the live DOM.

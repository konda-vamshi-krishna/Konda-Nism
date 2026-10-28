
## 2024-05-19 - [Preventing Layout Thrashing with Conditional Class Updates]
**Learning:** Unconditional assignments to DOM elements' `className` or using `classList.add`/`remove` inside loops triggering frequent UI updates (like rendering active states in a grid of 100+ items on every click) causes massive layout thrashing and forced reflows/repaints, severely degrading performance.
**Action:** Always compute the expected CSS class string first and check `if (element.className !== expectedClass)` before writing to the DOM, reducing O(N) DOM writes to O(1) for small state changes.

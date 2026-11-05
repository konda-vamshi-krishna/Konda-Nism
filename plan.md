1. **Refactor `buildActiveGrid` in `js/app.js` to use `DocumentFragment`:**
   - Currently, it appends buttons directly to the container in a loop (`container.appendChild(btn)`), causing unnecessary reflows/repaints.
   - I will modify it to create a `DocumentFragment`, append the buttons to the fragment, and then append the fragment to the container once.

2. **Refactor `updateGridStyles` in `js/app.js` to avoid `getElementById` in a loop:**
   - Currently, it uses `document.getElementById(containerId + '_' + i)` inside a loop over all questions, which is O(n) lookups.
   - Since `buildActiveGrid` creates buttons in order, I can get the container once and iterate over its `children` (which maps 1:1 to the question indices) instead of calling `getElementById` repeatedly. This reduces DOM queries significantly.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**

4. **Submit PR with title `⚡ Bolt: [performance improvement]` and descriptive body.**

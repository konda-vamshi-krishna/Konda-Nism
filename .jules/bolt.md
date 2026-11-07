## 2024-05-14 - Optimize active test grid rendering
**Learning:** Found O(n) `document.getElementById` DOM lookup loop and layout thrashing (direct `appendChild` inside loop) in the `js/app.js` test simulator grid rendering functions. In Vanilla JS, repeatedly query-ing the DOM inside tight loops like this is a common codebase anti-pattern for performance bottlenecks.
**Action:** When updating lists or grids, cache the parent container first and access `container.children` for updates. Use `DocumentFragment` to batch DOM node insertions to prevent layout thrashing on render.

## 2024-11-10 - O(1) Hoisting in Vanilla JS Render Loops
**Learning:** In Vanilla JS DOM rendering functions, synchronous operations like `localStorage.getItem()` and `JSON.parse()` placed inside loops (like `for (let testName in testData)`) can cause render loop thrashing and slow down UI updates, even for small lists.
**Action:** Always hoist expensive synchronous operations like `localStorage.getItem` and `JSON.parse` outside of iteration loops to prevent GC pauses and speed up rendering.

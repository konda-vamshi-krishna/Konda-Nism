
## 2024-05-24 - DOM Lookups in Vanilla JS Rendering Loops
**Learning:** Found an O(n) layout thrashing and DOM querying bottleneck in `updateGridStyles` and `buildActiveGrid` within `js/app.js`. When using Vanilla JS for mock tests with hundreds of options, appending grid buttons one-by-one inside a loop causes layout thrashing, and performing `document.getElementById` to find each button inside a loop causes heavy performance penalties.
**Action:** Always batch DOM insertions using `document.createDocumentFragment()` to minimize layout thrashing. Instead of looking up elements inside a loop with `document.getElementById`, cache the parent container element outside the loop and iterate through `container.children` directly.

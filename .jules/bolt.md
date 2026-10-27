## 2026-10-27 - Optimized DOM rendering in question grid
**Learning:** The legacy vanilla JS code re-queried the DOM inside loops (`document.getElementById`) and executed redundant DOM style updates even when classes didn't change, causing layout thrashing.
**Action:** Always prefer `DocumentFragment` for batch insertions and index-based lookups (`container.children[i]`) over ID lookups inside loops. Used string concatenation and a check `btn.className !== targetClass` to avoid redundant repaints. This pattern applies generally in this vanilla JS codebase.

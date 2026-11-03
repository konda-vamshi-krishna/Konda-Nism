## 2024-03-XX - DOM Manipulation Performance
**Learning:** Found usage of iterative appendChild within loops which leads to layout thrashing and slow rendering for large lists. Codebase prefers caching container elements, accessing container.children, and using DocumentFragment for batch insertions.
**Action:** Replace iterative `appendChild` within loops with `DocumentFragment` construction and a single `appendChild` call.

## 2024-05-18 - Keyboard Navigation for Flashcards
**Learning:** Adding keyboard support (Enter/Space to flip, arrows to navigate) and focus-visible indicators makes interactive elements like flashcards significantly more usable for power users and keyboard navigators. Specifically scoping global keydown listeners to the active tab is crucial to prevent cross-view side effects.
**Action:** Next time implementing a custom component like flashcards, build in `tabindex="0"` and keyboard event handling from the start.

# Graph Report - .  (2026-07-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 136 nodes · 209 edges · 27 communities (24 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4cba93b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- marked.min.js
- app.js
- parseInline
- startSimulator
- renderActiveQuestion
- inlineTokens
- parseMarkdown
- renderFlashcard
- A
- table
- complete_all_tests.py
- updateAnalyticsUI
- listitem
- parse_tests.py
- parse

## God Nodes (most connected - your core abstractions)
1. `parseInline()` - 10 edges
2. `renderActiveQuestion()` - 10 edges
3. `R()` - 8 edges
4. `parseMarkdown()` - 8 edges
5. `startSimulator()` - 8 edges
6. `link()` - 7 edges
7. `renderFlashcard()` - 7 edges
8. `A()` - 6 edges
9. `initializeApp()` - 5 edges
10. `saveActiveTestState()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `code()` --calls--> `R()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 2 → community 8_
- `listitem()` --calls--> `R()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 2 → community 12_
- `link()` --calls--> `me()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 5 → community 2_
- `parseMarkdown()` --calls--> `onError()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 6 → community 2_
- `initializeApp()` --calls--> `renderFlashcard()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 1 → community 7_

## Import Cycles
- None detected.

## Communities (27 total, 3 thin omitted)

### Community 0 - "marked.min.js"
Cohesion: 0.10
Nodes (4): constructor(), fences(), rt(), use()

### Community 1 - "app.js"
Cohesion: 0.14
Nodes (9): allLanguages, answers, applySavedLanguage(), flashcardsList, initializeApp(), loadLocalStorage(), setupFlashcardDecks(), setupTestSelectors() (+1 more)

### Community 2 - "parseInline"
Cohesion: 0.19
Nodes (14): br(), codespan(), de(), del(), em(), html(), image(), link() (+6 more)

### Community 3 - "startSimulator"
Cohesion: 0.24
Nodes (10): formatTime(), initiateNewTest(), mdToHtml(), renderNotes(), resumeActiveTest(), saveActiveTestState(), selectSimOption(), simSubmit() (+2 more)

### Community 4 - "renderActiveQuestion"
Cohesion: 0.32
Nodes (8): buildActiveGrid(), closeDrawer(), closeResults(), renderActiveQuestion(), selectSimOptionUI(), simNext(), simPrev(), updateGridStyles()

### Community 5 - "inlineTokens"
Cohesion: 0.29
Nodes (7): blockTokens(), inlineTokens(), lex(), lexer(), lexInline(), me(), reflink()

### Community 6 - "parseMarkdown"
Cohesion: 0.29
Nodes (7): parseMarkdown(), postprocess(), preprocess(), processAllTokens(), provideLexer(), provideParser(), walkTokens()

### Community 7 - "renderFlashcard"
Cohesion: 0.40
Nodes (6): jumpToFlashcard(), loadFlashcardDeck(), nextCard(), prevCard(), renderFlashcard(), shuffleCards()

### Community 8 - "A"
Cohesion: 0.40
Nodes (5): A(), blockquote(), code(), heading(), hr()

### Community 9 - "table"
Cohesion: 0.50
Nodes (4): table(), tablecell(), tablerow(), Y()

### Community 11 - "updateAnalyticsUI"
Cohesion: 0.67
Nodes (3): removeBookmark(), toggleBookmarkActiveQuestion(), updateAnalyticsUI()

### Community 12 - "listitem"
Cohesion: 0.67
Nodes (3): checkbox(), list(), listitem()

## Knowledge Gaps
- **4 isolated node(s):** `answers`, `starredQuestions`, `flashcardsList`, `allLanguages`
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `parseInline()` connect `parseInline` to `marked.min.js`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `renderActiveQuestion()` connect `renderActiveQuestion` to `updateAnalyticsUI`, `app.js`, `startSimulator`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `parseMarkdown()` connect `parseMarkdown` to `marked.min.js`, `parseInline`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `answers`, `starredQuestions`, `flashcardsList` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `marked.min.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09956709956709957 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
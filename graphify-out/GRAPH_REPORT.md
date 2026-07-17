# Graph Report - g:/mock text  (2026-07-18)

## Corpus Check
- 46 files · ~329,556 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 191 nodes · 300 edges · 34 communities (30 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- marked.min.js Core Compiler
- app.js State Management
- marked.min.js Inline Tokenizer Elements
- app.js Test Simulator Engine
- app.js Dashboard & Lifecycle
- app.js Simulator UI & Drawer
- app.js Course Uploader & Files Drag-Drop
- marked.min.js Lexer Controls
- app.js Markdown Preprocessor & Lexer Wrapper
- app.js Flashcard Component
- build_engine.py Module Exporter
- marked.min.js HTML Block Elements
- app.js GitHub Contribution API Client
- marked.min.js Table Elements
- complete_all_tests.py Question Padding
- marked.min.js List Elements
- parse_tests.py Legacy Test Parser
- rebuild_everything.py Course Rebuilder
- sw.js PWA Service Worker & Cache Controller
- apply_audit_fixes.py Test Corrector

## God Nodes (most connected - your core abstractions)
1. `parseInline()` - 10 edges
2. `renderActiveQuestion()` - 10 edges
3. `getStorageKey()` - 9 edges
4. `R()` - 8 edges
5. `parseMarkdown()` - 8 edges
6. `startSimulator()` - 8 edges
7. `setupDropzone()` - 8 edges
8. `link()` - 7 edges
9. `saveActiveTestState()` - 7 edges
10. `mergeDroppedFileIntoBuffer()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `code()` --calls--> `R()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 3 → community 13_
- `listitem()` --calls--> `R()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 3 → community 16_
- `link()` --calls--> `me()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 8 → community 3_
- `parseMarkdown()` --calls--> `onError()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 9 → community 3_
- `resumeActiveTest()` --calls--> `getStorageKey()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 7 → community 6_

## Import Cycles
- None detected.

## Communities (34 total, 4 thin omitted)

### Community 0 - "marked.min.js Core Compiler"
Cohesion: 0.09
Nodes (14): allLanguages, answers, encodeBase64(), flashcardsList, githubRequest(), globalData, ignoredFiles, notesData (+6 more)

### Community 1 - "app.js State Management"
Cohesion: 0.09
Nodes (6): constructor(), fences(), parse(), parser(), rt(), use()

### Community 2 - "marked.min.js Inline Tokenizer Elements"
Cohesion: 0.22
Nodes (14): ALLOWED_CORE_FILES, checkCompilationCheckpoint(), clearStagedFiles(), handleFileSelect(), isCompilerActive(), logToTerminal(), mergeDroppedFileIntoBuffer(), resetContributePage() (+6 more)

### Community 3 - "app.js Test Simulator Engine"
Cohesion: 0.19
Nodes (14): br(), codespan(), de(), del(), em(), html(), image(), link() (+6 more)

### Community 4 - "app.js Dashboard & Lifecycle"
Cohesion: 0.20
Nodes (10): applySavedLanguage(), backToCourses(), CourseScope, initializeApp(), refreshDashboardRegistry(), removeShimmerLoadingState(), renderCourseGrid(), selectCourse() (+2 more)

### Community 5 - "app.js Simulator UI & Drawer"
Cohesion: 0.28
Nodes (9): buildActiveGrid(), closeDrawer(), closeResults(), renderActiveQuestion(), selectSimOption(), selectSimOptionUI(), simNext(), simPrev() (+1 more)

### Community 6 - "app.js Course Uploader & Files Drag-Drop"
Cohesion: 0.36
Nodes (8): formatTime(), initiateNewTest(), renderChapterHtml(), renderNotes(), resumeActiveTest(), saveActiveTestState(), startSimulator(), switchTab()

### Community 7 - "marked.min.js Lexer Controls"
Cohesion: 0.48
Nodes (7): getStorageKey(), loadLocalStorage(), removeBookmark(), setupTestSelectors(), simSubmit(), toggleBookmarkActiveQuestion(), updateAnalyticsUI()

### Community 8 - "app.js Markdown Preprocessor & Lexer Wrapper"
Cohesion: 0.29
Nodes (7): blockTokens(), inlineTokens(), lex(), lexer(), lexInline(), me(), reflink()

### Community 9 - "app.js Flashcard Component"
Cohesion: 0.29
Nodes (7): parseMarkdown(), postprocess(), preprocess(), processAllTokens(), provideLexer(), provideParser(), walkTokens()

### Community 10 - "build_engine.py Module Exporter"
Cohesion: 0.40
Nodes (6): jumpToFlashcard(), loadFlashcardDeck(), nextCard(), prevCard(), renderFlashcard(), shuffleCards()

### Community 11 - "marked.min.js HTML Block Elements"
Cohesion: 0.47
Nodes (5): Validates that decentralized multi-source library arrays follow strict security, Rule G: Asserts sequential chapter_idx mapping starting strictly at 1 with no ga, validate_chapter_indices(), validate_external_resource_pointers(), validate_module()

### Community 12 - "app.js GitHub Contribution API Client"
Cohesion: 0.70
Nodes (4): generate_flashcards(), main(), parse_notes_file(), parse_test_file()

### Community 13 - "marked.min.js Table Elements"
Cohesion: 0.40
Nodes (5): A(), blockquote(), code(), heading(), hr()

### Community 14 - "complete_all_tests.py Question Padding"
Cohesion: 0.50
Nodes (4): table(), tablecell(), tablerow(), Y()

### Community 16 - "parse_tests.py Legacy Test Parser"
Cohesion: 0.67
Nodes (3): checkbox(), list(), listitem()

## Knowledge Gaps
- **12 isolated node(s):** `globalData`, `testData`, `notesData`, `answers`, `starredQuestions` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `parseInline()` connect `app.js Test Simulator Engine` to `app.js State Management`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `renderActiveQuestion()` connect `app.js Simulator UI & Drawer` to `marked.min.js Core Compiler`, `app.js Course Uploader & Files Drag-Drop`, `marked.min.js Lexer Controls`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `parseMarkdown()` connect `app.js Flashcard Component` to `app.js State Management`, `app.js Test Simulator Engine`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `globalData`, `testData`, `notesData` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `marked.min.js Core Compiler` be split into smaller, more focused modules?**
  _Cohesion score 0.08615384615384615 - nodes in this community are weakly interconnected._
- **Should `app.js State Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09420289855072464 - nodes in this community are weakly interconnected._
# Graph Report - g:/mock text  (2026-07-18)

## Corpus Check
- 1 files · ~331,708 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 199 nodes · 314 edges · 37 communities (32 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Settings & Translate Language Controls
- Markdown Parsing Syntax Utilities
- Mock Test Lifecycle & Simulator Handlers
- Markdown Inline Syntax Tokens
- Ingestion Buffer & Compilation Storage Checkpoints
- Markdown Lexer Core Routines
- Markdown Parser Initialization Gates
- Dashboard Navigation & Course Registry Cards
- Flashcards Study Mode Engine
- Course Module Verification Validators
- Back-end Flashcard & Notes Generators
- PDF Binary Text Extractor Pipelines
- Markdown Document Element Nodes
- LMS Interface View Layouts
- Registry Sync & App Lifecycle Initializer
- GitHub Contribution PR Dispatcher
- Markdown Table Grid Synthesizer
- Global Test Coverage Pool Runner
- Markdown Checkbox List Synthesizers
- Test JSON Parser & Compiler Utility
- Workspace Build & Section Purge Utility
- Service Worker Caching Manifest
- Notes View & Markdown Document Renderer

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
  js/marked.min.js → js/marked.min.js  _Bridges community 3 → community 12_
- `listitem()` --calls--> `R()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 3 → community 18_
- `link()` --calls--> `me()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 5 → community 3_
- `parseMarkdown()` --calls--> `onError()`  [EXTRACTED]
  js/marked.min.js → js/marked.min.js  _Bridges community 6 → community 3_
- `initializeApp()` --calls--> `renderCourseGrid()`  [EXTRACTED]
  js/app.js → js/app.js  _Bridges community 14 → community 7_

## Import Cycles
- None detected.

## Communities (37 total, 5 thin omitted)

### Community 0 - "App Settings & Translate Language Controls"
Cohesion: 0.08
Nodes (12): allLanguages, answers, checkCompilationCheckpoint(), flashcardsList, globalData, ignoredFiles, notesData, resetContributePage() (+4 more)

### Community 1 - "Markdown Parsing Syntax Utilities"
Cohesion: 0.09
Nodes (6): constructor(), fences(), parse(), parser(), rt(), use()

### Community 2 - "Mock Test Lifecycle & Simulator Handlers"
Cohesion: 0.16
Nodes (22): buildActiveGrid(), closeDrawer(), closeResults(), formatTime(), getStorageKey(), initiateNewTest(), loadLocalStorage(), removeBookmark() (+14 more)

### Community 3 - "Markdown Inline Syntax Tokens"
Cohesion: 0.19
Nodes (14): br(), codespan(), de(), del(), em(), html(), image(), link() (+6 more)

### Community 4 - "Ingestion Buffer & Compilation Storage Checkpoints"
Cohesion: 0.36
Nodes (10): ALLOWED_CORE_FILES, clearStagedFiles(), handleFileSelect(), isCompilerActive(), mergeDroppedFileIntoBuffer(), saveCompilationCheckpoint(), setupDropzone(), syncStagedFilesFromBuffer() (+2 more)

### Community 5 - "Markdown Lexer Core Routines"
Cohesion: 0.29
Nodes (7): blockTokens(), inlineTokens(), lex(), lexer(), lexInline(), me(), reflink()

### Community 6 - "Markdown Parser Initialization Gates"
Cohesion: 0.29
Nodes (7): parseMarkdown(), postprocess(), preprocess(), processAllTokens(), provideLexer(), provideParser(), walkTokens()

### Community 7 - "Dashboard Navigation & Course Registry Cards"
Cohesion: 0.33
Nodes (6): backToCourses(), CourseScope, removeShimmerLoadingState(), renderCourseGrid(), selectCourse(), showShimmerLoadingState()

### Community 8 - "Flashcards Study Mode Engine"
Cohesion: 0.40
Nodes (6): jumpToFlashcard(), loadFlashcardDeck(), nextCard(), prevCard(), renderFlashcard(), shuffleCards()

### Community 9 - "Course Module Verification Validators"
Cohesion: 0.47
Nodes (5): Validates that decentralized multi-source library arrays follow strict security, Rule G: Asserts sequential chapter_idx mapping starting strictly at 1 with no ga, validate_chapter_indices(), validate_external_resource_pointers(), validate_module()

### Community 10 - "Back-end Flashcard & Notes Generators"
Cohesion: 0.70
Nodes (4): generate_flashcards(), main(), parse_notes_file(), parse_test_file()

### Community 11 - "PDF Binary Text Extractor Pipelines"
Cohesion: 0.60
Nodes (5): ingestFileIntoWorkspace(), lazyLoadPDFEngine(), logToTerminal(), parseStructuralTextFromPDF(), restoreCompilationSession()

### Community 12 - "Markdown Document Element Nodes"
Cohesion: 0.40
Nodes (5): A(), blockquote(), code(), heading(), hr()

### Community 13 - "LMS Interface View Layouts"
Cohesion: 0.50
Nodes (4): Konda Universal LMS Web App UI, Interactive Course Contribution Workspace, Course Registry Selection & Practice Mode Control Grid, Dashboard & Module Navigation Bar

### Community 14 - "Registry Sync & App Lifecycle Initializer"
Cohesion: 0.50
Nodes (4): applySavedLanguage(), initializeApp(), refreshDashboardRegistry(), updateScopeUI()

### Community 15 - "GitHub Contribution PR Dispatcher"
Cohesion: 0.50
Nodes (4): encodeBase64(), githubRequest(), showPRSuccessScreen(), submitContributionPR()

### Community 16 - "Markdown Table Grid Synthesizer"
Cohesion: 0.50
Nodes (4): table(), tablecell(), tablerow(), Y()

### Community 18 - "Markdown Checkbox List Synthesizers"
Cohesion: 0.67
Nodes (3): checkbox(), list(), listitem()

## Knowledge Gaps
- **13 isolated node(s):** `STATIC_SHELL_URLS`, `STATIC_SHELL_MATCHES`, `Dashboard & Module Navigation Bar`, `globalData`, `testData` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Course Registry Selection & Practice Mode Control Grid` connect `LMS Interface View Layouts` to `App Settings & Translate Language Controls`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `Interactive Course Contribution Workspace` connect `LMS Interface View Layouts` to `App Settings & Translate Language Controls`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `STATIC_SHELL_URLS`, `STATIC_SHELL_MATCHES`, `Dashboard & Module Navigation Bar` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Settings & Translate Language Controls` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Markdown Parsing Syntax Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.09420289855072464 - nodes in this community are weakly interconnected._
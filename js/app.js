let globalData = {
    registry: [],
    courses: {},
    activeSimulationInProgress: false,
    pendingCacheRefresh: false
};
let currentCourseId = null;
let testData = {};
let notesData = { parts: [], flashcards: [] };
let activeCourseController = null;

function getStorageKey(baseKey) {
    if (!currentCourseId) return `prepmaster_global_${baseKey}`;
    return `prepmaster_${currentCourseId}_${baseKey}`;
}

// Shimmer Loader Visual Feedback
function showShimmerLoadingState() {
    const gridContainer = document.getElementById('courseSelectionGrid');
    if (!gridContainer) return;
    
    // Remove any existing shimmer first
    const existing = document.getElementById('courseShimmerLoader');
    if (existing) existing.remove();
    
    const shimmer = document.createElement('div');
    shimmer.id = 'courseShimmerLoader';
    shimmer.className = 'card shimmer-card';
    shimmer.innerHTML = `
        <div class="shimmer-title" style="height: 32px; background: var(--border-color); border-radius: 6px; width: 60%; margin-bottom: 16px; position: relative; overflow: hidden;"></div>
        <div class="shimmer-body" style="height: 18px; background: var(--border-color); border-radius: 4px; width: 90%; margin-bottom: 8px; position: relative; overflow: hidden;"></div>
        <div class="shimmer-body short" style="height: 18px; background: var(--border-color); border-radius: 4px; width: 50%; position: relative; overflow: hidden;"></div>
    `;
    gridContainer.style.display = 'none';
    gridContainer.parentNode.insertBefore(shimmer, gridContainer.nextSibling);
}

function removeShimmerLoadingState() {
    const shimmer = document.getElementById('courseShimmerLoader');
    if (shimmer) {
        shimmer.remove();
    }
    const gridContainer = document.getElementById('courseSelectionGrid');
    if (gridContainer) {
        gridContainer.style.display = 'grid';
    }
}

// Course Scope Wrapper for strict state management
const CourseScope = {
    courseId: null,
    testData: {},
    notesData: { parts: [], flashcards: [] },

    isActive() {
        return this.courseId !== null;
    },

    enter(courseId) {
        const courseData = globalData.courses[courseId];
        if (!courseData) {
            console.error(`Course ${courseId} not found in registry.`);
            removeShimmerLoadingState();
            return false;
        }

        this.courseId = courseId;
        this.testData = courseData.tests || {};
        this.notesData = {
            chapters: (courseData.notes && courseData.notes.chapters) || [],
            flashcards: courseData.flashcards || []
        };

        // Expose to global variables for compatibility with legacy core logic
        currentCourseId = this.courseId;
        testData = this.testData;
        notesData = this.notesData;

        flashcardsList = [...this.notesData.flashcards];
        currentFcIndex = 0;

        // UI transitions
        removeShimmerLoadingState();
        document.getElementById('courseSelectionGrid').style.display = 'none';
        document.getElementById('courseContentArea').style.display = 'block';
        document.getElementById('courseStatsStrip').style.display = 'flex';

        // Setup components
        setupTestSelectors();
        setupFlashcardDecks();
        loadLocalStorage();
        renderFlashcard();

        // Update scoped UI tabs
        updateScopeUI(true);

        // Scroll down to tests
        document.getElementById('courseContentArea').scrollIntoView({ behavior: 'smooth' });
        return true;
    },

    exit() {
        this.courseId = null;
        this.testData = {};
        this.notesData = { chapters: [], flashcards: [] };

        currentCourseId = null;
        testData = {};
        notesData = { chapters: [], flashcards: [] };
        
        flashcardsList = [];
        currentFcIndex = 0;

        // Clear active test simulator states to prevent leaks
        currentActiveTest = null;
        currentQ = 0;
        answers = {};
        isSubmitted = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        globalData.activeSimulationInProgress = false;
        if (globalData.pendingCacheRefresh) {
            globalData.pendingCacheRefresh = false;
            console.log("Exited active test. Re-hydrating pending cache updates.");
            refreshDashboardRegistry();
        }

        // Hide simulator views and buttons
        document.getElementById('simulatorCard').style.display = 'none';
        document.getElementById('simNavCard').style.display = 'none';
        document.getElementById('noActiveTestCard').style.display = 'block';

        // UI transitions
        document.getElementById('courseContentArea').style.display = 'none';
        document.getElementById('courseStatsStrip').style.display = 'none';
        
        const gridContainer = document.getElementById('courseSelectionGrid');
        if (gridContainer) {
            gridContainer.style.display = 'grid';
            gridContainer.style.animation = 'fadeIn 0.4s ease-out';
        }

        // Update scoped UI tabs
        updateScopeUI(false);
        switchTab('dashboard');
    }
};

function updateScopeUI(isInsideCourse) {
    const courseTabs = ['simulator', 'notes', 'flashcards', 'analytics'];
    courseTabs.forEach(tab => {
        const desktopBtn = document.getElementById('tab-' + tab);
        const mobileBtn = document.getElementById('m-tab-' + tab);
        if (desktopBtn) {
            desktopBtn.style.display = isInsideCourse ? 'flex' : 'none';
        }
        if (mobileBtn) {
            mobileBtn.style.display = isInsideCourse ? 'flex' : 'none';
        }
    });
    
    // Toggle right column (Quick Navigation) in dashboard grid
    const rightCol = document.querySelector('.dashboard-grid .right-col');
    if (rightCol) {
        rightCol.style.display = isInsideCourse ? 'block' : 'none';
    }
    
    // Adjust layout based on scope via CSS classes
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) {
        if (isInsideCourse) {
            dashboardGrid.classList.add('inside-course');
        } else {
            dashboardGrid.classList.remove('inside-course');
        }
        dashboardGrid.style.gridTemplateColumns = ''; // Clear inline styles to let media query take effect
    }
}

// Fetch registry.json dynamically on start
async function initializeApp() {
    try {
        updateScopeUI(false); // Hide tabs initially
        
        const response = await fetch('content/registry.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch content/registry.json: HTTP ${response.status}`);
        }
        const registry = await response.json();
        globalData.registry = registry.courses || [];
        
        renderCourseGrid();
        
        // apply global settings (theme, lang)
        const savedLang = localStorage.getItem('prepmaster_lang');
        if (savedLang && savedLang !== 'en') {
            document.body.classList.add('translation-active');
            applySavedLanguage(savedLang);
        }
        const savedTheme = localStorage.getItem('prepmaster_theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            const moon = document.querySelector('.moon-icon');
            const sun = document.querySelector('.sun-icon');
            if (moon) moon.style.display = 'none';
            if (sun) sun.style.display = 'block';
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        const gridContainer = document.getElementById('courseSelectionGrid');
        if (gridContainer) {
            gridContainer.innerHTML = `
                <div class="card" style="border: 1px solid var(--danger); background: var(--danger-light); color: var(--danger); padding: 24px; border-radius: 12px; text-align: center; backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);">
                    <h3 style="margin-top:0;">⚠️ Architectural Load Failure</h3>
                    <p style="margin-bottom: 0;">Could not dynamically load registry: ${error.message}</p>
                    <p style="font-size: 0.9rem; margin-top: 10px; opacity: 0.8;">Make sure you are running a local web server (e.g. <code>python -m http.server</code>) and accessing the app via http://localhost...</p>
                </div>
            `;
        }
    }
}

function renderCourseGrid() {
    const gridContainer = document.getElementById('courseSelectionGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    
    document.getElementById('courseContentArea').style.display = 'none';
    document.getElementById('courseStatsStrip').style.display = 'none';
    gridContainer.style.display = 'grid';
    
    globalData.registry.forEach(course => {
        const btn = document.createElement('button');
        btn.className = 'test-btn not-attempted';
        btn.style.textAlign = 'left';
        btn.style.padding = '20px';
        btn.style.display = 'flex';
        btn.style.flexDirection = 'column';
        btn.style.gap = '8px';
        btn.innerHTML = `
            <div style="font-size:24px; margin-bottom: 8px;">📚</div>
            <div class="test-title" style="font-size: 1.1rem; font-weight: bold;">${course.title}</div>
            <div class="test-status" style="font-size:0.85rem; opacity:0.8; font-weight: normal; line-height: 1.4;">${course.description}</div>
        `;
        btn.onclick = () => selectCourse(course.id);
        gridContainer.appendChild(btn);
    });
}

function backToCourses() {
    CourseScope.exit();
}

// Coordinated loading with AbortController for async safety
async function selectCourse(courseId) {
    if (activeCourseController) {
        activeCourseController.abort();
    }
    activeCourseController = new AbortController();
    const { signal } = activeCourseController;

    const startTestBtn = document.getElementById('startTestBtn');
    if (startTestBtn) {
        startTestBtn.disabled = true;
        startTestBtn.textContent = 'Loading Course Content...';
    }

    showShimmerLoadingState();

    try {
        const course = globalData.registry.find(c => c.id === courseId);
        if (!course) {
            throw new Error(`Course "${courseId}" not found in registry.`);
        }

        const folder = course.folder;
        let [config, tests, notes, flashcards] = await Promise.all([
            fetch(`content/${folder}/config.json`, { signal }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }),
            fetch(`content/${folder}/tests.json`, { signal }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }),
            fetch(`content/${folder}/notes.json`, { signal }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }),
            fetch(`content/${folder}/flashcards.json`, { signal }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
        ]);

        // Defensive self-healing check: If notes are empty, bypass browser/SW cache and force network reload
        if ((!notes || !notes.chapters || notes.chapters.length === 0) && courseId === 'nism-series-8') {
            console.warn("Cached notes.json is empty. Bypassing cache to force reload.");
            try {
                const freshNotes = await fetch(`content/${folder}/notes.json?cb=${Date.now()}`, { signal }).then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                });
                if (freshNotes && freshNotes.chapters && freshNotes.chapters.length > 0) {
                    notes = freshNotes;
                    console.log("Successfully self-healed empty notes from live network.");
                }
            } catch (err) {
                console.error("Self-healing notes fetch failed:", err);
            }
        }

        globalData.courses[courseId] = {
            metadata: config,
            tests: tests,
            notes: notes,
            flashcards: flashcards
        };

        CourseScope.enter(courseId);

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log(`Fetch aborted for course selection: ${courseId}`);
            return;
        }
        console.error("Error loading course content:", error);
        removeShimmerLoadingState();
        if (startTestBtn) {
            startTestBtn.disabled = false;
            startTestBtn.textContent = 'Select a Test to Start';
        }
        alert(`Error loading course content: ${error.message}\nMake sure you are running a local web server.`);
    }
}


// Ensure DOM is fully loaded before fetching and attaching events
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Register Service Worker for PWA Offline Isolation
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });

    // Listen for background update dispatch flags from the Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CONTENT_UPDATED') {
            // Defensively check if the user is in an active test context
            if (!globalData.activeSimulationInProgress) {
                console.log(`Content manifest updated: ${event.data.url}. Re-hydrating engine caches.`);
                refreshDashboardRegistry();
            } else {
                // Defer update execution until user returns to dashboard to prevent memory mutations mid-exam
                globalData.pendingCacheRefresh = true;
                console.log(`Content updated mid-test: ${event.data.url}. Deferring cache re-hydration.`);
            }
        }
    });
}

function refreshDashboardRegistry() {
    initializeApp();
}

      
  let currentActiveTest = null; 
  let currentQ = 0;
  let answers = {};
  let isSubmitted = false;
  let testMode = 'practice'; // 'practice' or 'exam'
  let timeRemaining = 120 * 60; // seconds
  let timerInterval = null;
  let starredQuestions = [];
  
  // Flashcards state
  let flashcardsList = [...notesData.flashcards];
  let currentFcIndex = 0;

  // Load configuration and data from LocalStorage
  function loadLocalStorage() {
      // Starred questions
      const savedStars = localStorage.getItem(getStorageKey('starred_questions'));
      if (savedStars) {
          try {
              starredQuestions = JSON.parse(savedStars);
              if (!Array.isArray(starredQuestions)) starredQuestions = [];
          } catch (e) {
              console.error("Failed to parse starred questions:", e);
              starredQuestions = [];
              localStorage.removeItem(getStorageKey('starred_questions'));
          }
      } else {
          starredQuestions = [];
      }
      
      // Active in-progress test
      const activeTest = localStorage.getItem(getStorageKey('active_test'));
      if (activeTest) {
          try {
              const active = JSON.parse(activeTest);
              const resumeDetails = document.getElementById('resumeDetails');
              const resumeSection = document.getElementById('resumeSection');
              if (resumeSection && resumeDetails && active && active.testName && testData[active.testName]) {
                  resumeSection.style.display = 'block';
                  resumeDetails.textContent = `${active.testName} (${active.mode === 'exam' ? 'Exam' : 'Practice'}) - Question ${active.currentQ + 1} of ${testData[active.testName].length} answered.`;
              } else if (resumeSection) {
                  resumeSection.style.display = 'none';
              }
          } catch (e) {
              console.error("Failed to parse active test state:", e);
              const resumeSection = document.getElementById('resumeSection');
              if (resumeSection) resumeSection.style.display = 'none';
              localStorage.removeItem(getStorageKey('active_test'));
          }
      } else {
          const resumeSection = document.getElementById('resumeSection');
          if (resumeSection) {
              resumeSection.style.display = 'none';
          }
      }
      
      updateAnalyticsUI();
  }

  let selectedTestForLaunch = null;

  function initiateNewTest() {
      if (!selectedTestForLaunch) return;
      const selected = selectedTestForLaunch;
      if (!testData[selected] || testData[selected].length === 0) {
          alert("Error: The selected test contains no questions or is not loaded.");
          return;
      }
      const selectedMode = document.querySelector('input[name="testMode"]:checked').value;
      
      currentActiveTest = selected;
      testMode = selectedMode;
      answers = {};
      currentQ = 0;
      isSubmitted = false;
      timeRemaining = 120 * 60;
      
      // Save state to local storage
      saveActiveTestState();
      
      // Switch tab and load test view
      switchTab('simulator');
      startSimulator();
  }

  function resumeActiveTest() {
      const activeTest = localStorage.getItem(getStorageKey('active_test'));
      if (!activeTest) return;
      
      try {
          const active = JSON.parse(activeTest);
          if (!active || !active.testName || !testData[active.testName]) {
              // Stale state or different course selected
              localStorage.removeItem(getStorageKey('active_test'));
              return;
          }
          currentActiveTest = active.testName;
          testMode = active.mode;
          answers = active.answers || {};
          currentQ = active.currentQ || 0;
          timeRemaining = active.timeRemaining || (120 * 60);
          isSubmitted = active.isSubmitted || false;
          
          switchTab('simulator');
          startSimulator(true);
      } catch (e) {
          console.error("Failed to parse active test state:", e);
          localStorage.removeItem(getStorageKey('active_test'));
      }
  }

  function saveActiveTestState() {
      if (!currentActiveTest || isSubmitted) {
          localStorage.removeItem(getStorageKey('active_test'));
          return;
      }
      localStorage.setItem(getStorageKey('active_test'), JSON.stringify({
          testName: currentActiveTest,
          mode: testMode,
          answers: answers,
          currentQ: currentQ,
          timeRemaining: timeRemaining,
          isSubmitted: isSubmitted
      }));
  }

  function startSimulator(isResumed = false) {
      globalData.activeSimulationInProgress = true;
      document.getElementById('noActiveTestCard').style.display = 'none';
      document.getElementById('simulatorCard').style.display = 'block';
      document.getElementById('simNavCard').style.display = 'block';
      
      document.getElementById('activeTestTitle').textContent = `${currentActiveTest} (${testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'})`;
      document.getElementById('simSubmitBtn').style.display = isSubmitted ? 'none' : 'inline-block';
      
      clearInterval(timerInterval);
      if (testMode === 'exam') {
          document.getElementById('simTimePill').style.display = 'flex';
          document.getElementById('simTimeDisplay').textContent = formatTime(timeRemaining);
          timerInterval = setInterval(() => {
              if (isSubmitted) {
                  clearInterval(timerInterval);
                  return;
              }
              timeRemaining--;
              document.getElementById('simTimeDisplay').textContent = formatTime(timeRemaining);
              
              if (timeRemaining % 30 === 0) { // Auto-save remaining time
                  saveActiveTestState();
              }

              if (timeRemaining <= 300) {
                  document.getElementById('simTimePill').classList.add('urgent');
              }
              
              if (timeRemaining <= 0) {
                  clearInterval(timerInterval);
                  simSubmit(true);
              }
          }, 1000);
      } else {
          document.getElementById('simTimePill').style.display = 'none';
      }
      
      buildActiveGrid();
      renderActiveQuestion();
  }

  function buildActiveGrid() {
      const buildGrid = (containerId) => {
          const container = document.getElementById(containerId);
          container.innerHTML = '';
          const numQ = testData[currentActiveTest].length;
          for (let i = 0; i < numQ; i++) {
              let btn = document.createElement('button');
              btn.className = 'grid-btn';
              btn.id = containerId + '_' + i;
              btn.textContent = i + 1;
              btn.onclick = () => { currentQ = i; renderActiveQuestion(); closeDrawer(); };
              container.appendChild(btn);
          }
      };
      
      buildGrid('activeGridContainer');
      buildGrid('mobileGridContainer');
      updateGridStyles();
  }

  function updateGridStyles() {
      const updateGrid = (containerId) => {
          const numQ = testData[currentActiveTest].length;
          let answeredCount = 0;
          for (let i = 0; i < numQ; i++) {
              const btn = document.getElementById(containerId + '_' + i);
              if (!btn) continue;
              
              btn.className = 'grid-btn';
              if (currentQ === i) btn.classList.add('active');
              
              const q = testData[currentActiveTest][i];
              if (isSubmitted) {
                  if (answers[i] !== undefined && answers[i] !== null) {
                      if (parseInt(answers[i]) === q.answer_idx) {
                          btn.classList.add('correct');
                      } else {
                          btn.classList.add('wrong');
                      }
                  } else {
                      btn.classList.add('unattempted');
                  }
              } else {
                  if (answers[i] !== undefined && answers[i] !== null) {
                      btn.classList.add('answered');
                      answeredCount++;
                  }
              }
          }
          if (!isSubmitted) {
              document.getElementById('gridProgress').textContent = `${answeredCount}/${numQ}`;
          } else {
              document.getElementById('gridProgress').textContent = 'Result Review';
          }
      };
      
      updateGrid('activeGridContainer');
      updateGrid('mobileGridContainer');
  }

  function renderActiveQuestion() {
      const q = testData[currentActiveTest]?.[currentQ];
      // Null-guard: malformed or missing question object — fail gracefully
      if (!q || !Array.isArray(q.options) || q.answer_idx === undefined) {
          document.getElementById('activeQText').innerHTML = '<p style="color:var(--color-wrong);">Question data unavailable. Please restart this test.</p>';
          document.getElementById('activeOptionsArea').innerHTML = '';
          return;
      }
      document.getElementById('activeQNumber').textContent = `Question ${currentQ + 1}/${testData[currentActiveTest].length}`;
      document.getElementById('activeQText').innerHTML = `
          <div class="notranslate">${q.question}</div>
          <div class="translate-box" translate="yes">${q.question}</div>
      `;
      
      // Update Grid active classes
      updateGridStyles();
      
      // Render Options
      const optionsArea = document.getElementById('activeOptionsArea');
      optionsArea.innerHTML = '';
      
      q.options.forEach((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const text = opt;
          
          const div = document.createElement('div');
          div.className = 'option';
          
          const isUserChoice = (answers[currentQ] !== undefined && answers[currentQ] !== null && parseInt(answers[currentQ]) === idx);
          if (isUserChoice) div.classList.add('selected');
          
          if (isSubmitted) {
              const isCorrect = (q.answer_idx === idx);
              if (isCorrect) {
                  div.classList.add('correct');
              } else if (isUserChoice) {
                  div.classList.add('wrong');
              }
          } else {
              div.onclick = function() { selectSimOptionUI(this, text, idx); };
          }
          
          div.innerHTML = `
              <div class="opt-badge notranslate">${letter}</div>
              <div class="opt-text-container">
                  <div class="notranslate">${text}</div>
                  <div class="translate-box" translate="yes">${text}</div>
              </div>
          `;
          optionsArea.appendChild(div);
      });
      
      // Bookmark button
      const bookmarkBtn = document.getElementById('activeBookmarkBtn');
      const isStarred = starredQuestions.some(sq => sq.testName === currentActiveTest && sq.index === currentQ);
      if (isStarred) {
          bookmarkBtn.classList.add('active');
      } else {
          bookmarkBtn.classList.remove('active');
      }
      
      // Show/Hide explanations
      const expPanel = document.getElementById('activeExpPanel');
      if (isSubmitted || (testMode === 'practice' && answers[currentQ] !== undefined && answers[currentQ] !== null)) {
          expPanel.style.display = 'block';
          const correctText = q.options[q.answer_idx] || '';
          const expHtml = `<h4>Explanation</h4><strong>Correct Answer:</strong> ${correctText}<br><br>${q.explanation || 'To be reviewed.'}<br><br>
            <button class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;" onclick="jumpToFlashcard('${currentActiveTest}', ${currentQ})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Review Related Flashcard
            </button>`;
          expPanel.innerHTML = `
              <div class="notranslate">${expHtml}</div>
              <div class="translate-box" translate="yes">${expHtml}</div>
          `;
      } else {
          expPanel.style.display = 'none';
      }
  }

  function selectSimOptionUI(element, text, optionIdx) {
      answers[currentQ] = optionIdx;
      saveActiveTestState();
      
      // Update UI classes without destroying DOM to preserve translation
      const optionsArea = document.getElementById('activeOptionsArea');
      Array.from(optionsArea.children).forEach(child => {
          child.classList.remove('selected');
      });
      element.classList.add('selected');
      
      updateGridStyles();
      
      // If practice mode, show explanation without full re-render
      if (testMode === 'practice') {
          const q = testData[currentActiveTest][currentQ];
          const expPanel = document.getElementById('activeExpPanel');
          expPanel.style.display = 'block';
          const correctText = q.options[q.answer_idx] || '';
          const expHtml = `<h4>Explanation</h4><strong>Correct Answer:</strong> ${correctText}<br><br>${q.explanation || 'To be reviewed.'}<br><br>
            <button class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;" onclick="jumpToFlashcard('${currentActiveTest}', ${currentQ})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Review Related Flashcard
            </button>`;
          expPanel.innerHTML = `
              <div class="notranslate">${expHtml}</div>
              <div class="translate-box" translate="yes">${expHtml}</div>
          `;
      }
  }

  // Legacy fallback
  function selectSimOption(optionIdx) {
      answers[currentQ] = optionIdx;
      saveActiveTestState();
      renderActiveQuestion();
  }

  function simPrev() {
      if (currentQ > 0) {
          currentQ--;
          renderActiveQuestion();
      }
  }

  function simNext() {
      if (currentQ < testData[currentActiveTest].length - 1) {
          currentQ++;
          renderActiveQuestion();
      }
  }

  function simSubmit(isAuto = false) {
      if (isSubmitted) return;
      
      if (!isAuto) {
          if (!confirm("Are you sure you want to submit your mock test?")) return;
      }
      
      isSubmitted = true;
      clearInterval(timerInterval);
      document.getElementById('simSubmitBtn').style.display = 'none';
      
      let correct = 0;
      let wrong = 0;
      let unanswered = 0;
      
      const questions = testData[currentActiveTest];
      for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (answers[i] !== undefined && answers[i] !== null) {
              if (parseInt(answers[i]) === q.answer_idx) {
                  correct++;
              } else {
                  wrong++;
              }
          } else {
              unanswered++;
          }
      }
      
      // Save to history
      const history = JSON.parse(localStorage.getItem(getStorageKey('test_history')) || '[]');
      history.unshift({
          testName: currentActiveTest,
          mode: testMode,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          score: `${correct}/${questions.length}`,
          percent: Math.round((correct / questions.length) * 100)
      });
      localStorage.setItem(getStorageKey('test_history'), JSON.stringify(history));
      
      // Remove active test from localstorage
      localStorage.removeItem(getStorageKey('active_test'));
      document.getElementById('resumeSection').style.display = 'none';
      
      // Render results modal
      document.getElementById('valCorrect').textContent = correct;
      document.getElementById('valWrong').textContent = wrong;
      document.getElementById('valUnanswered').textContent = unanswered;
      document.getElementById('scoreHeader').textContent = `Test Results: ${Math.round((correct / questions.length) * 100)}%`;
      document.getElementById('resultsOverlay').style.display = 'flex';
      
      updateAnalyticsUI();
  }

  function closeResults() {
      document.getElementById('resultsOverlay').style.display = 'none';
      currentQ = 0;
      renderActiveQuestion();
  }

  function toggleBookmarkActiveQuestion() {
      const isStarredIdx = starredQuestions.findIndex(sq => sq.testName === currentActiveTest && sq.index === currentQ);
      if (isStarredIdx > -1) {
          starredQuestions.splice(isStarredIdx, 1);
      } else {
          const q = testData[currentActiveTest][currentQ];
          starredQuestions.push({
              testName: currentActiveTest,
              index: currentQ,
              question: q.question,
              answer: q.options[q.answer_idx] || ''
          });
      }
      localStorage.setItem(getStorageKey('starred_questions'), JSON.stringify(starredQuestions));
      renderActiveQuestion();
      updateAnalyticsUI();
  }

  // Navigation Tabs Switch
  function switchTab(tabId) {
      // Guard: if navigating away from simulator with an active timer, freeze it and persist state
      if (tabId !== 'simulator' && timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
          if (typeof saveActiveTestState === 'function') saveActiveTestState();
      }

      if (tabId !== 'dashboard' && tabId !== 'contribute' && !currentCourseId) {
          console.warn(`Attempted to switch to ${tabId} without active course scope.`);
          return;
      }
      
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.mobile-tab-btn').forEach(el => el.classList.remove('active'));
      
      document.getElementById('content-' + tabId).classList.add('active');
      const dBtn = document.getElementById('tab-' + tabId);
      if(dBtn) dBtn.classList.add('active');
      const mBtn = document.getElementById('m-tab-' + tabId);
      if(mBtn) mBtn.classList.add('active');
      
      if(tabId === 'notes') {
          // Renders notes index first if not loaded
          if(!document.getElementById('notesTocContainer').hasChildNodes()) {
              renderNotes();
          }
      }
  }

  // Study Notes Renderer
  function renderNotes() {
      const tocContainer = document.getElementById('notesTocContainer');
      const bodyContainer = document.getElementById('notesBodyContainer');
      tocContainer.innerHTML = '';
      
      const chapters = notesData.chapters || [];
      
      chapters.forEach((chapter, index) => {
          const div = document.createElement('div');
          div.className = 'toc-item' + (index === 0 ? ' active' : '');
          div.textContent = chapter.title;
          div.onclick = () => {
              document.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
              div.classList.add('active');
              const htmlContent = renderChapterHtml(chapter);
              bodyContainer.innerHTML = `
                  <div class="notes-wrapper">
                      <div class="notes-half notranslate">${htmlContent}</div>
                      <div class="notes-half translate-box" translate="yes">${htmlContent}</div>
                  </div>
              `;
              window.scrollTo({ top: 0, behavior: 'smooth' });
          };
          tocContainer.appendChild(div);
      });
      
      // Load initial notes body
      if (chapters.length > 0) {
          const initHtmlContent = renderChapterHtml(chapters[0]);
          bodyContainer.innerHTML = `
              <div class="notes-wrapper">
                  <div class="notes-half notranslate">${initHtmlContent}</div>
                  <div class="notes-half translate-box" translate="yes">${initHtmlContent}</div>
              </div>
          `;
      }
  }

  function renderChapterHtml(chapter) {
      let html = `<h2 class="chapter-title" style="margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">${chapter.title}</h2>`;
      const sections = chapter.sections || [];
      sections.forEach(section => {
          html += `<div class="notes-section" style="margin-bottom: 25px;">`;
          if (section.heading) {
              html += `<h3 class="section-heading" style="font-size: 1.25rem; font-weight: 600; color: var(--primary-color); margin-bottom: 10px;">${section.heading}</h3>`;
          }
          if (section.body) {
              // Convert newlines in JSON to paragraphs and clean lists
              const formattedBody = section.body.split('\n\n').map(p => {
                  if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
                      const items = p.split('\n').map(item => `<li>${item.replace(/^[\-\*\s]+/, '')}</li>`).join('');
                      return `<ul style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc;">${items}</ul>`;
                  }
                  return `<p style="line-height: 1.6; margin-bottom: 12px; color: var(--text-secondary);">${p.replace(/\n/g, '<br>')}</p>`;
              }).join('');
              html += `<div class="section-body">${formattedBody}</div>`;
          }
          html += `</div>`;
      });
      return html;
  }

  // A very lightweight markdown formatter
  function mdToHtml(md) {
      if (typeof marked !== 'undefined') {
          return marked.parse(md);
      }
      return "<p>Error: Markdown parser not loaded.</p>";
  }

  // Flashcards flipping and loading
  function flipCard(cardEl) {
      cardEl.classList.toggle('flipped');
  }

  // Analytics UI Refresher
  window.resetAllProgress = function() {
      if (confirm("Are you sure you want to reset all your mock test progress and saved data? This cannot be undone.")) {
          localStorage.removeItem(getStorageKey('test_history'));
          localStorage.removeItem(getStorageKey('active_test'));
          localStorage.removeItem(getStorageKey('starred_questions'));
          localStorage.removeItem('prepmaster_lang');
          alert("All progress has been reset. The application will now reload.");
          window.location.reload();
      }
  };

  function updateAnalyticsUI() {
      const history = JSON.parse(localStorage.getItem(getStorageKey('test_history')) || '[]');
      
      // Update statistics
      document.getElementById('statAttempts').textContent = history.length;
      if (history.length > 0) {
          const totalPercent = history.reduce((acc, item) => acc + item.percent, 0);
          document.getElementById('statAvgScore').textContent = Math.round(totalPercent / history.length) + '%';
      } else {
          document.getElementById('statAvgScore').textContent = '0%';
      }

      // Render History List
      const historyContainer = document.getElementById('historyListContainer');
      historyContainer.innerHTML = '';
      
      if (history.length === 0) {
          historyContainer.innerHTML = '<div class="empty-state">No mock tests completed yet.</div>';
      } else {
          history.forEach(item => {
              const div = document.createElement('div');
              div.className = 'history-item';
              div.innerHTML = `
                  <div class="history-info">
                      <h4>${item.testName}</h4>
                      <span>${item.date} • Mode: ${item.mode === 'exam' ? 'Exam' : 'Practice'}</span>
                  </div>
                  <div class="history-score ${item.percent >= 60 ? 'color-correct' : 'color-wrong'}">
                      Score: ${item.score} (${item.percent}%)
                  </div>
              `;
              historyContainer.appendChild(div);
          });
      }

      // Render Starred/Bookmarked questions
      const bookmarksContainer = document.getElementById('bookmarksListContainer');
      bookmarksContainer.innerHTML = '';
      
      if (starredQuestions.length === 0) {
          bookmarksContainer.innerHTML = '<div class="empty-state">No questions bookmarked yet. Use the star icon during mock tests.</div>';
      } else {
          starredQuestions.forEach((sq, idx) => {
              const div = document.createElement('div');
              div.className = 'history-item';
              div.style.flexDirection = 'column';
              div.style.alignItems = 'flex-start';
              div.innerHTML = `
                  <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <strong>${sq.testName} - Q${sq.index + 1}</strong>
                      <span onclick="removeBookmark(${idx})" style="color: var(--danger); cursor: pointer; font-size: 0.85rem; font-weight: 600;">Remove</span>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 500;">${sq.question}</p>
                  <p style="margin: 0; font-size: 0.9rem; color: var(--success); font-weight: 600;">Correct Answer: ${sq.answer}</p>
              `;
              bookmarksContainer.appendChild(div);
          });
      }
  }

  function removeBookmark(idx) {
      starredQuestions.splice(idx, 1);
      localStorage.setItem(getStorageKey('starred_questions'), JSON.stringify(starredQuestions));
      updateAnalyticsUI();
  }

  // Theme Controller
  function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const sun = document.querySelector('.sun-icon');
      const moon = document.querySelector('.moon-icon');
      
      if (currentTheme === 'dark') {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('prepmaster_theme', 'light');
          sun.style.display = 'none';
          moon.style.display = 'block';
      } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('prepmaster_theme', 'dark');
          sun.style.display = 'block';
          moon.style.display = 'none';
      }
  }

  // Mobile Drawer Toggle
  function openDrawer() {
      document.getElementById('drawerOverlay').style.display = 'block';
      document.getElementById('mobileDrawer').classList.add('open');
  }

  function closeDrawer() {
      document.getElementById('drawerOverlay').style.display = 'none';
      const drawer = document.getElementById('mobileDrawer');
      if (drawer) drawer.classList.remove('open');
  }

  function updateStartTitle(val) {
      document.getElementById('startTitle').textContent = val;
  }

  function formatTime(seconds) {
      let h = Math.floor(seconds / 3600);
      let m = Math.floor((seconds % 3600) / 60);
      let s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Initialize test grid selection
  function setupTestSelectors() {
      const gridContainer = document.getElementById('testSelectionGrid');
      const startBtn = document.getElementById('startTestBtn');
      const totalCountSpan = document.getElementById('totalTestCount');
      
      if (!gridContainer || !startBtn) return;
      
      const tests = Object.keys(testData);
      
      if (totalCountSpan) {
          totalCountSpan.textContent = tests.length;
      }
      
      gridContainer.innerHTML = '';
      
      const history = JSON.parse(localStorage.getItem(getStorageKey('test_history')) || '[]');
      let firstTest = null;
      for (let testName in testData) {
          if (!firstTest) firstTest = testName;
          
          let btn = document.createElement('div');
          btn.className = 'test-btn not-attempted';
          
          // Check history
          const testHistory = history.filter(h => h.testName === testName);
          let statusText = 'Not Attempted';
          let statusIcon = '📝';
          if (testHistory.length > 0) {
              btn.className = 'test-btn completed';
              statusText = `Completed: ${testHistory[testHistory.length-1].percent}%`;
              statusIcon = '✅';
          }
          
          // Check in-progress
          const activeTest = localStorage.getItem(getStorageKey('active_test'));
          if (activeTest) {
              const active = JSON.parse(activeTest);
              if (active.testName === testName) {
                  btn.className = 'test-btn in-progress';
                  statusText = 'In Progress';
                  statusIcon = '⏳';
              }
          }

          btn.innerHTML = `
            <div style="font-size:24px; margin-bottom: 4px;">${statusIcon}</div>
            <div class="thumb-title" style="font-weight:bold;">${testName}</div>
            <div class="thumb-status" style="font-size:0.8rem; opacity:0.8;">${statusText}</div>
          `;
          
          btn.onclick = function() {
              // Deselect all
              document.querySelectorAll('.test-selection-grid .test-btn').forEach(b => b.classList.remove('selected'));
              btn.classList.add('selected');
              selectedTestForLaunch = testName;
              startBtn.textContent = 'Start ' + testName;
              startBtn.disabled = false;
          };
          
          gridContainer.appendChild(btn);
      }
      
      if (firstTest) {
          // Auto-select first test
          const firstBtn = gridContainer.querySelector('.test-btn');
          if (firstBtn) firstBtn.click();
      }
  }

  function renderFlashcard() {
      const card = flashcardsList[currentFcIndex];
      document.getElementById('flashcardElement').classList.remove('flipped');
      setTimeout(() => {
          document.getElementById('fcFrontCategory').textContent = `Fact #${currentFcIndex + 1}`;
          document.getElementById('fcFrontText').innerHTML = `<div class="notranslate">${card.front}</div><div class="translate-box" translate="yes">${card.front}</div>`;
          document.getElementById('fcBackText').innerHTML = `<div class="notranslate">${card.back}</div><div class="translate-box" translate="yes">${card.back}</div>`;
          document.getElementById('fcProgress').textContent = `Card ${currentFcIndex + 1} / ${flashcardsList.length}`;
      }, 150);
  }

  function nextCard() {
      if (currentFcIndex < flashcardsList.length - 1) {
          currentFcIndex++;
          renderFlashcard();
      }
  }

  function prevCard() {
      if (currentFcIndex > 0) {
          currentFcIndex--;
          renderFlashcard();
      }
  }

  function shuffleCards() {
      for (let i = flashcardsList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [flashcardsList[i], flashcardsList[j]] = [flashcardsList[j], flashcardsList[i]];
      }
      currentFcIndex = 0;
      renderFlashcard();
  }
  
  function setupFlashcardDecks() {
      const select = document.getElementById('fcDeckSelect');
      if (!select) return;
      
      const tests = new Set();
      notesData.flashcards.forEach(fc => {
          if (fc.testName) tests.add(fc.testName);
      });
      
      tests.forEach(t => {
          const count = notesData.flashcards.filter(fc => fc.testName === t).length;
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = `${t} (${count} cards)`;
          select.appendChild(opt);
      });
  }

  function loadFlashcardDeck(deckValue) {
      if (deckValue === 'all') {
          flashcardsList = [...notesData.flashcards];
      } else {
          flashcardsList = notesData.flashcards.filter(fc => fc.testName === deckValue);
      }
      currentFcIndex = 0;
      renderFlashcard();
  }

  function jumpToFlashcard(testName, qIndex) {
      const fcIndex = notesData.flashcards.findIndex(fc => fc.testName === testName && fc.questionIndex === qIndex);
      if (fcIndex !== -1) {
          const select = document.getElementById('fcDeckSelect');
          if (select) {
              select.value = 'all';
              loadFlashcardDeck('all');
          }
          currentFcIndex = fcIndex;
          switchTab('flashcards');
          renderFlashcard();
      }
  }

  

// --- Custom Translator Dropdown Logic ---
function toggleTranslateDropdown() {
    document.getElementById('translateDropdown').classList.toggle('show');
}

function applySavedLanguage(langCode) {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } else {
        setTimeout(() => applySavedLanguage(langCode), 500);
    }
}

function setLang(langCode) {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } else {
        console.error("Google Translate widget not found.");
    }
    document.getElementById('translateDropdown').classList.remove('show');
    
    localStorage.setItem('prepmaster_lang', langCode);
    
    if (langCode === 'en' || langCode === '') {
        document.body.classList.remove('translation-active');
    } else {
        document.body.classList.add('translation-active');
    }
}

const allLanguages = {
  "af":"Afrikaans","sq":"Albanian","am":"Amharic","ar":"Arabic","hy":"Armenian","as":"Assamese","ay":"Aymara","az":"Azerbaijani","bm":"Bambara","eu":"Basque","be":"Belarusian","bn":"Bengali","bho":"Bhojpuri","bs":"Bosnian","bg":"Bulgarian","ca":"Catalan","ceb":"Cebuano","ny":"Chichewa","zh-CN":"Chinese (Simplified)","zh-TW":"Chinese (Traditional)","co":"Corsican","hr":"Croatian","cs":"Czech","da":"Danish","dv":"Divehi","nl":"Dutch","en":"English","eo":"Esperanto","et":"Estonian","ee":"Ewe","tl":"Filipino","fi":"Finnish","fr":"French","fy":"Frisian","gl":"Galician","ka":"Georgian","de":"German","el":"Greek","gn":"Guarani","gu":"Gujarati","ht":"Haitian Creole","ha":"Hausa","haw":"Hawaiian","iw":"Hebrew","hi":"Hindi","hmn":"Hmong","hu":"Hungarian","is":"Icelandic","ig":"Igbo","ilo":"Ilocano","id":"Indonesian","ga":"Irish","it":"Italian","ja":"Japanese","jw":"Javanese","kn":"Kannada","kk":"Kazakh","km":"Khmer","rw":"Kinyarwanda","gom":"Konkani","ko":"Korean","kri":"Krio","ku":"Kurdish (Kurmanji)","ckb":"Kurdish (Sorani)","ky":"Kyrgyz","lo":"Lao","la":"Latin","lv":"Latvian","ln":"Lingala","lt":"Lithuanian","lg":"Luganda","lb":"Luxembourgish","mk":"Macedonian","mai":"Maithili","mg":"Malagasy","ms":"Malay","ml":"Malayalam","mt":"Maltese","mi":"Maori","mr":"Marathi","mni-Mtei":"Meiteilon (Manipuri)","lus":"Mizo","mn":"Mongolian","my":"Myanmar (Burmese)","ne":"Nepali","no":"Norwegian","or":"Odia (Oriya)","om":"Oromo","ps":"Pashto","fa":"Persian","pl":"Polish","pt":"Portuguese","pa":"Punjabi","qu":"Quechua","ro":"Romanian","ru":"Russian","sm":"Samoan","sa":"Sanskrit","gd":"Scots Gaelic","nso":"Sepedi","sr":"Serbian","st":"Sesotho","sn":"Shona","sd":"Sindhi","si":"Sinhala","sk":"Slovak","sl":"Slovenian","so":"Somali","es":"Spanish","su":"Sundanese","sw":"Swahili","sv":"Swedish","tg":"Tajik","ta":"Tamil","tt":"Tatar","te":"Telugu","th":"Thai","ti":"Tigrinya","ts":"Tsonga","tr":"Turkish","tk":"Turkmen","ak":"Twi","uk":"Ukrainian","ur":"Urdu","ug":"Uyghur","uz":"Uzbek","vi":"Vietnamese","cy":"Welsh","xh":"Xhosa","yi":"Yiddish","yo":"Yoruba","zu":"Zulu"
};

function populateAllLangs() {
    const list = document.getElementById('allLangsList');
    if(!list) return;
    let html = '';
    for(let code in allLanguages) {
        html += `<div class="lang-opt" data-name="${allLanguages[code].toLowerCase()}" onclick="setLang('${code}')" style="display:none;">${allLanguages[code]}</div>`;
    }
    list.innerHTML = html;
}

function filterLangs() {
    const q = document.getElementById('langSearch').value.toLowerCase().trim();
    const opts = document.querySelectorAll('#allLangsList .lang-opt');
    const quickPicks = document.querySelector('.quick-langs');
    const titles = document.querySelectorAll('.lang-section-title');
    
    if (q.length > 0) {
        if(quickPicks) quickPicks.style.display = 'none';
        if(titles.length > 0) titles[0].style.display = 'none';
        opts.forEach(opt => {
            if(opt.getAttribute('data-name').includes(q)) {
                opt.style.display = 'block';
            } else {
                opt.style.display = 'none';
            }
        });
    } else {
        if(quickPicks) quickPicks.style.display = 'block';
        if(titles.length > 0) titles[0].style.display = 'block';
        opts.forEach(opt => {
            opt.style.display = 'none';
        });
    }
}
window.addEventListener('DOMContentLoaded', () => {
    populateAllLangs();
    setupDropzone();
});

// Dropzone and Contribution Flow State
let stagedFiles = [];
let ignoredFiles = [];
let courseMetadata = null;
let originalContributeHtml = "";

const ALLOWED_CORE_FILES = ['config.json', 'tests.json', 'notes.json', 'flashcards.json'];

function setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    if (!originalContributeHtml) {
        originalContributeHtml = document.getElementById('content-contribute').innerHTML;
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', async (e) => {
        const items = e.dataTransfer.items;
        clearStagedFiles();
        stagedFiles = [];
        ignoredFiles = [];

        document.getElementById('stagedArea').style.display = 'block';
        document.getElementById('validationStatusArea').style.display = 'block';
        document.getElementById('validationSpinner').style.display = 'inline-block';
        
        const logContainer = document.getElementById('validationLogs');
        logContainer.innerHTML = '<div>⏳ Scanning dropped items...</div>';

        try {
            if (items && items.length > 0 && items[0].webkitGetAsEntry) {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i].webkitGetAsEntry();
                    if (item) {
                        await traverseFileTree(item);
                    }
                }
            } else {
                const files = e.dataTransfer.files;
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (ALLOWED_CORE_FILES.includes(file.name.toLowerCase())) {
                        const text = await file.text();
                        stagedFiles.push({
                            name: file.name,
                            path: file.webkitRelativePath || file.name,
                            content: text,
                            size: file.size
                        });
                    } else if (!file.name.startsWith('.')) {
                        ignoredFiles.push(file.name);
                    }
                }
            }
            validateStagedFiles();
        } catch (err) {
            logContainer.innerHTML += `<div style="color:var(--danger)">❌ Error reading dropped items: ${err.message}</div>`;
            document.getElementById('validationSpinner').style.display = 'none';
        }
    });
}

async function traverseFileTree(item, path = "") {
    if (item.isFile) {
        const file = await new Promise((resolve) => item.file(resolve));
        const relativePath = path + file.name;
        // Skip hidden files/folders (like .DS_Store)
        if (file.name.startsWith('.')) return;
        
        if (ALLOWED_CORE_FILES.includes(file.name.toLowerCase())) {
            const text = await file.text();
            stagedFiles.push({
                name: file.name,
                path: relativePath,
                content: text,
                size: file.size
            });
        } else {
            ignoredFiles.push(relativePath);
        }
    } else if (item.isDirectory) {
        // Skip hidden/system directories
        if (item.name.startsWith('.') || item.name === '__pycache__') return;
        
        const dirReader = item.createReader();
        const entries = await new Promise((resolve) => {
            dirReader.readEntries(resolve);
        });
        for (let i = 0; i < entries.length; i++) {
            await traverseFileTree(entries[i], path + item.name + "/");
        }
    }
}

async function handleFileSelect(e) {
    const files = e.target.files;
    clearStagedFiles();
    stagedFiles = [];
    ignoredFiles = [];

    document.getElementById('stagedArea').style.display = 'block';
    document.getElementById('validationStatusArea').style.display = 'block';
    document.getElementById('validationSpinner').style.display = 'inline-block';
    
    const logContainer = document.getElementById('validationLogs');
    logContainer.innerHTML = '<div>⏳ Processing selected files...</div>';

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (ALLOWED_CORE_FILES.includes(file.name.toLowerCase())) {
                const text = await file.text();
                stagedFiles.push({
                    name: file.name,
                    path: file.webkitRelativePath || file.name,
                    content: text,
                    size: file.size
                });
            } else if (!file.name.startsWith('.')) {
                ignoredFiles.push(file.name);
            }
        }
        validateStagedFiles();
    } catch (err) {
        logContainer.innerHTML += `<div style="color:var(--danger)">❌ Error reading selected files: ${err.message}</div>`;
        document.getElementById('validationSpinner').style.display = 'none';
    }
}

function validateStagedFiles() {
    const logContainer = document.getElementById('validationLogs');
    logContainer.innerHTML = '<div>🔍 Validating file structure and schema...</div>';

    const stagedList = document.getElementById('stagedFilesList');
    stagedList.innerHTML = '';

    stagedFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'staged-file-item';
        item.innerHTML = `
            <span>📄 ${file.path} (${(file.size / 1024).toFixed(1)} KB)</span>
            <span class="file-status pending" id="status-${file.name.replace('.', '-')}">Pending</span>
        `;
        stagedList.appendChild(item);
    });

    let isValid = true;
    let configJsonFile = null;
    courseMetadata = null;

    const fileStatuses = {};

    // Helper to update individual file status in UI
    const updateFileStatus = (fileName, status) => {
        fileStatuses[fileName] = status;
        const statusSpan = document.getElementById(`status-${fileName.replace('.', '-')}`);
        if (statusSpan) {
            statusSpan.className = `file-status ${status}`;
            statusSpan.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    // 1. Locate and Validate config.json
    configJsonFile = stagedFiles.find(f => f.name === 'config.json');
    if (!configJsonFile) {
        logContainer.innerHTML += '<div style="color:var(--danger)">❌ Error: Missing mandatory config.json.</div>';
        isValid = false;
    } else {
        try {
            const config = JSON.parse(configJsonFile.content);
            const requiredKeys = ['id', 'title', 'description', 'author', 'version'];
            let configValid = true;

            requiredKeys.forEach(k => {
                if (!config[k] || String(config[k]).trim() === '') {
                    logContainer.innerHTML += `<div style="color:var(--danger)">❌ config.json is missing required key: "${k}".</div>`;
                    configValid = false;
                    isValid = false;
                }
            });

            if (configValid) {
                // Validate folder/ID slug rules (lowercase alphanumeric + hyphens)
                const slugPattern = /^[a-z0-9-]+$/;
                if (!slugPattern.test(config.id)) {
                    logContainer.innerHTML += `<div style="color:var(--danger)">❌ config.json "id" must be lowercase slugified (alphanumeric and hyphens only, e.g. "my-course-slug"). Found: "${config.id}"</div>`;
                    configValid = false;
                    isValid = false;
                }
            }

            if (configValid) {
                courseMetadata = config;
                logContainer.innerHTML += `<div style="color:var(--success)">✅ config.json is valid (ID: ${config.id}, Version: ${config.version}).</div>`;
                updateFileStatus('config.json', 'valid');
            } else {
                updateFileStatus('config.json', 'invalid');
            }
        } catch (e) {
            logContainer.innerHTML += `<div style="color:var(--danger)">❌ config.json is not valid JSON: ${e.message}</div>`;
            isValid = false;
            updateFileStatus('config.json', 'invalid');
        }
    }

    // 2. Locate and Validate tests.json
    const testsJsonFile = stagedFiles.find(f => f.name === 'tests.json');
    if (testsJsonFile) {
        try {
            const testsData = JSON.parse(testsJsonFile.content);
            let testsValid = true;

            if (typeof testsData !== 'object' || Array.isArray(testsData)) {
                logContainer.innerHTML += '<div style="color:var(--danger)">❌ tests.json must be a JSON object mapping test keys to arrays.</div>';
                testsValid = false;
                isValid = false;
            } else {
                for (const testKey in testsData) {
                    if (!testKey.startsWith('test_') || isNaN(testKey.substring(5))) {
                        logContainer.innerHTML += `<div style="color:var(--danger)">❌ tests.json contains invalid key "${testKey}". Expected format: "test_1", "test_2".</div>`;
                        testsValid = false;
                        isValid = false;
                    }

                    const questions = testsData[testKey];
                    if (!Array.isArray(questions)) {
                        logContainer.innerHTML += `<div style="color:var(--danger)">❌ test key "${testKey}" must map to an array of questions.</div>`;
                        testsValid = false;
                        isValid = false;
                        continue;
                    }

                    questions.forEach((q, idx) => {
                        const reqKeys = ['id', 'question', 'options', 'answer_idx', 'explanation'];
                        reqKeys.forEach(rk => {
                            if (q[rk] === undefined) {
                                logContainer.innerHTML += `<div style="color:var(--danger)">❌ Question ${idx + 1} in "${testKey}" is missing required key "${rk}".</div>`;
                                testsValid = false;
                                isValid = false;
                            }
                        });

                        if (q.options && !Array.isArray(q.options)) {
                            logContainer.innerHTML += `<div style="color:var(--danger)">❌ Question ${q.id || idx + 1} options must be a JSON array.</div>`;
                            testsValid = false;
                            isValid = false;
                        } else if (q.options) {
                            if (q.answer_idx !== undefined) {
                                const idxInt = parseInt(q.answer_idx);
                                if (isNaN(idxInt) || idxInt < 0 || idxInt >= q.options.length) {
                                    logContainer.innerHTML += `<div style="color:var(--danger)">❌ Question ${q.id || idx + 1} answer_idx (${q.answer_idx}) is out of bounds for options length ${q.options.length}.</div>`;
                                    testsValid = false;
                                    isValid = false;
                                }
                            }
                        }
                    });
                }
            }

            if (testsValid) {
                const testKeysCount = Object.keys(testsData).length;
                logContainer.innerHTML += `<div style="color:var(--success)">✅ tests.json is valid (Found ${testKeysCount} tests).</div>`;
                updateFileStatus('tests.json', 'valid');
            } else {
                updateFileStatus('tests.json', 'invalid');
            }
        } catch (e) {
            logContainer.innerHTML += `<div style="color:var(--danger)">❌ tests.json is not valid JSON: ${e.message}</div>`;
            isValid = false;
            updateFileStatus('tests.json', 'invalid');
        }
    }

    // 3. Locate and Validate notes.json
    const notesJsonFile = stagedFiles.find(f => f.name === 'notes.json');
    if (notesJsonFile) {
        try {
            const notesData = JSON.parse(notesJsonFile.content);
            let notesValid = true;

            if (typeof notesData !== 'object' || Array.isArray(notesData) || !Array.isArray(notesData.chapters)) {
                logContainer.innerHTML += '<div style="color:var(--danger)">❌ notes.json root must contain a "chapters" array.</div>';
                notesValid = false;
                isValid = false;
            } else {
                notesData.chapters.forEach((chap, idx) => {
                    if (chap.chapter_idx === undefined || !chap.title || !Array.isArray(chap.sections)) {
                        logContainer.innerHTML += `<div style="color:var(--danger)">❌ Chapter at index ${idx} is missing chapter_idx, title, or sections array.</div>`;
                        notesValid = false;
                        isValid = false;
                        return;
                    }

                    chap.sections.forEach((sec, sIdx) => {
                        if (sec.heading === undefined || sec.body === undefined) {
                            logContainer.innerHTML += `<div style="color:var(--danger)">❌ Section at index ${sIdx} in chapter "${chap.title}" is missing heading or body.</div>`;
                            notesValid = false;
                            isValid = false;
                        }
                    });
                });
            }

            if (notesValid) {
                logContainer.innerHTML += `<div style="color:var(--success)">✅ notes.json is valid (Found ${notesData.chapters.length} chapters).</div>`;
                updateFileStatus('notes.json', 'valid');
            } else {
                updateFileStatus('notes.json', 'invalid');
            }
        } catch (e) {
            logContainer.innerHTML += `<div style="color:var(--danger)">❌ notes.json is not valid JSON: ${e.message}</div>`;
            isValid = false;
            updateFileStatus('notes.json', 'invalid');
        }
    }

    // 4. Locate and Validate flashcards.json
    const flashcardsJsonFile = stagedFiles.find(f => f.name === 'flashcards.json');
    if (flashcardsJsonFile) {
        try {
            const flashcardsData = JSON.parse(flashcardsJsonFile.content);
            let fcValid = true;

            if (!Array.isArray(flashcardsData)) {
                logContainer.innerHTML += '<div style="color:var(--danger)">❌ flashcards.json root must be a JSON array.</div>';
                fcValid = false;
                isValid = false;
            } else {
                flashcardsData.forEach((fc, idx) => {
                    if (!fc.id || !fc.front || !fc.back) {
                        logContainer.innerHTML += `<div style="color:var(--danger)">❌ Flashcard at index ${idx} is missing id, front, or back fields.</div>`;
                        fcValid = false;
                        isValid = false;
                    }
                });
            }

            if (fcValid) {
                logContainer.innerHTML += `<div style="color:var(--success)">✅ flashcards.json is valid (Found ${flashcardsData.length} cards).</div>`;
                updateFileStatus('flashcards.json', 'valid');
            } else {
                updateFileStatus('flashcards.json', 'invalid');
            }
        } catch (e) {
            logContainer.innerHTML += `<div style="color:var(--danger)">❌ flashcards.json is not valid JSON: ${e.message}</div>`;
            isValid = false;
            updateFileStatus('flashcards.json', 'invalid');
        }
    }

    // Mark remaining files as valid/pending
    stagedFiles.forEach(file => {
        if (!fileStatuses[file.name]) {
            updateFileStatus(file.name, 'valid');
        }
    });

    if (ignoredFiles.length > 0) {
        logContainer.innerHTML += `<div style="color:var(--warning)">⚠️ Warning: Ignored ${ignoredFiles.length} non-course file(s) (e.g. ${ignoredFiles.slice(0, 3).join(', ')}). Only config.json, tests.json, notes.json, and flashcards.json are supported.</div>`;
    }

    document.getElementById('validationSpinner').style.display = 'none';

    if (isValid && courseMetadata) {
        logContainer.innerHTML += '<div style="color:var(--success); font-weight:bold; margin-top:10px;">🎉 Local validation passed! Ready to submit.</div>';
        document.getElementById('githubSubmitArea').style.display = 'block';
    } else {
        logContainer.innerHTML += '<div style="color:var(--danger); font-weight:bold; margin-top:10px;">❌ Validation failed. Please review logs and re-upload.</div>';
        document.getElementById('githubSubmitArea').style.display = 'none';
    }
}

function clearStagedFiles() {
    stagedFiles = [];
    ignoredFiles = [];
    document.getElementById('stagedArea').style.display = 'none';
    document.getElementById('validationStatusArea').style.display = 'none';
    document.getElementById('githubSubmitArea').style.display = 'none';
}

function encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

async function githubRequest(path, options = {}) {
    const pat = document.getElementById('githubPatInput').value.trim();
    const url = `https://api.github.com${path}`;

    options.headers = {
        ...options.headers,
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || `HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }
    return response.json();
}

async function submitContributionPR() {
    const logContainer = document.getElementById('validationLogs');
    const pat = document.getElementById('githubPatInput').value.trim();

    if (!pat) {
        alert("Please enter a GitHub Personal Access Token.");
        return;
    }

    if (!courseMetadata || stagedFiles.length === 0) {
        alert("Please upload and validate a valid course module before submitting.");
        return;
    }

    const submitBtn = document.getElementById('submitPrBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid var(--primary-light); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 6px;"></span>
        Submitting...
    `;

    logContainer.innerHTML += '<div>🌐 Connecting to GitHub API...</div>';

    const owner = 'konda-vamshi-krishna';
    const repo = 'Konda-Nism';
    const courseId = courseMetadata.id;
    const branchName = `contrib-${courseId}-${Date.now()}`;

    try {
        // Step 1: Get master SHA
        logContainer.innerHTML += '<div>🔍 Fetching latest master branch state...</div>';
        const masterRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/master`);
        const masterSha = masterRef.object.sha;

        const masterCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${masterSha}`);
        const masterTreeSha = masterCommit.tree.sha;

        // Step 2: Create new branch
        logContainer.innerHTML += `<div>🌿 Creating contribution branch: <code>${branchName}</code>...</div>`;
        await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: masterSha
            })
        });

        // Step 3: Fetch current content/registry.json to update it
        logContainer.innerHTML += '<div>📋 Fetching registry.json...</div>';
        let registryData = null;
        let registrySha = null;
        try {
            const registryFile = await githubRequest(`/repos/${owner}/${repo}/contents/content/registry.json?ref=${branchName}`);
            const decodedRegistry = decodeURIComponent(escape(atob(registryFile.content.replace(/\s/g, ''))));
            registryData = JSON.parse(decodedRegistry);
            registrySha = registryFile.sha;
        } catch (e) {
            logContainer.innerHTML += '<div style="color:var(--warning)">⚠️ Warning: Could not fetch registry.json. Creating new.</div>';
            registryData = { courses: [] };
        }

        if (registryData && registryData.courses) {
            const exists = registryData.courses.some(c => c.id === courseId);
            if (!exists) {
                registryData.courses.push({
                    id: courseId,
                    title: courseMetadata.title,
                    description: courseMetadata.description,
                    folder: courseId
                });
                logContainer.innerHTML += '<div>✏️ Updated registry.json with new course metadata.</div>';
            }
        }

        // Step 4: Create Blobs for each file
        logContainer.innerHTML += '<div>📤 Uploading files to GitHub...</div>';
        const treeItems = [];

        for (const file of stagedFiles) {
            const repoPath = `content/${courseId}/${file.name}`;

            logContainer.innerHTML += `<div>📤 Creating blob for <code>${repoPath}</code>...</div>`;
            const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
                method: 'POST',
                body: JSON.stringify({
                    content: encodeBase64(file.content),
                    encoding: 'base64'
                })
            });

            treeItems.push({
                path: repoPath,
                mode: '100644',
                type: 'blob',
                sha: blob.sha
            });
        }

        // Upload updated registry.json
        const updatedRegistryContent = JSON.stringify(registryData, null, 2);
        const registryBlob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            body: JSON.stringify({
                content: encodeBase64(updatedRegistryContent),
                encoding: 'base64'
            })
        });
        treeItems.push({
            path: 'content/registry.json',
            mode: '100644',
            type: 'blob',
            sha: registryBlob.sha
        });

        // Step 5: Create a new Tree
        logContainer.innerHTML += '<div>🌳 Creating git tree...</div>';
        const newTree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, {
            method: 'POST',
            body: JSON.stringify({
                base_tree: masterTreeSha,
                tree: treeItems
            })
        });

        // Step 6: Create Commit
        logContainer.innerHTML += '<div>💾 Creating git commit...</div>';
        const commit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
            method: 'POST',
            body: JSON.stringify({
                message: `Add ${courseMetadata.title} course module`,
                tree: newTree.sha,
                parents: [masterSha]
            })
        });

        // Step 7: Update branch reference
        logContainer.innerHTML += '<div>🔗 Updating branch head...</div>';
        await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
            method: 'PATCH',
            body: JSON.stringify({
                sha: commit.sha,
                force: true
            })
        });

        // Step 8: Open Pull Request
        logContainer.innerHTML += '<div>🔀 Opening Pull Request...</div>';
        const pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            body: JSON.stringify({
                title: `Contribution: Add ${courseMetadata.title} course`,
                head: branchName,
                base: 'master',
                body: `Automatically submitted from Konda Universal Mock Test contribution dashboard.\n\nAuthor: ${courseMetadata.author}\nDescription: ${courseMetadata.description}`
            })
        });

        logContainer.innerHTML += `<div style="color:var(--success); font-weight:bold; font-size:1.1rem; margin-top:15px;">🎉 Pull Request created successfully!</div>`;

        showPRSuccessScreen(pr.html_url);

    } catch (err) {
        console.error(err);
        logContainer.innerHTML += `<div style="color:var(--danger); font-weight:bold; margin-top:15px;">❌ GitHub API Error: ${err.message}</div>`;
        if (err.status === 401 || err.status === 403) {
            logContainer.innerHTML += `
                <div class="glass-warning" style="margin-top: 10px; padding: 12px; border-radius: 6px; border: 1px solid var(--border-color); background: rgba(255, 193, 7, 0.05); font-size: 0.85rem; color: var(--text-muted);">
                    <h4 style="margin: 0 0 6px 0; color: var(--warning-text);">🔑 Token Scope or Authentication Failure</h4>
                    <p style="margin: 0 0 6px 0;">The GitHub API rejected the request (Status ${err.status}). This typically means:</p>
                    <ul style="margin: 0; padding-left: 1.2rem;">
                        <li>Your token has expired or is invalid.</li>
                        <li>Your token is missing the required <strong><code>public_repo</code></strong> scope.</li>
                    </ul>
                    <p style="margin: 6px 0 0 0;">Please follow the step-by-step instructions below to generate a valid token and try again.</p>
                </div>
            `;
        } else {
            logContainer.innerHTML += `<div style="color:var(--text-muted); font-size:0.85rem;">Please make sure your Personal Access Token (PAT) is correct and has standard 'repo' scopes enabled.</div>`;
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 15.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 12V3"></path><path d="M12 12V3h6v4.5a2.5 2.5 0 0 0-2.5 2.5H12z"></path><path d="M12 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"></path></svg>
            Submit Pull Request
        `;
    }
}

function showPRSuccessScreen(prUrl) {
    const contributeContainer = document.getElementById('content-contribute');
    contributeContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
            <h2 style="margin-top: 0; color: var(--success);">Submission Successful!</h2>
            <p style="font-size: 1.1rem; max-width: 500px; margin: 0 auto 24px auto;">
                Thank you for contributing! Your course has been validated and submitted as a Pull Request to our repository.
            </p>
            <div style="margin-bottom: 30px;">
                <a href="${prUrl}" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; justify-content: center; width: auto; padding: 12px 24px;">
                    View Pull Request on GitHub
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
            </div>
            <div>
                <button class="btn btn-secondary" onclick="resetContributePage()">Contribute Another Course</button>
            </div>
        </div>
    `;
}

function resetContributePage() {
    document.getElementById('content-contribute').innerHTML = originalContributeHtml;
    stagedFiles = [];
    courseMetadata = null;
    setupDropzone();
}



// Global variables for data
let globalData = window.MOCK_DATA;
let currentCourseId = null;
let testData = {};
let notesData = { parts: [], flashcards: [] };

function getStorageKey(baseKey) {
    if (!currentCourseId) return `prepmaster_global_${baseKey}`;
    return `prepmaster_${currentCourseId}_${baseKey}`;
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
            return false;
        }

        this.courseId = courseId;
        this.testData = courseData.tests || {};
        this.notesData = {
            parts: courseData.notes || [],
            flashcards: courseData.flashcards || []
        };

        // Expose to global variables for compatibility with legacy core logic
        currentCourseId = this.courseId;
        testData = this.testData;
        notesData = this.notesData;

        flashcardsList = [...this.notesData.flashcards];
        currentFcIndex = 0;

        // UI transitions
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
        this.notesData = { parts: [], flashcards: [] };

        currentCourseId = null;
        testData = {};
        notesData = { parts: [], flashcards: [] };
        
        flashcardsList = [];
        currentFcIndex = 0;

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
    
    // Adjust layout based on scope
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) {
        dashboardGrid.style.gridTemplateColumns = isInsideCourse ? '1fr 300px' : '1fr';
    }
}

// Initialize app directly (no fetch needed)
function initializeApp() {
    try {
        renderCourseGrid();
        updateScopeUI(false); // Hide tabs initially
        
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

function selectCourse(courseId) {
    CourseScope.enter(courseId);
}


// Ensure DOM is fully loaded before fetching and attaching events
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

      
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
          starredQuestions = JSON.parse(savedStars);
      }
      

      
      // Active in-progress test
      const activeTest = localStorage.getItem(getStorageKey('active_test'));
      if (activeTest) {
          const active = JSON.parse(activeTest);
          document.getElementById('resumeSection').style.display = 'block';
          document.getElementById('resumeDetails').textContent = `${active.testName} (${active.mode === 'exam' ? 'Exam' : 'Practice'}) - Question ${active.currentQ + 1} of ${testData[active.testName].length} answered.`;
      }
      
      updateAnalyticsUI();
  }

  let selectedTestForLaunch = null;

  function initiateNewTest() {
      if (!selectedTestForLaunch) return;
      const selected = selectedTestForLaunch;
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
      
      const active = JSON.parse(activeTest);
      currentActiveTest = active.testName;
      testMode = active.mode;
      answers = active.answers;
      currentQ = active.currentQ;
      timeRemaining = active.timeRemaining;
      isSubmitted = active.isSubmitted;
      
      switchTab('simulator');
      startSimulator(true);
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
                  const qAnsClean = q.answer.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
                  if (answers[i]) {
                      const userAnsClean = answers[i].replace(/^[A-D][\\.\\)]\\s*/, '').trim();
                      if (qAnsClean === userAnsClean || qAnsClean.includes(userAnsClean)) {
                          btn.classList.add('correct');
                      } else {
                          btn.classList.add('wrong');
                      }
                  } else {
                      btn.classList.add('unattempted');
                  }
              } else {
                  if (answers[i]) {
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
      const q = testData[currentActiveTest][currentQ];
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
          const letterMatch = opt.match(/^([A-D])[\\.\\)]\\s*/);
          const letter = letterMatch ? letterMatch[1] : String.fromCharCode(65 + idx);
          const text = opt.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
          
          const div = document.createElement('div');
          div.className = 'option';
          
          const isUserChoice = (answers[currentQ] === text || answers[currentQ] === opt);
          if (isUserChoice) div.classList.add('selected');
          
          if (isSubmitted) {
              const qAnsClean = q.answer.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
              const isCorrect = (qAnsClean === text || qAnsClean.includes(text) || text.includes(qAnsClean));
              if (isCorrect) {
                  div.classList.add('correct');
              } else if (isUserChoice) {
                  div.classList.add('wrong');
              }
          } else {
              div.onclick = function() { selectSimOptionUI(this, text, opt); };
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
      if (isSubmitted || (testMode === 'practice' && answers[currentQ])) {
          expPanel.style.display = 'block';
          const expHtml = `<h4>Explanation</h4><strong>Correct Answer:</strong> ${q.answer}<br><br>${q.explanation || 'To be reviewed.'}<br><br>
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

  function selectSimOptionUI(element, text, rawOpt) {
      answers[currentQ] = rawOpt;
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
          const expHtml = `<h4>Explanation</h4><strong>Correct Answer:</strong> ${q.answer}<br><br>${q.explanation || 'To be reviewed.'}<br><br>
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
  function selectSimOption(text, rawOpt) {
      answers[currentQ] = rawOpt;
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
          const qAnsClean = q.answer.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
          
          if (answers[i]) {
              const userAnsClean = answers[i].replace(/^[A-D][\\.\\)]\\s*/, '').trim();
              if (qAnsClean === userAnsClean || qAnsClean.includes(userAnsClean)) {
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
              answer: q.answer
          });
      }
      localStorage.setItem(getStorageKey('starred_questions'), JSON.stringify(starredQuestions));
      renderActiveQuestion();
      updateAnalyticsUI();
  }

  // Navigation Tabs Switch
  function switchTab(tabId) {
      if (tabId !== 'dashboard' && !currentCourseId) {
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
      
      notesData.parts.forEach((part, index) => {
          const div = document.createElement('div');
          div.className = 'toc-item' + (index === 0 ? ' active' : '');
          div.textContent = part.title;
          div.onclick = () => {
              document.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
              div.classList.add('active');
              const htmlContent = mdToHtml(part.content);
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
      const initHtmlContent = mdToHtml(notesData.parts[0].content);
      bodyContainer.innerHTML = `
          <div class="notes-wrapper">
              <div class="notes-half notranslate">${initHtmlContent}</div>
              <div class="notes-half translate-box" translate="yes">${initHtmlContent}</div>
          </div>
      `;
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
let courseMetadata = null;
let originalContributeHtml = "";

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
                    const text = await file.text();
                    stagedFiles.push({
                        name: file.name,
                        path: file.webkitRelativePath || file.name,
                        content: text,
                        size: file.size
                    });
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
        
        const text = await file.text();
        stagedFiles.push({
            name: file.name,
            path: relativePath,
            content: text,
            size: file.size
        });
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

    document.getElementById('stagedArea').style.display = 'block';
    document.getElementById('validationStatusArea').style.display = 'block';
    document.getElementById('validationSpinner').style.display = 'inline-block';
    
    const logContainer = document.getElementById('validationLogs');
    logContainer.innerHTML = '<div>⏳ Processing selected files...</div>';

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const text = await file.text();
            stagedFiles.push({
                name: file.name,
                path: file.webkitRelativePath || file.name,
                content: text,
                size: file.size
            });
        }
        validateStagedFiles();
    } catch (err) {
        logContainer.innerHTML += `<div style="color:var(--danger)">❌ Error reading selected files: ${err.message}</div>`;
        document.getElementById('validationSpinner').style.display = 'none';
    }
}

function validateStagedFiles() {
    const logContainer = document.getElementById('validationLogs');
    logContainer.innerHTML += '<div>🔍 Validating file structure and schema...</div>';

    const stagedList = document.getElementById('stagedFilesList');
    stagedList.innerHTML = '';

    stagedFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'staged-file-item';
        item.innerHTML = `
            <span>📄 ${file.path} (${(file.size / 1024).toFixed(1)} KB)</span>
            <span class="file-status pending">Pending</span>
        `;
        stagedList.appendChild(item);
    });

    let isValid = true;
    let configJsonFile = null;
    courseMetadata = null;

    // 1. Locate config.json
    configJsonFile = stagedFiles.find(f => f.name === 'config.json');
    if (!configJsonFile) {
        logContainer.innerHTML += '<div style="color:var(--danger)">❌ Error: Missing config.json in root.</div>';
        isValid = false;
    } else {
        try {
            const config = JSON.parse(configJsonFile.content);
            const requiredKeys = ['id', 'title', 'description', 'author'];
            let configValid = true;
            requiredKeys.forEach(k => {
                if (!config[k] || String(config[k]).trim() === '') {
                    logContainer.innerHTML += `<div style="color:var(--danger)">❌ config.json is missing required key: "${k}".</div>`;
                    configValid = false;
                    isValid = false;
                }
            });
            if (configValid) {
                courseMetadata = config;
                logContainer.innerHTML += `<div style="color:var(--success)">✅ config.json is valid (ID: ${config.id}, Title: ${config.title}).</div>`;
            }
        } catch (e) {
            logContainer.innerHTML += `<div style="color:var(--danger)">❌ config.json is not valid JSON: ${e.message}</div>`;
            isValid = false;
        }
    }

    // 2. Validate tests folder and markdown formatting
    const testFiles = stagedFiles.filter(f => f.path.toLowerCase().includes('/tests/') && f.name.endsWith('.md'));
    if (testFiles.length === 0) {
        logContainer.innerHTML += '<div style="color:var(--warning)">⚠️ Warning: No markdown files found inside a "tests" subdirectory.</div>';
    } else {
        testFiles.forEach(f => {
            let fileValid = true;
            if (!f.content.includes('Question 1') && !f.content.includes('**Question 1:**')) {
                logContainer.innerHTML += `<div style="color:var(--danger)">❌ ${f.name} does not contain "Question 1" marker.</div>`;
                fileValid = false;
                isValid = false;
            }
            if (!f.content.includes('**Answer:**') && !f.content.includes('Answer:')) {
                logContainer.innerHTML += `<div style="color:var(--danger)">❌ ${f.name} does not contain "**Answer:**" marker.</div>`;
                fileValid = false;
                isValid = false;
            }

            if (fileValid) {
                logContainer.innerHTML += `<div style="color:var(--success)">✅ Test format verified for: ${f.name}</div>`;
            }
        });
    }

    // 3. Validate notes folder if it exists
    const notesFiles = stagedFiles.filter(f => f.path.toLowerCase().includes('/notes/') && f.name.endsWith('.md'));
    notesFiles.forEach(f => {
        logContainer.innerHTML += `<div style="color:var(--success)">✅ Notes format verified for: ${f.name}</div>`;
    });

    document.getElementById('validationSpinner').style.display = 'none';

    // Update statuses
    document.querySelectorAll('.staged-file-item').forEach((item, idx) => {
        const file = stagedFiles[idx];
        const statusSpan = item.querySelector('.file-status');

        let fileStatus = 'valid';
        if (file.name === 'config.json') {
            fileStatus = courseMetadata ? 'valid' : 'invalid';
        } else if (file.path.toLowerCase().includes('/tests/') && file.name.endsWith('.md')) {
            const logsText = logContainer.innerHTML;
            fileStatus = logsText.includes(`❌ ${file.name}`) ? 'invalid' : 'valid';
        }

        statusSpan.className = `file-status ${fileStatus}`;
        statusSpan.textContent = fileStatus.charAt(0).toUpperCase() + fileStatus.slice(1);
    });

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
        throw new Error(errorData.message || `HTTP ${response.status}`);
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
            let subPath = file.path;
            // Clean path to be clean relative to course folder
            const parts = subPath.split('/');
            const templateIdx = parts.indexOf('template');
            const courseIdx = parts.indexOf(courseId);
            
            if (templateIdx !== -1) {
                subPath = parts.slice(templateIdx + 1).join('/');
            } else if (courseIdx !== -1) {
                subPath = parts.slice(courseIdx + 1).join('/');
            }
            
            const repoPath = `content/${courseId}/${subPath}`;

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
        logContainer.innerHTML += `<div style="color:var(--text-muted); font-size:0.85rem;">Please make sure your Personal Access Token (PAT) is correct and has standard 'repo' scopes enabled.</div>`;
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



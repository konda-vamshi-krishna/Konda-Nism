// Global variables for data
let testData = null;
let notesData = null;

// Initialize app after fetching data
async function initializeApp() {
    try {
        const response = await fetch('data/data.json');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();
        
        testData = data.testData;
        notesData = data.notesData;
        
        // Only run setup functions if data is loaded
        if(document.getElementById('simTestSelect')) {
            setupTestSelectors();
            loadLocalStorage();
            renderFlashcard();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Failed to load application data. If you are opening this file locally (file://), your browser might block fetch requests due to CORS. Please use a local server or host it on GitHub Pages.');
    }
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
      const savedStars = localStorage.getItem('nism_starred_questions');
      if (savedStars) {
          starredQuestions = JSON.parse(savedStars);
      }
      
      // Theme setting
      const savedTheme = localStorage.getItem('nism_theme');
      if (savedTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.querySelector('.moon-icon').style.display = 'none';
          document.querySelector('.sun-icon').style.display = 'block';
      }
      
      // Active in-progress test
      const activeTest = localStorage.getItem('nism_active_test');
      if (activeTest) {
          const active = JSON.parse(activeTest);
          document.getElementById('resumeSection').style.display = 'block';
          document.getElementById('resumeDetails').textContent = `${active.testName} (${active.mode === 'exam' ? 'Exam' : 'Practice'}) - Question ${active.currentQ + 1} of ${testData[active.testName].length} answered.`;
      }
      
      updateAnalyticsUI();
  }

  function initiateNewTest() {
      const selected = document.getElementById('simTestSelect').value;
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
      const activeTest = localStorage.getItem('nism_active_test');
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
          localStorage.removeItem('nism_active_test');
          return;
      }
      localStorage.setItem('nism_active_test', JSON.stringify({
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
      document.getElementById('activeQText').textContent = q.question;
      
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
              div.onclick = () => selectSimOption(text, opt);
          }
          
          div.innerHTML = `<div class="opt-badge">${letter}</div><div>${text}</div>`;
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
          expPanel.innerHTML = `<h4>Explanation</h4><strong>Correct Answer:</strong> ${q.answer}<br><br>${q.explanation || 'To be reviewed.'}`;
      } else {
          expPanel.style.display = 'none';
      }
  }

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
      const history = JSON.parse(localStorage.getItem('nism_test_history') || '[]');
      history.unshift({
          testName: currentActiveTest,
          mode: testMode,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          score: `${correct}/${questions.length}`,
          percent: Math.round((correct / questions.length) * 100)
      });
      localStorage.setItem('nism_test_history', JSON.stringify(history));
      
      // Remove active test from localstorage
      localStorage.removeItem('nism_active_test');
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
      localStorage.setItem('nism_starred_questions', JSON.stringify(starredQuestions));
      renderActiveQuestion();
      updateAnalyticsUI();
  }

  // Navigation Tabs Switch
  function switchTab(tabId) {
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
              bodyContainer.innerHTML = mdToHtml(part.content);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          };
          tocContainer.appendChild(div);
      });
      
      // Load initial notes body
      bodyContainer.innerHTML = mdToHtml(notesData.parts[0].content);
  }

  // A very lightweight markdown formatter
  function mdToHtml(md) {
      let lines = md.split('\\n');
      let html = '';
      let inTable = false;
      let inList = false;
      
      for(let i=0; i<lines.length; i++) {
          let line = lines[i].trim();
          
          // Header 3
          if (line.startsWith('###')) {
              if (inList) { html += '</ul>'; inList = false; }
              html += `<h3>${line.replace('###', '').trim()}</h3>`;
              continue;
          }
          // Header 2
          if (line.startsWith('##')) {
              if (inList) { html += '</ul>'; inList = false; }
              html += `<h2>${line.replace('##', '').trim()}</h2>`;
              continue;
          }
          // Header 1
          if (line.startsWith('#')) {
              if (inList) { html += '</ul>'; inList = false; }
              html += `<h1>${line.replace('#', '').trim()}</h1>`;
              continue;
          }
          
          // Handle Table
          if (line.includes('|')) {
              if (!inTable) {
                  html += '<table>';
                  inTable = true;
              }
              let cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
              // Skip divider line like |---|---|
              if (line.includes('---')) continue;
              
              html += '<tr>';
              cells.forEach(cell => {
                  // If it is the first row, make it a table header
                  if (html.endsWith('<table><tr>')) {
                      html += `<th>${cell}</th>`;
                  } else {
                      html += `<td>${cell}</td>`;
                  }
              });
              html += '</tr>';
              continue;
          } else {
              if (inTable) {
                  html += '</table>';
                  inTable = false;
              }
          }

          // Handle Lists
          if (line.startsWith('-') || line.match(/^\\d+\\./)) {
              if (!inList) {
                  html += '<ul>';
                  inList = true;
              }
              let text = line.replace(/^-|^\\d+\\./, '').trim();
              html += `<li>${text}</li>`;
              continue;
          } else {
              if (inList) {
                  html += '</ul>';
                  inList = false;
              }
          }

          if (line === '') {
              html += '<br>';
          } else {
              // Standard paragraph with bold formats
              let formattedLine = line.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
              html += `<p>${formattedLine}</p>`;
          }
      }
      
      if (inTable) html += '</table>';
      if (inList) html += '</ul>';
      return html;
  }

  // Flashcards flipping and loading
  function flipCard(cardEl) {
      cardEl.classList.toggle('flipped');
  }

  // Analytics UI Refresher
  function updateAnalyticsUI() {
      const history = JSON.parse(localStorage.getItem('nism_test_history') || '[]');
      
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
      localStorage.setItem('nism_starred_questions', JSON.stringify(starredQuestions));
      updateAnalyticsUI();
  }

  // Theme Controller
  function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const sun = document.querySelector('.sun-icon');
      const moon = document.querySelector('.moon-icon');
      
      if (currentTheme === 'dark') {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('nism_theme', 'light');
          sun.style.display = 'none';
          moon.style.display = 'block';
      } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('nism_theme', 'dark');
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

  // Initialize dropdowns and contents
  function setupTestSelectors() {
      const simTestSelect = document.getElementById('simTestSelect');
      simTestSelect.innerHTML = '';
      for (let testName in testData) {
          let opt = document.createElement('option');
          opt.value = testName;
          opt.textContent = testName;
          simTestSelect.appendChild(opt);
      }
      if (Object.keys(testData).length > 0) {
          updateStartTitle(Object.keys(testData)[0]);
      }
  }

  function renderFlashcard() {
      const card = flashcardsList[currentFcIndex];
      document.getElementById('flashcardElement').classList.remove('flipped');
      setTimeout(() => {
          document.getElementById('fcFrontCategory').textContent = `Fact #${currentFcIndex + 1}`;
          document.getElementById('fcFrontText').textContent = card.front;
          document.getElementById('fcBackText').textContent = card.back;
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

  

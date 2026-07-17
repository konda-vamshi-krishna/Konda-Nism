import re

filepath = 'g:/mock text/js/app.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace global init variables
content = content.replace(
    'let testData = window.NISM_DATA.testData;\nlet notesData = window.NISM_DATA.notesData;\n',
    '''let globalData = window.MOCK_DATA;
let currentCourseId = null;
let testData = {};
let notesData = { notes: [], flashcards: [] };

function getStorageKey(baseKey) {
    if (!currentCourseId) return `prepmaster_global_${baseKey}`;
    return `prepmaster_${currentCourseId}_${baseKey}`;
}
'''
)

# Replace all nism_ keys with dynamic ones EXCEPT nism_lang and nism_theme
# Wait, language and theme SHOULD be global.
# So nism_lang -> prepmaster_lang
# nism_theme -> prepmaster_theme
# nism_test_history -> getStorageKey('test_history')
# nism_active_test -> getStorageKey('active_test')
# nism_starred_questions -> getStorageKey('starred_questions')

content = content.replace("'nism_lang'", "'prepmaster_lang'")
content = content.replace("'nism_theme'", "'prepmaster_theme'")

content = content.replace("'nism_test_history'", "getStorageKey('test_history')")
content = content.replace("'nism_active_test'", "getStorageKey('active_test')")
content = content.replace("'nism_starred_questions'", "getStorageKey('starred_questions')")

# Update initializeApp to render course grid
content = content.replace(
    '''// Initialize app directly (no fetch needed)
function initializeApp() {
    try {
        setupTestSelectors();
        setupFlashcardDecks();
        loadLocalStorage();
        renderFlashcard();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}''',
    '''// Initialize app directly (no fetch needed)
function initializeApp() {
    try {
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
    }
}

function renderCourseGrid() {
    const gridContainer = document.getElementById('courseSelectionGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    
    globalData.registry.forEach(course => {
        const btn = document.createElement('button');
        btn.className = 'test-btn not-attempted';
        btn.style.textAlign = 'left';
        btn.innerHTML = `
            <div class="test-title">${course.title}</div>
            <div class="test-status" style="font-size:0.8rem; opacity:0.8;">${course.description}</div>
        `;
        btn.onclick = () => selectCourse(course.id);
        gridContainer.appendChild(btn);
    });
}

function selectCourse(courseId) {
    currentCourseId = courseId;
    const courseData = globalData.courses[courseId];
    if (!courseData) return;
    
    testData = courseData.tests || {};
    notesData = {
        notes: courseData.notes || [],
        flashcards: courseData.flashcards || []
    };
    
    flashcardsList = [...notesData.flashcards];
    currentFcIndex = 0;
    
    // UI Transitions
    document.getElementById('courseContentArea').style.display = 'block';
    document.getElementById('courseStatsStrip').style.display = 'flex';
    
    setupTestSelectors();
    setupFlashcardDecks();
    loadLocalStorage();
    renderFlashcard();
    
    // Scroll down to tests
    document.getElementById('courseContentArea').scrollIntoView({ behavior: 'smooth' });
}
'''
)

# In loadLocalStorage, remove the theme and lang loading since they are now in initializeApp (they shouldn't depend on currentCourseId)
content = content.replace(
'''      // Saved Language
      const savedLang = localStorage.getItem('prepmaster_lang');
      if (savedLang && savedLang !== 'en') {
          document.body.classList.add('translation-active');
          applySavedLanguage(savedLang);
      }''', ''
)
content = content.replace(
'''      // Theme setting
      const savedTheme = localStorage.getItem('prepmaster_theme');
      if (savedTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.querySelector('.moon-icon').style.display = 'none';
          document.querySelector('.sun-icon').style.display = 'block';
      }''', ''
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js has been successfully refactored.")

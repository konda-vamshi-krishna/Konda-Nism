# 🧠 Konda-Nism (PrepMaster): Zero-Cost, Offline-First AI Course Compiler & Exam Simulator

PrepMaster (Konda-Nism) is a serverless, offline-first Progressive Web Application (PWA) designed to turn long-form textbook materials and PDFs into interactive study resources. It functions as both a student exam simulator and an AI-powered course compiler.

---

## ✨ Key Features

1. **Intelligent AI Course Compiler**:
   * Drag-and-drop textbook PDFs or markdown files.
   * Auto-sharded text processing (10,000-character segments) to prevent proxy timeouts.
   * Compiles interactive mock tests, study notes, and flashcard decks using LLM APIs (OpenRouter or Nvidia NIM).
   * **Local Drive Rescue**: Automatically downloads course data as a single JSON file if GitHub API configurations are missing.

2. **Exam & Study Simulator**:
   * Responsive mock exam testing with detailed timer tracking and answers reviews.
   * Dynamic study notes viewer with markdown text formatting.
   * Interactive flashcards study mode.

3. **Zero-Cost Serverless PWA Architecture**:
   * Runs entirely client-side inside the browser.
   * Service Worker isolation for complete offline support (runs without an internet connection once loaded).
   * Free-tier AI model options enabled via OpenRouter gateway.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: Vanilla HTML5, CSS3 (Modern dark glassmorphism theme, CSS Variables), ES6 JavaScript.
* **Storage**: Browser LocalStorage & SessionStorage cache buffers.
* **Offline Layer**: Progressive Web App (PWA) Service Worker caching (`sw.js`).
* **AI Gateways**: Nvidia NIM API Mesh & OpenRouter serverless API.
* **Validators**: Python 3 check suites (`validate_module.py` and `semantic_audit.py`).

---

## 🚀 Running the App Locally

To prevent local file access CORS blocks (`CORS policy: Cross origin requests are only supported for protocol schemes...`), you must run the app using a local web server:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/konda-vamshi-krishna/Konda-Nism.git
   cd Konda-Nism
   ```

2. **Start a Local Server**:
   * **Python 3**:
     ```bash
     python -m http.server 8000
     ```
   * **Node.js (npx)**:
     ```bash
     npx local-web-server
     ```

3. **Access the App**:
   Open your browser and navigate to `http://localhost:8000`.

---

## 📖 How to Compile a New Course Module

1. Open the application locally, navigate to the **Contribute** tab.
2. Select your AI provider (OpenRouter or Nvidia NIM) and enter your API credential key.
3. Add any decentralized reference library links (e.g. Google Drive PDFs).
4. Drag and drop your source textbook PDF/TXT/MD into the dropzone.
5. Click **⚡ Compile & Save Current Chapter**.
6. To add more chapters, click **➕ Add Another Chapter** and repeat.
7. Once finished, click **🔒 Finalize Course Module** to review the raw manifest JSON.
8. Click **🚀 Dispatch Course Pull Request** to submit directly to the repository or download the compiled `.json` file to your disk.

---

## 🤝 Contributing

We welcome open-source contributions! Please review [CONTRIBUTING.md](CONTRIBUTING.md) to understand coding standards, branching guidelines, and our technical roadmap (including Pyodide integration and offline SVG progress charts).

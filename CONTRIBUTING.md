# Contributing to Konda Universal Mock Test

Welcome! We are building a Universal Open-Source Mock Test Platform. Anyone in the world can add their own mock tests, courses, and certifications by simply contributing a folder containing Markdown files. 

With our new **No-Code Contribute Panel**, you can submit courses directly from the browser!

---

## The 3-Step No-Code Guide

### 1. Prepare Your Files
Copy our folder templates and prepare your course files:
- **`config.json`**: Define your course ID, title, description, and author name.
- **`tests/` folder**: Create Markdown files (e.g. `Test_1.md`) containing questions. Use the format:
  ```markdown
  **Question 1:** What is the capital of France?
  A) Berlin
  B) Paris
  C) Madrid
  D) Rome
  **Answer:** B) Paris
  **Explanation:** Paris is the capital of France.
  ---
  ```
- **`notes/` folder** (Optional): Add markdown study guide notes.

### 2. Upload Your Course Folder
- Go to the **Contribute** tab on the website.
- Drag & drop your course folder (or select the files) directly into the dropzone.
- The browser will validate your schema and file formats in real-time.

### 3. Submit Pull Request
- Provide a **GitHub Personal Access Token (PAT)** with `repo` write scopes.
- Click **Submit Pull Request**. 
- The system will automatically create a branch, commit your files, register the course in `registry.json`, and open a Pull Request against the main repository!

---

## For Developers (CLI Flow)
If you prefer standard Git and command-line execution:
1. **Fork & Clone**: Fork the repository and clone it locally.
2. **Local Validation**: Run the Python validator script:
   ```bash
   python validate_module.py
   ```
3. **Local Compilation**: Recompile the database payload to test locally:
   ```bash
   python build_engine.py
   ```
   Open `index.html` in your browser.
4. **Push & PR**: Commit your files and open a Pull Request on GitHub.

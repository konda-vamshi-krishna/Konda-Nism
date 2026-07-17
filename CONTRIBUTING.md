# Contributing to PrepMaster

Welcome to PrepMaster! We are building a Universal Open-Source Mock Test Platform. Anyone in the world can add their own mock tests, courses, and certifications by simply contributing a folder containing Markdown files.

## How to Add a New Course

Adding a course requires **zero coding knowledge**. The entire system is powered by Markdown (`.md`) text files.

### 1. Fork and Clone
Fork this repository to your GitHub account and clone it to your local machine.

### 2. Copy the Template
Navigate to the `content/` folder.
Copy the `template` folder and rename it to your course ID (e.g., `content/cfa-level-1`).

### 3. Configure Metadata
Open the `config.json` inside your new folder and update the course details:
```json
{
  "id": "cfa-level-1",
  "title": "CFA Level I",
  "description": "Comprehensive mock tests for CFA Level I.",
  "author": "Your Name",
  "version": "1.0.0"
}
```

### 4. Register the Course
Open `content/registry.json` and add your course to the list:
```json
{
  "id": "cfa-level-1",
  "title": "CFA Level I",
  "description": "Comprehensive mock tests for CFA Level I.",
  "folder": "cfa-level-1"
}
```

### 5. Add Your Tests
Inside your course folder, navigate to the `tests/` directory. Create Markdown files (e.g., `Test_1.md`).
Follow this strict format:

```markdown
# Test Name

**Question 1:** What is the capital of France?

**Options:**

A) Berlin
B) Paris
C) Madrid
D) Rome

**Answer:** B) Paris

**Explanation:** Paris is the capital and most populous city of France.
---
```

### 6. Validate Your Module
Before submitting a Pull Request, run the validation script to ensure your formatting is correct:
```bash
python validate_module.py
```
If you see `✅ Module is valid!`, you are ready to submit!

### 7. Compile (Optional for Local Testing)
To view your course locally, run the compiler:
```bash
python build_engine.py
```
Then open `index.html` in your browser.

### 8. Submit a Pull Request
Push your changes to your fork and submit a Pull Request to our main repository. Your course will instantly be available to thousands of students worldwide!

# Contributing to Konda Universal Mock Test (KUMT)

Welcome! KUMT is a 100% free, open-source LMS. You can add any subject — AWS, Python, Finance, Medicine — with **zero coding** using our browser-based contribution workspace.

---

## The 4-File JSON Architecture

Create a folder using **lowercase alphanumeric characters and hyphens only** (e.g. `my-custom-course`). Place exactly four files inside:

### 1. `config.json` — Identity Metadata

```json
{
  "id": "my-custom-course",
  "title": "Clear Course Title (e.g., AWS Certified Cloud Practitioner)",
  "description": "A precise, concise single-sentence summary of what the course covers.",
  "author": "Your Full Name",
  "version": "1.0.0"
}
```

### 2. `tests.json` — Exam Engine Payload

Questions are grouped under snake_case test block keys (`test_1`, `test_2`, ...). Grading uses a zero-indexed integer pointer (`answer_idx`: 0 to 3). No letter prefixes in option text.

```json
{
  "test_1": [
    {
      "id": "q_unique_prefix_001",
      "question": "The question text — fully stated without option letters.",
      "options": [
        "First option choice (Index 0)",
        "Second option choice (Index 1)",
        "Third option choice (Index 2)",
        "Fourth option choice (Index 3)"
      ],
      "answer_idx": 1,
      "explanation": "Detail why the choice at index 1 is correct."
    }
  ]
}
```

### 3. `flashcards.json` — Active Recall Deck

A flat array of front/back card pairs.

```json
[
  {
    "id": "fc_unique_prefix_001",
    "front": "The prompt or question visible on the front face.",
    "back": "The answer or definition revealed when the card is flipped."
  }
]
```

### 4. `notes.json` — Structured Study Material

Organized by hierarchical chapter and section indices.

```json
{
  "chapters": [
    {
      "chapter_idx": 1,
      "title": "Chapter One Title",
      "sections": [
        {
          "heading": "Section Subheading Name",
          "body": "Raw paragraphs containing educational text for this topic."
        }
      ]
    }
  ]
}
```

---

## 3-Step Submission Pipeline

### Step 1 — Assemble Locally
Package your four completed JSON files inside your course folder. Verify the folder name is lowercase with hyphens only.

### Step 2 — Drag & Drop Validation
Open the **Contribute** tab on the KUMT website. Drag your course folder into the dropzone. The client-side JavaScript validates `answer_idx` bounds, required keys, and schema integrity instantly in-browser.

### Step 3 — Serverless GitHub PR Submission
Generate a temporary GitHub Personal Access Token (PAT) with `repo` write scope:
https://github.com/settings/tokens/new?scopes=repo&description=KUMT+Contribution

Paste your token into the field and click **Submit Pull Request**. Our engine calls the GitHub API directly from the browser to fork, branch, and stage your files. The automated GitHub Actions runner (`validate.yml`) then validates data bounds, pads question sets to 100 questions per test, and merges the PR — **no servers, no cost, no local CLI required**.

---

## For Developers (CLI Flow)

If you prefer standard Git and command-line tools:

1. **Fork & Clone**: Fork the repository and clone it locally.
2. **Add Your Module**: Drop your course folder into `content/`.
3. **Build & Validate**:
   ```bash
   python build_all.py
   python validate_module.py
   ```
4. **Open index.html** in your browser to verify locally.
5. **Push & PR**: Commit your files and open a Pull Request on GitHub.

> **Linux/GitHub Pages Note**: GitHub Pages serves files from a Linux container. File and folder names are **case-sensitive**. Always use lowercase names to prevent 404 errors.

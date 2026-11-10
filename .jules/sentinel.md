## 2024-05-24 - DOM XSS in File Upload Metadata
**Vulnerability:** File names and paths from dropped/selected files were injected directly into `.innerHTML` strings in `validateStagedFiles` without sanitization.
**Learning:** File metadata (like `file.name` or `file.path`) originates from the client's file system and must be treated as untrusted user input, as a malicious user could craft a file with a payload as its name.
**Prevention:** Always use `escapeHTML` or rely on `textContent`/`innerText` when dealing with file metadata before rendering it into the DOM.

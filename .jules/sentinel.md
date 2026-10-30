## 2024-10-30 - Prevent XSS in File Validation UI
**Vulnerability:** File names from user-dropped files were inserted directly into the DOM using `.innerHTML` without sanitization. An attacker could craft a file with a malicious filename (e.g., `<img src=x onerror=alert(1)>`) and execute arbitrary JavaScript.
**Learning:** The vulnerability existed because vanilla JavaScript DOM manipulation using `.innerHTML` with unsanitized dynamic user input (file names) is inherently unsafe.
**Prevention:** Always sanitize dynamic user input before using it in `.innerHTML`, or prefer `.textContent` where possible.

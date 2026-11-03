import os
from datetime import datetime

journal_path = '.jules/sentinel.md'
os.makedirs('.jules', exist_ok=True)

entry = f"""## {datetime.now().strftime('%Y-%m-%d')} - [Fix Vanilla JS XSS Vulnerabilities in innerHTML]
**Vulnerability:** [Multiple instances of dynamic/user-supplied content being directly injected via \`.innerHTML\` (e.g. course titles, flashcard content, quiz answers) leading to DOM-based XSS.]
**Learning:** [Vanilla JS codebases heavily relying on template literals for rendering DOM elements often miss HTML sanitization, which creates critical XSS paths if any injected property can be influenced by users or malicious API responses.]
**Prevention:** [Always use an \`escapeHTML\` helper (or DOMPurify) before inserting variables into \`.innerHTML\` templates. If only inserting text, prefer \`textContent\`.]
"""

with open(journal_path, 'a') as f:
    f.write(entry)

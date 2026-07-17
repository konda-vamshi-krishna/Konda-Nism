import os
import json
import sys
import re

# Force stdout to use UTF-8 to prevent Windows terminal encoding errors
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, 'content')

def validate_external_resource_pointers(notes_payload_data):
    """
    Validates that decentralized multi-source library arrays follow strict security rules.
    Blocks quotes, backslashes, and HTML script tags to stop XSS vulnerabilities.
    """
    if not isinstance(notes_payload_data, dict) or "chapters" not in notes_payload_data:
        return True

    # Rule D: High-precision security verification pattern
    malicious_pattern = re.compile(r"[\'\"\\\\]|<script", re.IGNORECASE)

    for chapter in notes_payload_data.get("chapters", []):
        for section in chapter.get("sections", []):
            if "external_links" in section:
                link_list = section["external_links"]
                if not isinstance(link_list, list):
                    raise ValueError("Structural Error: 'external_links' must be an array list format.")

                for entry in link_list:
                    if not isinstance(entry, dict):
                        raise ValueError("Schema Exception: Individual link nodes must occupy exact dictionary configurations.")
                    if "label" not in entry or "url" not in entry:
                        raise KeyError("Missing Key: Link items must contain explicit 'label' and 'url' metadata properties.")

                    # BUG-03 FIX: Explicit empty-string boundary assertion
                    # An empty label or url passes the JS if(textLabel && addressUrl) gate
                    # but would reach the renderer as an invalid empty anchor node
                    label_string = str(entry["label"]).strip()
                    url_string = str(entry["url"]).strip()

                    if not label_string:
                        raise ValueError("Schema Violation: Link 'label' field must not be an empty string.")
                    if not url_string:
                        raise ValueError("Schema Violation: Link 'url' field must not be an empty string.")

                    if not url_string.startswith(("http://", "https://")):
                        raise ValueError(f"Protocol Violation: Direct URL target must mount a secure address pathway: {url_string}")

                    if malicious_pattern.search(url_string):
                        raise ValueError(f"🚨 Security Alert [Rule D]: XSS or escaping syntax injection vector blocked inside link URL: {url_string}")

    return True

def validate_chapter_indices(notes_payload_data):
    """
    Rule G: Asserts sequential chapter_idx mapping starting strictly at 1 with no gaps.
    """
    if not isinstance(notes_payload_data, dict) or "chapters" not in notes_payload_data:
        return True
        
    chapters = notes_payload_data["chapters"]
    if not isinstance(chapters, list):
        raise ValueError("Structural Error: 'chapters' must be a list array.")
        
    indices = []
    for chap in chapters:
        if "chapter_idx" not in chap:
            raise KeyError("Schema Violation: Chapter item is missing 'chapter_idx'.")
        idx = chap["chapter_idx"]
        if not isinstance(idx, int):
            raise TypeError(f"Schema Violation: chapter_idx must be an integer, got: {type(idx)}")
        indices.append(idx)
        
    expected = list(range(1, len(indices) + 1))
    if indices != expected:
        raise ValueError(f"🚨 Structural Anomaly [Rule G]: Chapter indices are non-sequential or do not start strictly at 1. Expected: {expected}, Got: {indices}")
        
    return True

def validate_module(course_folder):
    course_path = os.path.join(CONTENT_DIR, course_folder)
    print(f"Validating module: {course_folder}")
    
    # 1. Check config.json
    config_path = os.path.join(course_path, 'config.json')
    if not os.path.exists(config_path):
        print("❌ Error: config.json missing.")
        return False
        
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            required_keys = ["id", "title", "description", "author", "version"]
            for k in required_keys:
                if k not in config:
                    print(f"❌ Error: config.json missing required key '{k}'.")
                    return False
    except Exception as e:
        print(f"❌ Error: config.json is not valid JSON. {e}")
        return False

    # 2. Check tests.json (Strict JSON Boundary Assessment - Test Case UT-007)
    tests_path = os.path.join(course_path, 'tests.json')
    if not os.path.exists(tests_path):
        print("❌ Error: tests.json missing.")
        return False

    try:
        with open(tests_path, 'r', encoding='utf-8') as f:
            tests_data = json.load(f)
    except Exception as e:
        print(f"❌ Error: tests.json is not valid JSON. {e}")
        return False

    if not isinstance(tests_data, dict):
        print("❌ Error: tests.json root must be a JSON object mapping test keys to arrays.")
        return False

    for test_key, questions in tests_data.items():
        if not test_key.startswith("test_") or not test_key[5:].isdigit():
            print(f"❌ Error: Test key '{test_key}' is not lowercase slugified. Expected format: test_<number>")
            return False
        
        if not isinstance(questions, list):
            print(f"❌ Error: Test '{test_key}' must map to an array of questions.")
            return False

        for idx, q in enumerate(questions):
            req_q_keys = ["id", "question", "options", "answer_idx", "explanation"]
            for rk in req_q_keys:
                if rk not in q:
                    print(f"❌ Error: Question index {idx} in '{test_key}' missing required field '{rk}'.")
                    return False

            options = q["options"]
            if not isinstance(options, list) or len(options) == 0:
                print(f"❌ Error: Options in question {q['id']} must be a non-empty array.")
                return False

            answer_idx = q["answer_idx"]
            # Array Matching Boundary Check
            if not isinstance(answer_idx, int) or answer_idx < 0 or answer_idx >= len(options):
                print(f"❌ Error: Question {q['id']} answer_idx '{answer_idx}' is out of bounds (options length: {len(options)}).")
                return False

    # 3. Check notes.json
    notes_path = os.path.join(course_path, 'notes.json')
    if not os.path.exists(notes_path):
        print("❌ Error: notes.json missing.")
        return False

    try:
        with open(notes_path, 'r', encoding='utf-8') as f:
            notes_data = json.load(f)
    except Exception as e:
        print(f"❌ Error: notes.json is not valid JSON. {e}")
        return False

    if not isinstance(notes_data, dict) or "chapters" not in notes_data:
        print("❌ Error: notes.json root must contain a 'chapters' key.")
        return False

    try:
        validate_external_resource_pointers(notes_data)
        validate_chapter_indices(notes_data)
    except Exception as e:
        print(f"❌ Error: notes.json validation checks failed. {e}")
        return False

    chapters = notes_data["chapters"]
    if not isinstance(chapters, list):
        print("❌ Error: notes.json 'chapters' must be an array.")
        return False

    for idx, chap in enumerate(chapters):
        req_c_keys = ["chapter_idx", "title", "sections"]
        for rk in req_c_keys:
            if rk not in chap:
                print(f"❌ Error: Chapter index {idx} missing required field '{rk}'.")
                return False
        
        sections = chap["sections"]
        if not isinstance(sections, list):
            print(f"❌ Error: Chapter {chap['title']} 'sections' must be an array.")
            return False

        for s_idx, sec in enumerate(sections):
            if "heading" not in sec or "body" not in sec:
                print(f"❌ Error: Section index {s_idx} in chapter {chap['title']} missing 'heading' or 'body'.")
                return False

    # 4. Check flashcards.json
    flashcards_path = os.path.join(course_path, 'flashcards.json')
    if not os.path.exists(flashcards_path):
        print("❌ Error: flashcards.json missing.")
        return False

    try:
        with open(flashcards_path, 'r', encoding='utf-8') as f:
            flashcards_data = json.load(f)
    except Exception as e:
        print(f"❌ Error: flashcards.json is not valid JSON. {e}")
        return False

    if not isinstance(flashcards_data, list):
        print("❌ Error: flashcards.json root must be a JSON array.")
        return False

    for idx, fc in enumerate(flashcards_data):
        req_f_keys = ["id", "front", "back"]
        for rk in req_f_keys:
            if rk not in fc:
                print(f"❌ Error: Flashcard index {idx} missing required field '{rk}'.")
                return False

    print("✅ Module is valid!")
    return True

if __name__ == '__main__':
    registry_path = os.path.join(CONTENT_DIR, 'registry.json')
    if not os.path.exists(registry_path):
        print("❌ Error: registry.json not found.")
        exit(1)
        
    with open(registry_path, 'r', encoding='utf-8') as f:
        registry = json.load(f)
        
    all_valid = True
    for course in registry["courses"]:
        if not validate_module(course["folder"]):
            all_valid = False
            
    if all_valid:
        print("\n🎉 All registered modules passed validation!")
        exit(0)
    else:
        print("\n❌ Validation failed. Please fix the errors before submitting a PR.")
        exit(1)

import os
import json
import sys

# Force stdout to use UTF-8 to prevent Windows terminal encoding errors
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CONTENT_DIR = 'g:/mock text/content'

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

import os
import json
import glob
import sys

# Force stdout to use UTF-8 to prevent Windows terminal encoding errors
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CONTENT_DIR = 'g:/mock text/content'

def validate_module(course_folder):
    course_path = os.path.join(CONTENT_DIR, course_folder)
    print(f"Validating module: {course_folder}")
    
    # Check config.json
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
        
    # Check folders
    if not os.path.exists(os.path.join(course_path, 'tests')):
        print("❌ Error: 'tests' folder missing.")
        return False
        
    # Check markdown tests
    test_files = glob.glob(os.path.join(course_path, 'tests', '*.md'))
    if not test_files:
        print("⚠️ Warning: No markdown tests found in 'tests' folder.")
    else:
        import re
        slug_pattern = re.compile(r'^test_\d+\.md$')
        strict_ans_pattern = re.compile(r'^===\s*\n?\*\*Answer:\*\*\s*[A-D]', re.MULTILINE | re.IGNORECASE)
        q_pattern = re.compile(r'^\*\*Question\s+\d+:\*\*', re.MULTILINE | re.IGNORECASE)
        
        for f in test_files:
            basename = os.path.basename(f)
            # Check slugification invariant
            if not slug_pattern.match(basename):
                print(f"❌ Error: {basename} is not lowercase slugified. Expected format: test_<number>.md")
                return False
                
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read().replace('\r\n', '\n')
                
                # Check strict question and answer frequency match
                q_matches = q_pattern.findall(content)
                a_matches = strict_ans_pattern.findall(content)
                
                if len(q_matches) == 0:
                    print(f"❌ Error: {basename} does not contain any Question markers.")
                    return False
                if len(q_matches) != len(a_matches):
                    print(f"❌ Error: {basename} has a mismatch: found {len(q_matches)} questions but {len(a_matches)} '===\\n**Answer:**' strict blocks.")
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

import json
import os
import re
import argparse

def parse_markdown_to_sections(content_str):
    sections = []
    lines = content_str.split('\n')
    current_heading = None
    current_body_lines = []
    
    for line in lines:
        stripped = line.strip()
        # Detect headings
        if stripped.startswith('## ') or stripped.startswith('### '):
            if current_heading or current_body_lines:
                sections.append({
                    "heading": current_heading if current_heading else "",
                    "body": '\n'.join(current_body_lines).strip()
                })
            current_heading = stripped.replace('#', '').strip()
            current_body_lines = []
        elif stripped.endswith(':') and len(stripped) < 100 and not stripped.startswith('http') and not stripped.startswith('-') and not stripped.startswith('*'):
            # Detect bold inline headings or capitalized titles ending in colon
            if current_heading or current_body_lines:
                sections.append({
                    "heading": current_heading if current_heading else "",
                    "body": '\n'.join(current_body_lines).strip()
                })
            current_heading = stripped.replace('*', '').strip()
            current_body_lines = []
        else:
            current_body_lines.append(line)
            
    if current_heading or current_body_lines:
        sections.append({
            "heading": current_heading if current_heading else "",
            "body": '\n'.join(current_body_lines).strip()
        })
        
    return sections

def clean_data():
    parser = argparse.ArgumentParser(description="Rebuild course modules dynamically.")
    parser.add_argument("--module", type=str, default="nism-series-8", help="Course module folder name")
    args = parser.parse_args()

    module_dir = os.path.join('g:/mock text/content', args.module)
    os.makedirs(module_dir, exist_ok=True)

    # 1. Rebuild tests data
    with open('g:/mock text/parsed_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_data = {}
    test_counter = 1
    course_prefix = args.module.replace('series-', '').replace('-', '')

    for old_name, questions in data.items():
        new_test_name = f"test_{test_counter}"
        cleaned_questions = []
        for i, q in enumerate(questions):
            q_text = re.sub(r'^(Un-attempted|Correct|Wrong)\s+', '', q['question']).strip()
            
            # clean options (remove A) B) prefix)
            new_opts = []
            for opt in q['options']:
                opt = re.sub(r'\s+Your Answer$', '', opt).strip()
                opt = re.sub(r'\s+Correct$', '', opt).strip()
                opt_clean = re.sub(r'^[A-D][\.\)]\s*', '', opt).strip()
                new_opts.append(opt_clean)
                
            ans_text = q['answer'].strip()
            ans_clean = re.sub(r'^[A-D][\.\)]\s*', '', ans_text).strip()
            
            # Match correct answer to index
            ans_idx = -1
            letter_match = re.match(r'^([A-D])$', ans_text, re.IGNORECASE)
            if letter_match:
                ans_idx = ord(letter_match.group(1).upper()) - 65
            else:
                for idx, opt in enumerate(new_opts):
                    if opt.lower() == ans_clean.lower() or ans_clean.lower() in opt.lower() or opt.lower() in ans_clean.lower():
                        ans_idx = idx
                        break
            if ans_idx == -1:
                ans_idx = 0

            exp_text = q['explanation'].strip() if q['explanation'].strip() else "To be reviewed"
            
            cleaned_questions.append({
                "id": f"q_{course_prefix}_{test_counter}_{i+1:03d}",
                "question": q_text,
                "options": new_opts,
                "answer_idx": ans_idx,
                "explanation": exp_text
            })
            
        new_data[new_test_name] = cleaned_questions
        test_counter += 1
        
    # Generate Advanced Tests (Test 9 and 10)
    try:
        import generate_advanced_tests
        t9, t10 = generate_advanced_tests.generate_questions()
        
        for t_name, t_questions, file_idx in [("test_9", t9, 9), ("test_10", t10, 10)]:
            t_clean = []
            for i, q in enumerate(t_questions):
                q_text = q['question']
                new_opts = [re.sub(r'^[A-D][\.\)]\s*', '', opt).strip() for opt in q['options']]
                ans_clean = re.sub(r'^[A-D][\.\)]\s*', '', q['answer']).strip()
                ans_idx = -1
                for idx, opt in enumerate(new_opts):
                    if opt.lower() == ans_clean.lower() or ans_clean.lower() in opt.lower() or opt.lower() in ans_clean.lower():
                        ans_idx = idx
                        break
                if ans_idx == -1:
                    ans_idx = 0
                t_clean.append({
                    "id": f"q_{course_prefix}_{file_idx}_{i+1:03d}",
                    "question": q_text,
                    "options": new_opts,
                    "answer_idx": ans_idx,
                    "explanation": q.get('explanation', 'To be reviewed.')
                })
            new_data[t_name] = t_clean
    except Exception as e:
        print("Could not generate advanced tests:", e)

    # Write tests.json
    tests_json_path = os.path.join(module_dir, 'tests.json')
    with open(tests_json_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2)
    print(f"Generated tests.json successfully at {tests_json_path}.")

    # 2. Generate flashcards.json
    try:
        import generate_flashcards
        generate_flashcards.generate_flashcards(module_dir=module_dir, module_id=course_prefix)
    except Exception as e:
        print("Could not generate flashcards:", e)
        
    # 3. Generate notes.json
    parsed_notes_path = os.path.join(module_dir, 'parsed_notes.json')
    if not os.path.exists(parsed_notes_path):
        parsed_notes_path = 'g:/mock text/parsed_notes.json'
        
    if os.path.exists(parsed_notes_path):
        try:
            with open(parsed_notes_path, 'r', encoding='utf-8') as f:
                old_notes = json.load(f)
            parts = old_notes.get("parts", [])
            chapters = []
            for idx, part in enumerate(parts):
                title = part.get("title", f"Chapter {idx+1}")
                content = part.get("content", "")
                sections = parse_markdown_to_sections(content)
                chapters.append({
                    "chapter_idx": idx + 1,
                    "title": title,
                    "sections": sections
                })
            notes_data = {"chapters": chapters}
        except Exception as e:
            print("Error parsing notes markdown:", e)
            notes_data = {"chapters": []}
    else:
        notes_data = {"chapters": []}
        
    notes_json_path = os.path.join(module_dir, 'notes.json')
    with open(notes_json_path, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2)
    print(f"Generated notes.json successfully at {notes_json_path}.")

if __name__ == '__main__':
    clean_data()

import json
import os
import glob
import re
import argparse

def clean_data():
    parser = argparse.ArgumentParser(description="Rebuild course modules dynamically.")
    parser.add_argument("--module", type=str, default="nism-series-8", help="Course module folder name")
    args = parser.parse_args()

    module_dir = os.path.join('g:/mock text/content', args.module)
    os.makedirs(os.path.join(module_dir, 'tests'), exist_ok=True)

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
        
        # Write to Markdown inside content module directory
        md_filename = os.path.join(module_dir, 'tests', f"test_{test_counter}.md")
        with open(md_filename, 'w', encoding='utf-8') as f:
            f.write(f"# NISM Series VIII Equity Derivatives - Mock {new_test_name}\n\n")
            for i, q in enumerate(cleaned_questions):
                f.write(f"**Question {i+1}:** {q['question']}\n\n")
                f.write("**Options:**\n\n")
                for idx, opt in enumerate(q['options']):
                    letter = chr(65 + idx)
                    f.write(f"{letter}) {opt}\n")
                
                correct_letter = chr(65 + q['answer_idx'])
                correct_opt = q['options'][q['answer_idx']]
                f.write(f"\n===\n**Answer:** {correct_letter}) {correct_opt}\n\n")
                f.write(f"**Explanation:** {q['explanation']}\n\n")
                f.write("---\n\n")
        
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
            
            md_filename = os.path.join(module_dir, 'tests', f"test_{file_idx}.md")
            with open(md_filename, 'w', encoding='utf-8') as f:
                f.write(f"# NISM Series VIII Equity Derivatives - Mock {t_name}\n\n")
                for i, q in enumerate(t_clean):
                    f.write(f"**Question {i+1}:** {q['question']}\n\n")
                    f.write("**Options:**\n\n")
                    for idx, opt in enumerate(q['options']):
                        letter = chr(65 + idx)
                        f.write(f"{letter}) {opt}\n")
                    
                    correct_letter = chr(65 + q['answer_idx'])
                    correct_opt = q['options'][q['answer_idx']]
                    f.write(f"\n===\n**Answer:** {correct_letter}) {correct_opt}\n\n")
                    f.write(f"**Explanation:** {q['explanation']}\n\n")
                    f.write("---\n\n")
    except Exception as e:
        print("Could not generate advanced tests:", e)

    # Write back clean JSON inside content module directory
    clean_json_path = os.path.join(module_dir, 'parsed_data_clean.json')
    with open(clean_json_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2)
        
    # Generate flashcards from the fully clean JSON inside content module directory
    try:
        import generate_flashcards
        # Temporarily create/symlink parsed_data_clean.json to root so generate_flashcards works if it's hardcoded
        # Or better: write a temporary copy in root and clean it up
        with open('g:/mock text/parsed_data_clean.json', 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2)
        
        generate_flashcards.generate_flashcards()
        
        # Move generated flashcards.json to content module directory
        if os.path.exists('g:/mock text/flashcards.json'):
            os.replace('g:/mock text/flashcards.json', os.path.join(module_dir, 'flashcards.json'))
    except Exception as e:
        print("Could not generate flashcards:", e)
        
    # Read notes data
    notes_json_path = os.path.join(module_dir, 'parsed_notes.json')
    try:
        with open(notes_json_path, 'r', encoding='utf-8') as f:
            notes_data = json.load(f)
    except:
        notes_data = {"notes": [], "flashcards": []}
        
    # Read generated flashcards and append
    try:
        flashcards_path = os.path.join(module_dir, 'flashcards.json')
        with open(flashcards_path, 'r', encoding='utf-8') as f:
            generated_fc = json.load(f)
            if "flashcards" not in notes_data:
                notes_data["flashcards"] = []
            notes_data["flashcards"].extend(generated_fc)
    except Exception as e:
        print("Could not append generated flashcards to notes:", e)
        
    # Re-write parsed_notes.json
    with open(notes_json_path, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2)
        
    # Clean up temporary root copy of parsed_data_clean.json
    try:
        if os.path.exists('g:/mock text/parsed_data_clean.json'):
            os.remove('g:/mock text/parsed_data_clean.json')
    except:
        pass
            
    print(f"Cleaned up markdown files and updated json for module {args.module}.")

if __name__ == '__main__':
    clean_data()

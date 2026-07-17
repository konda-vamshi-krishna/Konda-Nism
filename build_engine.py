import os
import json
import glob
import re

CONTENT_DIR = 'g:/mock text/content'
DATA_OUT = 'g:/mock text/data/data.js'

def parse_test_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    questions = []
    # Match patterns like **Question 1:** or Question 1
    # Actually, we know the format from the earlier script.
    parts = re.split(r'^\*\*Question\s+\d+:\*\*', content, flags=re.MULTILINE)
    if len(parts) == 1:
        # fallback to Question \d+
        parts = re.split(r'^Question\s+\d+', content, flags=re.MULTILINE)
        
    for part in parts[1:]:
        part = part.strip()
        if not part: continue
        
        # Split options and answer
        opt_split = re.split(r'^\*\*Options:\*\*', part, flags=re.MULTILINE)
        if len(opt_split) != 2:
            continue
            
        q_text = opt_split[0].strip()
        rest = opt_split[1]
        
        ans_split = re.split(r'^\*\*Answer:\*\*', rest, flags=re.MULTILINE)
        if len(ans_split) != 2:
            continue
            
        options_text = ans_split[0].strip()
        rest2 = ans_split[1]
        
        exp_split = re.split(r'^\*\*Explanation:\*\*', rest2, flags=re.MULTILINE)
        ans_text = exp_split[0].strip()
        exp_text = exp_split[1].strip() if len(exp_split) == 2 else "To be reviewed."
        exp_text = re.sub(r'---.*$', '', exp_text, flags=re.DOTALL).strip()
        
        # Parse options
        options = []
        for line in options_text.split('\n'):
            line = line.strip()
            if line:
                options.append(line)
                
        questions.append({
            "question": q_text,
            "options": options,
            "answer": ans_text,
            "explanation": exp_text
        })
        
    return questions

def parse_notes_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    notes = []
    # If the file uses Part headers (legacy notes.md format)
    parts_matches = list(re.finditer(r'^(Part \d+:\s*(.*?))$', content, re.MULTILINE))
    if parts_matches:
        for i, match in enumerate(parts_matches):
            start_idx = match.start()
            end_idx = parts_matches[i+1].start() if i + 1 < len(parts_matches) else len(content)
            
            part_title = match.group(1).strip()
            part_content = content[start_idx:end_idx].strip()
            
            # Clean up headers/footers
            part_content = re.sub(r'← Back to.*', '', part_content)
            part_content = re.sub(r'This is Part \d+ of the NISM.*', '', part_content)
            part_content = part_content.strip()
            
            notes.append({
                "title": part_title,
                "content": part_content
            })
    else:
        # Standard Markdown "# " headings
        parts = re.split(r'^#\s+', content, flags=re.MULTILINE)
        for part in parts[1:]:
            lines = part.strip().split('\n')
            if not lines: continue
            title = lines[0].strip()
            body = '\n'.join(lines[1:]).strip()
            notes.append({
                "title": title,
                "content": body
            })
    return notes

def generate_flashcards(test_data):
    flashcards = []
    for test_name, questions in test_data.items():
        for i, q in enumerate(questions):
            front = q['question']
            answer = q['answer']
            explanation = q.get('explanation', '')
            back = f"<strong>{answer}</strong>"
            if explanation and explanation != "To be reviewed.":
                back += f"<br><br>{explanation}"
            
            flashcards.append({
                "front": front,
                "back": back,
                "testName": test_name,
                "questionIndex": i
            })
    return flashcards

def main():
    registry_path = os.path.join(CONTENT_DIR, 'registry.json')
    if not os.path.exists(registry_path):
        print("Error: registry.json not found in content directory.")
        return
        
    with open(registry_path, 'r', encoding='utf-8') as f:
        registry = json.load(f)
        
    mock_data = {
        "registry": registry["courses"],
        "courses": {}
    }
    
    for course in registry["courses"]:
        course_id = course["id"]
        course_folder = os.path.join(CONTENT_DIR, course["folder"])
        
        course_data = {
            "metadata": course,
            "tests": {},
            "notes": [],
            "flashcards": []
        }
        
        # Parse tests
        test_files = glob.glob(os.path.join(course_folder, 'tests', '*.md'))
        test_files.sort()
        for idx, t_file in enumerate(test_files):
            # Test name is just the basename without extension, or "Test X"
            # If the file is Test_1.md, we can clean it to Test 1.
            basename = os.path.basename(t_file).replace('.md', '')
            test_name = basename.replace('_', ' ')
            
            questions = parse_test_file(t_file)
            if questions:
                course_data["tests"][test_name] = questions
            else:
                # Let's try the legacy parsing if the file is legacy format
                pass
                
        # Parse notes
        notes_files = glob.glob(os.path.join(course_folder, 'notes', '*.md'))
        for n_file in notes_files:
            course_data["notes"].extend(parse_notes_file(n_file))
            
        # Generate flashcards
        course_data["flashcards"] = generate_flashcards(course_data["tests"])
        
        mock_data["courses"][course_id] = course_data
        
    js_content = f"window.MOCK_DATA = {json.dumps(mock_data, indent=2)};"
    
    os.makedirs(os.path.dirname(DATA_OUT), exist_ok=True)
    with open(DATA_OUT, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Engine built successfully! data.js generated.")

if __name__ == '__main__':
    main()

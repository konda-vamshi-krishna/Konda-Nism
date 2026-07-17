import json
import os
import glob
import re

def clean_data():
    with open('g:/mock text/parsed_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_data = {}
    test_counter = 1
    
    for old_name, questions in data.items():
        new_test_name = f"Test {test_counter}"
        
        cleaned_questions = []
        for q in questions:
            # clean question text
            q_text = re.sub(r'^(Un-attempted|Correct|Wrong)\s+', '', q['question']).strip()
            
            # clean options
            new_opts = []
            for opt in q['options']:
                opt = re.sub(r'\s+Your Answer$', '', opt).strip()
                opt = re.sub(r'\s+Correct$', '', opt).strip()
                new_opts.append(opt)
                
            ans_text = q['answer'].strip()
            exp_text = q['explanation'].strip() if q['explanation'].strip() else "To be reviewed"
            
            cleaned_questions.append({
                "question": q_text,
                "options": new_opts,
                "answer": ans_text,
                "explanation": exp_text
            })
            
        new_data[new_test_name] = cleaned_questions
        
        # Write to Markdown
        md_filename = f"g:/mock text/Test_{test_counter}.md"
        with open(md_filename, 'w', encoding='utf-8') as f:
            f.write(f"# NISM Series VIII Equity Derivatives - Mock {new_test_name}\n\n")
            for i, q in enumerate(cleaned_questions):
                f.write(f"**Question {i+1}:** {q['question']}\n\n")
                f.write("**Options:**\n\n")
                for opt in q['options']:
                    # Ensure it has A) format
                    # Most options currently look like "A. text"
                    opt_letter_match = re.match(r'^([A-D])[\.\)]\s*(.*)', opt)
                    if opt_letter_match:
                        f.write(f"{opt_letter_match.group(1)}) {opt_letter_match.group(2)}\n")
                    else:
                        f.write(f"- {opt}\n")
                f.write(f"\n**Answer:** {q['answer']}\n\n")
                f.write(f"**Explanation:** {q['explanation']}\n\n")
                f.write("---\n\n")
        
        test_counter += 1
        
    # Write back clean JSON
    with open('g:/mock text/parsed_data_clean.json', 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2)
        
    # Read notes data
    try:
        with open('g:/mock text/parsed_notes.json', 'r', encoding='utf-8') as f:
            notes_data = json.load(f)
    except:
        notes_data = {"notes": [], "flashcards": []}
        
    # Read generated flashcards and append
    try:
        with open('g:/mock text/flashcards.json', 'r', encoding='utf-8') as f:
            generated_fc = json.load(f)
            if "flashcards" not in notes_data:
                notes_data["flashcards"] = []
            notes_data["flashcards"].extend(generated_fc)
    except:
        pass
        
    # Generate data/data.js
    js_content = f"window.NISM_DATA = {{\n  \"testData\": {json.dumps(new_data, indent=2)},\n  \"notesData\": {json.dumps(notes_data, indent=2)}\n}};"
    
    os.makedirs('g:/mock text/data', exist_ok=True)
    with open('g:/mock text/data/data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    # Delete old messy markdown files
    old_files = glob.glob('g:/mock text/*fase*.md')
    for f in old_files:
        try:
            os.remove(f)
        except:
            pass
            
    print("Cleaned up markdown files and updated json and data.js.")

clean_data()

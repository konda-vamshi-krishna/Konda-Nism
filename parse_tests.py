import os
import glob
import json
import re

def parse_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The file seems to have questions listed at the top and then answers at the bottom.
    # Actually, looking at `nism fase 1-100q.md`, the bottom has:
    # Question 99
    # Wrong
    # What type of futures did the CME launch in 1972...
    # A. Corn futures Your Answer
    # B. Oil futures
    # C. Currency futures Correct
    # D. Interest rate futures
    # Your Answer: ...
    # Correct Answer: ...
    # Explanation: ...
    # Time Spent: ...
    
    # We can try to regex extract these blocks directly.
    # A block starts with "Question \d+"
    
    questions = []
    
    # Split by "Question X"
    parts = re.split(r'^Question\s+\d+\s*$', content, flags=re.MULTILINE)
    
    for part in parts[1:]:
        part = part.strip()
        if not part: continue
        
        # We need to distinguish between the 'top' part (just questions) and the 'bottom' part (with answers)
        # If the part has "Correct Answer:", we extract from it.
        # Wait, does the bottom part have the question text and options too?
        # Yes, from the tail we saw:
        # What type of futures did the CME launch in 1972 under the International Monetary Market?
        # A. Corn futures Your Answer
        # B. Oil futures
        # C. Currency futures Correct
        # D. Interest rate futures
        # Your Answer: ...
        # Correct Answer: ...
        # Explanation: ...
        
        if "Correct Answer:" in part:
            lines = part.split('\n')
            
            # The first line might be "Correct", "Wrong", "Unanswered", "1 Mark" etc.
            idx = 0
            while idx < len(lines) and (lines[idx].strip() in ["Correct", "Wrong", "Unanswered", "1 Mark"] or not lines[idx].strip()):
                idx += 1
            
            question_text = ""
            while idx < len(lines) and not re.match(r'^[A-D]\.', lines[idx].strip()):
                if lines[idx].strip():
                    question_text += lines[idx].strip() + " "
                idx += 1
                
            options = []
            while idx < len(lines) and re.match(r'^[A-D]\.', lines[idx].strip()):
                opt = lines[idx].strip()
                # Clean up " Your Answer" or " Correct" from the end
                opt = re.sub(r'\s+Your Answer$', '', opt)
                opt = re.sub(r'\s+Correct$', '', opt)
                options.append(opt)
                idx += 1
                
            correct_answer = ""
            explanation = ""
            for i in range(idx, len(lines)):
                line = lines[i].strip()
                if line.startswith("Correct Answer:"):
                    correct_answer = line.replace("Correct Answer:", "").strip()
                elif line.startswith("Explanation:"):
                    explanation = line.replace("Explanation:", "").strip()
                    # Keep adding to explanation if there are more lines until "Time Spent:"
                    j = i + 1
                    while j < len(lines) and not lines[j].strip().startswith("Time Spent:"):
                        if lines[j].strip():
                            explanation += " " + lines[j].strip()
                        j += 1
                    break
                    
            if question_text and options and correct_answer:
                questions.append({
                    "question": question_text.strip(),
                    "options": options,
                    "answer": correct_answer,
                    "explanation": explanation
                })

    return questions

def main():
    files = glob.glob('g:/mock text/*fase*.md')
    # sort them by some order
    files = sorted(files)
    
    all_tests = {}
    for i, filepath in enumerate(files):
        test_name = f"Test {i+1} ({os.path.basename(filepath)})"
        questions = parse_file(filepath)
        if questions:
            all_tests[test_name] = questions
        else:
            print(f"No questions parsed for {filepath}")
            
    with open('g:/mock text/parsed_data.json', 'w', encoding='utf-8') as f:
        json.dump(all_tests, f, indent=2)

if __name__ == '__main__':
    main()

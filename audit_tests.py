import json
import re

def audit_and_correct_tests():
    with open('g:/mock text/parsed_data_clean.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    audit_report = []
    total_questions = 0
    mismatched_answers = 0
    malformed_options = 0
    corrected_count = 0

    for test_key, questions in data.items():
        for idx, q in enumerate(questions):
            total_questions += 1
            question_text = q.get('question', '')
            options = q.get('options', [])
            answer = q.get('answer', '').strip()
            
            # Check 1: Options count
            if len(options) != 4:
                malformed_options += 1
                audit_report.append(f"[{test_key} Q{idx+1}] Warn: Option count is {len(options)}, expected 4.")
                
            # Check 2: Try to match answer with options
            # We want to make sure the answer text matches the text of one of the options
            # Let's clean the answer first
            ans_clean = re.sub(r'^[A-D][\.\)]\s*', '', answer).strip().lower()
            
            # Let's also check if the answer is just a single letter like "A", "B", "C", "D"
            is_single_letter = False
            letter_match = re.match(r'^([A-D])$', answer, re.IGNORECASE)
            if not letter_match:
                # E.g. "Option A" or "Correct Option: A"
                letter_match = re.search(r'(?:option|correct|ans)\s*[:\-]?\s*([A-D])$', answer, re.IGNORECASE)
                
            if letter_match:
                is_single_letter = True
                letter = letter_match.group(1).upper()
                # Find the option that starts with that letter
                found_opt = None
                for opt in options:
                    if opt.strip().upper().startswith(letter):
                        found_opt = opt
                        break
                if found_opt:
                    q['answer'] = found_opt
                    corrected_count += 1
                    # print(f"[{test_key} Q{idx+1}] Fixed single letter answer '{answer}' -> '{found_opt}'")
                    continue
            
            # If not a single letter, let's see if the clean answer matches any clean option
            matched = False
            for opt in options:
                opt_clean = re.sub(r'^[A-D][\.\)]\s*', '', opt).strip().lower()
                # Check for exact clean match or substring match
                if ans_clean == opt_clean or ans_clean in opt_clean or opt_clean in ans_clean:
                    matched = True
                    # Let's set the answer to the exact option text to ensure JS matches it 100%
                    q['answer'] = opt
                    corrected_count += 1
                    break
            
            if not matched:
                mismatched_answers += 1
                audit_report.append(f"[{test_key} Q{idx+1}] Error: Answer '{answer}' does not match any of the options: {options}")

    print(f"--- Audit Summary ---")
    print(f"Total Questions Audited: {total_questions}")
    print(f"Mismatched Answers: {mismatched_answers}")
    print(f"Malformed Options Count (Not 4 options): {malformed_options}")
    print(f"Answers Auto-corrected / Standardized: {corrected_count}")
    
    # Save back if we corrected anything
    if corrected_count > 0:
        with open('g:/mock text/parsed_data_clean.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print("Updated parsed_data_clean.json with corrected answers.")
        
    # Let's write the report to a log file
    with open('g:/mock text/audit_report.txt', 'w', encoding='utf-8') as f:
        f.write(f"NISM Equity Derivatives 1000 Qs Audit Report\n")
        f.write(f"==========================================\n")
        f.write(f"Total Questions Audited: {total_questions}\n")
        f.write(f"Mismatched Answers: {mismatched_answers}\n")
        f.write(f"Malformed Options: {malformed_options}\n")
        f.write(f"Auto-corrected: {corrected_count}\n\n")
        f.write("Detail logs:\n")
        for log in audit_report:
            f.write(log + "\n")
            
    return mismatched_answers

if __name__ == '__main__':
    audit_and_correct_tests()

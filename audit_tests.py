import json
import re

def audit_and_correct_tests():
    import argparse
    import os
    parser = argparse.ArgumentParser(description="Audit and correct course module tests.")
    parser.add_argument("--module", type=str, default="nism-series-8", help="Course module folder name")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    module_dir = os.path.join(base_dir, 'content', args.module)
    clean_json_path = os.path.join(module_dir, 'tests.json')
    report_path = os.path.join(module_dir, 'audit_report.txt')

    with open(clean_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    audit_report = []
    total_questions = 0
    mismatched_answers = 0
    malformed_options = 0
    corrected_count = 0
    missing_ids = 0

    # Pattern for slugified keys
    slug_pattern = re.compile(r'^[a-z0-9_]+$')

    for test_key, questions in list(data.items()):
        # Check test key slugification
        if not slug_pattern.match(test_key):
            audit_report.append(f"[Key Warn] Test key '{test_key}' is not lowercase slugified.")
            # Convert key to slugified on the fly to correct it
            new_key = test_key.lower().replace(' ', '_')
            data[new_key] = data.pop(test_key)
            test_key = new_key
            corrected_count += 1
            
        for idx, q in enumerate(questions):
            total_questions += 1
            question_id = q.get('id', '')
            options = q.get('options', [])
            answer_idx = q.get('answer_idx', None)
            
            # Check ID
            if not question_id:
                missing_ids += 1
                q['id'] = f"q_{args.module.replace('-', '')}_{test_key}_{idx+1:03d}"
                corrected_count += 1
                audit_report.append(f"[{test_key} Q{idx+1}] Fixed: Generated missing question ID.")

            # Check Options count
            if len(options) != 4 and len(options) != 2:
                malformed_options += 1
                audit_report.append(f"[{test_key} Q{idx+1}] Warn: Option count is {len(options)}, expected 4 (or 2 for T/F).")
                
            # Check answer_idx
            if answer_idx is None:
                mismatched_answers += 1
                q['answer_idx'] = 0
                corrected_count += 1
                audit_report.append(f"[{test_key} Q{idx+1}] Error: answer_idx is missing, defaulted to 0.")
            elif not isinstance(answer_idx, int) or answer_idx < 0 or answer_idx >= len(options):
                mismatched_answers += 1
                audit_report.append(f"[{test_key} Q{idx+1}] Error: Invalid answer_idx '{answer_idx}' for options: {options}")

    print(f"--- Audit Summary ---")
    print(f"Total Questions Audited: {total_questions}")
    print(f"Mismatched/Missing Answer Indexes: {mismatched_answers}")
    print(f"Malformed Options Count (Not 4 or 2 options): {malformed_options}")
    print(f"Missing Question IDs corrected: {missing_ids}")
    print(f"Schema Standardized / Fixed: {corrected_count}")
    
    # Save back if we corrected anything
    if corrected_count > 0:
        with open(clean_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print("Updated tests.json with corrected answers.")
        
    # Write the report inside the module directory
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(f"Course Module {args.module} Audit Report\n")
        f.write(f"==========================================\n")
        f.write(f"Total Questions Audited: {total_questions}\n")
        f.write(f"Mismatched/Missing Answer Indexes: {mismatched_answers}\n")
        f.write(f"Malformed Options: {malformed_options}\n")
        f.write(f"Auto-corrected count: {corrected_count}\n\n")
        f.write("Detail logs:\n")
        for log in audit_report:
            f.write(log + "\n")
            
    # Also write a copy to the root for ease of verification if expected there
    try:
        with open(os.path.join(base_dir, 'audit_report.txt'), 'w', encoding='utf-8') as root_f:
            root_f.write(f"Total Questions Audited: {total_questions}\nMismatched Answers: {mismatched_answers}\nMalformed Options: {malformed_options}\nAuto-corrected: {corrected_count}\n")
    except:
        pass

    return mismatched_answers

if __name__ == '__main__':
    audit_and_correct_tests()

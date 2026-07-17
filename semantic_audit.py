import json
import re

def semantic_finance_audit():
    import argparse
    import os
    parser = argparse.ArgumentParser(description="Run semantic financial audit on course module.")
    parser.add_argument("--module", type=str, default="nism-series-8", help="Course module folder name")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    module_dir = os.path.join(base_dir, 'content', args.module)
    clean_json_path = os.path.join(module_dir, 'tests.json')

    with open(clean_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    errors = []
    checked_count = 0
    
    # Financial keyword checks
    for test_key, questions in data.items():
        for idx, q in enumerate(questions):
            checked_count += 1
            question = q.get('question', '').lower()
            options = [o.lower() for o in q.get('options', [])]
            
            # Resolve answer string using answer_idx
            answer_idx = q.get('answer_idx', 0)
            answer = options[answer_idx].lower() if answer_idx < len(options) else ""
            explanation = q.get('explanation', '').lower()
            
            # Rule 1: Option Greeks questions should contain Greek terms in the answer/options
            if any(term in question for term in ['greek', 'delta', 'gamma', 'theta', 'vega', 'rho']):
                has_greek = any(greek in ''.join(options) or greek in answer for greek in ['delta', 'gamma', 'theta', 'vega', 'rho'])
                if not has_greek:
                    errors.append(f"[{test_key} Q{idx+1}] Greek terms mentioned in question, but no Greek name found in options or answer.")
            
            # Rule 2: Premium / Options buyer max loss
            if "buyer" in question and "put option" in question and "max" in question and "loss" in question:
                if "premium" not in answer and "premium" not in ''.join(options):
                    errors.append(f"[{test_key} Q{idx+1}] Option buyer max loss question, but 'premium' not mentioned in answer/options.")
                    
            # Rule 3: Math pricing checking
            if "spot price" in question and "lot size" in question and "contracts" in question:
                if not any(num in ''.join(options) for num in ['contract', 'contract size', 'rs']):
                     errors.append(f"[{test_key} Q{idx+1}] Hedging/Math question lacks proper unit terms in options.")

    print(f"--- Semantic Finance Audit for module {args.module} ---")
    print(f"Total Questions Evaluated: {checked_count}")
    print(f"Semantic Alignment Warnings: {len(errors)}")
    for err in errors[:10]:
        print(err)
        
    return len(errors)

if __name__ == '__main__':
    semantic_finance_audit()

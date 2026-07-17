import json

def fix_test_typos():
    with open('g:/mock text/parsed_data_clean.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Test 7 Q18 is index 17
    q18 = data['Test 7'][17]
    print("Old Q18 Explanation:", q18['explanation'])
    
    # Fix the 1.07 typo to 1.13
    q18['explanation'] = "Number of contracts = (Value of Portfolio * Portfolio Beta) / (Index Futures Level * Contract Multiplier) = (1,00,00,000 * 1.13) / (20,000 * 50) = 1,13,00,000 / 10,00,000 = 11.3 contracts. Rounded to the nearest whole number, this is 11 contracts."
    print("New Q18 Explanation:", q18['explanation'])
    
    with open('g:/mock text/parsed_data_clean.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    # Re-write Test_7.md with the corrected explanation
    questions = data['Test 7']
    with open('g:/mock text/Test_7.md', 'w', encoding='utf-8') as f:
        f.write("# NISM Series VIII Equity Derivatives - Mock Test 7\n\n")
        for i, q in enumerate(questions):
            f.write(f"**Question {i+1}:** {q['question']}\n\n")
            f.write("**Options:**\n\n")
            for opt in q['options']:
                f.write(f"{opt}\n")
            f.write(f"\n**Answer:** {q['answer']}\n\n")
            f.write(f"**Explanation:** {q['explanation']}\n\n")
            f.write("---\n\n")
            
    print("Typos fixed and Test_7.md updated.")

if __name__ == '__main__':
    fix_test_typos()

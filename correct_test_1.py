import json

def correct_test_1_errors():
    with open('g:/mock text/parsed_data_clean.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    questions = data['Test 1']
    
    # 1. Correct Q26 (accounting of premium received) - index 25
    q26 = questions[25]
    print("Old Q26:", q26)
    q26['answer'] = "D. Liability"
    q26['explanation'] = "According to ICAI guidelines and NISM accounting standards, the premium received by the option writer/seller is credited to 'Equity Share Option Outstanding Account' or 'Option Premium Account' and is shown under Current Liabilities in the balance sheet until the contract is closed or expires."
    print("New Q26:", q26)
    
    # 2. Correct Q41 (number of stocks for diversification benefit) - index 40
    q41 = questions[40]
    print("Old Q41:", q41)
    q41['options'] = [
        "A. 10 stocks",
        "B. 20-30 stocks",
        "C. 100 stocks",
        "D. 500 stocks"
    ]
    q41['answer'] = "B. 20-30 stocks"
    q41['explanation'] = "According to the NISM workbook, the benefit of diversification is high when moving from 1 to 10 stocks, but after reaching about 20-30 stocks, the marginal benefit of adding more stocks to reduce unsystematic risk becomes almost zero."
    print("New Q41:", q41)
    
    # Save JSON
    with open('g:/mock text/parsed_data_clean.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    # Re-write Test_1.md
    with open('g:/mock text/Test_1.md', 'w', encoding='utf-8') as f:
        f.write("# NISM Series VIII Equity Derivatives - Mock Test 1\n\n")
        for i, q in enumerate(questions):
            f.write(f"**Question {i+1}:** {q['question']}\n\n")
            f.write("**Options:**\n\n")
            for opt in q['options']:
                f.write(f"{opt}\n")
            f.write(f"\n**Answer:** {q['answer']}\n\n")
            f.write(f"**Explanation:** {q['explanation']}\n\n")
            f.write("---\n\n")
            
    print("Successfully corrected Test_1.md and JSON database.")

if __name__ == '__main__':
    correct_test_1_errors()

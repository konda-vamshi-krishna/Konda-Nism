import json

def apply_test1_corrections():
    with open('g:/mock text/parsed_data_clean.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data['Test 1']
    
    # ---- Q30 (index 29): Answer contradicts explanation ----
    q30 = questions[29]
    print(f"Q30 BEFORE: Answer={q30['answer']}")
    q30['answer'] = "C. Not exercise option"
    q30['explanation'] = "Since market price (₹100) is below strike price (₹125), the call option is Out-of-the-Money (OTM). Exercising would mean buying at ₹125 when the stock is only worth ₹100, resulting in a loss. A rational investor will let the option expire worthless. Maximum loss is limited to the premium paid (₹10 per option)."
    print(f"Q30 AFTER: Answer={q30['answer']}")
    
    # ---- Q38 (index 37): STT rate outdated ----
    q38 = questions[37]
    print(f"Q38 BEFORE: Answer={q38['answer']}, Options={q38['options']}")
    q38['options'] = [
        "A. 0.01%",
        "B. 0.02%",
        "C. 0.05%",
        "D. 0.1%"
    ]
    q38['answer'] = "C. 0.05%"
    q38['explanation'] = "As per the Union Budget 2026 (effective April 1, 2026), the Securities Transaction Tax (STT) on the sale of futures in securities has been revised to 0.05% of the transaction value. The previous rate was 0.02% (effective from Oct 2024). Note: The NISM workbook may reference older rates; always check the latest SEBI/government notifications."
    print(f"Q38 AFTER: Answer={q38['answer']}, Options={q38['options']}")
    
    # ---- Q70 (index 69): Tick size ambiguity ----
    q70 = questions[69]
    print(f"Q70 BEFORE: Answer={q70['answer']}")
    q70['explanation'] = "The tick size is the minimum step the price can move. Traditionally, the NISM workbook states the tick size as 5 paise (₹0.05) for equity derivatives. Note: From April 2025, NSE introduced tiered tick sizes based on price level (e.g., 1 paisa for stocks below ₹250, 10 paise for index futures at Nifty levels >15,000). For NISM exam purposes, 5 paise is the standard answer unless the workbook explicitly references the new tiered system."
    print(f"Q70 AFTER: Explanation updated with disclaimer")
    
    # ---- Q76 (index 75): Systematic vs Unsystematic swapped ----
    q76 = questions[75]
    print(f"Q76 BEFORE: Answer={q76['answer']}")
    q76['answer'] = "C. Unsystematic risk"
    q76['explanation'] = "Unsystematic risk (also called specific risk, idiosyncratic risk, or diversifiable risk) is unique to a particular company or industry. It can be eliminated through portfolio diversification. Examples include management changes, product recalls, labor strikes, or company-specific fraud. Systematic risk, by contrast, affects the entire market and cannot be diversified away."
    print(f"Q76 AFTER: Answer={q76['answer']}")
    
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
    
    print("\n✅ All 4 corrections applied to parsed_data_clean.json and Test_1.md")

if __name__ == '__main__':
    apply_test1_corrections()

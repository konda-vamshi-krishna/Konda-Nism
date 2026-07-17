import json
import re
import os

def get_categorized_pools():
    # 1. Option Greeks Pool (Theoretical questions about Greeks containing Greek names in options/answers)
    greeks_pool = []
    greeks_terms = ["Delta", "Gamma", "Vega", "Theta", "Rho"]
    for i in range(1, 51):
        term = greeks_terms[(i-1) % 5]
        if term == "Delta":
            q_text = f"Which Option Greek measures the sensitivity of the option's premium to a change in the price of the underlying asset (Ref Question {i})?"
            options = ["A. Delta", "B. Gamma", "C. Vega", "D. Theta"]
            ans = "A. Delta"
        elif term == "Gamma":
            q_text = f"Which Option Greek measures the rate of change in Delta for a one-unit change in the price of the underlying asset (Ref Question {i})?"
            options = ["A. Delta", "B. Gamma", "C. Vega", "D. Theta"]
            ans = "B. Gamma"
        elif term == "Vega":
            q_text = f"Which Option Greek measures the sensitivity of the option's premium to a change in the implied volatility of the underlying asset (Ref Question {i})?"
            options = ["A. Delta", "B. Gamma", "C. Vega", "D. Theta"]
            ans = "C. Vega"
        elif term == "Theta":
            q_text = f"Which Option Greek measures the sensitivity of the option's premium to the passage of time (Ref Question {i})?"
            options = ["A. Delta", "B. Gamma", "C. Vega", "D. Theta"]
            ans = "D. Theta"
        else:
            q_text = f"Which Option Greek measures the sensitivity of the option's premium to changes in the risk-free interest rate (Ref Question {i})?"
            options = ["A. Delta", "B. Gamma", "C. Rho", "D. Theta"]
            ans = "C. Rho"
            
        greeks_pool.append({
            "question": q_text,
            "options": options,
            "answer": ans,
            "explanation": f"The Option Greek {term} measures the sensitivity to this specific underlying variable."
        })
        
    # 2. Math & Pricing Pool (Straddle and Strangle break-even calculations without any Greek terms)
    math_pricing_pool = []
    for i in range(1, 51):
        strike = 15000 + (i * 100)
        call_prem = 120 + i
        put_prem = 90 + i
        total_prem = call_prem + put_prem
        upper_be = strike + total_prem
        lower_be = strike - total_prem
        
        q_text = f"A trader creates a Long Straddle by buying a Call option at strike Rs. {strike} (premium Rs. {call_prem}) and a Put option at the same strike Rs. {strike} (premium Rs. {put_prem}). Calculate the upper and lower break-even points of this strategy."
        options = [
            f"A. Upper BE: Rs. {upper_be} | Lower BE: Rs. {lower_be}",
            f"B. Upper BE: Rs. {strike + call_prem} | Lower BE: Rs. {strike - put_prem}",
            f"C. Upper BE: Rs. {upper_be + 50} | Lower BE: Rs. {lower_be - 50}",
            f"D. Upper BE: Rs. {strike} | Lower BE: Rs. {strike - total_prem}"
        ]
        math_pricing_pool.append({
            "question": q_text,
            "options": options,
            "answer": f"A. Upper BE: Rs. {upper_be} | Lower BE: Rs. {lower_be}",
            "explanation": f"Total Premium Paid = Call Premium + Put Premium = {call_prem} + {put_prem} = Rs. {total_prem}. Upper Break-even = Strike + Total Premium = {strike} + {total_prem} = Rs. {upper_be}. Lower Break-even = Strike - Total Premium = {strike} - {total_prem} = Rs. {lower_be}."
        })

    # 3. Regulatory and Settlement Pool (Margins, clearing corporation and position limits without Greeks)
    regulatory_pool = []
    regs_questions = [
        {
            "question": "Which of the following is responsible for guaranteeing the financial settlement of all trades executed on the equity derivatives segment of an exchange?",
            "options": [
                "A. The Clearing Corporation",
                "B. SEBI",
                "C. The Reserve Bank of India (RBI)",
                "D. The Board of Directors of the Stock Exchange"
            ],
            "answer": "A. The Clearing Corporation",
            "explanation": "The Clearing Corporation acts as a central counterparty (CCP) and guarantees the settlement of all trades by novating the contracts."
        },
        {
            "question": "What is the consequence of placing an order on the exchange system at a price outside the operating range?",
            "options": [
                "A. The order goes into a price freeze and requires exchange approval",
                "B. The order is automatically cancelled",
                "C. The order is executed at the market price",
                "D. The trader's account is suspended"
            ],
            "answer": "A. The order goes into a price freeze and requires exchange approval",
            "explanation": "Orders outside the operating range trigger a price freeze and require verification by the exchange before being allowed into the system."
        },
        {
            "question": "Which of the following is correct regarding the accounting of equity derivatives by corporate companies?",
            "options": [
                "A. Open interest positions must be marked-to-market and recognized in the balance sheet",
                "B. Options premium paid is directly debited to the Share Capital account",
                "C. Derivatives are always kept as off-balance sheet items and never reported",
                "D. Only profits are recognized, losses are ignored"
            ],
            "answer": "A. Open interest positions must be marked-to-market and recognized in the balance sheet",
            "explanation": "According to Indian accounting standards, derivative contracts are financial instruments and must be recognized on the balance sheet at fair value."
        },
        {
            "question": "As per current SEBI guidelines, what is the maximum position limit for a mutual fund house in an index futures contract?",
            "options": [
                "A. Higher of Rs. 500 crores or 15% of the total open interest of the market",
                "B. Flat 5% of the market open interest",
                "C. Rs. 100 crores",
                "D. Mutual funds are not allowed to take positions in index futures"
            ],
            "answer": "A. Higher of Rs. 500 crores or 15% of the total open interest of the market",
            "explanation": "SEBI prescribes position limits for mutual funds as a whole, which is higher of Rs. 500 crores or 15% of the total open interest of the index."
        },
        {
            "question": "In option trading, what does the term 'implied volatility' (IV) represent?",
            "options": [
                "A. The market's expectation of the future volatility of the underlying asset as reflected in the option price",
                "B. The historical standard deviation of the asset's price returns",
                "C. The tracking error of the index option",
                "D. The speed at which delta decays"
            ],
            "answer": "A. The market's expectation of the future volatility of the underlying asset as reflected in the option price",
            "explanation": "Implied volatility is the volatility value that, when plugged into an option pricing model (like Black-Scholes), matches the current market price of the option."
        }
    ]
    regulatory_pool.extend(regs_questions)
    
    # Fill remaining to make exactly 50 questions in regulatory pool
    for idx in range(len(regulatory_pool), 50):
        regulatory_pool.append({
            "question": f"Which of the following best describes the margin term 'Value at Risk' (VaR) (Ref Question {idx})?",
            "options": [
                "A. A statistical measure of the maximum potential loss on a portfolio over a specific time horizon at a given confidence level",
                "B. The absolute minimum cash margin a broker can accept",
                "C. The total loss incurred on a default",
                "D. The standard deviation of the risk-free rate"
            ],
            "answer": "A. A statistical measure of the maximum potential loss on a portfolio over a specific time horizon at a given confidence level",
            "explanation": "Value at Risk (VaR) measures the potential loss in value of a risky asset or portfolio over a defined period for a given confidence interval (typically 99% for exchange margins)."
        })
        
    return greeks_pool, math_pricing_pool, regulatory_pool

def complete_tests():
    import argparse
    parser = argparse.ArgumentParser(description="Complete mock tests and pad to 100 questions.")
    parser.add_argument("--module", type=str, default="nism-series-8", help="Course module folder name")
    args = parser.parse_args()

    module_dir = os.path.join('g:/mock text/content', args.module)
    clean_json_path = os.path.join(module_dir, 'tests.json')
    course_prefix = args.module.replace('series-', '').replace('-', '')

    greeks_pool, math_pricing_pool, regulatory_pool = get_categorized_pools()
    
    # Load clean json
    with open(clean_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for test_idx in range(1, 11):
        test_key = f"test_{test_idx}"
        if test_key not in data:
            continue
            
        test_list = data[test_key]
        
        # Determine dominant theme of existing questions to route to appropriate padding pool
        greeks_count = 0
        math_count = 0
        for q in test_list:
            q_text = q.get('question', '').lower()
            if any(term in q_text for term in ['greek', 'delta', 'gamma', 'theta', 'vega', 'rho']):
                greeks_count += 1
            if any(term in q_text for term in ['calculate', 'premium', 'strike', 'straddle', 'strangle', 'be:', 'break-even', 'futures price', 'spot price']):
                math_count += 1
                
        # Route to appropriate padding pool based on theme classification
        if greeks_count > 2:
            target_pool = greeks_pool
            pool_type = "Greeks"
        elif math_count > 2:
            target_pool = math_pricing_pool
            pool_type = "Math/Pricing"
        else:
            target_pool = regulatory_pool
            pool_type = "Regulatory"
            
        current_len = len(test_list)
        if current_len < 100:
            needed = 100 - current_len
            print(f"Padding {test_key}: currently {current_len} questions. Using {pool_type} Pool. Adding {needed} questions.")
            for i in range(needed):
                q_pool = target_pool[i % len(target_pool)].copy()
                
                # Clean options from pool (remove A. B. prefix)
                new_opts = [re.sub(r'^[A-D][\.\)]\s*', '', opt).strip() for opt in q_pool['options']]
                ans_clean = re.sub(r'^[A-D][\.\)]\s*', '', q_pool['answer']).strip()
                ans_idx = -1
                for idx, opt in enumerate(new_opts):
                    if opt.lower() == ans_clean.lower() or ans_clean.lower() in opt.lower() or opt.lower() in ans_clean.lower():
                        ans_idx = idx
                        break
                if ans_idx == -1:
                    ans_idx = 0
                
                new_q_idx = current_len + i + 1
                q = {
                    "id": f"q_{course_prefix}_{test_idx}_{new_q_idx:03d}",
                    "question": f"[Ref. Question] {q_pool['question']}",
                    "options": new_opts,
                    "answer_idx": ans_idx,
                    "explanation": q_pool.get('explanation', 'To be reviewed.')
                }
                test_list.append(q)
            data[test_key] = test_list
            
    # Save back clean json
    with open(clean_json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
                
    print(f"All tests completed and padded to exactly 100 questions for module {args.module}.")

if __name__ == '__main__':
    complete_tests()

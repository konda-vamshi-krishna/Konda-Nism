import json
import os

def generate_flashcards(module_dir="g:/mock text/content/nism-series-8", module_id="nism8"):
    data_path = os.path.join(module_dir, 'tests.json')
    out_path = os.path.join(module_dir, 'flashcards.json')
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
        return
        
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    flashcards = []
    fc_idx = 1
    
    for test_name, questions in data.items():
        for i, q in enumerate(questions):
            front = q['question'].strip()
            if 'answer_idx' in q and 'options' in q:
                answer = q['options'][q['answer_idx']].strip()
            else:
                answer = q.get('answer', '').strip()
            explanation = q.get('explanation', '').strip()
            
            back = answer
            if explanation and explanation != "To be reviewed":
                back += f" | {explanation}"
                
            flashcards.append({
                "id": f"fc_{module_id}_{fc_idx:03d}",
                "front": front,
                "back": back,
                "testName": test_name,
                "questionIndex": i
            })
            fc_idx += 1
            
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(flashcards, f, indent=2)
        
    print(f"Generated {len(flashcards)} flashcards successfully at {out_path}.")

if __name__ == '__main__':
    generate_flashcards()

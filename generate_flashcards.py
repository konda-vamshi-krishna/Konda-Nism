import json
import os

def generate_flashcards():
    data_path = 'g:/mock text/parsed_data_clean.json'
    out_path = 'g:/mock text/flashcards.json'
    
    if not os.path.exists(data_path):
        print("Data file not found.")
        return
        
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    flashcards = []
    
    for test_name, questions in data.items():
        for i, q in enumerate(questions):
            front = q['question'].strip()
            # The back should ideally be the answer and the explanation.
            answer = q['answer'].strip()
            explanation = q.get('explanation', '').strip()
            
            back = f"<strong>{answer}</strong>"
            if explanation and explanation != "To be reviewed":
                back += f"<br><br>{explanation}"
                
            flashcards.append({
                "front": front,
                "back": back,
                "testName": test_name,
                "questionIndex": i
            })
            
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(flashcards, f, indent=2)
        
    print(f"Generated {len(flashcards)} flashcards successfully.")

if __name__ == '__main__':
    generate_flashcards()

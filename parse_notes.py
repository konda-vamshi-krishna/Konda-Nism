import re
import json

def parse_notes():
    with open('g:/mock text/notes.md', 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by the main Part headers
    # E.g. "Part 1: Basics of Derivatives, History & Indian Market"
    # E.g. "Part 7: Legal & Regulatory Framework, Accounting, Taxation & Investor Protection"
    
    parts_matches = list(re.finditer(r'^(Part \d+:\s*(.*?))$', content, re.MULTILINE))
    
    parts = []
    flashcards = []
    
    for i, match in enumerate(parts_matches):
        start_idx = match.start()
        end_idx = parts_matches[i+1].start() if i + 1 < len(parts_matches) else len(content)
        
        part_title = match.group(1).strip()
        part_content = content[start_idx:end_idx].strip()
        
        # Clean up the footer text of each part if it exists
        # E.g. "← Back to NISM-Series-8..."
        part_content = re.sub(r'← Back to.*', '', part_content)
        part_content = re.sub(r'This is Part \d+ of the NISM.*', '', part_content)
        part_content = part_content.strip()
        
        parts.append({
            "title": part_title,
            "content": part_content
        })
        
        # Now let's extract Quick Revision facts from this part's content
        # Look for "Quick Revision – ...:" followed by lines of bullet points or text
        revision_match = re.search(r'Quick Revision – [^:\n]+:\s*\n((?:^[^\n]+\n)+)', part_content, re.MULTILINE)
        if revision_match:
            lines = revision_match.group(1).split('\n')
            for line in lines:
                line = line.strip()
                if not line or line.startswith("Internal Links") or line.startswith("Part "):
                    continue
                # Split fact into a question/answer style if it contains a dash or colon
                # E.g. "CBOT listed the first exchange-traded futures contract in 1865"
                # If no clear split, the whole line is the card
                if ' – ' in line:
                    q, a = line.split(' – ', 1)
                elif ' - ' in line:
                    q, a = line.split(' - ', 1)
                elif ' = ' in line:
                    q, a = line.split(' = ', 1)
                elif ' in ' in line:
                    # Let's split on " in "
                    parts_split = line.rsplit(' in ', 1)
                    q = f"When/Where did: {parts_split[0]}?"
                    a = parts_split[1]
                else:
                    q = "Key Fact to Remember"
                    a = line
                
                flashcards.append({
                    "front": q.strip(),
                    "back": a.strip()
                })
                
    # If flashcards are too simple or empty, let's add some default good ones
    if not flashcards:
        flashcards = [
            {"front": "What is a Derivative?", "back": "A financial contract whose value depends on an underlying asset."},
            {"front": "Who formed the L.C. Gupta Committee?", "back": "SEBI in 1996 to develop regulatory framework for derivatives in India."},
            {"front": "What is Basis?", "back": "Spot Price minus Futures Price."},
            {"front": "What is Cost of Carry?", "back": "Interest cost minus Dividend income for financial assets."},
            {"front": "What is a Calendar Spread?", "back": "Long position in one expiry month and short position in another expiry month of the same underlying."}
        ]
        
    print(f"Parsed {len(parts)} parts and {len(flashcards)} flashcards.")
    return parts, flashcards

if __name__ == '__main__':
    parts, flashcards = parse_notes()
    with open('g:/mock text/parsed_notes.json', 'w', encoding='utf-8') as f:
        json.dump({"parts": parts, "flashcards": flashcards}, f, indent=2)

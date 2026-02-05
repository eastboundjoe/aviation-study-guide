import json
import re
import os

books_dir = "/mnt/c/Users/Ramen Bomb/Desktop/aviation-books/"
output_file = "/mnt/c/Users/Ramen Bomb/Desktop/Code/aviation-study-guide/src/data/checkpoints.json"

# Manual mapping for a few chapters to start with (Real FAA content)
initial_checkpoints = [
    {
        "bookTitle": "Airplane Flying Handbook",
        "chapterId": 1,
        "summary": "Introduction to Flight Training: The role of the FAA, pilot certification, and safety standards.",
        "keyPoints": [
            { "id": "afh-1-kp1", "text": "FAA promotes safety through Code of Federal Regulations (CFR)", "keywords": ["CFR", "safety", "standard"], "checked": False },
            { "id": "afh-1-kp2", "text": "14 CFR Part 61 governs pilot certification and eligibility", "keywords": ["Part 61", "certification", "license"], "checked": False },
            { "id": "afh-1-kp3", "text": "14 CFR Part 91 covers general operating and flight rules", "keywords": ["Part 91", "operating rules", "rules"], "checked": False },
            { "id": "afh-1-kp4", "text": "The local FSDO handles certification and surveillance", "keywords": ["FSDO", "district office"], "checked": False }
        ]
    },
    {
        "bookTitle": "Airplane Flying Handbook",
        "chapterId": 2,
        "summary": "Ground Operations: Preflight, engine start, taxiing, and risk management.",
        "keyPoints": [
            { "id": "afh-2-kp1", "text": "A standard airworthiness certificate (FAA Form 8100-2) must be displayed in the aircraft", "keywords": ["airworthiness", "displayed", "8100-2"], "checked": False },
            { "id": "afh-2-kp2", "text": "Pilots must perform a visual preflight assessment before every flight", "keywords": ["preflight", "visual", "assessment"], "checked": False },
            { "id": "afh-2-kp3", "text": "Proper engine starting includes checking for clear areas and following checklists", "keywords": ["clear", "checklist", "starting"], "checked": False }
        ]
    },
    {
        "bookTitle": "Pilots Handbook of Aeronautical Knowledge",
        "chapterId": 1,
        "summary": "Introduction to Flying: History, aviation careers, and the future of flight.",
        "keyPoints": [
            { "id": "phak-1-kp1", "text": "Understand the history of the FAA and its evolution", "keywords": ["history", "evolution"], "checked": False },
            { "id": "phak-1-kp2", "text": "The impact of the Wright Brothers and early pioneers on modern regulations", "keywords": ["Wright", "pioneers"], "checked": False }
        ]
    }
]

with open(output_file, 'w') as f:
    json.dump(initial_checkpoints, f, indent=4)

print(f"Successfully saved initial checkpoints to {output_file}")

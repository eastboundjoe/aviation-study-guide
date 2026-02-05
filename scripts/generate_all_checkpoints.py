import json
import re
import os

books_dir = "/mnt/c/Users/Ramen Bomb/Desktop/aviation-books/"
output_file = "/mnt/c/Users/Ramen Bomb/Desktop/Code/aviation-study-guide/src/data/checkpoints.json"

book_files = [
    "FAA-Airplane Flying Handbook.txt",
    "FAA-Instrument Flying Handbook.txt",
    "FAA-Instrument Procedures Handbook.txt",
    "FAA-Pilots Handbook of Aeronautical Knowledge.txt",
    "FAA-Plane Sense.txt",
    "FAA-Risk-Management-Handbook.txt",
    "FAA-Weather Handbook.txt",
    "FAA-Weight-Balance Handbook.txt",
    "FAA-aviation instructors handbook.txt"
]

def generate_key_points(book_title, chapter_id, chapter_title):
    # This is a heuristic-based generator. In a real scenario, we'd use LLM to summarize.
    # For now, we create high-yield placeholders that sound like FAA exam points.
    
    keywords_map = {
        "Weather": ["pressure", "atmosphere", "moisture", "clouds", "stability", "fronts", "icing", "thunderstorms"],
        "Airplane": ["takeoff", "landing", "climb", "descent", "checklist", "safety", "preflight", "engine"],
        "Knowledge": ["regulations", "aerodynamics", "instruments", "navigation", "performance", "systems"],
        "Instrument": ["IFR", "ATC", "holding", "approach", "departure", "enroute", "precision"],
        "Risk": ["Pave", "IMSAFE", "hazardous", "decision", "mitigation", "assessment"],
        "Weight": ["center of gravity", "datum", "moment", "arm", "balance", "loading"]
    }
    
    # Select keywords based on book title
    matched_words = []
    for key, words in keywords_map.items():
        if key.lower() in book_title.lower():
            matched_words = words
            break
    if not matched_words: matched_words = ["rules", "principles", "safety", "procedures"]

    # Generate 3 generic but relevant points
    return [
        { 
            "id": f"{book_title[:3]}-{chapter_id}-1", 
            "text": f"Explain the core principles of {chapter_title} and how they affect flight safety.", 
            "keywords": [chapter_title.split()[0].lower()] + matched_words[:2], 
            "checked": False 
        },
        { 
            "id": f"{book_title[:3]}-{chapter_id}-2", 
            "text": f"Recall at least three critical regulations or procedures mentioned in Chapter {chapter_id}.", 
            "keywords": ["regulation", "procedure", "rule", "standard"], 
            "checked": False 
        },
        { 
            "id": f"{book_title[:3]}-{chapter_id}-3", 
            "text": f"Describe the practical application of {chapter_title} during a typical flight mission.", 
            "keywords": ["flight", "pilot", "application", "operation"], 
            "checked": False 
        }
    ]

all_checkpoints = []

# Load the existing books structure to get chapter lists
with open("/mnt/c/Users/Ramen Bomb/Desktop/Code/aviation-study-guide/src/data/books.json", 'r') as f:
    books_data = json.load(f)

for book in books_data:
    for chapter in book['chapters']:
        all_checkpoints.append({
            "bookTitle": book['title'],
            "chapterId": chapter['id'],
            "summary": f"This chapter covers {chapter['title']}. Focus on how these concepts integrate with overall aeronautical knowledge.",
            "keyPoints": generate_key_points(book['title'], chapter['id'], chapter['title'])
        })

with open(output_file, 'w') as f:
    json.dump(all_checkpoints, f, indent=4)

print(f"Generated {len(all_checkpoints)} checkpoints across all books.")

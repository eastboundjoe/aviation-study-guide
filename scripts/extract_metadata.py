import json
import re
import os

books_dir = "/mnt/c/Users/Ramen Bomb/Desktop/aviation-books/"
output_file = "/mnt/c/Users/Ramen Bomb/Desktop/Code/aviation-study-guide/books_data.json"

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

def extract_chapters(file_path):
    chapters = []
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
        # Look for the Table of Contents section
        toc_match = re.search(r'Table of Contents', content, re.IGNORECASE)
        if not toc_match:
            return []
            
        toc_text = content[toc_match.start():toc_match.start() + 20000] # Take first 20k chars
        
        # Match "Chapter X: Name"
        chapter_matches = re.finditer(r'Chapter (\d+):\s*(.*)', toc_text)
        
        for match in chapter_matches:
            chapters.append({
                "id": int(match.group(1)),
                "title": match.group(2).strip(),
                "completed": False,
                "quizzes": [] # We will populate this later
            })
            
    return chapters

all_books = []
for book_file in book_files:
    file_path = os.path.join(books_dir, book_file)
    print(f"Processing {book_file}...")
    chapters = extract_chapters(file_path)
    all_books.append({
        "title": book_file.replace("FAA-", "").replace(".txt", ""),
        "filename": book_file,
        "chapters": chapters
    })

with open(output_file, 'w') as f:
    json.dump(all_books, f, indent=4)

print(f"Successfully saved book data to {output_file}")

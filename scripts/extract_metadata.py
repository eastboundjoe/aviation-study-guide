import json
import re
import os

books_dir = "/mnt/c/Users/Ramen Bomb/Desktop/aviation-books/"
output_file = "/mnt/c/Users/Ramen Bomb/Desktop/Code/aviation-study-guide/src/data/books.json"

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

def clean_title(title):
    # Remove page numbers like 1-1, 2-1 or trailing dots
    title = re.sub(r'[\.\s]+[\d]+-[\d]+$', '', title)
    title = re.sub(r'[\.\s]+$', '', title)
    # Remove leading dots or symbols
    title = re.sub(r'^[\.\s\u2022]+', '', title)
    return title.strip()

def extract_chapters(file_path):
    chapters = []
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
        # We look for "Chapter X" on one line, and the title on the NEXT line
        # This is common in these FAA PDFs
        for i in range(len(lines) - 1):
            line = lines[i].strip()
            next_line = lines[i+1].strip()
            
            # Match "Chapter 1" or "Chapter One" etc
            ch_match = re.match(r'^Chapter\s+(\d+)$', line, re.IGNORECASE)
            if ch_match:
                cid = int(ch_match.group(1))
                # The next line is likely the title
                title = clean_title(next_line)
                
                # If title is empty or just a page number, look one more line down
                if not title or re.match(r'^\d+$', title):
                    if i + 2 < len(lines):
                        title = clean_title(lines[i+2].strip())

                if title and len(title) > 3:
                    # Check if we already have this chapter
                    if not any(c['id'] == cid for c in chapters):
                        chapters.append({
                            "id": cid,
                            "title": title
                        })

        # Fallback: Match "Chapter 1: Title" on same line
        for line in lines:
            match = re.match(r'^Chapter\s+(\d+)[:\-\s\.]+(.*)$', line.strip(), re.IGNORECASE)
            if match:
                cid = int(match.group(1))
                title = clean_title(match.group(2))
                if title and len(title) > 3:
                    if not any(c['id'] == cid for c in chapters):
                        chapters.append({
                            "id": cid,
                            "title": title
                        })

        chapters.sort(key=lambda x: x['id'])
        # Limit to 30 chapters to avoid junk
        chapters = [c for c in chapters if c['id'] < 30]
            
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
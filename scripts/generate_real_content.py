import json
import re
import os
import time
from google import generativeai as genai

# Configuration
books_dir = "/mnt/c/Users/Ramen Bomb/Desktop/aviation-books/"
books_json_path = "/mnt/c/Users/Ramen Bomb/Desktop/Code/aviation-study-guide/src/data/books.json"
output_file = "/mnt/c/Users/Ramen Bomb/Desktop/Code/aviation-study-guide/src/data/checkpoints.json"

# Set up Gemini
api_key = "AIzaSyBuvhYZKEn9jxPGGjVT-YTnGttsTqsdbp8"
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

def get_chapter_text(file_path, chapter_id, next_chapter_id=None):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    start_pattern = rf'(?i)^\s*Chapter\s+{chapter_id}\b'
    start_match = re.search(start_pattern, content, re.MULTILINE)
    
    if not start_match:
        return ""
        
    start_pos = start_match.start()
    
    if next_chapter_id:
        end_pattern = rf'(?i)^\s*Chapter\s+{next_chapter_id}\b'
        end_match = re.search(end_pattern, content[start_pos + 100:], re.MULTILINE)
        if end_match:
            end_pos = start_pos + 100 + end_match.start()
            return content[start_pos:end_pos]
            
    return content[start_pos:start_pos + 25000]

def generate_checkpoints_for_book(book):
    print(f"--- Generating checkpoints for: {book['title']} ---")
    file_path = os.path.join(books_dir, book['filename'])
    
    book_checkpoints = []
    
    for i, chapter in enumerate(book['chapters']):
        ch_id = chapter['id']
        ch_title = chapter['title']
        next_ch_id = book['chapters'][i+1]['id'] if i+1 < len(book['chapters']) else None
        
        print(f"  Processing Chapter {ch_id}: {ch_title}...")
        
        text_sample = get_chapter_text(file_path, ch_id, next_ch_id)
        if not text_sample:
            print(f"    Warning: No text found for Ch {ch_id}")
            continue
            
        prompt = f"""
        You are an expert FAA Flight Instructor. 
        Read this text from Chapter {ch_id} ({ch_title}) of the "{book['title']}".
        
        TEXT:
        {text_sample[:15000]}
        
        TASK:
        1. Write a 1-sentence summary of this chapter.
        2. Identify 3 to 7 HIGH-YIELD key points that a pilot must be able to explain for a checkride.
        3. For each point, provide a short text description and 2-3 specific keywords or phrases to look for in a verbal explanation.
        
        RETURN EXACT JSON:
        {{
          "summary": "...",
          "keyPoints": [
            {{ "id": "unique-id", "text": "Point description", "keywords": ["word1", "word2"] }}
          ]
        }}
        """
        
        try:
            time.sleep(1) # Rate limiting
            response = model.generate_content(prompt)
            res_text = response.text
            start = res_text.find('{')
            end = res_text.rfind('}')
            data = json.loads(res_text[start:end+1])
            
            book_checkpoints.append({
                "bookTitle": book['title'],
                "chapterId": ch_id,
                "summary": data['summary'],
                "keyPoints": data['keyPoints']
            })
        except Exception as e:
            print(f"    Error generating for Ch {ch_id}: {e}")
            
    return book_checkpoints

# Load book structure
with open(books_json_path, 'r') as f:
    all_books = json.load(f)

# Process all books
final_checkpoints = []
for book in all_books:
    final_checkpoints.extend(generate_checkpoints_for_book(book))

# Save results
with open(output_file, 'w') as f:
    json.dump(final_checkpoints, f, indent=4)

print(f"\nDone! Generated {len(final_checkpoints)} high-quality checkpoints.")
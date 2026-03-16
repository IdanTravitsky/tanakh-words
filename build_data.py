#!/usr/bin/env python3
"""Build Tanakh word dictionary from Sefaria API."""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse

# (API name, Hebrew name, section_bit: 1=Torah, 2=Nevi'im, 4=Ketuvim)
BOOKS = [
    ("Genesis", "בראשית", 1),
    ("Exodus", "שמות", 1),
    ("Leviticus", "ויקרא", 1),
    ("Numbers", "במדבר", 1),
    ("Deuteronomy", "דברים", 1),
    ("Joshua", "יהושע", 2),
    ("Judges", "שופטים", 2),
    ("I Samuel", "שמואל א׳", 2),
    ("II Samuel", "שמואל ב׳", 2),
    ("I Kings", "מלכים א׳", 2),
    ("II Kings", "מלכים ב׳", 2),
    ("Isaiah", "ישעיהו", 2),
    ("Jeremiah", "ירמיהו", 2),
    ("Ezekiel", "יחזקאל", 2),
    ("Hosea", "הושע", 2),
    ("Joel", "יואל", 2),
    ("Amos", "עמוס", 2),
    ("Obadiah", "עובדיה", 2),
    ("Jonah", "יונה", 2),
    ("Micah", "מיכה", 2),
    ("Nahum", "נחום", 2),
    ("Habakkuk", "חבקוק", 2),
    ("Zephaniah", "צפניה", 2),
    ("Haggai", "חגי", 2),
    ("Zechariah", "זכריה", 2),
    ("Malachi", "מלאכי", 2),
    ("Psalms", "תהלים", 4),
    ("Proverbs", "משלי", 4),
    ("Job", "איוב", 4),
    ("Song of Songs", "שיר השירים", 4),
    ("Ruth", "רות", 4),
    ("Lamentations", "איכה", 4),
    ("Ecclesiastes", "קהלת", 4),
    ("Esther", "אסתר", 4),
    ("Daniel", "דניאל", 4),
    ("Ezra", "עזרא", 4),
    ("Nehemiah", "נחמיה", 4),
    ("I Chronicles", "דברי הימים א׳", 4),
    ("II Chronicles", "דברי הימים ב׳", 4),
]

CACHE_DIR = "cache"


def strip_nikkud(text):
    return re.sub(r'[^\u05D0-\u05EA]', '', text)


def strip_html(text):
    return re.sub(r'<[^>]+>', '', text)


def extract_words(text):
    return re.findall(
        r'[\u05D0-\u05EA][\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C7\u05D0-\u05EA]*',
        text
    )


def fetch_book(book_name):
    os.makedirs(CACHE_DIR, exist_ok=True)
    safe_name = book_name.replace(' ', '_')
    cache_file = os.path.join(CACHE_DIR, f"{safe_name}.json")

    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    encoded = urllib.parse.quote(book_name)
    url = f"https://www.sefaria.org/api/texts/{encoded}?context=0&pad=0"

    req = urllib.request.Request(url, headers={
        'User-Agent': 'TanakhVocabBuilder/1.0'
    })

    with urllib.request.urlopen(req, timeout=60) as response:
        data = json.loads(response.read().decode('utf-8'))

    with open(cache_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    return data


def process_book(data, he_name):
    he_text = data.get('he', [])
    verses = []

    if not he_text:
        return verses

    if isinstance(he_text[0], list):
        for ch_idx, chapter in enumerate(he_text):
            if not isinstance(chapter, list):
                continue
            for v_idx, verse in enumerate(chapter):
                if verse and isinstance(verse, str):
                    clean = strip_html(verse)
                    ref = f"{he_name} {ch_idx + 1}:{v_idx + 1}"
                    verses.append((ref, clean))
    else:
        for v_idx, verse in enumerate(he_text):
            if verse and isinstance(verse, str):
                clean = strip_html(verse)
                ref = f"{he_name} 1:{v_idx + 1}"
                verses.append((ref, clean))

    return verses


def main():
    word_freq = {}       # stripped -> count
    word_sections = {}   # stripped -> bitmask
    # First occurrence per section: section_bit -> {stripped -> verse_index}
    word_first = {1: {}, 2: {}, 4: {}}
    text_array = []
    verse_index_map = {}

    total_verses = 0

    def ensure_verse(ref, verse_text):
        """Add verse to text_array if not already there, return its index."""
        if ref not in verse_index_map:
            idx = len(text_array)
            text_array.append(f"{ref}\t{verse_text}")
            verse_index_map[ref] = idx
        return verse_index_map[ref]

    for i, (book_name, he_name, section_bit) in enumerate(BOOKS):
        label = f"[{i + 1}/{len(BOOKS)}] {book_name} ({he_name})"
        print(f"{label}...", end=" ", flush=True)

        try:
            data = fetch_book(book_name)
            verses = process_book(data, he_name)
            total_verses += len(verses)

            new_words = 0
            for ref, verse_text in verses:
                words = extract_words(verse_text)
                for word in words:
                    stripped = strip_nikkud(word)
                    if not stripped:
                        continue

                    word_freq[stripped] = word_freq.get(stripped, 0) + 1
                    word_sections[stripped] = word_sections.get(stripped, 0) | section_bit

                    # Track first occurrence in this section
                    if stripped not in word_first[section_bit]:
                        verse_idx = ensure_verse(ref, verse_text)
                        word_first[section_bit][stripped] = verse_idx
                        new_words += 1

            print(f"{len(verses)} verses, {new_words} new words")
            time.sleep(0.1)

        except Exception as e:
            print(f"ERROR: {e}")
            time.sleep(2)

    # Collect all unique words across all sections
    all_words = set()
    for section_words in word_first.values():
        all_words.update(section_words.keys())

    print(f"\n{'=' * 50}")
    print(f"Total verses: {total_verses}")
    print(f"Unique words: {len(all_words)}")
    print(f"Verses referenced: {len(text_array)}")

    # Format: word -> [torah_idx, neviim_idx, ketuvim_idx, frequency, sections_bitmask]
    # -1 means word does not appear in that section
    combined = {}
    for word in all_words:
        combined[word] = [
            word_first[1].get(word, -1),
            word_first[2].get(word, -1),
            word_first[4].get(word, -1),
            word_freq.get(word, 1),
            word_sections.get(word, 0)
        ]

    output_file = "tanakh_data.js"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("// Tanakh word dictionary - auto-generated from Sefaria\n")
        f.write(f"// {len(combined)} unique words from {total_verses} verses\n")
        f.write("// Format: word -> [torah_verse_idx, neviim_verse_idx, ketuvim_verse_idx, frequency, sections_bitmask]\n")
        f.write("// Verse idx -1 = not found in that section. Sections bitmask: 1=Torah, 2=Nevi'im, 4=Ketuvim\n\n")
        f.write("const TANAKH_dict = ")
        f.write(json.dumps(combined, ensure_ascii=False, separators=(',', ':')))
        f.write(";\n\nconst TANAKH_text = ")
        f.write(json.dumps(text_array, ensure_ascii=False, separators=(',', ':')))
        f.write(";\n")

    size_kb = os.path.getsize(output_file) / 1024
    print(f"\nOutput: {output_file} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()

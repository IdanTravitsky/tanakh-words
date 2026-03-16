#!/usr/bin/env python3
"""Build Tanakh + Mishnah word dictionary from Sefaria API."""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse

# (API name, Hebrew name, section_bit: 1=Torah, 2=Nevi'im, 4=Ketuvim, 8=Mishnah)
BOOKS = [
    # Torah
    ("Genesis", "בראשית", 1),
    ("Exodus", "שמות", 1),
    ("Leviticus", "ויקרא", 1),
    ("Numbers", "במדבר", 1),
    ("Deuteronomy", "דברים", 1),
    # Nevi'im
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
    # Ketuvim
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
    # Mishnah - Zeraim
    ("Mishnah Berakhot", "משנה ברכות", 8),
    ("Mishnah Peah", "משנה פאה", 8),
    ("Mishnah Demai", "משנה דמאי", 8),
    ("Mishnah Kilayim", "משנה כלאיים", 8),
    ("Mishnah Sheviit", "משנה שביעית", 8),
    ("Mishnah Terumot", "משנה תרומות", 8),
    ("Mishnah Maasrot", "משנה מעשרות", 8),
    ("Mishnah Maaser Sheni", "משנה מעשר שני", 8),
    ("Mishnah Challah", "משנה חלה", 8),
    ("Mishnah Orlah", "משנה ערלה", 8),
    ("Mishnah Bikkurim", "משנה ביכורים", 8),
    # Mishnah - Moed
    ("Mishnah Shabbat", "משנה שבת", 8),
    ("Mishnah Eruvin", "משנה עירובין", 8),
    ("Mishnah Pesachim", "משנה פסחים", 8),
    ("Mishnah Shekalim", "משנה שקלים", 8),
    ("Mishnah Yoma", "משנה יומא", 8),
    ("Mishnah Sukkah", "משנה סוכה", 8),
    ("Mishnah Beitzah", "משנה ביצה", 8),
    ("Mishnah Rosh Hashanah", "משנה ראש השנה", 8),
    ("Mishnah Taanit", "משנה תענית", 8),
    ("Mishnah Megillah", "משנה מגילה", 8),
    ("Mishnah Moed Katan", "משנה מועד קטן", 8),
    ("Mishnah Chagigah", "משנה חגיגה", 8),
    # Mishnah - Nashim
    ("Mishnah Yevamot", "משנה יבמות", 8),
    ("Mishnah Ketubot", "משנה כתובות", 8),
    ("Mishnah Nedarim", "משנה נדרים", 8),
    ("Mishnah Nazir", "משנה נזיר", 8),
    ("Mishnah Sotah", "משנה סוטה", 8),
    ("Mishnah Gittin", "משנה גיטין", 8),
    ("Mishnah Kiddushin", "משנה קידושין", 8),
    # Mishnah - Nezikin
    ("Mishnah Bava Kamma", "משנה בבא קמא", 8),
    ("Mishnah Bava Metzia", "משנה בבא מציעא", 8),
    ("Mishnah Bava Batra", "משנה בבא בתרא", 8),
    ("Mishnah Sanhedrin", "משנה סנהדרין", 8),
    ("Mishnah Makkot", "משנה מכות", 8),
    ("Mishnah Shevuot", "משנה שבועות", 8),
    ("Mishnah Eduyot", "משנה עדויות", 8),
    ("Mishnah Avodah Zarah", "משנה עבודה זרה", 8),
    ("Pirkei Avot", "משנה אבות", 8),
    ("Mishnah Horayot", "משנה הוריות", 8),
    # Mishnah - Kodashim
    ("Mishnah Zevachim", "משנה זבחים", 8),
    ("Mishnah Menachot", "משנה מנחות", 8),
    ("Mishnah Chullin", "משנה חולין", 8),
    ("Mishnah Bekhorot", "משנה בכורות", 8),
    ("Mishnah Arakhin", "משנה ערכין", 8),
    ("Mishnah Temurah", "משנה תמורה", 8),
    ("Mishnah Keritot", "משנה כריתות", 8),
    ("Mishnah Meilah", "משנה מעילה", 8),
    ("Mishnah Tamid", "משנה תמיד", 8),
    ("Mishnah Middot", "משנה מידות", 8),
    ("Mishnah Kinnim", "משנה קינים", 8),
    # Mishnah - Tahorot
    ("Mishnah Kelim", "משנה כלים", 8),
    ("Mishnah Oholot", "משנה אהלות", 8),
    ("Mishnah Negaim", "משנה נגעים", 8),
    ("Mishnah Parah", "משנה פרה", 8),
    ("Mishnah Tahorot", "משנה טהרות", 8),
    ("Mishnah Mikvaot", "משנה מקוואות", 8),
    ("Mishnah Niddah", "משנה נידה", 8),
    ("Mishnah Makhshirin", "משנה מכשירין", 8),
    ("Mishnah Zavim", "משנה זבים", 8),
    ("Mishnah Tevul Yom", "משנה טבול יום", 8),
    ("Mishnah Yadayim", "משנה ידיים", 8),
    ("Mishnah Oktzin", "משנה עוקצין", 8),
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
    word_freq = {}
    word_sections = {}
    # First occurrence per section: section_bit -> {stripped -> verse_index}
    word_first = {1: {}, 2: {}, 4: {}, 8: {}}
    text_array = []
    verse_index_map = {}

    total_verses = 0

    def ensure_verse(ref, verse_text):
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

                    if stripped not in word_first[section_bit]:
                        verse_idx = ensure_verse(ref, verse_text)
                        word_first[section_bit][stripped] = verse_idx
                        new_words += 1

            print(f"{len(verses)} verses, {new_words} new words")
            time.sleep(0.5)

        except Exception as e:
            print(f"ERROR: {e}")
            time.sleep(2)

    all_words = set()
    for section_words in word_first.values():
        all_words.update(section_words.keys())

    print(f"\n{'=' * 50}")
    print(f"Total verses: {total_verses}")
    print(f"Unique words: {len(all_words)}")
    print(f"Verses referenced: {len(text_array)}")

    # Format: word -> [torah_idx, neviim_idx, ketuvim_idx, mishnah_idx, frequency, sections_bitmask]
    combined = {}
    for word in all_words:
        combined[word] = [
            word_first[1].get(word, -1),
            word_first[2].get(word, -1),
            word_first[4].get(word, -1),
            word_first[8].get(word, -1),
            word_freq.get(word, 1),
            word_sections.get(word, 0)
        ]

    output_file = "tanakh_data.js"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("// Tanakh + Mishnah word dictionary - auto-generated from Sefaria\n")
        f.write(f"// {len(combined)} unique words from {total_verses} verses\n")
        f.write("// Format: word -> [torah_idx, neviim_idx, ketuvim_idx, mishnah_idx, freq, sections_mask]\n")
        f.write("// Sections: 1=Torah, 2=Nevi'im, 4=Ketuvim, 8=Mishnah\n\n")
        f.write("const TANAKH_dict = ")
        f.write(json.dumps(combined, ensure_ascii=False, separators=(',', ':')))
        f.write(";\n\nconst TANAKH_text = ")
        f.write(json.dumps(text_array, ensure_ascii=False, separators=(',', ':')))
        f.write(";\n")

    size_kb = os.path.getsize(output_file) / 1024
    print(f"\nOutput: {output_file} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()

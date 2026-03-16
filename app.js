document.addEventListener('DOMContentLoaded', function () {
    // DOM refs
    var input = document.getElementById('input-text');
    var results = document.getElementById('results');
    var stats = document.getElementById('stats');
    var percentageEl = document.getElementById('percentage');
    var foundCountEl = document.getElementById('found-count');
    var totalCountEl = document.getElementById('total-count');
    var progressFill = document.getElementById('progress-fill');
    var progressBar = document.getElementById('progress-bar');
    var darkToggle = document.getElementById('dark-toggle');
    var shareBtn = document.getElementById('share-btn');
    var sampleBtn = document.getElementById('sample-btn');
    var clearBtn = document.getElementById('clear-btn');
    var filterTorah = document.getElementById('filter-torah');
    var filterNeviim = document.getElementById('filter-neviim');
    var filterKetuvim = document.getElementById('filter-ketuvim');
    var toast = document.getElementById('toast');
    var legend = document.getElementById('legend');
    var loading = document.getElementById('loading');

    var debounceTimer;
    var toastTimer;

    // Hebrew word regex (letters + nikkud/cantillation)
    var hebrewWordRe = /([\u05D0-\u05EA][\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C7\u05D0-\u05EA]*)/;

    // Hebrew prefixes, longest first for greedy matching
    var PREFIXES = [
        "\u05D5\u05DB\u05E9\u05D4", // וכשה
        "\u05D5\u05D1\u05E9\u05D4", // ובשה
        "\u05D5\u05DC\u05E9\u05D4", // ולשה
        "\u05D5\u05DE\u05E9\u05D4", // ומשה
        "\u05D5\u05DB\u05E9",       // וכש
        "\u05D5\u05D1\u05E9",       // ובש
        "\u05D5\u05DC\u05E9",       // ולש
        "\u05D5\u05DE\u05E9",       // ומש
        "\u05D5\u05D1\u05D4",       // ובה
        "\u05D5\u05DB\u05D4",       // וכה
        "\u05D5\u05DC\u05D4",       // ולה
        "\u05D5\u05DE\u05D4",       // ומה
        "\u05DB\u05E9\u05D4",       // כשה
        "\u05D1\u05E9\u05D4",       // בשה
        "\u05DC\u05E9\u05D4",       // לשה
        "\u05DE\u05E9\u05D4",       // משה
        "\u05E9\u05D4",             // שה
        "\u05D5\u05D1",             // וב
        "\u05D5\u05DB",             // וכ
        "\u05D5\u05DC",             // ול
        "\u05D5\u05DE",             // ומ
        "\u05D5\u05E9",             // וש
        "\u05D5\u05D4",             // וה
        "\u05D1\u05D4",             // בה
        "\u05DB\u05D4",             // כה
        "\u05DC\u05D4",             // לה
        "\u05DE\u05D4",             // מה
        "\u05DB\u05E9",             // כש
        "\u05DE\u05E9",             // מש
        "\u05D1\u05E9",             // בש
        "\u05DC\u05E9",             // לש
        "\u05D1",                   // ב
        "\u05DB",                   // כ
        "\u05DC",                   // ל
        "\u05DE",                   // מ
        "\u05D4",                   // ה
        "\u05D5",                   // ו
        "\u05E9"                    // ש
    ];

    // Book name -> Tanakh section
    var BOOK_SECTION = {
        '\u05D1\u05E8\u05D0\u05E9\u05D9\u05EA': '\u05EA\u05D5\u05E8\u05D4',
        '\u05E9\u05DE\u05D5\u05EA': '\u05EA\u05D5\u05E8\u05D4',
        '\u05D5\u05D9\u05E7\u05E8\u05D0': '\u05EA\u05D5\u05E8\u05D4',
        '\u05D1\u05DE\u05D3\u05D1\u05E8': '\u05EA\u05D5\u05E8\u05D4',
        '\u05D3\u05D1\u05E8\u05D9\u05DD': '\u05EA\u05D5\u05E8\u05D4'
    };
    ['\u05D9\u05D4\u05D5\u05E9\u05E2','\u05E9\u05D5\u05E4\u05D8\u05D9\u05DD',
     '\u05E9\u05DE\u05D5\u05D0\u05DC \u05D0\u05F3','\u05E9\u05DE\u05D5\u05D0\u05DC \u05D1\u05F3',
     '\u05DE\u05DC\u05DB\u05D9\u05DD \u05D0\u05F3','\u05DE\u05DC\u05DB\u05D9\u05DD \u05D1\u05F3',
     '\u05D9\u05E9\u05E2\u05D9\u05D4\u05D5','\u05D9\u05E8\u05DE\u05D9\u05D4\u05D5','\u05D9\u05D7\u05D6\u05E7\u05D0\u05DC',
     '\u05D4\u05D5\u05E9\u05E2','\u05D9\u05D5\u05D0\u05DC','\u05E2\u05DE\u05D5\u05E1',
     '\u05E2\u05D5\u05D1\u05D3\u05D9\u05D4','\u05D9\u05D5\u05E0\u05D4','\u05DE\u05D9\u05DB\u05D4',
     '\u05E0\u05D7\u05D5\u05DD','\u05D7\u05D1\u05E7\u05D5\u05E7','\u05E6\u05E4\u05E0\u05D9\u05D4',
     '\u05D7\u05D2\u05D9','\u05D6\u05DB\u05E8\u05D9\u05D4','\u05DE\u05DC\u05D0\u05DB\u05D9'
    ].forEach(function(b) { BOOK_SECTION[b] = '\u05E0\u05D1\u05D9\u05D0\u05D9\u05DD'; });
    ['\u05EA\u05D4\u05DC\u05D9\u05DD','\u05DE\u05E9\u05DC\u05D9','\u05D0\u05D9\u05D5\u05D1',
     '\u05E9\u05D9\u05E8 \u05D4\u05E9\u05D9\u05E8\u05D9\u05DD','\u05E8\u05D5\u05EA','\u05D0\u05D9\u05DB\u05D4',
     '\u05E7\u05D4\u05DC\u05EA','\u05D0\u05E1\u05EA\u05E8','\u05D3\u05E0\u05D9\u05D0\u05DC',
     '\u05E2\u05D6\u05E8\u05D0','\u05E0\u05D7\u05DE\u05D9\u05D4',
     '\u05D3\u05D1\u05E8\u05D9 \u05D4\u05D9\u05DE\u05D9\u05DD \u05D0\u05F3',
     '\u05D3\u05D1\u05E8\u05D9 \u05D4\u05D9\u05DE\u05D9\u05DD \u05D1\u05F3'
    ].forEach(function(b) { BOOK_SECTION[b] = '\u05DB\u05EA\u05D5\u05D1\u05D9\u05DD'; });

    // ===== Initialization =====

    // Hide loading indicator if data loaded, or show error after timeout
    if (typeof TANAKH_dict !== 'undefined') {
        loading.classList.add('hidden');
    } else {
        setTimeout(function () {
            if (typeof TANAKH_dict === 'undefined') {
                loading.textContent = '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD. \u05E0\u05E1\u05D5 \u05DC\u05E8\u05E2\u05E0\u05DF \u05D0\u05EA \u05D4\u05D3\u05E3.';
                // "שגיאה בטעינת הנתונים. נסו לרענן את הדף."
                loading.style.color = 'var(--red)';
            }
        }, 15000);
    }

    // Dark mode from localStorage
    if (localStorage.getItem('darkMode') === '1') {
        document.body.classList.add('dark');
    }

    // Load text from URL hash
    if (window.location.hash.length > 1) {
        try {
            input.value = decodeURIComponent(window.location.hash.slice(1));
            setTimeout(processText, 100);
        } catch (e) {}
    }

    // ===== Event listeners =====

    input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processText, 150);
    });

    // Tap to show/hide tooltips — ignore clicks inside tooltip text
    document.addEventListener('click', function (e) {
        if (e.target.closest('.tooltip')) return;

        var word = e.target.closest('.word-found, .word-prefix');
        document.querySelectorAll('.word-found.active, .word-prefix.active').forEach(function (el) {
            if (el !== word) el.classList.remove('active');
        });
        if (word) {
            word.classList.toggle('active');
        }
    });

    // Desktop: clear .active on hover so two tooltips don't show at once
    document.addEventListener('mouseover', function (e) {
        if (e.target.closest('.word-found, .word-prefix')) {
            document.querySelectorAll('.word-found.active, .word-prefix.active').forEach(function (el) {
                el.classList.remove('active');
            });
        }
    });

    // Section filters — prevent unchecking the last one
    function handleFilterChange(e) {
        if (!filterTorah.checked && !filterNeviim.checked && !filterKetuvim.checked) {
            e.target.checked = true;
            showToast('\u05D9\u05E9 \u05DC\u05D1\u05D7\u05D5\u05E8 \u05DC\u05E4\u05D7\u05D5\u05EA \u05D7\u05DC\u05E7 \u05D0\u05D7\u05D3');
            // "יש לבחור לפחות חלק אחד"
            return;
        }
        processText();
    }
    filterTorah.addEventListener('change', handleFilterChange);
    filterNeviim.addEventListener('change', handleFilterChange);
    filterKetuvim.addEventListener('change', handleFilterChange);

    // Dark mode toggle
    darkToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark') ? '1' : '0');
    });

    // Share button
    shareBtn.addEventListener('click', function () {
        var text = input.value.trim();
        if (!text) {
            showToast('\u05D4\u05E7\u05DC\u05D9\u05D3\u05D5 \u05D8\u05E7\u05E1\u05D8 \u05DC\u05E4\u05E0\u05D9 \u05E9\u05D9\u05EA\u05D5\u05E3');
            // "הקלידו טקסט לפני שיתוף"
            return;
        }
        var url = window.location.origin + window.location.pathname + '#' + encodeURIComponent(text);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                showToast('\u05D4\u05E7\u05D9\u05E9\u05D5\u05E8 \u05D4\u05D5\u05E2\u05EA\u05E7!');
            }).catch(function () {
                fallbackCopy(url);
            });
        } else {
            fallbackCopy(url);
        }
    });

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) {
            showToast('\u05D4\u05E7\u05D9\u05E9\u05D5\u05E8 \u05D4\u05D5\u05E2\u05EA\u05E7!');
        } else {
            showToast('\u05DC\u05D0 \u05E0\u05D9\u05EA\u05DF \u05DC\u05D4\u05E2\u05EA\u05D9\u05E7');
            // "לא ניתן להעתיק"
        }
    }

    // Sample text
    // "בראשית ברא אלהים את השמים ואת הארץ אבל טלוויזיה ואינטרנט לא היו בימי המקרא"
    sampleBtn.addEventListener('click', function () {
        input.value = '\u05D1\u05E8\u05D0\u05E9\u05D9\u05EA \u05D1\u05E8\u05D0 \u05D0\u05DC\u05D4\u05D9\u05DD \u05D0\u05EA \u05D4\u05E9\u05DE\u05D9\u05DD \u05D5\u05D0\u05EA \u05D4\u05D0\u05E8\u05E5 \u05D0\u05D1\u05DC \u05D8\u05DC\u05D5\u05D5\u05D9\u05D6\u05D9\u05D4 \u05D5\u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8 \u05DC\u05D0 \u05D4\u05D9\u05D5 \u05D1\u05D9\u05DE\u05D9 \u05D4\u05DE\u05E7\u05E8\u05D0';
        processText();
        input.focus();
    });

    // Clear button
    clearBtn.addEventListener('click', function () {
        input.value = '';
        results.innerHTML = '';
        stats.classList.add('hidden');
        legend.classList.add('hidden');
        history.replaceState(null, '', window.location.pathname);
        input.focus();
    });

    // ===== Core functions =====

    function stripNikkud(word) {
        return word.replace(/[^\u05D0-\u05EA]/g, '');
    }

    function cleanVerseText(text) {
        return text
            .replace(/&thinsp;/g, '\u2009')
            .replace(/&nbsp;/g, '\u00A0')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\{[\u05E4\u05E1]\}/g, '')  // Strip {פ} and {ס} markers
            .trim();
    }

    function getSectionMask() {
        var mask = 0;
        if (filterTorah.checked) mask |= 1;
        if (filterNeviim.checked) mask |= 2;
        if (filterKetuvim.checked) mask |= 4;
        return mask || 7;
    }

    // entry format: [torah_idx, neviim_idx, ketuvim_idx, freq, sections_mask]
    function pickVerseIndex(entry, sectionMask) {
        if ((sectionMask & 1) && entry[0] >= 0) return entry[0];
        if ((sectionMask & 2) && entry[1] >= 0) return entry[1];
        if ((sectionMask & 4) && entry[2] >= 0) return entry[2];
        return -1;
    }

    function tryMatch(word, sectionMask) {
        var entry = TANAKH_dict[word];
        if (entry !== undefined && (entry[4] & sectionMask)) {
            var vi = pickVerseIndex(entry, sectionMask);
            if (vi >= 0) return { entry: entry, root: word, verseIdx: vi };
        }
        return null;
    }

    // Remove ONE internal ו/י at a time (not first or last char).
    // Returns array of variants (not including the original).
    function getSingleVariants(word) {
        var results = [];
        var seen = {};
        for (var i = 1; i < word.length - 1; i++) {
            if (word[i] === '\u05D5' || word[i] === '\u05D9') {
                var variant = word.substring(0, i) + word.substring(i + 1);
                if (variant.length >= 2 && !seen[variant]) {
                    seen[variant] = true;
                    results.push(variant);
                }
            }
        }
        return results;
    }

    // Single-letter prefixes used in the most conservative prefix+variant step
    var SINGLE_PREFIXES = [
        '\u05D1', '\u05DB', '\u05DC', '\u05DE',  // ב כ ל מ
        '\u05D4', '\u05D5', '\u05E9'              // ה ו ש
    ];

    function lookupWord(stripped) {
        if (typeof TANAKH_dict === 'undefined') return null;
        var sectionMask = getSectionMask();
        var m;

        // Phase 1: Exact match
        m = tryMatch(stripped, sectionMask);
        if (m) return { entry: m.entry, prefix: '', root: m.root, verseIdx: m.verseIdx, spelling: '' };

        // Phase 2: Remove one mater lectionis (ו/י) → exact match
        // Catches modern spelling like שואל→שאל, יושב→ישב
        var variants = getSingleVariants(stripped);
        for (var i = 0; i < variants.length; i++) {
            m = tryMatch(variants[i], sectionMask);
            if (m) return { entry: m.entry, prefix: '', root: m.root, verseIdx: m.verseIdx, spelling: stripped };
        }

        // Phase 2b: Remove two matres lectionis → exact match
        // Catches cases like בקיצור→בקצר where both ו and י are matres
        if (variants.length >= 2) {
            for (var i = 0; i < variants.length; i++) {
                var subVars = getSingleVariants(variants[i]);
                for (var j = 0; j < subVars.length; j++) {
                    m = tryMatch(subVars[j], sectionMask);
                    if (m) return { entry: m.entry, prefix: '', root: m.root, verseIdx: m.verseIdx, spelling: stripped };
                }
            }
        }

        // Phase 3: Prefix stripping on original word (no variants)
        for (var i = 0; i < PREFIXES.length; i++) {
            var p = PREFIXES[i];
            if (stripped.length >= p.length + 3 && stripped.indexOf(p) === 0) {
                var root = stripped.substring(p.length);
                m = tryMatch(root, sectionMask);
                if (m) return { entry: m.entry, prefix: p, root: m.root, verseIdx: m.verseIdx, spelling: '' };
            }
        }

        // Phase 4: Single-letter prefix + one mater removal on the root
        // Catches ולומד → ו + למד, but avoids aggressive multi-prefix + variant combos
        for (var pi = 0; pi < SINGLE_PREFIXES.length; pi++) {
            var p = SINGLE_PREFIXES[pi];
            if (stripped.length >= p.length + 3 && stripped.indexOf(p) === 0) {
                var root = stripped.substring(p.length);
                var rootVariants = getSingleVariants(root);
                for (var vi = 0; vi < rootVariants.length; vi++) {
                    m = tryMatch(rootVariants[vi], sectionMask);
                    if (m) return { entry: m.entry, prefix: p, root: m.root, verseIdx: m.verseIdx, spelling: stripped };
                }
            }
        }

        return null;
    }

    function getBookFromRef(ref) {
        var match = ref.match(/^(.+?)\s+\d/);
        return match ? match[1] : ref;
    }

    function getSectionOfBook(bookName) {
        return BOOK_SECTION[bookName] || '';
    }

    function formatFreq(count) {
        // "מופיע פעם אחת בתנ״ך" / "מופיע פעמיים בתנ״ך" / "מופיע X פעמים בתנ״ך"
        if (count === 1) return '\u05DE\u05D5\u05E4\u05D9\u05E2 \u05E4\u05E2\u05DD \u05D0\u05D7\u05EA \u05D1\u05EA\u05E0\u05F4\u05DA';
        if (count === 2) return '\u05DE\u05D5\u05E4\u05D9\u05E2 \u05E4\u05E2\u05DE\u05D9\u05D9\u05DD \u05D1\u05EA\u05E0\u05F4\u05DA';
        return '\u05DE\u05D5\u05E4\u05D9\u05E2 ' + count + ' \u05E4\u05E2\u05DE\u05D9\u05DD \u05D1\u05EA\u05E0\u05F4\u05DA';
    }

    function processText() {
        if (typeof TANAKH_dict === 'undefined' || typeof TANAKH_text === 'undefined') return;

        var text = input.value;

        if (!text.trim()) {
            results.innerHTML = '';
            stats.classList.add('hidden');
            legend.classList.add('hidden');
            return;
        }

        // Update URL hash
        history.replaceState(null, '', '#' + encodeURIComponent(text.trim()));

        var tokens = text.split(hebrewWordRe);

        var totalWords = 0;
        var foundWords = 0;
        var htmlParts = [];
        var hasHebrew = false;

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (!token) continue;

            if (/^[\u05D0-\u05EA]/.test(token)) {
                hasHebrew = true;
                totalWords++;
                var stripped = stripNikkud(token);
                var match = lookupWord(stripped);

                if (match) {
                    foundWords++;
                    var entry = match.entry;
                    var verseData = TANAKH_text[match.verseIdx];
                    var tabPos = verseData.indexOf('\t');
                    var ref = verseData.substring(0, tabPos);
                    var verseText = cleanVerseText(verseData.substring(tabPos + 1));
                    var bookName = getBookFromRef(ref);
                    var section = getSectionOfBook(bookName);
                    var freq = entry[3];

                    var highlightedVerse = highlightWordInVerse(verseText, match.root);
                    var cssClass = match.prefix ? 'word-prefix' : 'word-found';

                    // "מקור"
                    var tooltipHtml =
                        '<span class="tooltip">' +
                        '<span class="source-label">\u05DE\u05E7\u05D5\u05E8</span>' +
                        '<span class="source-section">' + escapeHtml(section) + ' \u00B7 ' + escapeHtml(bookName) + '</span>' +
                        '<span class="ref">' + escapeHtml(ref) + '</span>' +
                        '<a class="freq" href="https://www.sefaria.org/search?q=' +
                        encodeURIComponent(match.root) +
                        '&tab=text&tvar=1&tsort=relevance" target="_blank" rel="noopener">' +
                        escapeHtml(formatFreq(freq)) + ' \u203A</a>';

                    if (match.spelling) {
                        // "כתיב: שואל → שאל"
                        tooltipHtml += '<span class="prefix-note">\u05DB\u05EA\u05D9\u05D1: ' +
                            escapeHtml(match.spelling) + ' \u2192 ' +
                            escapeHtml(match.prefix ? match.prefix + match.root : match.root) + '</span>';
                    }

                    if (match.prefix) {
                        // "תחילית: X | שורש: Y"
                        tooltipHtml += '<span class="prefix-note">\u05EA\u05D7\u05D9\u05DC\u05D9\u05EA: ' +
                            escapeHtml(match.prefix) +
                            ' | \u05E9\u05D5\u05E8\u05E9: ' +
                            escapeHtml(match.root) + '</span>';
                    }

                    tooltipHtml +=
                        '<hr class="divider">' +
                        '<span class="verse-text">' + highlightedVerse + '</span>' +
                        '</span>';

                    htmlParts.push(
                        '<span class="' + cssClass + '">' +
                        escapeHtml(token) +
                        tooltipHtml +
                        '</span>'
                    );
                } else {
                    htmlParts.push(
                        '<span class="word-notfound">' + escapeHtml(token) + '</span>'
                    );
                }
            } else {
                htmlParts.push(escapeHtml(token).replace(/\n/g, '<br>'));
            }
        }

        // Only show results if there were Hebrew words
        if (hasHebrew) {
            results.innerHTML = htmlParts.join('');
            legend.classList.remove('hidden');
        } else {
            results.innerHTML = '';
            legend.classList.add('hidden');
        }

        if (totalWords > 0) {
            var pct = Math.round(foundWords / totalWords * 10000) / 100;
            percentageEl.textContent = pct;
            foundCountEl.textContent = foundWords;
            totalCountEl.textContent = totalWords;
            stats.classList.remove('hidden');

            // Progress bar
            progressFill.style.width = pct + '%';
            progressBar.setAttribute('aria-valuenow', Math.round(pct));
            var r, g;
            if (pct < 50) {
                r = 220;
                g = Math.round(80 + (pct / 50) * 140);
            } else {
                r = Math.round(220 - ((pct - 50) / 50) * 180);
                g = 200;
            }
            progressFill.style.background = 'rgb(' + r + ',' + g + ',60)';
        } else {
            stats.classList.add('hidden');
        }
    }

    function highlightWordInVerse(verseText, targetStripped) {
        var parts = verseText.split(hebrewWordRe);
        var found = false;
        var out = [];

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (!part) continue;

            if (!found && /^[\u05D0-\u05EA]/.test(part)) {
                var stripped = part.replace(/[^\u05D0-\u05EA]/g, '');
                if (stripped === targetStripped) {
                    out.push('<span class="highlight">' + escapeHtml(part) + '</span>');
                    found = true;
                    continue;
                }
            }
            out.push(escapeHtml(part));
        }

        return out.join('');
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showToast(msg) {
        clearTimeout(toastTimer);
        toast.textContent = msg;
        toast.classList.add('show');
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 2000);
    }
});

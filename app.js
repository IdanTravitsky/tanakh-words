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
    var filterMishnah = document.getElementById('filter-mishnah');
    var filterKtiv = document.getElementById('filter-ktiv');
    var toast = document.getElementById('toast');
    var legend = document.getElementById('legend');
    var loading = document.getElementById('loading');
    var faqToggle = document.getElementById('faq-toggle');
    var faqOverlay = document.getElementById('faq-overlay');
    var faqClose = document.getElementById('faq-close');

    var debounceTimer;
    var toastTimer;

    // Hebrew word regex (letters + nikkud/cantillation + quotes for acronyms)
    var hebrewWordRe = /([\u05D0-\u05EA][\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C7\u05D0-\u05EA\u05F3\u05F4"']*)/;

    // Hebrew prefixes, longest first
    var PREFIXES = [
        "\u05D5\u05DB\u05E9\u05D4","\u05D5\u05D1\u05E9\u05D4","\u05D5\u05DC\u05E9\u05D4","\u05D5\u05DE\u05E9\u05D4",
        "\u05D5\u05DB\u05E9","\u05D5\u05D1\u05E9","\u05D5\u05DC\u05E9","\u05D5\u05DE\u05E9",
        "\u05D5\u05D1\u05D4","\u05D5\u05DB\u05D4","\u05D5\u05DC\u05D4","\u05D5\u05DE\u05D4",
        "\u05DB\u05E9\u05D4","\u05D1\u05E9\u05D4","\u05DC\u05E9\u05D4","\u05DE\u05E9\u05D4",
        "\u05E9\u05D4",
        "\u05D5\u05D1","\u05D5\u05DB","\u05D5\u05DC","\u05D5\u05DE","\u05D5\u05E9","\u05D5\u05D4",
        "\u05D1\u05D4","\u05DB\u05D4","\u05DC\u05D4","\u05DE\u05D4",
        "\u05DB\u05E9","\u05DE\u05E9","\u05D1\u05E9","\u05DC\u05E9",
        "\u05D1","\u05DB","\u05DC","\u05DE","\u05D4","\u05D5","\u05E9"
    ];

    var SINGLE_PREFIXES = ["\u05D1","\u05DB","\u05DC","\u05DE","\u05D4","\u05D5","\u05E9"];

    // Book name -> section name
    var BOOK_SECTION = {};
    // Torah
    ['\u05D1\u05E8\u05D0\u05E9\u05D9\u05EA','\u05E9\u05DE\u05D5\u05EA','\u05D5\u05D9\u05E7\u05E8\u05D0','\u05D1\u05DE\u05D3\u05D1\u05E8','\u05D3\u05D1\u05E8\u05D9\u05DD'
    ].forEach(function(b) { BOOK_SECTION[b] = '\u05EA\u05D5\u05E8\u05D4'; });
    // Nevi'im
    ['\u05D9\u05D4\u05D5\u05E9\u05E2','\u05E9\u05D5\u05E4\u05D8\u05D9\u05DD',
     '\u05E9\u05DE\u05D5\u05D0\u05DC \u05D0\u05F3','\u05E9\u05DE\u05D5\u05D0\u05DC \u05D1\u05F3',
     '\u05DE\u05DC\u05DB\u05D9\u05DD \u05D0\u05F3','\u05DE\u05DC\u05DB\u05D9\u05DD \u05D1\u05F3',
     '\u05D9\u05E9\u05E2\u05D9\u05D4\u05D5','\u05D9\u05E8\u05DE\u05D9\u05D4\u05D5','\u05D9\u05D7\u05D6\u05E7\u05D0\u05DC',
     '\u05D4\u05D5\u05E9\u05E2','\u05D9\u05D5\u05D0\u05DC','\u05E2\u05DE\u05D5\u05E1',
     '\u05E2\u05D5\u05D1\u05D3\u05D9\u05D4','\u05D9\u05D5\u05E0\u05D4','\u05DE\u05D9\u05DB\u05D4',
     '\u05E0\u05D7\u05D5\u05DD','\u05D7\u05D1\u05E7\u05D5\u05E7','\u05E6\u05E4\u05E0\u05D9\u05D4',
     '\u05D7\u05D2\u05D9','\u05D6\u05DB\u05E8\u05D9\u05D4','\u05DE\u05DC\u05D0\u05DB\u05D9'
    ].forEach(function(b) { BOOK_SECTION[b] = '\u05E0\u05D1\u05D9\u05D0\u05D9\u05DD'; });
    // Ketuvim
    ['\u05EA\u05D4\u05DC\u05D9\u05DD','\u05DE\u05E9\u05DC\u05D9','\u05D0\u05D9\u05D5\u05D1',
     '\u05E9\u05D9\u05E8 \u05D4\u05E9\u05D9\u05E8\u05D9\u05DD','\u05E8\u05D5\u05EA','\u05D0\u05D9\u05DB\u05D4',
     '\u05E7\u05D4\u05DC\u05EA','\u05D0\u05E1\u05EA\u05E8','\u05D3\u05E0\u05D9\u05D0\u05DC',
     '\u05E2\u05D6\u05E8\u05D0','\u05E0\u05D7\u05DE\u05D9\u05D4',
     '\u05D3\u05D1\u05E8\u05D9 \u05D4\u05D9\u05DE\u05D9\u05DD \u05D0\u05F3',
     '\u05D3\u05D1\u05E8\u05D9 \u05D4\u05D9\u05DE\u05D9\u05DD \u05D1\u05F3'
    ].forEach(function(b) { BOOK_SECTION[b] = '\u05DB\u05EA\u05D5\u05D1\u05D9\u05DD'; });

    // Hebrew acronyms (ראשי תיבות)
    var ACRONYMS = {
        "\u05EA\u05E0\u05DA":"\u05EA\u05D5\u05E8\u05D4 \u05E0\u05D1\u05D9\u05D0\u05D9\u05DD \u05DB\u05EA\u05D5\u05D1\u05D9\u05DD",
        "\u05D4\u05E7\u05D1\u05D4":"\u05D4\u05E7\u05D3\u05D5\u05E9 \u05D1\u05E8\u05D5\u05DA \u05D4\u05D5\u05D0",
        "\u05D7\u05D6\u05DC":"\u05D7\u05DB\u05DE\u05D9\u05E0\u05D5 \u05D6\u05D9\u05DB\u05E8\u05D5\u05E0\u05DD \u05DC\u05D1\u05E8\u05DB\u05D4",
        "\u05E8\u05E9\u05D9":"\u05E8\u05D1\u05D9 \u05E9\u05DC\u05DE\u05D4 \u05D9\u05E6\u05D7\u05E7\u05D9",
        "\u05E8\u05DE\u05D1\u05DD":"\u05E8\u05D1\u05D9 \u05DE\u05E9\u05D4 \u05D1\u05DF \u05DE\u05D9\u05DE\u05D5\u05DF",
        "\u05E8\u05DE\u05D1\u05DF":"\u05E8\u05D1\u05D9 \u05DE\u05E9\u05D4 \u05D1\u05DF \u05E0\u05D7\u05DE\u05DF",
        "\u05D6\u05DC":"\u05D6\u05D9\u05DB\u05E8\u05D5\u05E0\u05D5 \u05DC\u05D1\u05E8\u05DB\u05D4",
        "\u05D6\u05E6\u05DC":"\u05D6\u05DB\u05E8 \u05E6\u05D3\u05D9\u05E7 \u05DC\u05D1\u05E8\u05DB\u05D4",
        "\u05E2\u05D4":"\u05E2\u05DC\u05D9\u05D5 \u05D4\u05E9\u05DC\u05D5\u05DD",
        "\u05D1\u05D4":"\u05D1\u05E8\u05D5\u05DA \u05D4\u05E9\u05DD",
        "\u05D1\u05E2\u05D4":"\u05D1\u05E2\u05D6\u05E8\u05EA \u05D4\u05E9\u05DD",
        "\u05D1\u05E1\u05D3":"\u05D1\u05E1\u05D9\u05D9\u05E2\u05EA\u05D0 \u05D3\u05E9\u05DE\u05D9\u05D0",
        "\u05EA\u05D7":"\u05EA\u05DC\u05DE\u05D9\u05D3 \u05D7\u05DB\u05DD",
        "\u05E1\u05EA":"\u05E1\u05E4\u05E8 \u05EA\u05D5\u05E8\u05D4",
        "\u05E9\u05D5\u05EA":"\u05E9\u05D0\u05DC\u05D5\u05EA \u05D5\u05EA\u05E9\u05D5\u05D1\u05D5\u05EA",
        "\u05D2\u05DE\u05D7":"\u05D2\u05DE\u05D9\u05DC\u05D5\u05EA \u05D7\u05E1\u05D3\u05D9\u05DD",
        "\u05D1\u05DC\u05E0":"\u05D1\u05DC\u05D9 \u05E0\u05D3\u05E8",
        "\u05E2\u05D6":"\u05E2\u05D1\u05D5\u05D3\u05D4 \u05D6\u05E8\u05D4",
        "\u05E9\u05E2":"\u05E9\u05D5\u05DC\u05D7\u05DF \u05E2\u05E8\u05D5\u05DA",
        "\u05E8\u05EA":"\u05E8\u05D0\u05E9\u05D9 \u05EA\u05D9\u05D1\u05D5\u05EA",
        "\u05DB\u05D2":"\u05DB\u05D4\u05DF \u05D2\u05D3\u05D5\u05DC",
        "\u05D1\u05D3":"\u05D1\u05D9\u05EA \u05D3\u05D9\u05DF",
        "\u05E8\u05D4":"\u05E8\u05D0\u05E9 \u05D4\u05E9\u05E0\u05D4",
        "\u05D0\u05D3\u05DE\u05D5\u05E8":"\u05D0\u05D3\u05D5\u05E0\u05E0\u05D5 \u05DE\u05D5\u05E8\u05E0\u05D5 \u05D5\u05E8\u05D1\u05E0\u05D5",
        "\u05E2\u05E4":"\u05E2\u05DC \u05E4\u05D9",
        "\u05D1\u05E2\u05E4":"\u05D1\u05E2\u05DC \u05E4\u05D4",
        "\u05D3\u05DB":"\u05D3\u05E8\u05DA \u05DB\u05DC\u05DC",
        "\u05D1\u05D3\u05DB":"\u05D1\u05D3\u05E8\u05DA \u05DB\u05DC\u05DC",
        "\u05DB\u05DB":"\u05DB\u05DC \u05DB\u05DA",
        "\u05D0\u05DB":"\u05D0\u05DD \u05DB\u05DA",
        "\u05E2\u05E9":"\u05E2\u05DC \u05E9\u05DD",
        "\u05D3\u05E9":"\u05D3\u05E8\u05D9\u05E9\u05EA \u05E9\u05DC\u05D5\u05DD",
        "\u05DE\u05E6\u05D1":"\u05DE\u05E6\u05D5\u05E8\u05E3 \u05D1\u05D6\u05D4",
        "\u05D5\u05DB\u05D5":"\u05D5\u05DB\u05D5\u05DC\u05D9",
        "\u05E1\u05D4\u05DB":"\u05E1\u05DA \u05D4\u05DB\u05DC",
        "\u05E2\u05DE":"\u05E2\u05DE\u05D5\u05D3",
        "\u05D3\u05D5\u05D7":"\u05D3\u05D9\u05DF \u05D5\u05D7\u05E9\u05D1\u05D5\u05DF",
        "\u05E6\u05D4\u05DC":"\u05E6\u05D1\u05D0 \u05D4\u05D2\u05E0\u05D4 \u05DC\u05D9\u05E9\u05E8\u05D0\u05DC",
        "\u05DE\u05D2\u05D1":"\u05DE\u05E9\u05DE\u05E8 \u05D4\u05D2\u05D1\u05D5\u05DC",
        "\u05E9\u05D1\u05DB":"\u05E9\u05D9\u05E8\u05D5\u05EA \u05D4\u05D1\u05D9\u05D8\u05D7\u05D5\u05DF \u05D4\u05DB\u05DC\u05DC\u05D9",
        "\u05E9\u05D1\u05E1":"\u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05EA\u05D9 \u05D4\u05E1\u05D5\u05D4\u05E8",
        "\u05DE\u05D3\u05D0":"\u05DE\u05D2\u05DF \u05D3\u05D5\u05D3 \u05D0\u05D3\u05D5\u05DD",
        "\u05DE\u05D8\u05DB":"\u05DE\u05D8\u05D4 \u05DB\u05DC\u05DC\u05D9",
        "\u05D7\u05DB":"\u05D7\u05D1\u05E8 \u05DB\u05E0\u05E1\u05EA",
        "\u05DE\u05DB":"\u05DE\u05E4\u05E7\u05D3 \u05DB\u05D9\u05EA\u05D4",
        "\u05DE\u05E4":"\u05DE\u05E4\u05E7\u05D3 \u05E4\u05DC\u05D5\u05D2\u05D4",
        "\u05D0\u05DC\u05DE":"\u05D0\u05DC\u05D5\u05E3 \u05DE\u05E9\u05E0\u05D4",
        "\u05EA\u05D0\u05DC":"\u05EA\u05EA \u05D0\u05DC\u05D5\u05E3",
        "\u05E8\u05E1\u05DF":"\u05E8\u05D1 \u05E1\u05E8\u05DF",
        "\u05E8\u05E1\u05DD":"\u05E8\u05D1 \u05E1\u05DE\u05DC",
        "\u05E1\u05DE\u05E8":"\u05E1\u05DE\u05DC \u05E8\u05D0\u05E9\u05D5\u05DF",
        "\u05E8\u05D4\u05DE":"\u05E8\u05D0\u05E9 \u05D4\u05DE\u05DE\u05E9\u05DC\u05D4",
        "\u05D9\u05D5\u05E8":"\u05D9\u05D5\u05E9\u05D1 \u05E8\u05D0\u05E9",
        "\u05D1\u05D2\u05E5":"\u05D1\u05D9\u05EA \u05DE\u05E9\u05E4\u05D8 \u05D2\u05D1\u05D5\u05D4 \u05DC\u05E6\u05D3\u05E7",
        "\u05EA\u05D0":"\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1",
        "\u05E4\u05EA":"\u05E4\u05EA\u05D7 \u05EA\u05E7\u05D5\u05D4",
        "\u05D0\u05E8\u05D4\u05D1":"\u05D0\u05E8\u05E6\u05D5\u05EA \u05D4\u05D1\u05E8\u05D9\u05EA",
        "\u05D0\u05D5\u05DD":"\u05D0\u05D5\u05DE\u05D5\u05EA \u05DE\u05D0\u05D5\u05D7\u05D3\u05D5\u05EA",
        "\u05D0\u05D9":"\u05D0\u05E8\u05E5 \u05D9\u05E9\u05E8\u05D0\u05DC",
        "\u05E8\u05D0\u05E9\u05DC\u05E6":"\u05E8\u05D0\u05E9\u05D5\u05DF \u05DC\u05E6\u05D9\u05D5\u05DF",
        "\u05E2\u05D5\u05D3":"\u05E2\u05D5\u05E8\u05DA \u05D3\u05D9\u05DF",
        "\u05E8\u05D5\u05D7":"\u05E8\u05D5\u05D0\u05D4 \u05D7\u05E9\u05D1\u05D5\u05DF",
        "\u05DE\u05E0\u05DB\u05DC":"\u05DE\u05E0\u05D4\u05DC \u05DB\u05DC\u05DC\u05D9",
        "\u05E1\u05DE\u05E0\u05DB\u05DC":"\u05E1\u05D2\u05DF \u05DE\u05E0\u05D4\u05DC \u05DB\u05DC\u05DC\u05D9",
        "\u05D9\u05D7\u05E6":"\u05D9\u05D7\u05E1\u05D9 \u05E6\u05D9\u05D1\u05D5\u05E8",
        "\u05D3\u05E8":"\u05D3\u05D5\u05E7\u05D8\u05D5\u05E8",
        "\u05E7\u05D2":"\u05E7\u05D9\u05DC\u05D5\u05D2\u05E8\u05DD",
        "\u05E7\u05DE":"\u05E7\u05D9\u05DC\u05D5\u05DE\u05D8\u05E8",
        "\u05E1\u05DE":"\u05E1\u05E0\u05D8\u05D9\u05DE\u05D8\u05E8",
        "\u05D1\u05D9\u05E1":"\u05D1\u05D9\u05EA \u05E1\u05E4\u05E8",
        "\u05E2\u05DE\u05D9":"\u05E2\u05DD \u05D9\u05E9\u05E8\u05D0\u05DC",
        "\u05D1\u05E2\u05DE":"\u05D1\u05E2\u05E8\u05D1\u05D5\u05DF \u05DE\u05D5\u05D2\u05D1\u05DC",
        "\u05EA\u05D6":"\u05EA\u05E2\u05D5\u05D3\u05EA \u05D6\u05D4\u05D5\u05EA",
        "\u05EA\u05D3":"\u05EA\u05D0 \u05D3\u05D5\u05D0\u05E8",
        "\u05DE\u05DE\u05D3":"\u05DE\u05E8\u05D7\u05D1 \u05DE\u05D5\u05D2\u05DF \u05D3\u05D9\u05E8\u05EA\u05D9",
        "\u05DE\u05D5\u05E4":"\u05DE\u05D7\u05E7\u05E8 \u05D5\u05E4\u05D9\u05EA\u05D5\u05D7",
        "\u05D3\u05DC\u05E4":"\u05D3\u05E2\u05D4 \u05DC\u05D0 \u05E4\u05D5\u05E4\u05DC\u05E8\u05D9\u05EA"
    };

    // ===== Initialization =====

    if (typeof TANAKH_dict !== 'undefined') {
        loading.classList.add('hidden');
    } else {
        setTimeout(function () {
            if (typeof TANAKH_dict === 'undefined') {
                loading.textContent = '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD. \u05E0\u05E1\u05D5 \u05DC\u05E8\u05E2\u05E0\u05DF \u05D0\u05EA \u05D4\u05D3\u05E3.';
                loading.style.color = 'var(--red)';
            }
        }, 15000);
    }

    // Dark mode already applied on <html> by inline script in <head>
    // Sync to body as well for any body-scoped styles
    if (localStorage.getItem('darkMode') === '1') {
        document.documentElement.classList.add('dark');
    }

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

    document.addEventListener('click', function (e) {
        if (e.target.closest('.tooltip')) return;
        var word = e.target.closest('.word-found, .word-prefix');
        document.querySelectorAll('.word-found.active, .word-prefix.active').forEach(function (el) {
            if (el !== word) el.classList.remove('active');
        });
        if (word) word.classList.toggle('active');
    });

    document.addEventListener('mouseover', function (e) {
        if (e.target.closest('.word-found, .word-prefix')) {
            document.querySelectorAll('.word-found.active, .word-prefix.active').forEach(function (el) {
                el.classList.remove('active');
            });
        }
    });

    function handleFilterChange(e) {
        if (!filterTorah.checked && !filterNeviim.checked && !filterKetuvim.checked && !filterMishnah.checked) {
            e.target.checked = true;
            showToast('\u05D9\u05E9 \u05DC\u05D1\u05D7\u05D5\u05E8 \u05DC\u05E4\u05D7\u05D5\u05EA \u05DE\u05E7\u05D5\u05E8 \u05D0\u05D7\u05D3');
            return;
        }
        processText();
    }
    filterTorah.addEventListener('change', handleFilterChange);
    filterNeviim.addEventListener('change', handleFilterChange);
    filterKetuvim.addEventListener('change', handleFilterChange);
    filterMishnah.addEventListener('change', handleFilterChange);
    filterKtiv.addEventListener('change', processText);

    faqToggle.addEventListener('click', function () {
        faqOverlay.classList.remove('hidden');
        requestAnimationFrame(function () { faqOverlay.classList.add('show'); });
    });
    function closeFaq() {
        faqOverlay.classList.remove('show');
        setTimeout(function () { faqOverlay.classList.add('hidden'); }, 250);
    }
    faqClose.addEventListener('click', closeFaq);
    faqOverlay.addEventListener('click', function (e) {
        if (e.target === faqOverlay) closeFaq();
    });

    darkToggle.addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', document.documentElement.classList.contains('dark') ? '1' : '0');
    });

    shareBtn.addEventListener('click', function () {
        var text = input.value.trim();
        if (!text) { showToast('\u05D4\u05E7\u05DC\u05D9\u05D3\u05D5 \u05D8\u05E7\u05E1\u05D8 \u05DC\u05E4\u05E0\u05D9 \u05E9\u05D9\u05EA\u05D5\u05E3'); return; }
        var url = window.location.origin + window.location.pathname + '#' + encodeURIComponent(text);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                showToast('\u05D4\u05E7\u05D9\u05E9\u05D5\u05E8 \u05D4\u05D5\u05E2\u05EA\u05E7!');
            }).catch(function () { fallbackCopy(url); });
        } else { fallbackCopy(url); }
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
        showToast(ok ? '\u05D4\u05E7\u05D9\u05E9\u05D5\u05E8 \u05D4\u05D5\u05E2\u05EA\u05E7!' : '\u05DC\u05D0 \u05E0\u05D9\u05EA\u05DF \u05DC\u05D4\u05E2\u05EA\u05D9\u05E7');
    }

    sampleBtn.addEventListener('click', function () {
        input.value = '\u05D1\u05E8\u05D0\u05E9\u05D9\u05EA \u05D1\u05E8\u05D0 \u05D0\u05DC\u05D4\u05D9\u05DD \u05D0\u05EA \u05D4\u05E9\u05DE\u05D9\u05DD \u05D5\u05D0\u05EA \u05D4\u05D0\u05E8\u05E5 \u05D0\u05D1\u05DC \u05D8\u05DC\u05D5\u05D5\u05D9\u05D6\u05D9\u05D4 \u05D5\u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8 \u05DC\u05D0 \u05D4\u05D9\u05D5 \u05D1\u05D9\u05DE\u05D9 \u05D4\u05DE\u05E7\u05E8\u05D0';
        processText();
        input.focus();
    });

    clearBtn.addEventListener('click', function () {
        input.value = '';
        results.innerHTML = '';
        stats.classList.add('hidden');
        legend.classList.add('hidden');
        history.replaceState(null, '', window.location.pathname);
        input.focus();
    });

    // ===== Core functions =====
    // Data format: entry = [torah_idx, neviim_idx, ketuvim_idx, mishnah_idx, freq, sections_mask]

    function stripNikkud(word) {
        return word.replace(/[^\u05D0-\u05EA]/g, '');
    }

    function cleanVerseText(text) {
        return text
            .replace(/&thinsp;/g, '\u2009').replace(/&nbsp;/g, '\u00A0')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
            .replace(/\{[\u05E4\u05E1]\}/g, '').trim();
    }

    function getSectionMask() {
        var mask = 0;
        if (filterTorah.checked) mask |= 1;
        if (filterNeviim.checked) mask |= 2;
        if (filterKetuvim.checked) mask |= 4;
        if (filterMishnah.checked) mask |= 8;
        return mask || 15;
    }

    function pickVerseIndex(entry, sectionMask) {
        if ((sectionMask & 1) && entry[0] >= 0) return entry[0];
        if ((sectionMask & 2) && entry[1] >= 0) return entry[1];
        if ((sectionMask & 4) && entry[2] >= 0) return entry[2];
        if ((sectionMask & 8) && entry[3] >= 0) return entry[3];
        return -1;
    }

    function tryMatch(word, sectionMask) {
        var entry = TANAKH_dict[word];
        if (entry !== undefined && (entry[5] & sectionMask)) {
            var vi = pickVerseIndex(entry, sectionMask);
            if (vi >= 0) return { entry: entry, root: word, verseIdx: vi };
        }
        return null;
    }

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

    function lookupWord(stripped) {
        if (typeof TANAKH_dict === 'undefined') return null;
        var sectionMask = getSectionMask();
        var useVariants = filterKtiv.checked;
        var m;

        // Phase 1: Exact match
        m = tryMatch(stripped, sectionMask);
        if (m) return { entry: m.entry, prefix: '', root: m.root, verseIdx: m.verseIdx, spelling: '' };

        if (useVariants) {
            // Phase 2: Single mater removal
            var variants = getSingleVariants(stripped);
            for (var i = 0; i < variants.length; i++) {
                m = tryMatch(variants[i], sectionMask);
                if (m) return { entry: m.entry, prefix: '', root: m.root, verseIdx: m.verseIdx, spelling: stripped };
            }

            // Phase 2b: Double mater removal
            if (variants.length >= 2) {
                for (var i = 0; i < variants.length; i++) {
                    var subVars = getSingleVariants(variants[i]);
                    for (var j = 0; j < subVars.length; j++) {
                        m = tryMatch(subVars[j], sectionMask);
                        if (m) return { entry: m.entry, prefix: '', root: m.root, verseIdx: m.verseIdx, spelling: stripped };
                    }
                }
            }
        }

        if (!useVariants) return null;

        // Phase 3: Prefix stripping on original word
        for (var i = 0; i < PREFIXES.length; i++) {
            var p = PREFIXES[i];
            if (stripped.length >= p.length + 3 && stripped.indexOf(p) === 0) {
                var root = stripped.substring(p.length);
                m = tryMatch(root, sectionMask);
                if (m) return { entry: m.entry, prefix: p, root: m.root, verseIdx: m.verseIdx, spelling: '' };
            }
        }

        if (useVariants) {
            // Phase 4: Single prefix + single mater removal on root
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
        }

        return null;
    }

    function lookupAcronym(token) {
        if (typeof TANAKH_dict === 'undefined') return null;
        if (!/["'\u05F3\u05F4]/.test(token)) return null;
        var consonants = token.replace(/[^\u05D0-\u05EA]/g, '');
        var expansion = ACRONYMS[consonants];
        // Try stripping a single-letter prefix (ה, ו, ב, כ, ל, מ, ש) if not found
        if (!expansion && consonants.length >= 3) {
            for (var pi = 0; pi < SINGLE_PREFIXES.length; pi++) {
                if (consonants.indexOf(SINGLE_PREFIXES[pi]) === 0) {
                    expansion = ACRONYMS[consonants.substring(1)];
                    if (expansion) break;
                }
            }
        }
        if (!expansion) return null;

        var words = expansion.split(' ');
        var sectionMask = getSectionMask();
        var firstMatch = null;
        var foundCount = 0;

        for (var i = 0; i < words.length; i++) {
            var m = tryMatch(words[i], sectionMask);
            if (m) {
                foundCount++;
                if (!firstMatch) firstMatch = m;
            }
        }

        if (!firstMatch) return null;
        return { expansion: expansion, entry: firstMatch.entry, root: firstMatch.root, verseIdx: firstMatch.verseIdx, foundCount: foundCount, totalCount: words.length };
    }

    // Convert Arabic numerals to Hebrew letters (gematria) for verse references
    var HEB_ONES = ['', '\u05D0', '\u05D1', '\u05D2', '\u05D3', '\u05D4', '\u05D5', '\u05D6', '\u05D7', '\u05D8'];
    var HEB_TENS = ['', '\u05D9', '\u05DB', '\u05DC', '\u05DE', '\u05E0', '\u05E1', '\u05E2', '\u05E4', '\u05E6'];
    // א ב ג ד ה ו ז ח ט / י כ ל מ נ ס ע פ צ
    function toHebNum(n) {
        if (n <= 0) return String(n);
        if (n >= 1000) return String(n);
        var result = '';
        var hundreds = Math.floor(n / 100);
        var remainder = n % 100;
        // Hundreds: ק=100 ר=200 ש=300 ת=400 תק=500 תר=600 תש=700 תת=800
        var hundredLetters = ['', '\u05E7', '\u05E8', '\u05E9', '\u05EA', '\u05EA\u05E7', '\u05EA\u05E8', '\u05EA\u05E9', '\u05EA\u05EA'];
        if (hundreds > 0 && hundreds <= 8) result += hundredLetters[hundreds];
        // Special cases: 15=טו, 16=טז (not יה/יו)
        if (remainder === 15) { result += '\u05D8\u05D5'; }
        else if (remainder === 16) { result += '\u05D8\u05D6'; }
        else {
            var tens = Math.floor(remainder / 10);
            var ones = remainder % 10;
            if (tens > 0) result += HEB_TENS[tens];
            if (ones > 0) result += HEB_ONES[ones];
        }
        return result;
    }

    function hebrewRef(ref) {
        // "בראשית 1:2" → "בראשית א׳:ב׳"
        return ref.replace(/(\d+):(\d+)/g, function (m, ch, v) {
            return toHebNum(parseInt(ch)) + '\u05F3' + ':' + toHebNum(parseInt(v)) + '\u05F3';
        });
    }

    function getBookFromRef(ref) {
        var match = ref.match(/^(.+?)\s+\d/);
        return match ? match[1] : ref;
    }

    function getSectionOfBook(bookName) {
        return BOOK_SECTION[bookName] || '\u05DE\u05E9\u05E0\u05D4'; // Default to "משנה" for Mishnah tractates
    }

    function formatFreq(count) {
        if (count === 1) return '\u05DE\u05D5\u05E4\u05D9\u05E2 \u05E4\u05E2\u05DD \u05D0\u05D7\u05EA';
        if (count === 2) return '\u05DE\u05D5\u05E4\u05D9\u05E2 \u05E4\u05E2\u05DE\u05D9\u05D9\u05DD';
        return '\u05DE\u05D5\u05E4\u05D9\u05E2 ' + count + ' \u05E4\u05E2\u05DE\u05D9\u05DD';
    }

    // Determine the source class for color coding based on which section the verse comes from
    function getSourceClass(entry, sectionMask) {
        // Pick the earliest section that is both enabled and has the word
        if ((sectionMask & 1) && entry[0] >= 0) return 'src-torah';
        if ((sectionMask & 2) && entry[1] >= 0) return 'src-neviim';
        if ((sectionMask & 4) && entry[2] >= 0) return 'src-ketuvim';
        if ((sectionMask & 8) && entry[3] >= 0) return 'src-mishnah';
        return '';
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

        history.replaceState(null, '', '#' + encodeURIComponent(text.trim()));

        var tokens = text.split(hebrewWordRe);
        var totalWords = 0;
        var foundWords = 0;
        var htmlParts = [];
        var hasHebrew = false;
        var sectionMask = getSectionMask();

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (!token) continue;

            if (/^[\u05D0-\u05EA]/.test(token)) {
                hasHebrew = true;
                totalWords++;

                // Check acronym — if found, expand inline and process each word
                var acronymExpansion = lookupAcronym(token);
                if (acronymExpansion) {
                    totalWords--;
                    var expWords = acronymExpansion.expansion.split(' ');
                    htmlParts.push('<span class="acronym-group"><span class="acronym-label">' + escapeHtml(token) + '</span>');
                    for (var ew = 0; ew < expWords.length; ew++) {
                        if (ew > 0) htmlParts.push(' ');
                        totalWords++;
                        var expStripped = stripNikkud(expWords[ew]);
                        var expMatch = lookupWord(expStripped);
                        if (expMatch) {
                            foundWords++;
                            var expEntry = expMatch.entry;
                            var expVerseData = TANAKH_text[expMatch.verseIdx];
                            var expTabPos = expVerseData.indexOf('\t');
                            var expRef = expVerseData.substring(0, expTabPos);
                            var expVerseText = cleanVerseText(expVerseData.substring(expTabPos + 1));
                            var expBookName = getBookFromRef(expRef);
                            var expSection = getSectionOfBook(expBookName);
                            var expFreq = expEntry[4];
                            var expSrcCls = getSourceClass(expEntry, sectionMask);
                            var expHighlighted = highlightWordInVerse(expVerseText, expMatch.root);
                            var expCssClass = (expMatch.prefix ? 'word-prefix' : 'word-found') + ' ' + expSrcCls;

                            var expTooltip =
                                '<span class="tooltip">' +
                                '<span class="source-label">\u05DE\u05E7\u05D5\u05E8</span>' +
                                '<span class="source-section">' + escapeHtml(expSection) + ' \u00B7 ' + escapeHtml(expBookName) + '</span>' +
                                '<span class="ref">' + escapeHtml(hebrewRef(expRef)) + '</span>' +
                                '<a class="freq" href="https://www.sefaria.org.il/search?q=' + encodeURIComponent(expMatch.root) +
                                '&tab=text&tvar=1&tsort=relevance" target="_blank" rel="noopener">' +
                                escapeHtml(formatFreq(expFreq)) + ' \u203A</a>' +
                                '<hr class="divider">' +
                                '<span class="verse-text">' + expHighlighted + '</span></span>';

                            htmlParts.push('<span class="' + expCssClass + '">' + escapeHtml(expWords[ew]) + expTooltip + '</span>');
                        } else {
                            htmlParts.push('<span class="word-notfound">' + escapeHtml(expWords[ew]) + '</span>');
                        }
                    }
                    htmlParts.push('</span>');
                    continue;
                }

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
                    var freq = entry[4];
                    var srcCls = getSourceClass(entry, sectionMask);

                    var highlightedVerse = highlightWordInVerse(verseText, match.root);
                    var cssClass = (match.prefix ? 'word-prefix' : 'word-found') + ' ' + srcCls;

                    var tooltipHtml =
                        '<span class="tooltip">' +
                        '<span class="source-label">\u05DE\u05E7\u05D5\u05E8</span>' +
                        '<span class="source-section">' + escapeHtml(section) + ' \u00B7 ' + escapeHtml(bookName) + '</span>' +
                        '<span class="ref">' + escapeHtml(hebrewRef(ref)) + '</span>' +
                        '<a class="freq" href="https://www.sefaria.org.il/search?q=' +
                        encodeURIComponent(match.root) +
                        '&tab=text&tvar=1&tsort=relevance" target="_blank" rel="noopener">' +
                        escapeHtml(formatFreq(freq)) + ' \u203A</a>';

                    if (match.spelling) {
                        tooltipHtml += '<span class="prefix-note">\u05DB\u05EA\u05D9\u05D1: ' +
                            escapeHtml(match.spelling) + ' \u2192 ' +
                            escapeHtml(match.prefix ? match.prefix + match.root : match.root) + '</span>';
                    }

                    if (match.prefix) {
                        tooltipHtml += '<span class="prefix-note">\u05EA\u05D7\u05D9\u05DC\u05D9\u05EA: ' +
                            escapeHtml(match.prefix) + ' | \u05E9\u05D5\u05E8\u05E9: ' +
                            escapeHtml(match.root) + '</span>';
                    }

                    tooltipHtml += '<hr class="divider"><span class="verse-text">' + highlightedVerse + '</span></span>';

                    htmlParts.push('<span class="' + cssClass + '">' + escapeHtml(token) + tooltipHtml + '</span>');
                } else {
                    htmlParts.push('<span class="word-notfound">' + escapeHtml(token) + '</span>');
                }
            } else {
                htmlParts.push(escapeHtml(token).replace(/\n/g, '<br>'));
            }
        }

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
            progressFill.style.width = pct + '%';
            progressBar.setAttribute('aria-valuenow', Math.round(pct));
            var r, g;
            if (pct < 50) { r = 220; g = Math.round(80 + (pct / 50) * 140); }
            else { r = Math.round(220 - ((pct - 50) / 50) * 180); g = 200; }
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
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function showToast(msg) {
        clearTimeout(toastTimer);
        toast.textContent = msg;
        toast.classList.add('show');
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
    }
});

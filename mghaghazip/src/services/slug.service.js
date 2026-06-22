const ARABIC_TO_LATIN_MAP = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a', 'ء': '',
  'ئ': 'y', 'ؤ': 'w',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

function stripDiacritics(text) {
  return text.replace(/[\u064B-\u0652\u0670\u0640]/g, '');
}

function transliterateArabic(text) {
  const clean = stripDiacritics(text);
  let result = '';
  for (const char of clean) {
    if (ARABIC_TO_LATIN_MAP[char] !== undefined) {
      result += ARABIC_TO_LATIN_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
}

function slugify(text) {
  const transliterated = transliterateArabic(text);
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a slug guaranteed unique according to existsFn.
 * existsFn(candidateSlug) must return true/false.
 */
function generateUniqueSlug(text, existsFn) {
  let base = slugify(text);
  if (!base) base = 'item';
  let candidate = base;
  let counter = 2;
  while (existsFn(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

module.exports = { slugify, transliterateArabic, generateUniqueSlug };

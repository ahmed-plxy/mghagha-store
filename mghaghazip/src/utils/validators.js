const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ARABIC_LETTERS = /[\u0600-\u06FF]/;
const LATIN_LETTERS = /[a-zA-Z]/;
const REPEATED_CHARS = /(.)\1{4,}/;
const KEYBOARD_SEQUENCES = /^(qwerty|asdf|zxcv|1234|abcd|aaaa|bbbb)/i;

function isValidEgyptianPhone(phone) {
  if (typeof phone !== 'string') return false;
  const trimmed = phone.trim().replace(/[\s-]/g, '');
  return EGYPT_PHONE_REGEX.test(trimmed);
}

function isValidEmail(email) {
  if (!email || email.trim() === '') return true;
  return EMAIL_REGEX.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidFullName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();

  if (trimmed.length < 3) return false;
  if (trimmed.length > 60) return false;

  const hasArabic = ARABIC_LETTERS.test(trimmed);
  const hasLatin = LATIN_LETTERS.test(trimmed);
  if (!hasArabic && !hasLatin) return false;

  if (REPEATED_CHARS.test(trimmed)) return false;
  if (KEYBOARD_SEQUENCES.test(trimmed)) return false;

  const digits = trimmed.replace(/[^0-9]/g, '').length;
  if (digits > 0) return false;

  const specialChars = trimmed.replace(/[\u0600-\u06FFa-zA-Z\s'\-\.]/g, '').length;
  if (specialChars > 0) return false;

  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 1) return false;
  for (const word of words) {
    if (word.length < 2) return false;
  }

  return true;
}

module.exports = {
  isValidEgyptianPhone,
  isValidEmail,
  isValidPassword,
  isNonEmptyString,
  isValidFullName
};

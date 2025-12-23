type FilterResult = {
  isClean: boolean;
  violations: string[];
  filteredText?: string;
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
};

const createWordPattern = (word: string): RegExp => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "gi");
};

const ENGLISH_BAD_WORDS = [
  "fuck", "fucking", "fucked", "fucker",
  "shit", "shitting", "shitty",
  "asshole", "bastard", "bitch", "cunt",
  "damn", "dammit",
  "piss", "pissing",
  "cock", "dick", "pussy", "tits", "boobs",
  "sex", "sexual", "porn", "pornography", "xxx",
  "nude", "naked", "nudity",
  "rape", "raping",
  "kill", "killing", "murder",
  "drug", "drugs", "cocaine", "heroin",
  "hate", "hateful",
];

const INDONESIAN_BAD_WORDS = [
  "anjing", "bangsat", "bajingan", "bego", "bodoh",
  "goblok", "tolol", "idiot",
  "kontol", "memek", "ngentot", "ngewe",
  "pantek", "pantat", "pepek",
  "sialan", "sial", "setan",
  "babi", "celeng",
  "bencong", "banci",
  "puki", "pukimak",
  "jancok", "jancuk",
  "asu", "anjir",
  "keparat", "brengsek",
  "bangsat", "bajing",
  "gila", "goblok",
  "pornografi", "porno",
  "seks", "seksual",
  "telanjang", "bugil",
  "bunuh", "membunuh",
  "narkoba", "narkotika",
];

const ADULT_CONTENT_INDICATORS = [
  "18+", "nsfw", "adult", "mature",
  "porn", "pornography", "xxx", "sex",
  "nude", "naked", "nudity", "explicit",
  "erotic", "erotica",
  "hentai", "pornhub",
];

const checkBadWords = (text: string): string[] => {
  const normalized = normalizeText(text);
  const violations: string[] = [];
  const allBadWords = [...ENGLISH_BAD_WORDS, ...INDONESIAN_BAD_WORDS];

  for (const word of allBadWords) {
    const pattern = createWordPattern(word);
    if (pattern.test(normalized)) {
      violations.push(word);
    }
  }

  return violations;
};

const checkAdultContent = (text: string): boolean => {
  const normalized = normalizeText(text);
  const lowerText = text.toLowerCase();

  for (const indicator of ADULT_CONTENT_INDICATORS) {
    if (lowerText.includes(indicator) || normalized.includes(indicator)) {
      return true;
    }
  }

  return false;
};

const censorWord = (word: string): string => {
  if (word.length <= 2) return word;
  return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
};

const filterText = (text: string, badWords: string[]): string => {
  let filtered = text;
  const normalized = normalizeText(text);

  for (const word of badWords) {
    const pattern = createWordPattern(word);
    filtered = filtered.replace(pattern, (match) => {
      return censorWord(match);
    });
  }

  return filtered;
};

export const filterContent = (text: string, options?: { censor?: boolean }): FilterResult => {
  const badWordViolations = checkBadWords(text);
  const hasAdultContent = checkAdultContent(text);

  const violations: string[] = [];
  if (badWordViolations.length > 0) {
    violations.push(...badWordViolations.map((w) => `Bad word: ${w}`));
  }
  if (hasAdultContent) {
    violations.push("Adult/18+ content detected");
  }

  const isClean = violations.length === 0;

  if (options?.censor && badWordViolations.length > 0) {
    const filteredText = filterText(text, badWordViolations);
    return {
      isClean: !hasAdultContent,
      violations,
      filteredText,
    };
  }

  return {
    isClean,
    violations,
  };
};

export const validateContent = (text: string): { isValid: boolean; reason?: string } => {
  const result = filterContent(text);

  if (!result.isClean) {
    return {
      isValid: false,
      reason: result.violations.join(", "),
    };
  }

  return { isValid: true };
};


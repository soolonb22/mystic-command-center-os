export type KeywordSet = { keywords: string[] };

export type Card = {
  id: string;
  name: string;
  suit: string;
  rank: string;
  upright: KeywordSet;
  reversed: KeywordSet;
};

export type StoredCard = {
  id: string;
  name: string;
  suit: string;
  rank: string;
  reversed: boolean;
  position: string;
  keywords: string[];
  meaning: string;
  prompt: string;
  action: string;
};

export type ReadingType = "shadow" | "flow" | "mixed";

export type Reading = {
  id: string;
  date: string;
  type: ReadingType;
  spreadSize: 3 | 6 | 9;
  cards: StoredCard[];
  oracle: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  timestamp: string;
  category: string;
  text: string;
  mood: string;
};

export type SyncItem = {
  id: string;
  type: string;
  text: string;
  timestamp: string;
};

export type Dragon = {
  id: string;
  task: string;
  attacks: string[];
  attackIndex: number;
  started: boolean;
  completed: boolean;
  date: string;
  bitesDone: number;
  awarded: { generated: boolean; started: boolean; completed: boolean };
};

export type XpEvent = { at: string; amount: number; reason: string };

export type UniverseNote = { date: string; message: string };

export type DailyState = {
  date: string;
  spreadSize: 3 | 6 | 9;
  readingId: string;
  universe: string;
  numbers: number[];
  prompt: string;
  shadowPrompt: string;
  checkedIn: boolean;
  universeLog: UniverseNote[];
};

export type Settings = {
  animations: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  highContrast: boolean;
};

export type DB = {
  profile: { name: string };
  xp: { value: number; level: number; log: XpEvent[] };
  streaks: {
    app: number;
    journal: number;
    dragon: number;
    lastApp: string;
    lastJournal: string;
    lastDragon: string;
  };
  dragon: { current: Dragon | null; open: Dragon[]; history: Dragon[] };
  journalEntries: JournalEntry[];
  synchronicities: SyncItem[];
  tarotHistory: Reading[];
  dailyState: DailyState | null;
  settings: Settings;
};

export const JOURNAL_CATEGORIES = [
  "Spirituality",
  "Intuition",
  "Dreams",
  "Shadow Work",
  "Manifestation",
  "Healing",
  "Purpose",
  "Gratitude",
  "Magic",
  "Universe",
] as const;

export const MOODS = [
  "Still",
  "Tender",
  "Stirred",
  "Heavy",
  "Bright",
  "Uncertain",
  "Fierce",
  "Quiet",
] as const;

export const SYNC_TYPES = [
  "Dreams",
  "Signs",
  "Animals",
  "Numbers",
  "Coincidences",
  "Patterns",
] as const;

export const TITLES: { level: number; title: string }[] = [
  { level: 1, title: "Seeker" },
  { level: 6, title: "Mystic" },
  { level: 13, title: "Alchemist" },
  { level: 23, title: "Oracle" },
  { level: 36, title: "Dragon Slayer" },
  { level: 51, title: "Sage" },
  { level: 76, title: "Ascendant" },
];

const STORAGE_KEY = "mystic-command-center-os";

export function storageKey() {
  return STORAGE_KEY;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function prevKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() - 1);
  return todayKey(dt);
}

export function formatLong(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function hashSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cap(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function levelProgress(xp: number) {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (level < 100) {
    const need = 20 + 8 * level;
    if (rest < need) {
      return { level, into: rest, need, pct: Math.round((rest / need) * 100) };
    }
    rest -= need;
    level += 1;
  }
  return { level: 100, into: rest, need: 1, pct: 100 };
}

export function titleFor(level: number) {
  let current = TITLES[0]?.title ?? "Seeker";
  for (const row of TITLES) {
    if (level >= row.level) current = row.title;
  }
  return current;
}

export function nextTitle(level: number) {
  return TITLES.find((row) => row.level > level) ?? null;
}

export function moonInfo(date = new Date()) {
  const synodic = 29.53058867;
  const known = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (date.getTime() - known) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const frac = age / synodic;
  const edges: [number, string][] = [
    [0.033, "New Moon"],
    [0.22, "Waxing Crescent"],
    [0.28, "First Quarter"],
    [0.47, "Waxing Gibbous"],
    [0.53, "Full Moon"],
    [0.72, "Waning Gibbous"],
    [0.78, "Last Quarter"],
    [0.97, "Waning Crescent"],
    [1, "New Moon"],
  ];
  let name = "New Moon";
  for (const [edge, label] of edges) {
    if (frac <= edge) {
      name = label;
      break;
    }
  }
  const illumination = Math.round(((1 - Math.cos(frac * 2 * Math.PI)) / 2) * 100);
  return { frac, age, name, illumination };
}

const MAJORS: { name: string; light: [string, string, string]; shadow: [string, string, string] }[] = [
  { name: "The Fool", light: ["beginning", "trust", "a clean leap"], shadow: ["hesitation", "recklessness", "avoided beginnings"] },
  { name: "The Magician", light: ["focus", "skill", "gathered will"], shadow: ["scattered tools", "performance", "unused power"] },
  { name: "The High Priestess", light: ["silence", "inner knowing", "patience"], shadow: ["withheld truth", "fog", "isolation"] },
  { name: "The Empress", light: ["nurture", "abundance", "the body"], shadow: ["depletion", "smothering", "neglect of the senses"] },
  { name: "The Emperor", light: ["structure", "boundary", "steady rule"], shadow: ["rigidity", "control", "crumbling order"] },
  { name: "The Hierophant", light: ["teaching", "tradition", "a trusted form"], shadow: ["dogma", "rebellion", "empty ritual"] },
  { name: "The Lovers", light: ["choice", "alignment", "honest union"], shadow: ["split loyalty", "avoided choice", "discord"] },
  { name: "The Chariot", light: ["direction", "nerve", "forward motion"], shadow: ["force", "stall", "divided reins"] },
  { name: "Strength", light: ["gentle power", "patience", "tamed fire"], shadow: ["self-doubt", "force without warmth", "drained courage"] },
  { name: "The Hermit", light: ["solitude", "a lantern", "inner counsel"], shadow: ["withdrawal", "lost way", "refusing help"] },
  { name: "Wheel of Fortune", light: ["turning cycles", "timing", "movement"], shadow: ["resistance to change", "fatalism", "a stuck wheel"] },
  { name: "Justice", light: ["truth", "balance", "clean consequence"], shadow: ["bias", "harsh verdict", "avoided account"] },
  { name: "The Hanged Man", light: ["surrender", "new angle", "sacred pause"], shadow: ["stall disguised as waiting", "martyrdom", "stuck perspective"] },
  { name: "Death", light: ["ending", "compost", "necessary release"], shadow: ["clinging", "fear of change", "delayed closure"] },
  { name: "Temperance", light: ["blend", "pace", "healing measure"], shadow: ["excess", "impatience", "split ingredients"] },
  { name: "The Devil", light: ["bond named", "desire seen", "a chain noticed"], shadow: ["shame", "compulsion", "the story that you cannot leave"] },
  { name: "The Tower", light: ["revelation", "clean break", "truth striking"], shadow: ["aftershock", "denial", "fear of collapse"] },
  { name: "The Star", light: ["hope", "soft repair", "a clear night"], shadow: ["dim faith", "disconnection", "hope deferred"] },
  { name: "The Moon", light: ["dream", "uncertainty", "tidal feeling"], shadow: ["anxiety", "projection", "a path hard to see"] },
  { name: "The Sun", light: ["vitality", "clarity", "simple joy"], shadow: ["dimmed joy", "overexposure", "forced brightness"] },
  { name: "Judgement", light: ["calling", "awakening", "honest review"], shadow: ["self-judgement", "refused call", "old verdicts"] },
  { name: "The World", light: ["completion", "wholeness", "arrival"], shadow: ["loose ends", "almost-there", "refused finish"] },
];

const SUIT_META: Record<string, { domain: string; light: [string, string, string]; shadow: [string, string, string] }> = {
  Cups: { domain: "emotions", light: ["feeling", "bond", "intuition"], shadow: ["flooding", "withdrawal", "longing"] },
  Wands: { domain: "action", light: ["will", "spark", "courage"], shadow: ["burnout", "impulse", "scattered fire"] },
  Swords: { domain: "mind", light: ["truth", "clarity", "thought"], shadow: ["rumination", "harshness", "confusion"] },
  Pentacles: { domain: "the material world", light: ["craft", "body", "resource"], shadow: ["scarcity", "stagnation", "overwork"] },
};

const RANKS = [
  "Ace",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Page",
  "Knight",
  "Queen",
  "King",
] as const;

const RANK_LIGHT: Record<string, string> = {
  Ace: "a beginning",
  Two: "a choice",
  Three: "growth",
  Four: "stability",
  Five: "friction",
  Six: "reciprocity",
  Seven: "patience",
  Eight: "momentum",
  Nine: "ripeness",
  Ten: "completion",
  Page: "a message",
  Knight: "pursuit",
  Queen: "embodiment",
  King: "stewardship",
};

const RANK_SHADOW: Record<string, string> = {
  Ace: "a blocked seed",
  Two: "indecision",
  Three: "stalled growth",
  Four: "stagnation",
  Five: "needless conflict",
  Six: "uneven exchange",
  Seven: "impatience",
  Eight: "rushing",
  Nine: "strain",
  Ten: "an unfinished ending",
  Page: "a missed message",
  Knight: "reckless pursuit",
  Queen: "care turned inward until it starves",
  King: "control mistaken for care",
};

let deckCache: Card[] | null = null;

export function buildDeck(): Card[] {
  if (deckCache) return deckCache;
  const deck: Card[] = MAJORS.map((major, index) => ({
    id: `major-${index}`,
    name: major.name,
    suit: "Major",
    rank: String(index),
    upright: { keywords: [...major.light] },
    reversed: { keywords: [...major.shadow] },
  }));
  for (const suit of Object.keys(SUIT_META)) {
    const meta = SUIT_META[suit];
    if (!meta) continue;
    RANKS.forEach((rank, index) => {
      const lightBit = meta.light[index % meta.light.length] ?? meta.domain;
      const shadowBit = meta.shadow[index % meta.shadow.length] ?? "delay";
      deck.push({
        id: `${suit.toLowerCase()}-${rank.toLowerCase()}`,
        name: `${rank} of ${suit}`,
        suit,
        rank,
        upright: { keywords: [RANK_LIGHT[rank] ?? "movement", lightBit, meta.domain] },
        reversed: { keywords: [RANK_SHADOW[rank] ?? "delay", shadowBit, "a smaller door"] },
      });
    });
  }
  deckCache = deck;
  return deck;
}

const POSITIONS: Record<3 | 6 | 9, string[]> = {
  3: ["What was", "What is", "What stirs"],
  6: ["Heart", "Mind", "Will", "Body", "Shadow", "Path"],
  9: [
    "Root — past",
    "Root — now",
    "Root — next",
    "Heart — past",
    "Heart — now",
    "Heart — next",
    "Crown — past",
    "Crown — now",
    "Crown — next",
  ],
};

export function spreadSizeFor(dateKey: string): 3 | 6 | 9 {
  const [y, m, d] = dateKey.split("-").map(Number);
  const days = Math.floor(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86400000);
  const mod = ((days % 3) + 3) % 3;
  if (mod === 1) return 6;
  if (mod === 2) return 9;
  return 3;
}

function interpret(card: Card, reversed: boolean, position: string): StoredCard {
  const keywords = reversed ? card.reversed.keywords : card.upright.keywords;
  const a = keywords[0] ?? "movement";
  const b = keywords[1] ?? "truth";
  const c = keywords[2] ?? "the next step";
  const meaning = reversed
    ? `${card.name} sits reversed in “${position}”. ${cap(a)} is tangled with ${b}. You are not asked to push harder — only to name where ${c} has gone quiet.`
    : `${card.name} stands upright in “${position}”. ${cap(a)} is available through ${b}. Let ${c} become specific enough to touch today.`;
  const prompt = reversed
    ? `Where has ${a} turned into ${b}, and what would honesty sound like in one sentence?`
    : `How can ${a} show up as ${b} before this day ends?`;
  const action = reversed
    ? `Name the stuck place around ${b}. Then give it two gentle minutes of contact.`
    : `Give ${a} a body: one small action that expresses ${b}.`;
  return {
    id: card.id,
    name: card.name,
    suit: card.suit,
    rank: card.rank,
    reversed,
    position,
    keywords: [...keywords],
    meaning,
    prompt,
    action,
  };
}

function oracleMessage(cards: StoredCard[], rng: () => number) {
  const pool = cards.flatMap((card) => card.keywords);
  const a = pool[0] ?? "movement";
  const b = pool[Math.min(pool.length - 1, 3)] ?? "trust";
  const c = pool[Math.floor(pool.length / 2)] ?? "momentum";
  const frames = [
    `The path becomes visible through ${a}. Trust ${b} and let ${c} reveal the way.`,
    `${cap(a)} is the hinge of this hour. Where ${b} meets ${c}, take the next honest step.`,
    `What feels tangled is instruction. Follow ${a}, soften around ${b}, and give ${c} a real gesture.`,
    `Today's temple is built from ${a}. ${cap(b)} keeps you true. ${cap(c)} shows the door.`,
    `Do not wait for the whole map. ${cap(a)} moves first, ${b} steadies you, and ${c} confirms the path.`,
    `The oracle is plain: honor ${a}, tell the truth about ${b}, and let ${c} be small enough to begin.`,
    `Movement is the prayer. Let ${a} lead, let ${b} stay kind, and let ${c} be finished in miniature.`,
  ];
  return frames[Math.floor(rng() * frames.length)] ?? frames[0];
}

export function makeDailyReading(date: string, createdAt = new Date().toISOString()): Reading {
  const rng = mulberry32(hashSeed(`tarot|${date}`));
  const spreadSize = spreadSizeFor(date);
  const deck = [...buildDeck()];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = deck[i];
    const other = deck[j];
    if (!swap || !other) continue;
    deck[i] = other;
    deck[j] = swap;
  }
  const positions = POSITIONS[spreadSize];
  const cards = deck.slice(0, spreadSize).map((card, index) => interpret(card, rng() < 0.5, positions[index] ?? "Path"));
  const reversed = cards.filter((card) => card.reversed).length;
  const type: ReadingType = reversed >= 3 ? "shadow" : reversed === 0 ? "flow" : "mixed";
  return {
    id: `daily-${date}`,
    date,
    type,
    spreadSize,
    cards,
    oracle: oracleMessage(cards, rng) ?? "",
    createdAt,
  };
}

const OPENINGS = [
  "The universe",
  "A quiet law",
  "Today's current",
  "The unseen",
  "Midnight wisdom",
  "Your next breath",
  "The old stars",
  "A gentle tide",
  "The golden thread",
  "Temple silence",
  "The living path",
  "Soft thunder",
  "An inner lantern",
  "The deep well",
  "Fate's small hand",
  "The moon's counsel",
  "A faithful spark",
  "Hidden order",
  "The braver heart",
  "Sacred timing",
  "The winding road",
  "Crystal dark",
];

const VERBS = [
  "rewards",
  "protects",
  "clarifies",
  "magnifies",
  "steadies",
  "remembers",
  "blesses",
  "reveals",
  "honors",
  "invites",
  "tempers",
  "awakens",
  "shelters",
  "refines",
  "witnesses",
  "multiplies",
  "releases",
  "guides",
  "fortifies",
  "anoints",
  "simplifies",
  "consecrates",
];

const THEMES = [
  "courageous movement",
  "honest rest",
  "one true sentence",
  "unfinished kindness",
  "patient fire",
  "clean boundaries",
  "tender attention",
  "practical magic",
  "the avoided step",
  "quiet devotion",
  "brave simplicity",
  "body-level truth",
  "a smaller promise",
  "sacred repetition",
  "clear asking",
  "gentle discipline",
  "repaired trust",
  "wild focus",
  "humble ritual",
  "open hands",
  "precise hope",
  "the next right inch",
];

const TAILS = [
  "Momentum reveals hidden pathways.",
  "Small actions create magical outcomes.",
  "What you touch with sincerity begins to answer.",
  "The way opens after the first honest move.",
  "Stillness shows what effort was hiding.",
  "You are allowed to begin imperfectly.",
  "Courage compounds in secret.",
  "The ordinary becomes a doorway.",
  "Nothing sincere is wasted.",
  "Your pace is part of the spell.",
  "Relief arrives through contact, not theory.",
  "The future leans toward what you repeat.",
  "Softness is not the opposite of power.",
  "A single kept promise changes the field.",
  "Avoidance loosens when it is named aloud.",
  "Light prefers a specific action.",
  "You do not have to see the whole staircase.",
  "The pattern meets you halfway.",
  "Grace is hiding inside the tiny task.",
  "What is real can be touched today.",
  "Mystery collaborates with movement.",
  "The temple is built one brick of attention at a time.",
];

export function universeSpace() {
  return OPENINGS.length * VERBS.length * THEMES.length * TAILS.length;
}

export function makeUniverse(date: string) {
  const rng = mulberry32(hashSeed(`universe|${date}`));
  const opening = OPENINGS[Math.floor(rng() * OPENINGS.length)] ?? OPENINGS[0];
  const verb = VERBS[Math.floor(rng() * VERBS.length)] ?? VERBS[0];
  const theme = THEMES[Math.floor(rng() * THEMES.length)] ?? THEMES[0];
  const tail = TAILS[Math.floor(rng() * TAILS.length)] ?? TAILS[0];
  return `${opening} ${verb} ${theme}. ${tail}`;
}

const J_LEAD = [
  "Where did you last feel",
  "What would shift if you trusted",
  "How is fear disguising itself inside",
  "What is the smallest truth about",
  "When did you abandon",
  "What are you ready to bless in",
  "How does your body tell the truth about",
  "What want is hiding underneath",
  "If the night could speak of",
  "What boundary would protect",
  "Which memory still guards",
  "What would devotion look like toward",
];

const J_TOPIC = [
  "your courage",
  "the task you keep orbiting",
  "a dream you half remember",
  "your longing",
  "a relationship that matters",
  "the work of your hands",
  "your body's pace",
  "money, care, and safety",
  "your anger",
  "a joy you rush past",
  "the home you are making",
  "your intuition",
  "an old grief",
  "play and rest",
  "a promise you made",
  "the future you pretend not to want",
];

const J_TURN = [
  "and what one sentence tells the truth?",
  "and what would a kinder next step be?",
  "without fixing it — only witnessing it?",
  "as if something kind were listening?",
  "and where is the gold hidden in it?",
  "and what can be named without shame?",
  "and what do you want to remember tomorrow?",
  "and what would ten honest minutes change?",
  "and which fear is smaller than it claims?",
  "and what are you allowed to want?",
];

const S_LEAD = [
  "What do you criticize outside yourself that also lives in",
  "Which feeling was exiled because it threatened",
  "What story about being too much still governs",
  "Where do you disappear in order to keep",
  "What anger is protecting inside",
  "Which rule did you inherit that now starves",
  "What would you confess if no one punished",
  "Where does people-pleasing disguise itself as",
  "What are you unwilling to grieve about",
  "Which younger self is still waiting inside",
];

const S_TOPIC = [
  "your worth",
  "your desire",
  "your rest",
  "your voice",
  "your ambition",
  "your tenderness",
  "the family pattern",
  "your body",
  "your no",
  "the future you want",
];

const S_TURN = [
  "Write without correcting the first three lines.",
  "Name it, then name the need underneath it.",
  "What would kindness say back?",
  "Where does this show up in an ordinary hour?",
  "What is one boundary that would make this safer?",
  "What can be set down for today only?",
  "Who benefits when you stay silent about this?",
  "What tiny repair is available before night?",
  "If this shadow had a gift, what would it be?",
  "End with one sentence you can actually keep.",
];

export function promptSpace() {
  return J_LEAD.length * J_TOPIC.length * J_TURN.length;
}

export function shadowPromptSpace() {
  return S_LEAD.length * S_TOPIC.length * S_TURN.length;
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)] ?? list[0]!;
}

export function makePrompt(date: string) {
  const rng = mulberry32(hashSeed(`journal|${date}`));
  return `${pick(rng, J_LEAD)} ${pick(rng, J_TOPIC)}, ${pick(rng, J_TURN)}`;
}

export function makeShadowPrompt(date: string) {
  const rng = mulberry32(hashSeed(`shadow|${date}`));
  return `${pick(rng, S_LEAD)} ${pick(rng, S_TOPIC)}. ${pick(rng, S_TURN)}`;
}

export function spinPrompt(kind: "journal" | "shadow") {
  const rng = mulberry32(hashSeed(`${kind}|spin|${Date.now()}|${Math.random()}`));
  if (kind === "shadow") {
    return `${pick(rng, S_LEAD)} ${pick(rng, S_TOPIC)}. ${pick(rng, S_TURN)}`;
  }
  return `${pick(rng, J_LEAD)} ${pick(rng, J_TOPIC)}, ${pick(rng, J_TURN)}`;
}

export function makeNumbers(date: string) {
  const rng = mulberry32(hashSeed(`numbers|${date}`));
  return Array.from({ length: 9 }, () => 1 + Math.floor(rng() * 99));
}

const ANGELS = new Set([11, 22, 33, 44, 55, 66, 77, 88, 99]);

const NUMBER_ROOTS: { name: string; caption: string; howTo: string }[] = [
  { name: "", caption: "", howTo: "" },
  {
    name: "The Crown",
    caption: "Absolute unity, the divine spark, pure spiritual will.",
    howTo: "Name the one beginning that matters. Take its first physical step, and leave the rest of the plan for later.",
  },
  {
    name: "Wisdom",
    caption: "Intuition, revelation, the primordial spark of creation.",
    howTo: "Sit with the quieter knowing. Write the first sentence before you explain it away.",
  },
  {
    name: "Writing",
    caption: "Communication, recording knowledge, manifesting thought.",
    howTo: "Put the thought where it can be read. Send the message, or write the single line.",
  },
  {
    name: "Cities",
    caption: "Civilization, structured society, human achievement.",
    howTo: "Set one boundary or one hour that can hold the work. Build the floor, not the monument.",
  },
  {
    name: "The Crisis",
    caption: "Sudden upheaval, sweeping away the old order.",
    howTo: "Do not rebuild the fallen part today. Clear one piece of debris and choose the next safe step.",
  },
  {
    name: "Medicine",
    caption: "Healing, balance of forces, health and regeneration.",
    howTo: "Tend the body or the nearest person. A meal, real rest, or a softened tone is the medicine.",
  },
  {
    name: "The Depths",
    caption: "The depths, unconscious emotions, hidden mysteries.",
    howTo: "Give the feeling a name without fixing it. Ten quiet minutes is enough contact.",
  },
  {
    name: "The Dance",
    caption: "The cosmic dance, dynamic balance of forces.",
    howTo: "Notice what you keep repeating. Keep one loop that feeds you. Stop feeding one that does not.",
  },
  {
    name: "The Return",
    caption: "Completing the cycle, coming back home, the eternal soul.",
    howTo: "Close one small circle. Finish the lingering thing, then stop.",
  },
];

const ANGEL_LINES: Record<number, string> = {
  11: "A doorway. Trust the first quiet knowing, then check it in the world before you build on it.",
  22: "The builder. The vision is ready for edges. Lay one measurable brick and stop while it is still true.",
  33: "The teacher. Offer what you know without disappearing inside the kindness.",
  44: "The foundation. Repair the promise, place, or habit that everything else stands on.",
  55: "Movement with a direction. Change is not the threat. Standing still inside it is.",
  66: "Practical kindness. A meal, a softened tone, a message that does not perform.",
  77: "Go inward and come back. If it cannot be said in one honest line, it is not finished.",
  88: "Enough is already circulating. Notice the resource you have and let a little of it move.",
  99: "A cycle is closing. Release the old verdict. What remains is simpler than the story.",
};

export function digitalRoot(value: number) {
  let n = Math.abs(Math.floor(value));
  if (n === 0) return 0;
  while (n > 9) {
    n = String(n)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return n;
}

export function universalNumber(value: number) {
  const n = Math.min(99, Math.max(1, Math.floor(value)));
  const root = digitalRoot(n);
  const tone = NUMBER_ROOTS[root] ?? NUMBER_ROOTS[1]!;
  const angel = ANGELS.has(n);
  const arcanaIndex = n % 22;
  const arcana = MAJORS[arcanaIndex]?.name ?? "The Fool";
  return {
    value: n,
    root,
    angel,
    title: tone.name,
    tone: tone.name,
    arcana,
    arcanaIndex,
    caption: tone.caption,
    howTo: tone.howTo,
    text: angel ? `${ANGEL_LINES[n] ?? tone.caption} ${tone.caption}` : tone.caption,
  };
}

export type NumberItem = {
  value: number;
  angel: boolean;
  palindrome: boolean;
  repeat: boolean;
};

export function inspectNumbers(nums: number[]) {
  const items: NumberItem[] = nums.map((value) => ({
    value,
    angel: ANGELS.has(value),
    palindrome: value >= 10 && String(value) === [...String(value)].reverse().join(""),
    repeat: nums.filter((n) => n === value).length > 1,
  }));
  const set = new Set(nums);
  const mirrors: string[] = [];
  for (const n of set) {
    const rev = Number([...String(n)].reverse().join(""));
    if (rev !== n && set.has(rev) && n < rev) mirrors.push(`${n} and ${rev}`);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const runs: string[] = [];
  let run: number[] = [];
  for (const n of sorted) {
    const prev = run[run.length - 1];
    if (prev === undefined || n === prev + 1) run.push(n);
    else {
      if (run.length >= 3) runs.push(run.join("–"));
      run = [n];
    }
  }
  if (run.length >= 3) runs.push(run.join("–"));
  const digitCounts = new Map<string, number>();
  for (const n of nums) {
    const digit = String(n).slice(-1);
    digitCounts.set(digit, (digitCounts.get(digit) ?? 0) + 1);
  }
  const echoes = [...digitCounts.entries()].filter(([, count]) => count >= 3).map(([digit, count]) => `${count} numbers end in ${digit}`);
  return { items, mirrors, runs, echoes };
}

function shortTask(task: string) {
  const clean = task.replace(/\s+/g, " ").trim();
  return clean.length > 72 ? `${clean.slice(0, 69)}…` : clean;
}

export function attackLadder(task: string) {
  const short = shortTask(task);
  return [
    `Do one small piece of “${short}”: one item, one sentence, or two minutes. Then stop.`,
    `Set a five-minute timer and touch “${short}”. Stopping when it rings counts.`,
    `Open “${short}” and read only the first line. Do not continue.`,
    `Put the tool for “${short}” where you can see it. The page, the dish, the shoes.`,
    `Stand or sit in the place “${short}” happens. That is the whole step.`,
    `Say “${short}” out loud once. Then you are allowed to walk away.`,
  ];
}

const BITE_LINES = [
  (task: string) => `One item inside “${task}”. Then stop while it still feels easy.`,
  (task: string) => `Two minutes on “${task}”. The timer ending is the finish line.`,
  (task: string) => `Only the next visible piece of “${task}”. Leave the rest for another bite.`,
  (task: string) => `Clear one obstacle in front of “${task}”: the tab, the mess, the first line.`,
  (task: string) => `Same quest, half the size: a smaller repeat of “${task}”.`,
];

export function nextBite(task: string, count: number) {
  const short = shortTask(task);
  const line = BITE_LINES[Math.abs(count) % BITE_LINES.length] ?? BITE_LINES[0]!;
  return line(short);
}

export function activeDragons(db: DB) {
  const open = Array.isArray(db.dragon.open) ? db.dragon.open.filter((row) => row && !row.completed) : [];
  const current = db.dragon.current;
  if (current && !current.completed && !open.some((row) => row.id === current.id)) return [current, ...open];
  return open;
}

export function writeDragons(db: DB, open: Dragon[], currentId?: string | null): DB {
  const alive = open.filter((row) => !row.completed).slice(0, 40);
  const wanted = currentId === null ? null : alive.find((row) => row.id === currentId) ?? alive[0] ?? null;
  return { ...db, dragon: { ...db.dragon, open: alive, current: wanted } };
}

export function defaultDB(): DB {
  return {
    profile: { name: "" },
    xp: { value: 0, level: 1, log: [] },
    streaks: { app: 0, journal: 0, dragon: 0, lastApp: "", lastJournal: "", lastDragon: "" },
    dragon: { current: null, open: [], history: [] },
    journalEntries: [],
    synchronicities: [],
    tarotHistory: [],
    dailyState: null,
    settings: { animations: true, reducedMotion: false, darkMode: true, highContrast: false },
  };
}

export function isArchive(raw: unknown) {
  const root = asRecord(raw);
  if (!root) return false;
  return "xp" in root || "journalEntries" in root || "settings" in root || "dailyState" in root || "tarotHistory" in root || "dragon" in root;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asDragon(value: unknown): Dragon | null {
  const row = asRecord(value);
  if (!row || typeof row.task !== "string" || !row.task.trim()) return null;
  const attacks = Array.isArray(row.attacks) ? row.attacks.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  const awarded = asRecord(row.awarded);
  const task = row.task.trim();
  return {
    id: asString(row.id) || uid(),
    task,
    attacks: attacks.length ? attacks : attackLadder(task),
    attackIndex: Math.max(0, asNumber(row.attackIndex, 0)),
    started: asBool(row.started, false),
    completed: asBool(row.completed, false),
    date: asString(row.date) || todayKey(),
    bitesDone: Math.max(0, asNumber(row.bitesDone, 0)),
    awarded: {
      generated: asBool(awarded?.generated, true),
      started: asBool(awarded?.started, false),
      completed: asBool(awarded?.completed, false),
    },
  };
}

export function mergeDB(raw: unknown): DB {
  const base = defaultDB();
  const root = asRecord(raw);
  if (!root) return base;
  const profile = asRecord(root.profile);
  const xp = asRecord(root.xp);
  const streaks = asRecord(root.streaks);
  const dragon = asRecord(root.dragon);
  const settings = asRecord(root.settings);
  const daily = asRecord(root.dailyState);
  const log = Array.isArray(xp?.log) ? (xp.log as XpEvent[]) : [];
  return {
    profile: { name: asString(profile?.name) },
    xp: {
      value: Math.max(0, asNumber(xp?.value, 0)),
      level: Math.min(100, Math.max(1, asNumber(xp?.level, 1))),
      log: log.filter((row) => row && typeof row.reason === "string").slice(0, 60),
    },
    streaks: {
      app: Math.max(0, asNumber(streaks?.app, 0)),
      journal: Math.max(0, asNumber(streaks?.journal, 0)),
      dragon: Math.max(0, asNumber(streaks?.dragon, 0)),
      lastApp: asString(streaks?.lastApp),
      lastJournal: asString(streaks?.lastJournal),
      lastDragon: asString(streaks?.lastDragon),
    },
    dragon: (() => {
      const history = Array.isArray(dragon?.history) ? dragon.history.map(asDragon).filter((row): row is Dragon => !!row).slice(0, 200) : [];
      const fromOpen = Array.isArray(dragon?.open) ? dragon.open.map(asDragon).filter((row): row is Dragon => !!row && !row.completed) : [];
      const current = asDragon(dragon?.current);
      const open = current && !current.completed && !fromOpen.some((row) => row.id === current.id) ? [current, ...fromOpen] : fromOpen;
      return {
        current: open.find((row) => row.id === current?.id) ?? open[0] ?? null,
        open: open.slice(0, 40),
        history,
      };
    })(),
    journalEntries: Array.isArray(root.journalEntries) ? (root.journalEntries as JournalEntry[]) : [],
    synchronicities: Array.isArray(root.synchronicities) ? (root.synchronicities as SyncItem[]) : [],
    tarotHistory: Array.isArray(root.tarotHistory) ? (root.tarotHistory as Reading[]) : [],
    dailyState: daily
      ? {
          date: asString(daily.date),
          spreadSize: daily.spreadSize === 6 || daily.spreadSize === 9 ? daily.spreadSize : 3,
          readingId: asString(daily.readingId),
          universe: asString(daily.universe),
          numbers: Array.isArray(daily.numbers) ? (daily.numbers as number[]).slice(0, 9) : [],
          prompt: asString(daily.prompt),
          shadowPrompt: asString(daily.shadowPrompt),
          checkedIn: asBool(daily.checkedIn, false),
          universeLog: Array.isArray(daily.universeLog) ? (daily.universeLog as UniverseNote[]).slice(0, 400) : [],
        }
      : null,
    settings: {
      animations: asBool(settings?.animations, true),
      reducedMotion: asBool(settings?.reducedMotion, false),
      darkMode: asBool(settings?.darkMode, true),
      highContrast: asBool(settings?.highContrast, false),
    },
  };
}

export function addXp(db: DB, amount: number, reason: string): DB {
  const value = db.xp.value + amount;
  const level = levelProgress(value).level;
  const log = [{ at: new Date().toISOString(), amount, reason }, ...db.xp.log].slice(0, 60);
  return { ...db, xp: { value, level, log } };
}

export function syncLevel(db: DB): DB {
  const level = levelProgress(db.xp.value).level;
  if (level === db.xp.level) return db;
  return { ...db, xp: { ...db.xp, level } };
}

export function rollDaily(db: DB, opts?: { grantTarot?: boolean; now?: Date }): DB {
  const now = opts?.now ?? new Date();
  const today = todayKey(now);
  let next = db;
  if (next.streaks.lastApp !== today) {
    const app = next.streaks.lastApp === prevKey(today) ? next.streaks.app + 1 : 1;
    next = { ...next, streaks: { ...next.streaks, app, lastApp: today } };
  }
  const savedToday = next.dailyState?.date === today ? next.dailyState : null;
  const savedReading = savedToday?.readingId ? next.tarotHistory.find((reading) => reading.id === savedToday.readingId) : undefined;
  if (savedToday?.readingId && savedReading) {
    const daily = {
      ...savedToday,
      numbers: savedToday.numbers?.length === 9 ? savedToday.numbers : makeNumbers(today),
      universe: savedToday.universe || makeUniverse(today),
      prompt: savedToday.prompt || makePrompt(today),
      shadowPrompt: savedToday.shadowPrompt || makeShadowPrompt(today),
      universeLog: savedToday.universeLog?.length
        ? savedToday.universeLog
        : [{ date: today, message: savedToday.universe || makeUniverse(today) }],
    };
    return syncLevel({ ...next, dailyState: daily });
  }
  const existing = next.tarotHistory.find((reading) => reading.id === `daily-${today}`);
  const reading = existing ?? makeDailyReading(today, now.toISOString());
  const universe = next.dailyState?.date === today && next.dailyState.universe ? next.dailyState.universe : makeUniverse(today);
  const numbers =
    next.dailyState?.date === today && next.dailyState.numbers?.length === 9 ? next.dailyState.numbers : makeNumbers(today);
  const prompt = makePrompt(today);
  const shadowPrompt = makeShadowPrompt(today);
  const priorLog = next.dailyState?.universeLog ?? [];
  const universeLog = [{ date: today, message: universe }, ...priorLog.filter((row) => row.date !== today)].slice(0, 400);
  const history = existing ? next.tarotHistory : [reading, ...next.tarotHistory.filter((row) => row.id !== reading.id)];
  next = {
    ...next,
    tarotHistory: history,
    dailyState: {
      date: today,
      spreadSize: reading.spreadSize,
      readingId: reading.id,
      universe,
      numbers,
      prompt,
      shadowPrompt,
      checkedIn: false,
      universeLog,
    },
  };
  if (!existing && opts?.grantTarot !== false) next = addXp(next, 15, "Daily tarot");
  return syncLevel(next);
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDB();
    return mergeDB(JSON.parse(raw) as unknown);
  } catch {
    return defaultDB();
  }
}

export function saveDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function readingById(db: DB, id: string | undefined) {
  if (!id) return null;
  return db.tarotHistory.find((reading) => reading.id === id) ?? null;
}

export type SearchHit = { kind: string; title: string; excerpt: string; when: string };

function clip(text: string, n = 180) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

export function searchDb(db: DB, q: string): SearchHit[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const hits: SearchHit[] = [];
  for (const entry of db.journalEntries) {
    const blob = `${entry.category} ${entry.text} ${entry.mood}`.toLowerCase();
    if (blob.includes(s)) {
      hits.push({
        kind: "Journal",
        title: `${entry.category} · ${entry.mood}`,
        excerpt: clip(entry.text),
        when: entry.timestamp,
      });
    }
  }
  for (const reading of db.tarotHistory) {
    const blob = [reading.oracle, reading.type, reading.date, ...reading.cards.flatMap((card) => [card.name, card.meaning, card.prompt, card.action, ...card.keywords])]
      .join(" ")
      .toLowerCase();
    if (blob.includes(s)) {
      hits.push({
        kind: "Tarot",
        title: `${reading.date} · ${reading.spreadSize} cards · ${reading.type}`,
        excerpt: clip(reading.oracle),
        when: reading.createdAt || reading.date,
      });
    }
  }
  for (const item of db.synchronicities) {
    if (`${item.type} ${item.text}`.toLowerCase().includes(s)) {
      hits.push({ kind: "Synchronicity", title: item.type, excerpt: clip(item.text), when: item.timestamp });
    }
  }
  for (const note of db.dailyState?.universeLog ?? []) {
    if (note.message.toLowerCase().includes(s)) {
      hits.push({ kind: "Universe", title: note.date, excerpt: note.message, when: note.date });
    }
  }
  const dragons = [...activeDragons(db), ...db.dragon.history];
  for (const dragon of dragons) {
    if (`${dragon.task} ${dragon.attacks.join(" ")}`.toLowerCase().includes(s)) {
      hits.push({ kind: "Dragon", title: dragon.completed ? `${dragon.date} · completed` : dragon.date, excerpt: clip(dragon.task), when: dragon.date });
    }
  }
  return hits.slice(0, 80);
}

export function bumpStreak(value: number, last: string, today: string) {
  if (last === today) return { value, last };
  if (last === prevKey(today)) return { value: value + 1, last: today };
  return { value: 1, last: today };
}

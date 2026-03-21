import type { Song, QuizFilters, QuizQuestion, AnswerRecord, HistoryEntry } from "./types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDecade(year: number): number {
  return Math.floor(year / 10) * 10;
}

const LOCALE_TO_CONTINENT: Record<string, string> = {
  USA: "North America",
  Canada: "North America",
  "Puerto Rico": "North America",
  Jamaica: "North America",
  Brazil: "South America",
  Colombia: "South America",
  Venezuela: "South America",
  UK: "Europe",
  Germany: "Europe",
  Iceland: "Europe",
  Sweden: "Europe",
  Portugal: "Europe",
  Spain: "Europe",
  Ethiopia: "Africa",
  Mali: "Africa",
  Niger: "Africa",
  Nigeria: "Africa",
  Senegal: "Africa",
  Japan: "Asia",
  Pakistan: "Asia",
};

export function getContinent(locale: string): string {
  return LOCALE_TO_CONTINENT[locale] ?? "Other";
}

export function filterSongs(songs: Song[], filters: QuizFilters): Song[] {
  return songs.filter((s) => {
    if (filters.tags.length > 0) {
      const hasTag = s.tags.some((t) =>
        filters.tags.some((ft) => t.toLowerCase() === ft.toLowerCase())
      );
      if (!hasTag) return false;
    }
    if (filters.locales.length > 0) {
      if (!filters.locales.includes(s.locale)) return false;
    }
    if (filters.decades.length > 0) {
      if (!filters.decades.includes(getDecade(s.release_year))) return false;
    }
    return true;
  });
}

const QUIZ_SIZE = 10;

export function buildQuiz(songs: Song[], filters: QuizFilters): QuizQuestion[] {
  const filtered = filterSongs(songs, filters);
  return shuffle(filtered).slice(0, QUIZ_SIZE).map((s) => ({
    ...s,
    shuffledOptions: shuffle(s.options),
  }));
}

export function createQuizState() {
  let questions = $state<QuizQuestion[]>([]);
  let currentIndex = $state(0);
  let answers = $state<AnswerRecord[]>([]);
  let selectedAnswer = $state<string | null>(null);
  let revealed = $state(false);

  const current = $derived(questions[currentIndex] ?? null);
  const total = $derived(questions.length);
  const score = $derived(answers.filter((a) => a.correct).length);
  const isComplete = $derived(currentIndex >= questions.length && questions.length > 0);
  const isLast = $derived(currentIndex === questions.length - 1);
  const progress = $derived(questions.length > 0 ? (currentIndex + 1) / questions.length : 0);

  function start(songs: Song[], filters: QuizFilters) {
    questions = buildQuiz(songs, filters);
    currentIndex = 0;
    answers = [];
    selectedAnswer = null;
    revealed = false;
  }

  function startWithQuestions(q: QuizQuestion[]) {
    questions = q;
    currentIndex = 0;
    answers = [];
    selectedAnswer = null;
    revealed = false;
  }

  function selectAnswer(answer: string) {
    if (revealed || !current) return;
    selectedAnswer = answer;
    revealed = true;
    answers = [
      ...answers,
      {
        question: current,
        selected: answer,
        correct: answer === current.answer,
      },
    ];
  }

  function next() {
    if (!revealed) return;
    currentIndex++;
    selectedAnswer = null;
    revealed = false;
  }

  function reset() {
    questions = [];
    currentIndex = 0;
    answers = [];
    selectedAnswer = null;
    revealed = false;
  }

  return {
    get questions() { return questions; },
    get currentIndex() { return currentIndex; },
    get current() { return current; },
    get total() { return total; },
    get score() { return score; },
    get isComplete() { return isComplete; },
    get isLast() { return isLast; },
    get progress() { return progress; },
    get answers() { return answers; },
    get selectedAnswer() { return selectedAnswer; },
    get revealed() { return revealed; },
    start,
    startWithQuestions,
    selectAnswer,
    next,
    reset,
  };
}

export function getUniqueValues(songs: Song[]) {
  const tags = new Set<string>();
  const continents = new Set<string>();
  const decades = new Set<number>();

  for (const s of songs) {
    s.tags.forEach((t) => tags.add(t));
    continents.add(getContinent(s.locale));
    decades.add(getDecade(s.release_year));
  }

  const tagCategories = categoriseTags([...tags]);

  return {
    tags: tagCategories,
    continents: [...continents].sort(),
    decades: [...decades].sort(),
  };
}

// Map raw tags into broader genre families for filter chips
const TAG_FAMILIES: Record<string, string[]> = {
  "Metal": ["metal", "thrash", "heavy", "metalcore", "death metal", "black metal", "doom", "sludge", "grindcore", "mathcore", "post-metal"],
  "Hip-Hop": ["hip-hop", "rap", "drill", "UK drill", "trap", "conscious", "jazz rap", "southern rap", "boom bap", "noise"],
  "Electronic": ["electronic", "house", "acid house", "techno", "dubstep", "post-dubstep", "electropop", "dance", "ambient", "IDM", "drum and bass", "trance", "EBM"],
  "Rock": ["rock", "shoegaze", "alternative", "indie", "post-punk", "punk", "grunge", "britpop", "psychedelic", "garage rock", "krautrock", "stoner"],
  "Jazz": ["jazz", "free jazz", "avant-garde", "fusion", "bebop", "hard bop", "modal jazz"],
  "Pop": ["pop", "synthpop", "dream pop", "art pop", "K-pop", "J-pop"],
  "R&B / Soul": ["R&B", "soul", "neo-soul", "funk"],
  "Folk / World": ["folk", "afrobeat", "samba", "dancehall", "reggae", "vallenato", "highlife", "cumbia", "flamenco", "fado", "celtic", "bluegrass", "country"],
  "Classical": ["classical", "neoclassical", "darkwave", "chamber"],
  "Experimental": ["experimental", "extreme", "industrial", "noise", "trip-hop", "downtempo", "post-rock"],
};

function categoriseTags(rawTags: string[]): string[] {
  const families = new Set<string>();
  for (const tag of rawTags) {
    for (const [family, members] of Object.entries(TAG_FAMILIES)) {
      if (members.some((m) => m.toLowerCase() === tag.toLowerCase())) {
        families.add(family);
      }
    }
  }
  return [...families].sort();
}

// Check if a song matches a tag family
export function songMatchesFamily(song: Song, family: string): boolean {
  const members = TAG_FAMILIES[family];
  if (!members) return false;
  return song.tags.some((t) =>
    members.some((m) => m.toLowerCase() === t.toLowerCase())
  );
}

export function filterSongsWithFamilies(
  songs: Song[],
  families: string[],
  continents: string[],
  decades: number[]
): Song[] {
  return songs.filter((s) => {
    if (families.length > 0) {
      const matchesFamily = families.some((f) => songMatchesFamily(s, f));
      if (!matchesFamily) return false;
    }
    if (continents.length > 0) {
      if (!continents.includes(getContinent(s.locale))) return false;
    }
    if (decades.length > 0) {
      if (!decades.includes(getDecade(s.release_year))) return false;
    }
    return true;
  });
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getSongWeight(
  artist: string,
  song: string,
  history: HistoryEntry[]
): number {
  const key = `${artist}::${song}`;
  let latest: HistoryEntry | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].songKey === key) { latest = history[i]; break; }
  }
  if (!latest) return 10;
  if (!latest.correct) return 8;
  const age = Date.now() - latest.timestamp;
  return age > SEVEN_DAYS_MS ? 3 : 1;
}

function weightedSample<T extends Song>(items: T[], weights: number[], count: number): T[] {
  if (items.length <= count) return shuffle(items);
  const picked: T[] = [];
  const remaining = items.map((item, i) => ({ item, weight: weights[i] }));
  for (let n = 0; n < count && remaining.length > 0; n++) {
    const totalWeight = remaining.reduce((s, r) => s + r.weight, 0);
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i].weight;
      if (r <= 0) { idx = i; break; }
    }
    picked.push(remaining[idx].item);
    remaining.splice(idx, 1);
  }
  return picked;
}

export function buildQuizWithFamilies(
  songs: Song[],
  families: string[],
  continents: string[],
  decades: number[],
  history: HistoryEntry[] = []
): QuizQuestion[] {
  const filtered = filterSongsWithFamilies(songs, families, continents, decades);
  const weights = filtered.map((s) => getSongWeight(s.artist, s.song, history));
  const selected = weightedSample(filtered, weights, QUIZ_SIZE);
  return shuffle(selected).map((s) => ({
    ...s,
    shuffledOptions: shuffle(s.options),
  }));
}

export { TAG_FAMILIES };

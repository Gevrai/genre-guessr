export interface Song {
  artist: string;
  song: string;
  album: string | null;
  release_year: number;
  locale: string;
  hint: string;
  answer: string;
  options: string[];
  explanation: string;
  tags: string[];
  youtube_id: string;
}

export interface QuizFilters {
  tags: string[];
  locales: string[];
  decades: number[];
}

export interface QuizQuestion extends Song {
  shuffledOptions: string[];
}

export interface AnswerRecord {
  question: QuizQuestion;
  selected: string;
  correct: boolean;
}

export type Screen = "start" | "quiz" | "results";

export type Route = "/" | "/explore" | "/favorites";

export interface HistoryEntry {
  songKey: string;
  correct: boolean;
  timestamp: number;
}

export interface Favorites {
  songs: string[];
  tags: string[];
}

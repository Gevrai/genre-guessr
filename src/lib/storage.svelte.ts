import type { HistoryEntry, Favorites } from "./types";

const PREFIX = "gg:";
const HISTORY_MAX = 2000;

function isLocalStorageAvailable(): boolean {
  try {
    const key = `${PREFIX}__test__`;
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const canUseStorage = isLocalStorageAvailable();

function readRaw<T>(key: string, fallback: T): T {
  if (!canUseStorage) return fallback;
  const raw = localStorage.getItem(`${PREFIX}${key}`);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeRaw<T>(key: string, value: T): void {
  if (!canUseStorage) return;
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function createPersistedState<T>(key: string, defaultValue: T): { get value(): T; set value(v: T) } {
  let inner = $state<T>(readRaw(key, defaultValue));

  $effect(() => {
    writeRaw(key, inner);
  });

  return {
    get value() { return inner; },
    set value(v: T) { inner = v; },
  };
}

// Pre-built stores
export function createHistoryStore() {
  const store = createPersistedState<HistoryEntry[]>("quiz-history", []);

  function record(entries: HistoryEntry[]) {
    let next = [...store.value, ...entries];
    if (next.length > HISTORY_MAX) {
      next = next.slice(next.length - HISTORY_MAX);
    }
    store.value = next;
  }

  function getLatest(songKey: string): HistoryEntry | undefined {
    for (let i = store.value.length - 1; i >= 0; i--) {
      if (store.value[i].songKey === songKey) return store.value[i];
    }
    return undefined;
  }

  return {
    get entries() { return store.value; },
    record,
    getLatest,
    clear() { store.value = []; },
  };
}

export function createFavoritesStore() {
  const store = createPersistedState<Favorites>("favorites", { songs: [], tags: [] });

  function toggleSong(songKey: string) {
    const songs = store.value.songs.includes(songKey)
      ? store.value.songs.filter((s) => s !== songKey)
      : [...store.value.songs, songKey];
    store.value = { ...store.value, songs };
  }

  function toggleTag(tag: string) {
    const tags = store.value.tags.includes(tag)
      ? store.value.tags.filter((t) => t !== tag)
      : [...store.value.tags, tag];
    store.value = { ...store.value, tags };
  }

  function isSongFavorited(songKey: string): boolean {
    return store.value.songs.includes(songKey);
  }

  function isTagFavorited(tag: string): boolean {
    return store.value.tags.includes(tag);
  }

  return {
    get songs() { return store.value.songs; },
    get tags() { return store.value.tags; },
    toggleSong,
    toggleTag,
    isSongFavorited,
    isTagFavorited,
    clear() { store.value = { songs: [], tags: [] }; },
  };
}

export function clearAll(): void {
  if (!canUseStorage) return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function songKey(artist: string, song: string): string {
  return `${artist}::${song}`;
}

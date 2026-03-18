<script lang="ts">
  import type { Song } from "../lib/types";
  import { filterSongsWithFamilies, getDecade } from "../lib/engine";

  interface Props {
    songs: Song[];
    tagFamilies: string[];
    locales: string[];
    decades: number[];
    onStart: (families: string[], locales: string[], decades: number[]) => void;
  }

  let { songs, tagFamilies, locales, decades, onStart }: Props = $props();

  let selectedFamilies = $state<string[]>([]);
  let selectedLocales = $state<string[]>([]);
  let selectedDecades = $state<number[]>([]);

  const matchCount = $derived(
    filterSongsWithFamilies(songs, selectedFamilies, selectedLocales, selectedDecades).length
  );

  function toggleFamily(f: string) {
    selectedFamilies = selectedFamilies.includes(f)
      ? selectedFamilies.filter((x) => x !== f)
      : [...selectedFamilies, f];
  }

  function toggleLocale(l: string) {
    selectedLocales = selectedLocales.includes(l)
      ? selectedLocales.filter((x) => x !== l)
      : [...selectedLocales, l];
  }

  function toggleDecade(d: number) {
    selectedDecades = selectedDecades.includes(d)
      ? selectedDecades.filter((x) => x !== d)
      : [...selectedDecades, d];
  }

  function clearFilters() {
    selectedFamilies = [];
    selectedLocales = [];
    selectedDecades = [];
  }

  function start() {
    if (matchCount === 0) return;
    onStart(selectedFamilies, selectedLocales, selectedDecades);
  }

  const hasFilters = $derived(
    selectedFamilies.length > 0 || selectedLocales.length > 0 || selectedDecades.length > 0
  );
</script>

<div class="start-screen">
  <div class="hero">
    <p class="tagline">Can you tell UK drill from grime?<br/>Shoegaze from dream pop?</p>
    <p class="subtitle">Test your music subgenre knowledge</p>
  </div>

  <section class="filters">
    <div class="filter-header">
      <h2>Filters</h2>
      {#if hasFilters}
        <button class="clear-btn" onclick={clearFilters}>Clear all</button>
      {/if}
    </div>

    <div class="filter-group">
      <h3>Genre</h3>
      <div class="chips">
        {#each tagFamilies as family}
          <button
            class="chip"
            class:active={selectedFamilies.includes(family)}
            onclick={() => toggleFamily(family)}
          >
            {family}
          </button>
        {/each}
      </div>
    </div>

    <div class="filter-group">
      <h3>Region</h3>
      <div class="chips">
        {#each locales as locale}
          <button
            class="chip"
            class:active={selectedLocales.includes(locale)}
            onclick={() => toggleLocale(locale)}
          >
            {locale}
          </button>
        {/each}
      </div>
    </div>

    <div class="filter-group">
      <h3>Decade</h3>
      <div class="chips">
        {#each decades as decade}
          <button
            class="chip"
            class:active={selectedDecades.includes(decade)}
            onclick={() => toggleDecade(decade)}
          >
            {decade}s
          </button>
        {/each}
      </div>
    </div>
  </section>

  <div class="start-footer">
    <p class="match-count">{matchCount} question{matchCount !== 1 ? 's' : ''} available</p>
    <button class="start-btn" onclick={start} disabled={matchCount === 0}>
      Start Quiz
    </button>
  </div>
</div>

<style>
  .start-screen {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 8px 0 32px;
    flex: 1;
  }

  .hero {
    text-align: center;
    padding: 16px 0;
  }

  .tagline {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.5;
    color: var(--text);
  }

  .subtitle {
    margin-top: 8px;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-header h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .clear-btn {
    font-size: 0.8rem;
    color: var(--accent);
    transition: color var(--transition);
  }

  .clear-btn:hover {
    color: var(--accent-hover);
  }

  .filter-group h3 {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-muted);
    transition: all var(--transition);
  }

  .chip:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .chip.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .start-footer {
    margin-top: auto;
    padding-top: 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .match-count {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .start-btn {
    width: 100%;
    padding: 16px;
    border-radius: var(--radius);
    background: var(--accent);
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    transition: background var(--transition);
  }

  .start-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .start-btn:disabled {
    background: var(--bg-hover);
    color: var(--text-muted);
  }
</style>

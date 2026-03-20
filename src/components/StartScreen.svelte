<script lang="ts">
  import type { Song } from "../lib/types";
  import { filterSongsWithFamilies } from "../lib/engine.svelte";

  interface Props {
    songs: Song[];
    tagFamilies: string[];
    continents: string[];
    decades: number[];
    onStart: (families: string[], continents: string[], decades: number[]) => void;
  }

  let { songs, tagFamilies, continents, decades, onStart }: Props = $props();

  let selectedFamilies = $state<string[]>([]);
  let selectedContinents = $state<string[]>([]);
  let selectedDecades = $state<number[]>([]);

  const matchCount = $derived(
    filterSongsWithFamilies(songs, selectedFamilies, selectedContinents, selectedDecades).length
  );

  function toggleFamily(f: string) {
    selectedFamilies = selectedFamilies.includes(f)
      ? selectedFamilies.filter((x) => x !== f)
      : [...selectedFamilies, f];
  }

  function toggleContinent(c: string) {
    selectedContinents = selectedContinents.includes(c)
      ? selectedContinents.filter((x) => x !== c)
      : [...selectedContinents, c];
  }

  function toggleDecade(d: number) {
    selectedDecades = selectedDecades.includes(d)
      ? selectedDecades.filter((x) => x !== d)
      : [...selectedDecades, d];
  }

  function clearFilters() {
    selectedFamilies = [];
    selectedContinents = [];
    selectedDecades = [];
  }

  function start() {
    if (matchCount === 0) return;
    onStart(selectedFamilies, selectedContinents, selectedDecades);
  }

  const hasFilters = $derived(
    selectedFamilies.length > 0 || selectedContinents.length > 0 || selectedDecades.length > 0
  );
</script>

<div class="start-screen">
  <div class="hero">
    <p class="tagline">Can you tell UK drill from grime?<br/>Shoegaze from dream pop?</p>
    <p class="subtitle">Test your music subgenre knowledge</p>
  </div>

  <div class="start-footer">
    <p class="match-count">{Math.min(matchCount, 10)} question{Math.min(matchCount, 10) !== 1 ? 's' : ''} · {matchCount} available</p>
    <button class="start-btn" onclick={start} disabled={matchCount === 0}>
      Start Quiz
    </button>
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
      <h3>Continent</h3>
      <div class="chips">
        {#each continents as continent}
          <button
            class="chip"
            class:active={selectedContinents.includes(continent)}
            onclick={() => toggleContinent(continent)}
          >
            {continent}
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
    padding: 20px 0 4px;
  }

  .tagline {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    line-height: 1.45;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin-top: 10px;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .start-footer {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .match-count {
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .start-btn {
    width: 100%;
    padding: 16px;
    border-radius: var(--radius);
    background: linear-gradient(135deg, #b06ef3, #f06292);
    color: #fff;
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    transition: all var(--transition);
    box-shadow: 0 0 28px rgba(176, 110, 243, 0.35);
  }

  .start-btn:hover:not(:disabled) {
    box-shadow: 0 0 36px rgba(176, 110, 243, 0.55);
    transform: translateY(-1px);
  }

  .start-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .start-btn:disabled {
    background: var(--bg-hover);
    color: var(--text-muted);
    box-shadow: none;
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
    font-family: var(--font-display);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
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
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 500;
    letter-spacing: 0.04em;
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
    border-color: var(--accent);
  }

  .chip.active {
    background: linear-gradient(135deg, #b06ef3, #f06292);
    border-color: transparent;
    color: #fff;
    font-weight: 600;
  }
</style>

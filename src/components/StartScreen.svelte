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
  <div class="start-footer">
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

    <div class="match-panel">
      <p class="match-label">Available Pool</p>
      <p class="match-count">{Math.min(matchCount, 10)} question{Math.min(matchCount, 10) !== 1 ? 's' : ''} · {matchCount} available</p>
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
    gap: 32px;
    padding: 4px 0 32px;
    flex: 1;
  }

  .start-footer {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
  }

  .match-panel {
    padding: 16px;
    border-radius: var(--radius);
    background: var(--surface-container);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .match-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .match-count {
    font-size: 1rem;
    line-height: 1.45;
    color: var(--text);
  }

  .start-btn {
    width: 100%;
    padding: 16px;
    border-radius: var(--radius);
    background: var(--gradient-primary);
    color: var(--on-primary-container);
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    transition: all var(--transition);
    box-shadow: var(--glow-warm);
  }

  .start-btn:hover:not(:disabled) {
    box-shadow: 0 24px 44px rgba(255, 77, 0, 0.16);
    transform: translateY(-1px);
  }

  .start-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .start-btn:disabled {
    background: var(--surface-high);
    color: var(--text-muted);
    box-shadow: none;
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-header h2 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: var(--text-muted);
  }

  .clear-btn {
    font-size: 0.8rem;
    color: var(--primary);
    transition: color var(--transition), transform var(--transition);
  }

  .clear-btn:hover {
    color: var(--accent-hover);
    transform: translateX(1px);
  }

  .filter-group {
    padding: 16px;
    border-radius: var(--radius);
    background: var(--surface-low);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .filter-group h3 {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: var(--surface-high);
    color: var(--text-muted);
    transition: all var(--transition);
  }

  .chip:hover {
    background: var(--surface-highest);
    color: var(--text);
    transform: translateY(-1px);
  }

  .chip.active {
    background: var(--primary-container);
    color: var(--on-primary-container);
    font-weight: 600;
    box-shadow: 0 14px 28px rgba(255, 87, 26, 0.18);
  }
</style>

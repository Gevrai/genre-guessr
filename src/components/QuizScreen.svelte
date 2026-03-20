<script lang="ts">
  import YouTubeEmbed from "./YouTubeEmbed.svelte";
  import { extractPalette, paletteToStyle, type CSSPalette } from '../lib/palette';
  import { onDestroy } from 'svelte';

  interface Props {
    quiz: any;
    onComplete: () => void;
  }

  let { quiz, onComplete }: Props = $props();

  let palette = $state<CSSPalette | null>(null);

  const LABELS = ['A', 'B', 'C', 'D'];

  function handleSelect(option: string) {
    quiz.selectAnswer(option);
  }

  function handleNext() {
    if (quiz.isLast) {
      quiz.next();
      onComplete();
    } else {
      quiz.next();
    }
  }

  $effect(() => {
    const id = quiz.current?.youtube_id;
    const result = id ? extractPalette(id) : null;
    palette = result;
    if (result?.['--bg']) {
      document.body.style.setProperty('--bg', result['--bg']);
    } else {
      document.body.style.removeProperty('--bg');
    }
  });

  onDestroy(() => {
    document.body.style.removeProperty('--bg');
  });

  function optionClass(option: string): string {
    if (!quiz.revealed) return "";
    if (option === quiz.current?.answer) return "correct";
    if (option === quiz.selectedAnswer) return "wrong";
    return "dimmed";
  }

  function optionIcon(option: string): string {
    if (!quiz.revealed) return "";
    if (option === quiz.current?.answer) return "✓";
    if (option === quiz.selectedAnswer && option !== quiz.current?.answer) return "✗";
    return "";
  }
</script>

{#if quiz.current}
  <div class="quiz-screen" style={paletteToStyle(palette)}>
    <!-- Progress -->
    <div class="progress-row">
      <span class="progress-text">{quiz.currentIndex + 1} / {quiz.total}</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {quiz.progress * 100}%"></div>
      </div>
    </div>

    <!-- Song info -->
    <div class="song-card">
      <YouTubeEmbed videoId={quiz.current.youtube_id} />

      <div class="song-info">
        <h2 class="song-title">{quiz.current.artist} — {quiz.current.song}</h2>
        <div class="song-meta">
          {#if quiz.current.album}
            <span>{quiz.current.album}</span>
            <span class="dot">·</span>
          {/if}
          <span>{quiz.current.release_year}</span>
          <span class="dot">·</span>
          <span>{quiz.current.locale}</span>
        </div>
      </div>

      <p class="hint">💡 {quiz.current.hint}</p>
    </div>

    <!-- Options -->
    <div class="options">
      {#each quiz.current.shuffledOptions as option, i}
        <button
          class="option-btn {optionClass(option)}"
          onclick={() => handleSelect(option)}
          disabled={quiz.revealed}
        >
          <span class="option-label">{LABELS[i]}</span>
          <span class="option-text">{option}</span>
          {#if optionIcon(option)}
            <span class="option-icon">{optionIcon(option)}</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Explanation (revealed) -->
    {#if quiz.revealed}
      <div class="reveal-section screen-enter">
        <div class="explanation">
          <p>{quiz.current.explanation}</p>
        </div>
        <button class="next-btn" onclick={handleNext}>
          {quiz.isLast ? "See Results" : "Next →"}
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .quiz-screen {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 0 32px;
    flex: 1;
    transition: background-color 0.6s ease;
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-text {
    font-family: var(--font-display);
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 700;
    white-space: nowrap;
    min-width: 3.5em;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--bg-card);
    border-radius: 3px;
    overflow: hidden;
    transition: background 0.6s ease, border-color 0.4s ease;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
    border-radius: 3px;
    transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1), background 0.6s ease, border-color 0.4s ease;
    box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 50%, transparent);
  }

  .song-card {
    background: var(--bg-card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: background 0.6s ease, border-color 0.4s ease;
  }

  .song-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .song-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .song-meta {
    font-size: 0.8rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  .dot {
    color: var(--border);
  }

  .hint {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.4;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .option-btn {
    width: 100%;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    text-align: left;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background 0.6s ease, border-color 0.4s ease, transform var(--transition), opacity var(--transition);
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
  }

  .option-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--accent);
  }

  .option-btn:active:not(:disabled) {
    transform: scale(0.99);
  }

  .option-btn.correct {
    background: var(--correct-bg);
    border-color: var(--correct);
    color: var(--correct);
  }

  .option-btn.wrong {
    background: var(--wrong-bg);
    border-color: var(--wrong);
    color: var(--wrong);
  }

  .option-btn.dimmed {
    opacity: 0.35;
  }

  .option-label {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-muted);
    transition: all var(--transition);
  }

  .option-btn:hover:not(:disabled) .option-label {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .option-btn.correct .option-label {
    background: var(--correct);
    border-color: var(--correct);
    color: #fff;
  }

  .option-btn.wrong .option-label {
    background: var(--wrong);
    border-color: var(--wrong);
    color: #fff;
  }

  .option-btn.dimmed .option-label {
    background: var(--bg-card);
  }

  .option-text {
    flex: 1;
  }

  .option-icon {
    flex-shrink: 0;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .reveal-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .explanation {
    background: var(--bg-card);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    border-left: 3px solid var(--accent);
    transition: background 0.6s ease, border-color 0.4s ease;
  }

  .explanation p {
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--text);
  }

  .next-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #fff;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    transition: all var(--transition);
    box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .next-btn:hover {
    box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 50%, transparent);
    transform: translateY(-1px);
  }

  .next-btn:active {
    transform: translateY(0);
  }
</style>

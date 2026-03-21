<script lang="ts">
  import YouTubeEmbed from "./YouTubeEmbed.svelte";

  interface Props {
    quiz: any;
    onComplete: () => void;
  }

  let { quiz, onComplete }: Props = $props();
  let soundEnabled = $state(false);
  let cluesRevealed = $state(false);

  function handleSelect(option: string) {
    quiz.selectAnswer(option);
  }

  function enableSound() {
    soundEnabled = true;
  }

  function handleNext() {
    if (quiz.isLast) {
      quiz.next();
      onComplete();
    } else {
      quiz.next();
    }
  }

  function toggleClues() {
    cluesRevealed = !cluesRevealed;
  }

  $effect(() => {
    quiz.current?.youtube_id;
    cluesRevealed = false;
  });

  const answeredCorrectly = $derived(quiz.selectedAnswer === quiz.current?.answer);
</script>

{#if quiz.current}
  <div class="quiz-screen">
    <!-- Progress -->
    <div class="progress-row">
      <span class="progress-text">{quiz.currentIndex + 1} / {quiz.total}</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {quiz.progress * 100}%"></div>
      </div>
    </div>

    <!-- Song info -->
    <div class="song-card">
      {#key `${quiz.current.youtube_id}:${soundEnabled ? "sound" : "muted"}`}
        <YouTubeEmbed
          videoId={quiz.current.youtube_id}
          autoplay={soundEnabled}
          muted={!soundEnabled}
          showSoundPrompt={!soundEnabled}
          onEnableSound={enableSound}
        />
      {/key}

      <div class="song-info">
        <h2 class="song-title">{quiz.current.artist} — {quiz.current.song}</h2>
        {#if quiz.current.album}
          <p class="song-album">{quiz.current.album}</p>
        {/if}

        <div class="clue-section">
          {#if cluesRevealed}
            <div class="song-meta">
              <span>{quiz.current.release_year}</span>
              <span class="dot">·</span>
              <span>{quiz.current.locale}</span>
            </div>

            <p class="hint">💡 {quiz.current.hint}</p>
          {:else}
            <button
              type="button"
              class="clue-toggle"
              aria-label="Show hint, year, and location"
              title="Show hint"
              onclick={toggleClues}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 18h6m-5 3h4m-6.314-5.5C6.536 14.48 5 12.423 5 10a7 7 0 1 1 14 0c0 2.423-1.536 4.48-2.686 5.5-.472.418-.708.627-.85.875-.143.248-.177.509-.245 1.032L15 18H9l-.219-.593c-.068-.523-.102-.784-.245-1.032-.142-.248-.378-.457-.85-.875Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>

    {#if quiz.revealed}
      <div class="reveal-section screen-enter">
        <div class="explanation" class:correct={answeredCorrectly} class:wrong={!answeredCorrectly}>
          <p class="answer-detail">
            {#if answeredCorrectly}
              The answer is <strong>{quiz.current.answer}</strong>.
            {:else}
              You picked <strong>{quiz.selectedAnswer}</strong>. The answer is <strong>{quiz.current.answer}</strong>.
            {/if}
          </p>
          <p>{quiz.current.explanation}</p>
        </div>

        <button class="next-btn" onclick={handleNext}>
          {quiz.isLast ? "See Results" : "Next →"}
        </button>
      </div>
    {:else}
      <div class="options">
        {#each quiz.current.shuffledOptions as option}
          <button
            class="option-btn"
            onclick={() => handleSelect(option)}
          >
            <span class="option-text">{option}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .quiz-screen {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 4px 0 20px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .progress-text {
    font-family: var(--font-display);
    font-size: 0.74rem;
    color: var(--text-muted);
    font-weight: 700;
    white-space: nowrap;
    min-width: 3.5em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--surface-low);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-container), var(--secondary-container));
    border-radius: 3px;
    transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 12px rgba(255, 87, 26, 0.3);
  }

  .song-card {
    background: var(--surface-low);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex-shrink: 0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .song-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .song-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .song-album {
    font-size: 0.84rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .clue-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 2px;
  }

  .clue-toggle {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--surface-variant);
    color: var(--primary);
    transition: all var(--transition);
    backdrop-filter: blur(24px);
    box-shadow:
      inset 0 0 0 1px var(--outline-ghost),
      0 12px 28px rgba(255, 87, 26, 0.1);
  }

  .clue-toggle:hover {
    color: var(--text);
    transform: translateY(-1px);
    box-shadow:
      inset 0 0 0 1px var(--outline-strong),
      0 16px 30px rgba(255, 87, 26, 0.14);
  }

  .clue-toggle:active {
    transform: scale(0.98);
  }

  .clue-toggle svg {
    width: 18px;
    height: 18px;
  }

  .song-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .dot {
    color: color-mix(in srgb, var(--text-muted) 45%, transparent);
  }

  .hint {
    font-size: 0.92rem;
    color: var(--text);
    line-height: 1.55;
    padding: 14px 16px;
    background: var(--surface-highest);
    border-radius: var(--radius-sm);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .option-btn {
    width: 100%;
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    background: var(--surface-low);
    text-align: left;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all var(--transition);
    display: flex;
    align-items: center;
    min-height: 52px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .option-btn:hover:not(:disabled) {
    background: var(--surface-high);
    transform: translateY(-1px);
  }

  .option-btn:active:not(:disabled) {
    transform: scale(0.99);
  }

  .option-text {
    flex: 1;
  }

  .reveal-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-height: 0;
  }

  .answer-detail {
    font-size: 0.85rem;
    line-height: 1.5;
    margin-bottom: 12px;
    color: var(--text-muted);
  }

  .explanation {
    background:
      radial-gradient(circle at top left, rgba(255, 199, 3, 0.08), transparent 38%),
      linear-gradient(180deg, var(--surface-container), var(--surface-high));
    border-radius: var(--radius-sm);
    padding: 16px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 18px 34px rgba(0, 0, 0, 0.16);
  }

  .explanation p {
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--text);
  }

  .explanation.correct {
    background:
      radial-gradient(circle at top left, rgba(183, 224, 124, 0.22), transparent 34%),
      linear-gradient(180deg, color-mix(in srgb, var(--surface-container) 84%, var(--correct-bg)), color-mix(in srgb, var(--surface-high) 88%, var(--correct-bg)));
    box-shadow:
      inset 0 0 0 1px rgba(183, 224, 124, 0.14),
      0 0 0 1px rgba(183, 224, 124, 0.08),
      0 22px 42px rgba(183, 224, 124, 0.16);
  }

  .explanation.wrong {
    background:
      radial-gradient(circle at top left, rgba(255, 155, 114, 0.24), transparent 34%),
      linear-gradient(180deg, color-mix(in srgb, var(--surface-container) 84%, var(--wrong-bg)), color-mix(in srgb, var(--surface-high) 88%, var(--wrong-bg)));
    box-shadow:
      inset 0 0 0 1px rgba(255, 155, 114, 0.14),
      0 0 0 1px rgba(255, 155, 114, 0.08),
      0 22px 42px rgba(255, 87, 26, 0.18);
  }

  .next-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius-sm);
    background: var(--gradient-primary);
    color: var(--on-primary-container);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    transition: all var(--transition);
    box-shadow: var(--glow-warm);
    margin-top: auto;
  }

  .next-btn:hover {
    box-shadow: 0 24px 44px rgba(255, 77, 0, 0.16);
    transform: translateY(-1px);
  }

  .next-btn:active {
    transform: translateY(0);
  }
</style>

<script lang="ts">
  import YouTubeEmbed from "./YouTubeEmbed.svelte";

  interface Props {
    quiz: any;
    onComplete: () => void;
  }

  let { quiz, onComplete }: Props = $props();
  let soundEnabled = $state(false);

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
    gap: 16px;
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
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #b06ef3, #f06292);
    border-radius: 3px;
    transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 8px rgba(176, 110, 243, 0.5);
  }

  .song-card {
    background: var(--bg-card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-shrink: 0;
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
    flex: 1;
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
    transition: all var(--transition);
    display: flex;
    align-items: center;
    min-height: 48px;
  }

  .option-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--accent);
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
  }

  .explanation {
    background: var(--bg-card);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    border-left: 3px solid var(--accent);
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .explanation p {
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--text);
  }

  .explanation.correct {
    border-left-color: var(--correct);
  }

  .explanation.wrong {
    border-left-color: var(--wrong);
  }

  .next-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, #b06ef3, #f06292);
    color: #fff;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    transition: all var(--transition);
    box-shadow: 0 0 20px rgba(176, 110, 243, 0.3);
    margin-top: auto;
  }

  .next-btn:hover {
    box-shadow: 0 0 28px rgba(176, 110, 243, 0.5);
    transform: translateY(-1px);
  }

  .next-btn:active {
    transform: translateY(0);
  }
</style>

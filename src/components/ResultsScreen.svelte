<script lang="ts">
  interface Props {
    quiz: any;
    onPlayAgain: () => void;
  }

  let { quiz, onPlayAgain }: Props = $props();

  const pct = $derived(quiz.total > 0 ? Math.round((quiz.score / quiz.total) * 100) : 0);

  const message = $derived.by(() => {
    if (pct === 100) return "Perfect score! You're a genre wizard 🧙‍♂️";
    if (pct >= 80) return "Impressive! You really know your subgenres 🔥";
    if (pct >= 60) return "Solid work! Your ear is getting sharper 🎧";
    if (pct >= 40) return "Not bad — keep exploring new music! 🎵";
    return "Music is a journey — every listen teaches something 🌍";
  });

  const shareText = $derived(
    `I scored ${quiz.score}/${quiz.total} on Genre Guessr! 🎵 Can you do better?`
  );

  let copied = $state(false);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Fallback: select text
    }
  }
</script>

<div class="results-screen">
  <div class="score-hero">
    <div class="score-ring">
      <span class="score-number">{quiz.score}</span>
      <span class="score-divider">/</span>
      <span class="score-total">{quiz.total}</span>
    </div>
    <p class="score-pct">{pct}%</p>
    <p class="score-message">{message}</p>
  </div>

  <div class="share-row">
    <button class="share-btn" onclick={copyShare}>
      {copied ? "Copied! ✓" : "📋 Copy Score"}
    </button>
  </div>

  <div class="breakdown">
    <h3>Breakdown</h3>
    <ul class="breakdown-list">
      {#each quiz.answers as record, i}
        <li class="breakdown-item">
          <span class="breakdown-icon">{record.correct ? "✓" : "✗"}</span>
          <div class="breakdown-detail">
            <span class="breakdown-song">{record.question.artist} — {record.question.song}</span>
            <span class="breakdown-genre {record.correct ? 'correct-text' : 'wrong-text'}">
              {record.correct ? record.question.answer : `${record.selected} → ${record.question.answer}`}
            </span>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <button class="play-again-btn" onclick={onPlayAgain}>
    Play Again
  </button>
</div>

<style>
  .results-screen {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px 0 32px;
    flex: 1;
  }

  .score-hero {
    text-align: center;
    padding: 24px 0;
  }

  .score-ring {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
  }

  .score-number {
    font-size: 3.5rem;
    font-weight: 700;
    color: var(--accent);
    line-height: 1;
  }

  .score-divider {
    font-size: 2rem;
    color: var(--text-muted);
  }

  .score-total {
    font-size: 2rem;
    color: var(--text-muted);
  }

  .score-pct {
    font-size: 1rem;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .score-message {
    margin-top: 12px;
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .share-row {
    display: flex;
    justify-content: center;
  }

  .share-btn {
    padding: 10px 24px;
    border-radius: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all var(--transition);
  }

  .share-btn:hover {
    background: var(--bg-hover);
  }

  .breakdown h3 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .breakdown-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .breakdown-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 10px 12px;
    background: var(--bg-card);
    border-radius: var(--radius-sm);
  }

  .breakdown-icon {
    font-weight: 700;
    font-size: 1rem;
    min-width: 1.2em;
    text-align: center;
  }

  .breakdown-item:has(.correct-text) .breakdown-icon {
    color: var(--correct);
  }

  .breakdown-item:has(.wrong-text) .breakdown-icon {
    color: var(--wrong);
  }

  .breakdown-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .breakdown-song {
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .breakdown-genre {
    font-size: 0.75rem;
  }

  .correct-text {
    color: var(--correct);
  }

  .wrong-text {
    color: var(--wrong);
  }

  .play-again-btn {
    width: 100%;
    padding: 16px;
    border-radius: var(--radius);
    background: var(--accent);
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    transition: background var(--transition);
    margin-top: auto;
  }

  .play-again-btn:hover {
    background: var(--accent-hover);
  }
</style>

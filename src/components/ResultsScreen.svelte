<script lang="ts">
  interface Props {
    quiz: any;
    onPlayAgain: () => void;
  }

  let { quiz, onPlayAgain }: Props = $props();

  const pct = $derived(quiz.total > 0 ? Math.round((quiz.score / quiz.total) * 100) : 0);

  const grade = $derived.by(() => {
    if (pct === 100) return 'S';
    if (pct >= 80) return 'A';
    if (pct >= 60) return 'B';
    if (pct >= 40) return 'C';
    return 'D';
  });

  const gradeColor = $derived.by(() => {
    if (pct === 100) return '#f9d71c';
    if (pct >= 80) return '#4ade80';
    if (pct >= 60) return '#b06ef3';
    if (pct >= 40) return '#fb923c';
    return '#f87171';
  });

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
    <div class="grade-ring" style="--grade-color: {gradeColor}">
      <span class="grade">{grade}</span>
    </div>
    <div class="score-line">
      <span class="score-number">{quiz.score}</span>
      <span class="score-sep">/</span>
      <span class="score-total">{quiz.total}</span>
      <span class="score-pct">· {pct}%</span>
    </div>
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
          <span class="breakdown-icon {record.correct ? 'icon-correct' : 'icon-wrong'}">
            {record.correct ? "✓" : "✗"}
          </span>
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
    gap: 28px;
    padding: 8px 0 32px;
    flex: 1;
  }

  .score-hero {
    text-align: center;
    padding: 18px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    background: var(--surface-low);
    border-radius: var(--radius);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .grade-ring {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--grade-color) 25%, transparent),
      0 20px 40px color-mix(in srgb, var(--grade-color) 12%, transparent);
    background: color-mix(in srgb, var(--grade-color) 10%, var(--surface-highest));
  }

  .grade {
    font-family: var(--font-display);
    font-size: 2.8rem;
    font-weight: 800;
    color: var(--grade-color);
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .score-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 5px;
  }

  .score-number {
    font-family: var(--font-display);
    font-size: 2.8rem;
    font-weight: 800;
    color: var(--text);
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .score-sep {
    font-size: 1.8rem;
    color: var(--text-muted);
  }

  .score-total {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .score-pct {
    font-size: 1rem;
    color: var(--text-muted);
    margin-left: 4px;
  }

  .score-message {
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.5;
    color: var(--text-muted);
    max-width: 24ch;
  }

  .share-row {
    display: flex;
    justify-content: center;
  }

  .share-btn {
    padding: 12px 20px;
    border-radius: var(--radius);
    background: var(--secondary-container);
    color: var(--on-secondary-container);
    font-size: 0.85rem;
    font-weight: 700;
    transition: all var(--transition);
  }

  .share-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 34px rgba(255, 199, 3, 0.16);
  }

  .breakdown {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .breakdown h3 {
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: var(--text-muted);
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
    padding: 12px 14px;
    background: var(--surface-low);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .breakdown-icon {
    font-weight: 700;
    font-size: 0.9rem;
    min-width: 1.2em;
    text-align: center;
    margin-top: 1px;
  }

  .icon-correct { color: var(--correct); }
  .icon-wrong { color: var(--wrong); }

  .breakdown-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .breakdown-song {
    font-size: 0.87rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .breakdown-genre {
    font-size: 0.76rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .correct-text { color: var(--correct); }
  .wrong-text { color: var(--wrong); }

  .play-again-btn {
    width: 100%;
    padding: 16px;
    border-radius: var(--radius);
    background: var(--gradient-primary);
    color: var(--on-primary-container);
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    transition: all var(--transition);
    box-shadow: var(--glow-warm);
    margin-top: auto;
  }

  .play-again-btn:hover {
    box-shadow: 0 24px 44px rgba(255, 77, 0, 0.16);
    transform: translateY(-1px);
  }

  .play-again-btn:active {
    transform: translateY(0);
  }
</style>

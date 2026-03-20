<script lang="ts">
  import type { Song, Screen } from "./lib/types";
  import { createQuizState, getUniqueValues, filterSongsWithFamilies } from "./lib/engine.svelte";
  import songsData from "./data/songs.json";
  import StartScreen from "./components/StartScreen.svelte";
  import QuizScreen from "./components/QuizScreen.svelte";
  import ResultsScreen from "./components/ResultsScreen.svelte";

  const songs: Song[] = songsData as Song[];
  const meta = getUniqueValues(songs);
  const quiz = createQuizState();

  let screen = $state<Screen>("start");

  function startQuiz(families: string[], continents: string[], decades: number[]) {
    const filtered = filterSongsWithFamilies(songs, families, continents, decades);
    if (filtered.length === 0) return;
    quiz.start(filtered, { tags: [], locales: [], decades: [] });
    screen = "quiz";
  }

  function handleQuizComplete() {
    screen = "results";
  }

  function handlePlayAgain() {
    quiz.reset();
    screen = "start";
  }
</script>

<div class="app-shell">
  <header class="app-header">
    <h1 class="logo">
      <span class="eq-bars" aria-hidden="true">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </span>
      <span class="logo-text">Genre <span class="logo-accent">Guessr</span></span>
    </h1>
  </header>

  <main class="app-main">
    {#if screen === "start"}
      <div class="screen-enter">
        <StartScreen
          {songs}
          tagFamilies={meta.tags}
          continents={meta.continents}
          decades={meta.decades}
          onStart={startQuiz}
        />
      </div>
    {:else if screen === "quiz"}
      <div class="screen-enter quiz-screen-wrap">
        <QuizScreen {quiz} onComplete={handleQuizComplete} />
      </div>
    {:else if screen === "results"}
      <div class="screen-enter">
        <ResultsScreen {quiz} onPlayAgain={handlePlayAgain} />
      </div>
    {/if}
  </main>
</div>

<style>
  .app-shell {
    width: 100%;
    max-width: var(--max-w);
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .app-header {
    padding: 18px 0 10px;
    text-align: center;
    flex-shrink: 0;
  }

  .logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .logo-text {
    color: var(--text);
  }

  .logo-accent {
    background: linear-gradient(135deg, #b06ef3, #f06292);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .eq-bars {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 1.1em;
    padding-bottom: 0.05em;
  }

  .bar {
    display: block;
    width: 3px;
    border-radius: 1.5px;
    background: linear-gradient(to top, #b06ef3, #f06292);
    animation: eq-bounce 1.4s ease-in-out infinite;
    transform-origin: bottom;
  }

  .bar:nth-child(1) { height: 55%; animation-delay: 0s; }
  .bar:nth-child(2) { height: 90%; animation-delay: 0.2s; }
  .bar:nth-child(3) { height: 70%; animation-delay: 0.1s; }
  .bar:nth-child(4) { height: 40%; animation-delay: 0.3s; }

  @keyframes eq-bounce {
    0%, 100% { transform: scaleY(0.35); }
    50% { transform: scaleY(1); }
  }

  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .quiz-screen-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
</style>

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

  function startQuiz(families: string[], locales: string[], decades: number[]) {
    const filtered = filterSongsWithFamilies(songs, families, locales, decades);
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
    <h1 class="logo">🎵 Genre Guessr</h1>
  </header>

  <main class="app-main">
    {#if screen === "start"}
      <div class="screen-enter">
        <StartScreen
          {songs}
          tagFamilies={meta.tags}
          locales={meta.locales}
          decades={meta.decades}
          onStart={startQuiz}
        />
      </div>
    {:else if screen === "quiz"}
      <div class="screen-enter">
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
    min-height: 100dvh;
  }

  .app-header {
    padding: 16px 0 8px;
    text-align: center;
    flex-shrink: 0;
  }

  .logo {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>

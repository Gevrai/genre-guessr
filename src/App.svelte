<script lang="ts">
  import type { Song, Screen, Route } from "./lib/types";
  import { createQuizState, getUniqueValues, filterSongsWithFamilies, buildQuizWithFamilies } from "./lib/engine.svelte";
  import { createHistoryStore, createFavoritesStore, songKey } from "./lib/storage.svelte";
  import songsData from "./data/songs.json";
  import StartScreen from "./components/StartScreen.svelte";
  import QuizScreen from "./components/QuizScreen.svelte";
  import ResultsScreen from "./components/ResultsScreen.svelte";
  import FavoritesPage from "./components/FavoritesPage.svelte";
  import ExplorePage from "./components/ExplorePage.svelte";

  const songs: Song[] = songsData as Song[];
  const meta = getUniqueValues(songs);
  const quiz = createQuizState();
  const history = createHistoryStore();
  const favorites = createFavoritesStore();

  // Routing
  const VALID_ROUTES: Route[] = ["/", "/explore", "/favorites"];

  function parseHash(): Route {
    const raw = window.location.hash.replace(/^#/, "") || "/";
    return VALID_ROUTES.includes(raw as Route) ? (raw as Route) : "/";
  }

  let route = $state<Route>(parseHash());
  let screen = $state<Screen>("start");

  function navigate(to: Route) {
    window.location.hash = `#${to}`;
  }

  $effect(() => {
    function onHashChange() {
      route = parseHash();
      if (route !== "/") {
        // Reset quiz when navigating away
        if (screen === "quiz" || screen === "results") {
          quiz.reset();
          screen = "start";
        }
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  });

  function startQuiz(families: string[], continents: string[], decades: number[]) {
    const filtered = filterSongsWithFamilies(songs, families, continents, decades);
    if (filtered.length === 0) return;
    const questions = buildQuizWithFamilies(songs, families, continents, decades, history.entries);
    quiz.startWithQuestions(questions);
    screen = "quiz";
  }

  function handleQuizComplete() {
    // Record quiz results to history
    const entries = quiz.answers.map((a) => ({
      songKey: songKey(a.question.artist, a.question.song),
      correct: a.correct,
      timestamp: Date.now(),
    }));
    history.record(entries);
    screen = "results";
  }

  function handlePlayAgain() {
    quiz.reset();
    screen = "start";
  }

  function handleQuizWithTags(tags: string[]) {
    // Navigate to quiz and pre-start with those tags as raw filters
    navigate("/");
    // Direct start with the filtered songs
    const filtered = songs.filter((s) =>
      s.tags.some((t) => tags.some((ft) => ft.toLowerCase() === t.toLowerCase()))
    );
    if (filtered.length === 0) return;
    const questions = buildQuizWithFamilies(filtered, [], [], [], history.entries);
    quiz.startWithQuestions(questions);
    screen = "quiz";
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

    <nav class="nav-bar">
      <a
        href="#/"
        class="nav-link"
        class:active={route === "/"}
      >Quiz</a>
      <a
        href="#/explore"
        class="nav-link"
        class:active={route === "/explore"}
      >Explore</a>
      <a
        href="#/favorites"
        class="nav-link"
        class:active={route === "/favorites"}
      >Favorites</a>
    </nav>
  </header>

  <main class="app-main">
    {#if route === "/"}
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
          <QuizScreen {quiz} onComplete={handleQuizComplete} {favorites} />
        </div>
      {:else if screen === "results"}
        <div class="screen-enter">
          <ResultsScreen {quiz} onPlayAgain={handlePlayAgain} {favorites} />
        </div>
      {/if}
    {:else if route === "/explore"}
      <div class="screen-enter">
        <ExplorePage {songs} {favorites} />
      </div>
    {:else if route === "/favorites"}
      <div class="screen-enter">
        <FavoritesPage {favorites} {songs} onQuizWithTags={handleQuizWithTags} />
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
    padding: 4px 0 4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex-shrink: 0;
  }

  .logo {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .logo-text {
    color: var(--text);
  }

  .logo-accent {
    background: var(--gradient-primary);
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
    background: linear-gradient(to top, var(--primary-container), var(--secondary-container));
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

  .nav-bar {
    display: flex;
    gap: 4px;
    width: 100%;
    padding: 4px;
    background: var(--surface-low);
    border-radius: var(--radius);
  }

  .nav-link {
    flex: 1;
    text-align: center;
    padding: 8px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    border-radius: calc(var(--radius) - 2px);
    text-decoration: none;
    transition: all var(--transition);
  }

  .nav-link:hover {
    color: var(--text);
    background: var(--surface-high);
  }

  .nav-link.active {
    color: var(--on-primary-container);
    background: var(--primary-container);
    font-weight: 700;
  }

  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--surface-highest) transparent;
  }

  .quiz-screen-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>

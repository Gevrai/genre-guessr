<script lang="ts">
  import type { Song } from "../lib/types";
  import { songKey } from "../lib/storage.svelte";

  interface Props {
    favorites: {
      songs: string[];
      tags: string[];
      toggleSong: (key: string) => void;
      toggleTag: (tag: string) => void;
      isSongFavorited: (key: string) => boolean;
      isTagFavorited: (tag: string) => boolean;
    };
    songs: Song[];
    onQuizWithTags: (tags: string[]) => void;
  }

  let { favorites, songs, onQuizWithTags }: Props = $props();

  const favoritedSongs = $derived(
    favorites.songs
      .map((key) => {
        const song = songs.find((s) => songKey(s.artist, s.song) === key);
        return song ? { key, song } : null;
      })
      .filter((x): x is { key: string; song: Song } => x !== null)
  );

  function quizFavoritedTags() {
    if (favorites.tags.length === 0) return;
    onQuizWithTags(favorites.tags);
  }
</script>

<div class="favorites-page">
  <h2 class="page-title">Favorites</h2>

  <section class="fav-section">
    <h3 class="section-title">Songs</h3>
    {#if favoritedSongs.length === 0}
      <p class="empty">No favorited songs yet. Tap the ♡ during a quiz to save songs you love.</p>
    {:else}
      <ul class="song-list">
        {#each favoritedSongs as { key, song }}
          <li class="song-row">
            <a
              class="yt-link"
              href="https://www.youtube.com/watch?v={song.youtube_id}"
              target="_blank"
              rel="noopener noreferrer"
              title="Play on YouTube"
            >▶</a>
            <div class="song-info">
              <span class="song-name">{song.artist} — {song.song}</span>
              <span class="song-genre">{song.answer}</span>
            </div>
            <button
              class="heart-btn active"
              onclick={() => favorites.toggleSong(key)}
              title="Remove from favorites"
            >♥</button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="fav-section">
    <h3 class="section-title">Tags</h3>
    {#if favorites.tags.length === 0}
      <p class="empty">No favorited tags yet. Tap tags during quiz explanations to save them.</p>
    {:else}
      <div class="tag-chips">
        {#each favorites.tags as tag}
          <button class="tag-chip" onclick={() => favorites.toggleTag(tag)}>
            {tag} <span class="remove-x">×</span>
          </button>
        {/each}
      </div>
      <button class="quiz-tags-btn" onclick={quizFavoritedTags}>
        Quiz These Tags
      </button>
    {/if}
  </section>
</div>

<style>
  .favorites-page {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 4px 0 32px;
  }

  .page-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .section-title {
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .fav-section {
    display: flex;
    flex-direction: column;
  }

  .empty {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.55;
    padding: 16px;
    background: var(--surface-low);
    border-radius: var(--radius);
  }

  .song-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .song-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--surface-low);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .yt-link {
    font-size: 0.8rem;
    color: var(--primary);
    text-decoration: none;
    min-width: 1.4em;
    text-align: center;
    transition: color var(--transition);
  }

  .yt-link:hover {
    color: var(--accent-hover);
  }

  .song-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .song-name {
    font-size: 0.87rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .song-genre {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .heart-btn {
    font-size: 1.1rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    transition: color var(--transition), transform var(--transition);
    padding: 4px;
  }

  .heart-btn.active {
    color: var(--wrong);
  }

  .heart-btn:hover {
    transform: scale(1.15);
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .tag-chip {
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: var(--primary-container);
    color: var(--on-primary-container);
    transition: all var(--transition);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tag-chip:hover {
    transform: translateY(-1px);
  }

  .remove-x {
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .quiz-tags-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--gradient-primary);
    color: var(--on-primary-container);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    transition: all var(--transition);
    box-shadow: var(--glow-warm);
  }

  .quiz-tags-btn:hover {
    box-shadow: 0 24px 44px rgba(255, 77, 0, 0.16);
    transform: translateY(-1px);
  }
</style>

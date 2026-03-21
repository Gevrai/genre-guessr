<script lang="ts">
  interface Props {
    videoId: string;
    autoplay?: boolean;
    muted?: boolean;
    showSoundPrompt?: boolean;
    onEnableSound?: () => void;
  }

  let {
    videoId,
    autoplay = true,
    muted = true,
    showSoundPrompt = false,
    onEnableSound,
  }: Props = $props();

  const src = $derived(
    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&playsinline=1&rel=0&modestbranding=1`
  );
</script>

<div class="yt-wrapper">
  <iframe
    {src}
    title="Song preview"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    loading="eager"
  ></iframe>

  {#if showSoundPrompt}
    <div class="sound-overlay">
      <button class="sound-btn" onclick={() => onEnableSound?.()}>
        Start with sound
      </button>
    </div>
  {/if}
</div>

<style>
  .yt-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 */
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--surface-highest);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .sound-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      linear-gradient(180deg, rgba(19, 19, 19, 0.18), rgba(19, 19, 19, 0.68)),
      radial-gradient(circle at 50% 20%, rgba(255, 87, 26, 0.18), transparent 35%);
    padding: 16px;
    backdrop-filter: blur(24px);
  }

  .sound-btn {
    padding: 12px 18px;
    border-radius: var(--radius);
    background: var(--surface-variant);
    color: var(--text);
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    box-shadow:
      inset 0 0 0 1px var(--outline-ghost),
      0 20px 36px rgba(255, 77, 0, 0.12);
    backdrop-filter: blur(24px);
    transition: all var(--transition);
  }

  .sound-btn:hover {
    transform: translateY(-1px);
    color: var(--primary);
  }

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
</style>

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
    background: #000;
  }

  .sound-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, rgba(8, 8, 16, 0.2), rgba(8, 8, 16, 0.55));
    padding: 16px;
  }

  .sound-btn {
    padding: 12px 18px;
    border-radius: 999px;
    background: rgba(16, 16, 30, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #fff;
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(6px);
  }

  .sound-btn:hover {
    background: rgba(176, 110, 243, 0.9);
  }

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
</style>

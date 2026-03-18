<script lang="ts">
  interface Props {
    videoId: string;
  }

  let { videoId }: Props = $props();

  const src = $derived(
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
  );
</script>

<div class="yt-wrapper">
  <iframe
    {src}
    title="Song preview"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    loading="lazy"
  ></iframe>
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

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
</style>

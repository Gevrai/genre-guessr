<script lang="ts">
  import type { Song } from "../lib/types";
  import { TAG_FAMILIES } from "../lib/engine.svelte";
  import { FAMILY_COLORS } from "../lib/genre-colors";
  import { songKey } from "../lib/storage.svelte";
  import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
  import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";

  interface Props {
    songs: Song[];
    favorites: {
      toggleSong: (key: string) => void;
      toggleTag: (tag: string) => void;
      isSongFavorited: (key: string) => boolean;
      isTagFavorited: (tag: string) => boolean;
    };
  }

  let { songs, favorites }: Props = $props();

  // Build tag data
  interface TagInfo {
    tag: string;
    family: string;
    color: string;
    songs: Song[];
    coTags: Map<string, number>;
  }

  const allTags = $derived.by(() => {
    const map = new Map<string, TagInfo>();
    for (const s of songs) {
      for (const t of s.tags) {
        if (!map.has(t)) {
          const family = getFamily(t);
          map.set(t, {
            tag: t,
            family,
            color: FAMILY_COLORS[family] ?? FAMILY_COLORS.Other,
            songs: [],
            coTags: new Map(),
          });
        }
        map.get(t)!.songs.push(s);
      }
    }
    // Compute co-occurrences
    for (const s of songs) {
      for (let i = 0; i < s.tags.length; i++) {
        for (let j = i + 1; j < s.tags.length; j++) {
          const a = map.get(s.tags[i])!;
          const b = map.get(s.tags[j])!;
          a.coTags.set(s.tags[j], (a.coTags.get(s.tags[j]) ?? 0) + 1);
          b.coTags.set(s.tags[i], (b.coTags.get(s.tags[i]) ?? 0) + 1);
        }
      }
    }
    return map;
  });

  function getFamily(tag: string): string {
    const lower = tag.toLowerCase();
    for (const [family, members] of Object.entries(TAG_FAMILIES)) {
      if (members.some((m) => m.toLowerCase() === lower)) return family;
    }
    return "Other";
  }

  // Stats
  const totalSongs = $derived(songs.length);
  const totalTags = $derived(allTags.size);
  const totalFamilies = $derived(Object.keys(TAG_FAMILIES).length);
  const decadeRange = $derived.by(() => {
    const years = songs.map((s) => s.release_year);
    const min = Math.floor(Math.min(...years) / 10) * 10;
    const max = Math.floor(Math.max(...years) / 10) * 10;
    return `${min}s – ${max}s`;
  });

  // Family groups for list view
  interface FamilyGroup {
    name: string;
    color: string;
    memberTags: TagInfo[];
    songCount: number;
  }

  const familyGroups = $derived.by(() => {
    const groups: FamilyGroup[] = [];
    const familyNames = [...Object.keys(TAG_FAMILIES), "Other"];
    for (const name of familyNames) {
      const memberTags: TagInfo[] = [];
      for (const info of allTags.values()) {
        if (info.family === name) memberTags.push(info);
      }
      if (memberTags.length === 0) continue;
      const uniqueSongs = new Set<string>();
      for (const t of memberTags) {
        for (const s of t.songs) uniqueSongs.add(songKey(s.artist, s.song));
      }
      groups.push({
        name,
        color: FAMILY_COLORS[name] ?? FAMILY_COLORS.Other,
        memberTags: memberTags.sort((a, b) => b.songs.length - a.songs.length),
        songCount: uniqueSongs.size,
      });
    }
    return groups.sort((a, b) => b.songCount - a.songCount);
  });

  // Expanded state
  let expandedFamily = $state<string | null>(null);
  let selectedTag = $state<string | null>(null);

  function toggleExpand(name: string) {
    expandedFamily = expandedFamily === name ? null : name;
    selectedTag = null;
  }

  function selectTag(tag: string) {
    selectedTag = selectedTag === tag ? null : tag;
  }

  const selectedTagInfo = $derived(selectedTag ? allTags.get(selectedTag) ?? null : null);

  // Graph
  interface GraphNode extends SimulationNodeDatum {
    id: string;
    family: string;
    color: string;
    count: number;
    radius: number;
  }

  interface GraphLink extends SimulationLinkDatum<GraphNode> {
    value: number;
  }

  let canvasEl: HTMLCanvasElement | undefined = $state(undefined);
  let graphWidth = $state(0);
  const graphHeight = 360;
  let showGraph = $state(false);
  let hoveredNode = $state<string | null>(null);
  let graphNodes = $state<GraphNode[]>([]);
  let graphLinks = $state<GraphLink[]>([]);
  let sim: ReturnType<typeof forceSimulation<GraphNode>> | null = null;

  // Track pointer for panning/zooming
  let transform = $state({ x: 0, y: 0, k: 1 });
  let dragging = $state(false);
  let dragStart = $state({ x: 0, y: 0 });
  let dragTransformStart = $state({ x: 0, y: 0 });

  function buildGraph() {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const tagArr = [...allTags.values()];

    for (const info of tagArr) {
      const r = Math.max(4, Math.min(18, Math.sqrt(info.songs.length) * 4));
      nodes.push({
        id: info.tag,
        family: info.family,
        color: info.color,
        count: info.songs.length,
        radius: r,
      });
    }

    const seen = new Set<string>();
    for (const info of tagArr) {
      for (const [coTag, count] of info.coTags) {
        const key = [info.tag, coTag].sort().join("||");
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({
          source: info.tag,
          value: count,
          target: coTag,
        });
      }
    }

    graphNodes = nodes;
    graphLinks = links;

    sim?.stop();
    const w = graphWidth || 400;
    sim = forceSimulation<GraphNode>(nodes)
      .force("link", forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(60).strength(0.3))
      .force("charge", forceManyBody<GraphNode>().strength(-40))
      .force("center", forceCenter(w / 2, graphHeight / 2))
      .force("collide", forceCollide<GraphNode>().radius((d) => d.radius + 2))
      .alpha(0.8)
      .alphaDecay(0.02)
      .on("tick", drawGraph);
  }

  function drawGraph() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    const w = canvasEl.width;
    const h = canvasEl.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Draw links
    for (const link of graphLinks) {
      const s = link.source as GraphNode;
      const t = link.target as GraphNode;
      if (s.x == null || s.y == null || t.x == null || t.y == null) continue;
      const isHighlighted = hoveredNode && (s.id === hoveredNode || t.id === hoveredNode);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = isHighlighted
        ? "rgba(255,255,255,0.35)"
        : "rgba(255,255,255,0.06)";
      ctx.lineWidth = isHighlighted ? Math.min(link.value, 4) : Math.min(link.value * 0.5, 2);
      ctx.stroke();
    }

    // Draw nodes
    for (const node of graphNodes) {
      if (node.x == null || node.y == null) continue;
      const isHovered = node.id === hoveredNode;
      const isConnected = hoveredNode && allTags.get(hoveredNode)?.coTags.has(node.id);
      const dimmed = hoveredNode && !isHovered && !isConnected;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = dimmed ? `${node.color}33` : node.color;
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.id, node.x, node.y - node.radius - 5);
      }
    }

    ctx.restore();
  }

  function resizeCanvas() {
    if (!canvasEl) return;
    const rect = canvasEl.parentElement?.getBoundingClientRect();
    if (rect) {
      graphWidth = rect.width;
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width = rect.width * dpr;
      canvasEl.height = graphHeight * dpr;
      canvasEl.style.width = `${rect.width}px`;
      canvasEl.style.height = `${graphHeight}px`;
      drawGraph();
    }
  }

  function getNodeAt(px: number, py: number): GraphNode | null {
    // Convert screen coords to graph coords
    const gx = (px - transform.x) / transform.k;
    const gy = (py - transform.y) / transform.k;
    for (let i = graphNodes.length - 1; i >= 0; i--) {
      const n = graphNodes[i];
      if (n.x == null || n.y == null) continue;
      const dx = n.x - gx;
      const dy = n.y - gy;
      if (dx * dx + dy * dy <= (n.radius + 3) ** 2) return n;
    }
    return null;
  }

  function onPointerDown(e: PointerEvent) {
    const rect = canvasEl?.getBoundingClientRect();
    if (!rect) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    dragTransformStart = { x: transform.x, y: transform.y };
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvasEl?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (dragging) {
      transform = {
        ...transform,
        x: dragTransformStart.x + (e.clientX - dragStart.x),
        y: dragTransformStart.y + (e.clientY - dragStart.y),
      };
      drawGraph();
      return;
    }

    const node = getNodeAt(px, py);
    const newHover = node?.id ?? null;
    if (newHover !== hoveredNode) {
      hoveredNode = newHover;
      drawGraph();
    }
  }

  function onPointerUp(e: PointerEvent) {
    const wasDragging = dragging;
    const moved = Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y);
    dragging = false;

    if (wasDragging && moved < 5) {
      const rect = canvasEl?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const node = getNodeAt(px, py);
      if (node) {
        selectedTag = node.id;
        const familyForTag = allTags.get(node.id)?.family;
        if (familyForTag) expandedFamily = familyForTag;
      }
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const rect = canvasEl?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newK = Math.max(0.3, Math.min(4, transform.k * delta));
    const ratio = newK / transform.k;
    transform = {
      k: newK,
      x: px - (px - transform.x) * ratio,
      y: py - (py - transform.y) * ratio,
    };
    drawGraph();
  }

  $effect(() => {
    if (showGraph && canvasEl) {
      resizeCanvas();
      buildGraph();
    }
    return () => {
      sim?.stop();
    };
  });

  // Redraw on hover changes
  $effect(() => {
    hoveredNode;
    transform;
    drawGraph();
  });
</script>

<div class="explore-page">
  <h2 class="page-title">Explore</h2>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat">
      <span class="stat-value">{totalSongs}</span>
      <span class="stat-label">Songs</span>
    </div>
    <div class="stat">
      <span class="stat-value">{totalTags}</span>
      <span class="stat-label">Tags</span>
    </div>
    <div class="stat">
      <span class="stat-value">{totalFamilies}</span>
      <span class="stat-label">Families</span>
    </div>
    <div class="stat">
      <span class="stat-value">{decadeRange}</span>
      <span class="stat-label">Span</span>
    </div>
  </div>

  <!-- Graph toggle -->
  <button class="toggle-graph-btn" onclick={() => { showGraph = !showGraph; }}>
    {showGraph ? "Hide" : "Show"} Tag Graph
  </button>

  {#if showGraph}
    <div class="graph-container">
      <canvas
        bind:this={canvasEl}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointerleave={() => { dragging = false; hoveredNode = null; drawGraph(); }}
        onwheel={onWheel}
        style="touch-action: none;"
      ></canvas>
      <p class="graph-hint">Hover to highlight • Click a node to see tag details • Scroll to zoom • Drag to pan</p>
    </div>
  {/if}

  <!-- Family list -->
  <div class="families">
    {#each familyGroups as group}
      <div class="family-card">
        <button class="family-header" onclick={() => toggleExpand(group.name)}>
          <span class="family-dot" style="background: {group.color}"></span>
          <span class="family-name">{group.name}</span>
          <span class="family-count">{group.songCount} song{group.songCount !== 1 ? "s" : ""}</span>
          <span class="expand-icon">{expandedFamily === group.name ? "▾" : "▸"}</span>
        </button>

        {#if expandedFamily === group.name}
          <div class="family-body screen-enter">
            <div class="subtag-chips">
              {#each group.memberTags as info}
                <button
                  class="subtag-chip"
                  class:selected={selectedTag === info.tag}
                  onclick={() => selectTag(info.tag)}
                  style="--tag-color: {info.color}"
                >
                  {info.tag}
                  <span class="subtag-count">{info.songs.length}</span>
                </button>
              {/each}
            </div>

            {#if selectedTagInfo}
              <div class="tag-detail screen-enter">
                <div class="tag-detail-header">
                  <h4>{selectedTagInfo.tag}</h4>
                  <button
                    class="heart-btn"
                    class:active={favorites.isTagFavorited(selectedTagInfo.tag)}
                    onclick={() => favorites.toggleTag(selectedTagInfo.tag)}
                    title="Toggle favorite tag"
                  >
                    {favorites.isTagFavorited(selectedTagInfo.tag) ? "♥" : "♡"}
                  </button>
                </div>

                <!-- Co-occurring tags -->
                {#if selectedTagInfo.coTags.size > 0}
                  <div class="co-tags">
                    <span class="co-label">Related:</span>
                    {#each [...selectedTagInfo.coTags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12) as [coTag, count]}
                      <button
                        class="co-tag-chip"
                        onclick={() => selectTag(coTag)}
                        title="{count} shared song{count !== 1 ? 's' : ''}"
                      >
                        {coTag} <span class="co-count">({count})</span>
                      </button>
                    {/each}
                  </div>
                {/if}

                <!-- Songs with this tag -->
                <ul class="tag-songs">
                  {#each selectedTagInfo.songs as s}
                    {@const sk = songKey(s.artist, s.song)}
                    <li class="tag-song-row">
                      <a
                        class="yt-link"
                        href="https://www.youtube.com/watch?v={s.youtube_id}"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Play on YouTube"
                      >▶</a>
                      <div class="tag-song-info">
                        <span class="tag-song-name">{s.artist} — {s.song}</span>
                        <span class="tag-song-answer">{s.answer}</span>
                      </div>
                      <button
                        class="heart-btn"
                        class:active={favorites.isSongFavorited(sk)}
                        onclick={() => favorites.toggleSong(sk)}
                        title="Toggle favorite"
                      >
                        {favorites.isSongFavorited(sk) ? "♥" : "♡"}
                      </button>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .explore-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 4px 0 32px;
  }

  .page-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  /* Stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .stat {
    background: var(--surface-low);
    border-radius: var(--radius);
    padding: 12px 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text);
  }

  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  /* Graph */
  .toggle-graph-btn {
    padding: 10px 16px;
    border-radius: var(--radius);
    background: var(--surface-high);
    color: var(--text-muted);
    font-size: 0.84rem;
    font-weight: 600;
    transition: all var(--transition);
    align-self: flex-start;
  }

  .toggle-graph-btn:hover {
    background: var(--surface-highest);
    color: var(--text);
  }

  .graph-container {
    background: var(--surface-lowest);
    border-radius: var(--radius);
    overflow: hidden;
    position: relative;
  }

  .graph-container canvas {
    display: block;
    cursor: grab;
  }

  .graph-container canvas:active {
    cursor: grabbing;
  }

  .graph-hint {
    font-size: 0.68rem;
    color: var(--text-muted);
    text-align: center;
    padding: 6px;
    opacity: 0.7;
  }

  /* Families */
  .families {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .family-card {
    background: var(--surface-low);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .family-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    font-size: 0.9rem;
    font-weight: 600;
    text-align: left;
    transition: background var(--transition);
  }

  .family-header:hover {
    background: var(--surface-high);
  }

  .family-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .family-name {
    flex: 1;
  }

  .family-count {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .expand-icon {
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 1em;
    text-align: center;
  }

  .family-body {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .subtag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .subtag-chip {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--surface-high);
    color: var(--text-muted);
    transition: all var(--transition);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .subtag-chip:hover {
    background: var(--surface-highest);
    color: var(--text);
  }

  .subtag-chip.selected {
    background: var(--tag-color);
    color: #000;
    font-weight: 700;
  }

  .subtag-count {
    font-size: 0.65rem;
    opacity: 0.7;
  }

  /* Tag detail panel */
  .tag-detail {
    background: var(--surface-container);
    border-radius: var(--radius-sm);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tag-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tag-detail-header h4 {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
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

  .co-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .co-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .co-tag-chip {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    background: var(--surface-high);
    color: var(--text-muted);
    transition: all var(--transition);
  }

  .co-tag-chip:hover {
    background: var(--surface-highest);
    color: var(--text);
  }

  .co-count {
    opacity: 0.6;
  }

  .tag-songs {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tag-song-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: var(--surface-high);
    border-radius: var(--radius-sm);
  }

  .yt-link {
    font-size: 0.75rem;
    color: var(--primary);
    text-decoration: none;
    min-width: 1.2em;
    text-align: center;
  }

  .yt-link:hover {
    color: var(--accent-hover);
  }

  .tag-song-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .tag-song-name {
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag-song-answer {
    font-size: 0.68rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>

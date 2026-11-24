import { VIDEOS } from './data.js';
import { save, persist } from './save.js';
import { Sfx } from './audio.js';
import { SPARKY_SVG, heroSVG } from './portraits.js';

const $ = (s) => document.querySelector(s);
const NEED = 0.9; // fraction of a video that must really be watched

let apiPromise = null;
function loadYT() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((res, rej) => {
    if (window.YT && window.YT.Player) return res(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev && prev(); res(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => rej(new Error('YouTube could not load'));
    document.head.appendChild(s);
    setTimeout(() => rej(new Error('YouTube timed out')), 12000);
  });
  apiPromise.catch(() => { apiPromise = null; });
  return apiPromise;
}

const segOf = (v) => [v.start || 0, v.end || v.length];
const needOf = (v) => { const [a, b] = segOf(v); return Math.floor((b - a) * NEED); };

export function isWatched(key) { return !!save.watched[key]; }
export function allWatched(keys) { return keys.every(isWatched); }

// The Theater: Jesi + Sparky on the couch watching the lesson. Resolves 'play' or 'back'.
export class Theater {
  constructor(game) {
    this.game = game;
    this.el = $('#theater');
    this.typed = '';
    window.addEventListener('keydown', (e) => {
      if (this.el.classList.contains('hidden')) return;
      // hidden tester shortcut: type "skipit" while the theater is open
      this.typed = (this.typed + (e.key || '')).slice(-6).toLowerCase();
      if (this.typed === 'skipit' && this.current) { this.markWatched(this.current); this.typed = ''; }
      if (e.code === 'Escape') this.close('back');
    });
    // second hidden tester shortcut (works even when the video has keyboard focus): click "Lesson Time" 5 times fast
    let clicks = [];
    document.querySelector('.th-label').addEventListener('click', () => {
      const now = performance.now();
      clicks = clicks.filter((c) => now - c < 2000).concat(now);
      if (clicks.length >= 5 && this.current) { clicks = []; this.markWatched(this.current); }
    });
    $('#th-back').addEventListener('click', () => this.close('back'));
    // Skip: tap once to arm, tap again within 3 seconds to confirm
    $('#th-skip').addEventListener('click', () => {
      const b = $('#th-skip');
      if (!this.current) return;
      if (!b.classList.contains('armed')) {
        b.classList.add('armed');
        b.textContent = 'Tap again to skip';
        clearTimeout(this.skipT);
        this.skipT = setTimeout(() => this.disarmSkip(), 3000);
        return;
      }
      this.disarmSkip();
      // skips this video (and any other parts of this lesson) so the level unlocks
      for (const k of this.keys) this.markWatched(k);
    });
    $('#th-play').addEventListener('click', () => { if (!$('#th-play').disabled) this.close('play'); });
  }

  open(world, { rewatch = false, videoKeys = null, playLabel = '▶ Play Level', heading = null } = {}) {
    this.world = world;
    this.keys = videoKeys || world.videos;
    this.rewatch = rewatch;
    this.playLabel = playLabel;
    this.game.ui.pushModal();
    $('#th-couch').innerHTML = `<div class="buddy jesi">${heroSVG(save.avatar)}</div><div class="buddy sparky">${SPARKY_SVG}</div>`;
    this.el.classList.remove('hidden');
    $('#th-world').textContent = rewatch ? 'Rewatch' : (heading || `World ${world.num}: ${world.name}`);
    $('#th-play').textContent = rewatch ? 'Done ✓' : playLabel;
    this.renderTabs();
    const first = this.keys.find((k) => !isWatched(k)) || this.keys[0];
    this.select(first);
    return new Promise((res) => (this.resolve = res));
  }

  renderTabs() {
    const tabs = $('#th-tabs');
    tabs.style.display = this.keys.length > 1 ? '' : 'none';
    tabs.innerHTML = this.keys.map((k, i) => `<button class="tab ${isWatched(k) ? 'done' : ''}" data-k="${k}">Part ${i + 1} ${isWatched(k) ? '✓' : ''}</button>`).join('');
    tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.select(b.dataset.k)));
  }

  async select(key) {
    this.stopTracking();
    this.disarmSkip();
    this.current = key;
    const v = VIDEOS[key];
    $('#th-title').textContent = v.title;
    const watchUrl = `https://www.youtube.com/watch?v=${v.id}${v.start ? '&t=' + v.start + 's' : ''}`;
    $('#th-credit').innerHTML = `🎬 Video by <a href="https://www.youtube.com/@futurepedia_io" target="_blank" rel="noopener"><b>Futurepedia</b></a> · from <i>Master The Claude Ecosystem</i> · <a href="${watchUrl}" target="_blank" rel="noopener">open on YouTube ↗</a>`;
    $('#th-tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.k === key));
    $('#th-fallback').classList.add('hidden');
    const holder = $('#th-screen-inner');
    holder.innerHTML = '<div id="yt-player"></div>';
    this.updateProgress();
    try {
      const YT = await loadYT();
      if (this.current !== key) return;
      const [start, end] = segOf(v);
      this.yt = new YT.Player('yt-player', {
        videoId: v.id,
        width: '100%', height: '100%',
        playerVars: { start, end: v.end || undefined, rel: 0, playsinline: 1, modestbranding: 1, origin: location.origin },
        events: {
          onReady: () => this.startTracking(v),
          onError: (e) => { if ([2, 5, 100, 101, 150, 153].includes(e.data)) this.fallback(v); },
        },
      });
    } catch (err) {
      this.fallback(v);
    }
  }

  startTracking(v) {
    const set = new Set(save.watchedSecs[v.key] || []);
    this.set = set;
    let last = null, sinceSave = 0;
    const [a, b] = segOf(v);
    this.timer = setInterval(() => {
      if (!this.yt || !this.yt.getPlayerState) return;
      const st = this.yt.getPlayerState();
      const t = this.yt.getCurrentTime();
      const rate = this.yt.getPlaybackRate ? this.yt.getPlaybackRate() : 1;
      if (st === 1 && last != null) {
        const d = t - last;
        // only count time that really played (skipping ahead doesn't count)
        if (d > 0 && d <= 0.5 * rate + 0.75) {
          for (let s = Math.floor(last); s <= Math.floor(t); s++) if (s >= a && s < b) set.add(s);
        }
      }
      last = t;
      if (++sinceSave >= 10) { sinceSave = 0; save.watchedSecs[v.key] = [...set]; persist(); }
      this.updateProgress();
      if (!isWatched(v.key) && set.size >= needOf(v)) this.markWatched(v.key);
    }, 500);
  }

  stopTracking() {
    clearInterval(this.timer);
    if (this.set && this.current) { save.watchedSecs[this.current] = [...this.set]; persist(); }
    this.set = null;
    if (this.yt && this.yt.destroy) { try { this.yt.destroy(); } catch (e) {} }
    this.yt = null;
  }

  markWatched(key) {
    if (!save.watched[key]) {
      save.watched[key] = true;
      persist();
      Sfx.good();
      this.cheer();
    }
    this.renderTabs();
    $('#th-tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.k === this.current));
    this.updateProgress();
  }

  disarmSkip() {
    clearTimeout(this.skipT);
    const b = $('#th-skip');
    b.classList.remove('armed');
    b.innerHTML = 'Skip video &#9197;';
  }

  cheer() {
    const c = $('#th-couch');
    c.classList.remove('cheer'); void c.offsetWidth; c.classList.add('cheer');
  }

  updateProgress() {
    const v = VIDEOS[this.current];
    const watched = isWatched(this.current);
    const n = this.set ? this.set.size : (save.watchedSecs[this.current] || []).length;
    const pct = watched ? 100 : Math.min(99, Math.floor((n / needOf(v)) * 100));
    $('#th-fill').style.width = pct + '%';
    const all = this.keys.every(isWatched);
    $('#th-pct').textContent = watched
      ? (all ? 'Lesson complete! Sparky is SO proud of you ✨' : 'Part done! Watch the next part too →')
      : `Watched ${pct}%: keep watching to unlock the level`;
    $('#th-skip').classList.toggle('hidden', all || this.rewatch);
    const play = $('#th-play');
    play.disabled = !(all || this.rewatch);
    play.classList.toggle('ready', all && !this.rewatch);
    if (!this.rewatch) play.textContent = all ? this.playLabel : '🔒 ' + this.playLabel.replace(/^▶\s*/, '');
  }

  fallback(v) {
    this.stopTracking();
    const fb = $('#th-fallback');
    fb.classList.remove('hidden');
    const url = `https://www.youtube.com/watch?v=${v.id}${v.start ? '&t=' + v.start + 's' : ''}`;
    fb.innerHTML = `<p>This video can’t play inside the game right now.</p>
      <a class="btn" href="${url}" target="_blank" rel="noopener" id="th-ext">Watch on YouTube ↗</a>
      <button class="btn hidden" id="th-honor">✓ I watched it</button>`;
    $('#th-ext').addEventListener('click', () => $('#th-honor').classList.remove('hidden'));
    $('#th-honor').addEventListener('click', () => this.markWatched(v.key));
  }

  close(result) {
    if (this.el.classList.contains('hidden')) return;
    this.stopTracking();
    $('#th-screen-inner').innerHTML = '';
    this.el.classList.add('hidden');
    this.game.ui.popModal();
    this.current = null;
    const r = this.resolve; this.resolve = null;
    r && r(result);
  }
}

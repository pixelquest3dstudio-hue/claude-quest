// Progress is saved in this browser (localStorage). Wrapped in try/catch so private windows still work.
const KEY = 'jesiClaudeQuest.v1';
const defaults = () => ({ watched: {}, watchedSecs: {}, done: {}, stars: {}, stickers: [], introSeen: false, muted: false, playerName: '', avatar: '', world: '' });

// Only a safety fallback: the name screen requires players to type a name.
export const DEFAULT_NAME = 'Adventurer';

// The player's chosen name, safe to drop into HTML.
export function playerName() {
  const n = (save.playerName || '').trim() || DEFAULT_NAME;
  return n.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return Object.assign(defaults(), raw ? JSON.parse(raw) : {});
  } catch (e) {
    return defaults();
  }
}

export const save = load();

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); return true; } catch (e) { return false; }
}

export function resetSave() {
  const fresh = defaults();
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, fresh);
  persist();
}

export function hasProgress() {
  return save.introSeen || Object.keys(save.done).length > 0;
}

// ---------- save slots + backup files ----------
export const SLOTS = [1, 2, 3];
const slotKey = (n) => `${KEY}.slot${n}`;

export function readSlot(n) {
  try { return JSON.parse(localStorage.getItem(slotKey(n))); } catch (e) { return null; }
}

// Returns false if the browser refused to store it.
export function writeSlot(n) {
  try { localStorage.setItem(slotKey(n), JSON.stringify({ at: Date.now(), data: save })); return true; } catch (e) { return false; }
}

export function exportSave() {
  return JSON.stringify({ game: 'claude-quest', at: Date.now(), data: save });
}

// Replaces the current game. Keeps only known fields of the right type. Returns false if it isn't a save.
export function loadSave(box) {
  const d = box && box.data;
  if (!d || typeof d !== 'object' || Array.isArray(d) || typeof d.done !== 'object' || !d.done) return false;
  const next = defaults();
  for (const k of Object.keys(next)) {
    const a = next[k], b = d[k];
    if (b != null && typeof a === typeof b && Array.isArray(a) === Array.isArray(b)) next[k] = b;
  }
  next.playerName = next.playerName.slice(0, 14);
  if (!['male', 'female'].includes(next.avatar)) next.avatar = '';
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, next);
  return persist();
}
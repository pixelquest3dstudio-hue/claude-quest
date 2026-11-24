import { save, SLOTS, readSlot, writeSlot, exportSave, loadSave } from './save.js';
import { WORLDS } from './data.js';
import { Sfx } from './audio.js';

const $ = (id) => document.getElementById(id);
const worldName = (k) => (WORLDS.find((w) => w.key === k) || { name: 'Promptopia' }).name;

// The save menu: three slots plus a backup file.
export class SaveMenu {
  constructor(game) {
    this.game = game;
    $('btn-save').onclick = () => { $('btn-save').blur(); if (!game.ui.modal && !game.transitioning) this.open(true); };
    $('btn-load').onclick = () => this.open(false);
    $('saves-close').onclick = () => this.close();
    $('saves-export').onclick = () => this.download();
    $('saves-import').onclick = () => $('saves-file').click();
    $('saves-file').onchange = () => this.upload();
  }

  open(canSave) {
    this.canSave = canSave;
    this.game.ui.pushModal();
    $('saves-export').style.display = canSave ? '' : 'none';
    this.msg('');
    this.render();
    $('saves').classList.remove('hidden');
    this.game.ui.keyHandler = (e) => { if (e.code === 'Escape' || e.code === 'KeyP') { this.close(); return true; } return false; };
  }

  close() {
    if ($('saves').classList.contains('hidden')) return;
    $('saves').classList.add('hidden');
    this.game.ui.keyHandler = null;
    this.game.ui.popModal();
  }

  msg(t) { $('saves-msg').textContent = t; }

  render() {
    const list = $('saves-list');
    list.textContent = '';
    for (const n of SLOTS) {
      const s = readSlot(n), d = s && s.data;
      const row = document.createElement('div');
      row.className = 'save-row';
      const info = document.createElement('div');
      info.className = 'save-info';
      const b = document.createElement('b');
      b.textContent = d ? `Slot ${n}: ${d.playerName || 'Adventurer'}` : `Slot ${n}: empty`;
      const small = document.createElement('small');
      small.textContent = d ? `${worldName(d.world)} · ${Object.keys(d.done || {}).length}/${WORLDS.length} worlds · ★ ${Object.keys(d.stars || {}).length} · ${new Date(s.at).toLocaleString()}` : 'Nothing saved here yet';
      info.append(b, small);
      row.append(info);
      const btn = (label, cls, fn) => { const x = document.createElement('button'); x.className = cls; x.textContent = label; x.onclick = fn; row.append(x); };
      if (this.canSave) btn('Save here', 'btn', () => {
        if (d && !confirm(`Replace the game in slot ${n}?`)) return;
        const ok = writeSlot(n);
        ok ? Sfx.good() : Sfx.bad();
        this.render();
        this.msg(ok ? `✨ Saved to slot ${n}!` : 'This browser would not store the save. Use Download backup instead.');
      });
      if (d) btn('Load', 'btn ghost', () => this.load(s));
      list.append(row);
    }
  }

  load(box) {
    if (save.playerName && !confirm('Load this game? Your current game will be replaced, so save it to a slot first if you want to keep it.')) return;
    if (loadSave(box)) location.reload();
    else this.msg('That save could not be loaded.');
  }

  download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportSave()], { type: 'application/json' }));
    a.download = 'claude-quest-save.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    this.msg('Backup downloaded.');
  }

  async upload() {
    const f = $('saves-file').files[0];
    $('saves-file').value = '';
    if (!f) return;
    try {
      const box = JSON.parse(await f.text());
      if (box.game !== 'claude-quest') throw new Error('not a save');
      this.load(box);
    } catch (e) { this.msg('That file is not a Claude Quest save.'); }
  }
}
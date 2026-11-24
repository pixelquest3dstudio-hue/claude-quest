import { Input } from './input.js';
import { Sfx } from './audio.js';
import { SPARKY_SVG, heroSVG, blobSVG } from './portraits.js';
import { CARDS } from './data.js';
import { save, playerName } from './save.js';

const $ = (s) => document.querySelector(s);
const ADVANCE = ['Space', 'Enter', 'KeyE'];
export class UI {
  constructor(game) {
    this.game = game;
    this.modal = 0;
    this.cooldown = 0;
    this.keyHandler = null;
    this.speakers = {
      sparky: { name: 'Sparky', color: '#f08a5d', svg: SPARKY_SVG, pitch: 1.4 },
      jesi: { get name() { return playerName(); }, get color() { return save.avatar === 'male' ? '#5a8fe0' : '#9b7bd4'; }, get svg() { return heroSVG(save.avatar); }, get pitch() { return save.avatar === 'male' ? 0.95 : 1.1; } },
    };
    this.el = {
      dlg: $('#dialogue'), name: $('#dlg-name'), text: $('#dlg-text'), portrait: $('#dlg-portrait'), next: $('#dlg-next'),
      choice: $('#choice'), choiceTitle: $('#choice-title'), choiceQ: $('#choice-q'), choiceOpts: $('#choice-opts'),
      hearts: $('#hearts'), stars: $('#stars'), objective: $('#objective'), prompt: $('#prompt'), toast: $('#toast'),
      banner: $('#banner'), fade: $('#fade'), flash: $('#flash'), boss: $('#bossbar'), bossName: $('#boss-name'), bossFill: $('#boss-fill'),
      book: $('#book'), bookCards: $('#book-cards'), hud: $('#hud'),
    };
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return; // typing a name shouldn't trigger hotkeys
      if (this.keyHandler && this.keyHandler(e)) { e.preventDefault(); Input.pressed.clear(); }
      else if (!this.modal && e.code === 'KeyB' && this.game.level) this.openBook();
      else if (!this.modal && e.code === 'KeyP' && this.game.level && !this.game.cam.orbit && !this.game.transitioning) this.game.saves.open(true);
      else if (e.code === 'KeyM') this.game.toggleMute();
    });
    this.el.dlg.addEventListener('click', () => this.clickAdvance && this.clickAdvance());
    $('#book-close').addEventListener('click', () => this.closeBook());
    $('#btn-book').addEventListener('click', () => { if (!this.modal) this.openBook(); });
    $('#btn-mute').addEventListener('click', () => this.game.toggleMute());
  }

  get blocking() { return this.modal > 0; }
  pushModal() { this.modal++; }
  popModal() { this.modal = Math.max(0, this.modal - 1); if (!this.modal) this.cooldown = 0.25; }
  tick(dt) { if (this.cooldown > 0) this.cooldown -= dt; }

  // ---------- dialogue ----------
  async say(lines) {
    if (!Array.isArray(lines[0])) lines = [lines];
    this.pushModal();
    this.el.dlg.classList.remove('hidden');
    for (const l of lines) await this.line(l);
    this.el.dlg.classList.add('hidden');
    this.keyHandler = null;
    this.popModal();
  }

  line([who, text]) {
    return new Promise((res) => {
      const sp = this.speakers[who] || { name: who, color: '#9b7bd4', svg: blobSVG('#c9b6ff'), pitch: 1 };
      text = text.replace(/\{name\}/g, playerName());
      this.el.name.innerHTML = sp.name;
      this.el.name.style.background = sp.color;
      this.el.portrait.innerHTML = sp.svg;
      this.el.portrait.classList.remove('pop'); void this.el.portrait.offsetWidth; this.el.portrait.classList.add('pop');
      this.el.next.classList.remove('show');
      let i = 0, done = false, timer = null;
      const tick = () => {
        if (done) return;
        i += 1;
        this.el.text.innerHTML = text.slice(0, i);
        if (i % 3 === 0 && text[i - 1] !== ' ') Sfx.talk(sp.pitch);
        if (i >= text.length) { done = true; this.el.next.classList.add('show'); return; }
        timer = setTimeout(tick, text[i - 1] === '.' || text[i - 1] === '!' || text[i - 1] === '?' ? 90 : 20);
      };
      const adv = () => {
        if (!done) { done = true; clearTimeout(timer); this.el.text.innerHTML = text; this.el.next.classList.add('show'); }
        else { this.keyHandler = null; this.clickAdvance = null; Sfx.click(); res(); }
      };
      this.keyHandler = (e) => { if (!ADVANCE.includes(e.code)) return false; if (!e.repeat) adv(); return true; };
      this.clickAdvance = adv;
      // avoid rendering half an HTML tag while typing
      text = text.replace(/<b>/g, '').replace(/<\/b>/g, '');
      tick();
    });
  }

  // ---------- multiple choice ----------
  choice(question, options, { title = '' } = {}) {
    return new Promise((res) => {
      this.pushModal();
      this.el.choiceTitle.textContent = title;
      this.el.choiceTitle.style.display = title ? '' : 'none';
      this.el.choiceQ.innerHTML = question;
      this.el.choiceOpts.innerHTML = '';
      const finish = (i) => {
        this.keyHandler = null;
        this.el.choice.classList.add('hidden');
        Sfx.click();
        this.popModal();
        res(i);
      };
      options.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.innerHTML = `<span class="num">${i + 1}</span>${o}`;
        b.addEventListener('click', () => finish(i));
        this.el.choiceOpts.appendChild(b);
      });
      this.keyHandler = (e) => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= options.length) { finish(n - 1); return true; }
        return ADVANCE.includes(e.code) || e.code.startsWith('Arrow') || e.code.startsWith('Key');
      };
      this.el.choice.classList.remove('hidden');
    });
  }

  // a lesson tip that stays up long enough to read
  lesson(label, text) { this.toast(`<b>${label}</b><br><small>${text}</small>`, 6500); this.el.toast.classList.add('lesson'); }

  // ---------- HUD ----------
  setHearts(hp, max) {
    this.el.hearts.innerHTML = Array.from({ length: max }, (_, i) => `<span class="heart ${i < hp ? '' : 'empty'}">♥</span>`).join('');
  }
  setStars(n) { this.el.stars.innerHTML = `<span class="star-ico">★</span> ${n}`; }
  setObjective(t) { this.el.objective.innerHTML = t || ''; this.el.objective.style.display = t ? '' : 'none'; }
  prompt(t) {
    if (t === this._prompt) return;
    this._prompt = t;
    this.el.prompt.innerHTML = t ? `<kbd>E</kbd> ${t}` : '';
    this.el.prompt.classList.toggle('show', !!t);
  }
  showHud(v) { this.el.hud.classList.toggle('hidden', !v); }

  toast(t, ms = 1800) {
    const el = this.el.toast;
    el.innerHTML = t;
    el.classList.remove('lesson');
    el.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.remove('show'), ms);
  }

  banner(title, sub = '') {
    const el = this.el.banner;
    el.innerHTML = `<div class="b-sub">${sub}</div><div class="b-title">${title}</div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  flash() { const f = this.el.flash; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

  boss(name, frac) {
    if (name == null) { this.el.boss.classList.add('hidden'); return; }
    this.el.boss.classList.remove('hidden');
    this.el.bossName.textContent = name;
    this.el.bossFill.style.width = Math.max(0, frac) * 100 + '%';
  }

  fadeOut(ms = 450) { this.el.fade.style.transitionDuration = ms + 'ms'; this.el.fade.classList.add('on'); return new Promise((r) => setTimeout(r, ms)); }
  fadeIn(ms = 450) { this.el.fade.style.transitionDuration = ms + 'ms'; this.el.fade.classList.remove('on'); return new Promise((r) => setTimeout(r, ms)); }

  // ---------- sticker book ----------
  openBook() {
    this.pushModal();
    const owned = new Set(save.stickers);
    document.getElementById('book-owner').innerHTML = playerName();
    this.el.bookCards.innerHTML = Object.entries(CARDS).map(([id, c]) => owned.has(id)
      ? `<div class="card"><div class="card-emoji">${c.emoji}</div><div class="card-title">${c.title}</div><div class="card-world">${c.world}</div><ul>${c.lines.map((l) => `<li>${l}</li>`).join('')}</ul></div>`
      : `<div class="card locked"><div class="card-emoji">?</div><div class="card-title">???</div><div class="card-world">${c.world}</div><p>Clear this world to collect this sticker!</p></div>`).join('');
    this.el.book.classList.remove('hidden');
    this.keyHandler = (e) => { if (['Escape', 'KeyB', 'Space', 'Enter', 'KeyE'].includes(e.code)) { this.closeBook(); return true; } return false; };
  }
  closeBook() {
    if (this.el.book.classList.contains('hidden')) return;
    this.el.book.classList.add('hidden');
    this.keyHandler = null;
    this.popModal();
  }
}

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

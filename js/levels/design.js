import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere } from '../toon.js';
import { makeFace } from '../creatures.js';
import { makeSpark } from '../creatures2.js';
import { makePalette, makeEasel, makeBlandy, makeRecipeCard } from '../creatures3.js';
import { Boss } from '../boss.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';

// BONUS WORLD - DESIGN STUDIO
// Lessons (from "A Complete Guide to the New Claude Design" and
// "Claude Design Just Unlocked AI Motion Graphics", both by Futurepedia):
//   open it from the Claude sidebar (Design) or claude.ai/design; any paid plan, usage is bundled into your Claude usage;
//   lots of templates (slides, mobile app, document, wireframe, animation, UI mockup, resume, 3D object, email, flyer...);
//   Claude has design tendencies, so steer it with a DESIGN SYSTEM (your brand's style + voice guide), best made first,
//   from GitHub / Figma / your own assets + notes; edit anything in it manually or by asking Claude;
//   it usually asks questions first; ask for 2-3 hero options -> tweaks panel; inline edits (words, size, font, spacing)
//   with no prompt needed, annotate / draw, "add a bunch of tweaks"; Share -> send to Claude Code (copy the prompt or
//   download the zip) when it needs a database or payments;
//   slides export as editable PowerPoint / PDF or straight to Canva; on-brand documents; 3D exports 3D formats;
//   animations are real code (HTML = structure, CSS = styling, JS = motion), so edits are precise;
//   an image reference gets recreated with code; multiple references keep one generation consistent, a design system
//   keeps style across generations; an SRT transcript syncs animations to your words; use text minimally,
//   leave the right third open for a talking head; refer to sections by Claude's titles; Share -> Video -> 1080p MP4.
// Boss: Blandy the Beige Blob, who makes every design look like everyone else's.

const TEMPLATES = [
  { key: 'slides', name: 'Slides', icon: '📽️', color: 0xff8f6b, tip: 'Slides: on-brand decks with speaker notes. Export as editable PowerPoint or PDF, or straight to Canva!' },
  { key: 'mobile', name: 'Mobile App', icon: '📱', color: 0x7fb4ff, tip: 'Mobile app design: the video made a calm meditation app from one prompt.' },
  { key: 'doc', name: 'Document', icon: '📄', color: 0xffd166, tip: 'Documents: annual reports, invoices, contracts, forms… all on brand.' },
  { key: 'anim', name: 'Animation', icon: '🎬', color: 0xb79cf0, tip: 'Animation: motion graphics from a prompt. It feels like a whole feature of its own!' },
  { key: '3d', name: '3D Object', icon: '🧊', color: 0x7fd6c2, tip: '3D objects, even with sliders! You can export them in different 3D asset formats.' },
];
const PINK = { top: 0xffd6ea, side: 0xc9b6a0 };
const BEIGE = 0xe9dfcf;

export class DesignStudio extends Level {
  build() {
    this.env({ top: '#ffc2e0', bottom: '#fff6fb', fog: 0xfff0f7, sun: 1.45 });
    this.clouds(16, 90, 6, -40);
    const ui = this.game.ui;
    ui.speakers.pip = { name: 'Pip the Palette', color: '#d9578f', svg: blobSVG('#ffb3d1'), pitch: 1.35 };
    ui.speakers.design = { name: 'Claude Design', color: '#e07a5f', svg: blobSVG('#ffb36b'), pitch: 1.4 };
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.blandy = { name: 'Blandy the Beige Blob', color: '#8a7d6a', svg: blobSVG('#d8cbb8'), pitch: 0.8 };
    this.stage = 'pip';
    this.templates = new Set();
    this.paths = {};
    const P = (o) => this.platform({ ...PINK, ...o });

    // ---- the gallery plaza ----
    const G = [0, 0, 0, 12];
    P({ x: 0, y: 0, z: 0, r: 12, h: 2.5, top: 0xffe3f0 });
    this.decorate(0, 0, 0, 12, { trees: 2, flowers: 22, flowerColors: [0xff8fb1, 0xffd166, 0xb79cf0, 0x7fb4ff], avoid: [[0, -4, 3], [-7, 2, 2], [7, 3, 2], [0, 8, 3], [-4, -8, 2], [4, -8, 2]] });
    this.spawn.set(0, 0.1, 8);
    this.checkpoint(0, 0, 4, 10);
    this.label('★ Design Studio', 0, 6.5, -7, { size: 0.8, border: '#ff7aa6' });
    this.add(makePalette(), 0, 0, -4);
    this.solids.push({ shape: 'cyl', x: 0, z: -4, r: 0.6, top: 1.8, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(V(0, 0, -4), 2.4, 'Talk to Pip', () => this.pipTalk());
    // template easels: two on the plaza, three up on little gallery ledges
    const spots = [[-7, 0, 2], [7, 0, 3], [-9, 1.4, -6], [9, 1.4, -6], [0, 2.2, -11]];
    this.easels = TEMPLATES.map((t, i) => {
      const [x, y, z] = spots[i];
      if (y > 0) this.platform({ shape: 'box', x, y, z, w: 2.6, d: 2.6, h: 1, ...PINK });
      const e = makeEasel(t.color);
      e.rotation.y = Math.atan2(-x, 8 - z);
      this.add(e, x, y, z);
      const lab = this.label(`${t.icon} ${t.name}`, x, y + 2.5, z, { size: 0.26 });
      lab.visible = false;
      const glow = mesh(sphere(0.28), toon(t.color, { emissive: t.color, emissiveIntensity: 0.5 }), { outline: 1.08 });
      glow.userData.update = (tt) => { glow.position.y = y + 2.0 + Math.sin(tt * 2 + i) * 0.12; };
      this.add(glow, x + 0.8, y + 2.0, z);
      glow.visible = false;
      this.trigger(x, y, z, 1.5, () => this.getTemplate(t, glow, lab), { once: false });
      return { glow, lab };
    });
    this.star(-1.2, 3.0, -11);
    this.tokenTot(-3, 0, 5, 'x', 2.5, 1.5, makeSpark);

    // ---- brand booth: the design system ----
    const S = [10, 2.5, -20, 4.5];
    this.S = S;
    this.paths.booth = this.stones(G, S, 2, { hidden: true, ...PINK, top: 0xffb3d1 });
    this.boothPlat = P({ x: S[0], y: S[1], z: S[2], r: S[3], top: BEIGE });
    this.checkpoint(S[0], S[1], S[2], 4);
    this.makeBooth(S[0], S[1], S[2] - 1.5);
    this.star(S[0] + 3, S[1] + 1, S[2] + 1.5);

    // ---- mockup monitor: UI mockup + tweaks ----
    const M = [0, 5, -32, 4.5];
    this.paths.mockup = this.stones(S, M, 2, { hidden: true, ...PINK });
    P({ x: M[0], y: M[1], z: M[2], r: M[3] });
    this.checkpoint(M[0], M[1], M[2], 4);
    this.makeMonitor(M[0], M[1], M[2] - 1.6);
    // three "hero" variants that pop up after Claude's questions
    this.heroes = [[-3.6, 0xff8fb1, 'A'], [0, 0xffd166, 'B'], [3.6, 0x7fb4ff, 'C']].map(([dx, c, n]) => {
      const card = makeRecipeCard(c);
      card.scale.setScalar(0.75);
      this.add(card, M[0] + dx, M[1] + 3.6, M[2] + 1.6);
      const lab = this.label(`Hero ${n}`, M[0] + dx, M[1] + 4.6, M[2] + 1.6, { size: 0.26 });
      card.visible = false; lab.visible = false;
      return { card, lab };
    });
    this.tokenTot(M[0] + 1.5, M[1], M[2] + 2, 'x', 1.6, 1.7, makeSpark);

    // ---- deck & docs desk ----
    const D = [-11, 7, -40, 4];
    this.paths.deck = this.stones(M, D, 1, { hidden: true, ...PINK });
    P({ x: D[0], y: D[1], z: D[2], r: D[3] });
    this.checkpoint(D[0], D[1], D[2], 3.5);
    this.makeDeckDesk(D[0], D[1], D[2] - 1.2);
    this.star(D[0] - 2.5, D[1] + 1, D[2] + 2);

    // ---- animation stage ----
    const A = [-4, 9.5, -52, 4.5];
    this.paths.stage = this.stones(D, A, 1, { hidden: true, ...PINK });
    P({ x: A[0], y: A[1], z: A[2], r: A[3], top: 0xe7dcff });
    this.checkpoint(A[0], A[1], A[2], 4);
    this.makeStage(A[0], A[1], A[2] - 1.6);
    this.tokenTot(A[0] - 1.5, A[1], A[2] + 2, 'x', 1.6, 1.8, makeSpark);

    // ---- keyframe stones (HTML / CSS / JS) up to the gate ----
    const Q = [-4, 12, -68, 3.4];
    this.keyframes = this.stones(A, Q, 3, { hidden: true, r: 1.1, top: BEIGE, side: 0xc9b6a0 });
    P({ x: Q[0], y: Q[1], z: Q[2], r: Q[3] });
    this.checkpoint(Q[0], Q[1], Q[2], 3);
    this.gate = this.fogGate(Q[0], Q[1], -71.9, 9, { color: 0xff9ecf });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());

    // ---- arena: a giant blank canvas ----
    this.arena = { x: -4, y: 12, z: -86, r: 13 };
    P({ x: -4, y: 12, z: -86, r: 13, h: 3, top: 0xfffaf3, side: 0xe9b98f });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const e = makeEasel([0xff8fb1, 0xffd166, 0x7fb4ff, 0x8fd694, 0xb79cf0, 0xff8f6b][i]);
      e.scale.setScalar(1.6);
      e.rotation.y = a + Math.PI;
      this.add(e, -4 + Math.sin(a) * 12.2, 12, -86 + Math.cos(a) * 12.2);
    }
    this.trigger(-4, 12, -86, 10.5, () => this.startBoss());
    this.killY = -12;
    this.setObj();
  }

  // ----- props -----
  makeBooth(x, y, z) {
    const g = new THREE.Group();
    const loom = mesh(new THREE.BoxGeometry(2.6, 2.2, 0.25), 0xfffaf3, { outline: 1.04 });
    loom.position.y = 1.6;
    const frame = mesh(new THREE.BoxGeometry(2.9, 0.25, 0.4), 0xd9578f);
    frame.position.y = 2.8;
    const face = makeFace({ eyeR: 0.13, spacing: 0.3 });
    face.position.set(0, 1.9, 0.14);
    this.swatches = [];
    [0xff8fb1, 0xffd166, 0x7fb4ff, 0x8fd694, 0xb79cf0].forEach((c, i) => {
      const s = mesh(new THREE.BoxGeometry(0.38, 0.38, 0.06), toon(0xcfc4b3));
      s.position.set(-0.96 + i * 0.48, 1.05, 0.15);
      s.userData.color = c;
      g.add(s); this.swatches.push(s);
    });
    g.add(loom, frame, face);
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 1.2, top: y + 2.9, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('🎨 Brand Booth', x, y + 3.6, z, { size: 0.34, border: '#d9578f' });
    this.interact(V(x, y, z), 2.6, 'Build a design system', () => this.boothTalk());
  }

  makeMonitor(x, y, z) {
    const g = new THREE.Group();
    const screen = mesh(new THREE.BoxGeometry(2.8, 1.7, 0.2), 0x5b3b5e, { outline: 1.04 });
    screen.position.y = 2.0;
    const glass = mesh(new THREE.PlaneGeometry(2.5, 1.4), toon(0xffe3f0, { emissive: 0x663344, emissiveIntensity: 0.3 }));
    glass.position.set(0, 2.0, 0.11);
    const face = makeFace({ eyeR: 0.13, spacing: 0.3 });
    face.position.set(0, 2.0, 0.13);
    const stand = mesh(new THREE.CylinderGeometry(0.12, 0.4, 1.1, 10), 0xd9578f);
    stand.position.y = 0.55;
    g.add(screen, glass, face, stand);
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 0.6, top: y + 2.9, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('🖥️ Mockup Monitor', x, y + 3.5, z, { size: 0.34, border: '#d9578f' });
    this.interact(V(x, y, z), 2.6, 'Design a website', () => this.mockupTalk());
  }

  makeDeckDesk(x, y, z) {
    const g = new THREE.Group();
    const top = mesh(new THREE.BoxGeometry(2.4, 0.2, 1.2), 0xd9a07a, { outline: 1.04 });
    top.position.y = 1;
    for (const [lx, lz] of [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]]) {
      const l = mesh(new THREE.BoxGeometry(0.15, 1, 0.15), 0xb07a5a);
      l.position.set(lx, 0.5, lz);
      g.add(l);
    }
    for (let i = 0; i < 3; i++) {
      const sl = mesh(new THREE.BoxGeometry(0.9, 0.55, 0.05), [0xff8f6b, 0xffd166, 0xfffaf3][i], { outline: 1.06 });
      sl.position.set(-0.7 + i * 0.7, 1.45 + i * 0.05, -0.2 + i * 0.1);
      sl.rotation.set(-0.25, 0, (i - 1) * 0.15);
      g.add(sl);
    }
    g.add(top);
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 1.2, top: y + 1.1, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('📽️ Deck & Docs', x, y + 2.7, z, { size: 0.34, border: '#ff8f6b' });
    this.interact(V(x, y, z), 2.6, 'Make slides and docs', () => this.deckTalk());
  }

  makeStage(x, y, z) {
    const g = new THREE.Group();
    const screen = mesh(new THREE.BoxGeometry(3.2, 1.9, 0.15), 0xfffaf3, { outline: 1.04 });
    screen.position.y = 2.2;
    const bar = mesh(new THREE.BoxGeometry(3.2, 0.12, 0.17), 0xb79cf0);
    bar.position.y = 1.35;
    const head = mesh(new THREE.BoxGeometry(0.06, 0.3, 0.2), 0xff3b5c);
    head.position.set(-1.5, 1.35, 0.05);
    this.playhead = head;
    const face = makeFace({ eyeR: 0.13, spacing: 0.3 });
    face.position.set(0, 2.3, 0.09);
    // three little motion dots that dance once the animation is built
    this.motionDots = [0xff8fb1, 0xffd166, 0x7fb4ff].map((c, i) => {
      const d = mesh(sphere(0.16), toon(c));
      d.position.set(-0.8 + i * 0.8, 1.7, 0.1);
      g.add(d);
      return d;
    });
    const legs = [-1.3, 1.3].map((lx) => { const l = mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 8), 0xb79cf0); l.position.set(lx, 0.65, 0); return l; });
    g.add(screen, bar, head, face, ...legs);
    g.userData.update = (t) => {
      if (this.animating) {
        head.position.x = -1.5 + ((t * 0.6) % 1) * 3;
        this.motionDots.forEach((d, i) => { d.position.y = 1.9 + Math.abs(Math.sin(t * 3 + i)) * 0.6; });
      }
    };
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 1.4, top: y + 3.2, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('🎬 Animation Stage', x, y + 3.9, z, { size: 0.34, border: '#b79cf0' });
    this.interact(V(x, y, z), 2.8, 'Make a motion graphic', () => this.stageTalk());
  }

  // ----- story -----
  async pipTalk() {
    const ui = this.game.ui;
    if (this.stage === 'pip') {
      await ui.say([
        ['pip', 'Hiii {name}! I’m Pip the Palette! Welcome to the bonus world: the <b>Design Studio</b>! ✨'],
        ['pip', '<b>Claude Design</b> is how you <b>CREATE</b>: prototypes, websites, slide decks, documents, even motion graphics. No design tools needed!'],
        ['pip', 'To open it, click <b>Design</b> in the Claude sidebar (in the desktop app too), or go to <b>claude.ai/design</b>. Any paid Claude plan has it.'],
        ['pip', 'And good news: the usage is now bundled into your normal Claude usage, so you won’t run out super fast like people used to!'],
        ['pip', 'You can type anything into the prompt box, but most of the time you start from a <b>template</b>. Five of them are on the easels around my gallery. Go look at each one!'],
      ]);
      this.stage = 'templates';
      this.easels.forEach((e) => { e.glow.visible = true; e.lab.visible = true; });
    } else if (this.stage === 'templates' && this.templates.size < 5) {
      await ui.say(['pip', `Visit every template easel! The glowing dots show where they are. (${this.templates.size}/5)`]);
    } else if (this.stage === 'templates') {
      await ui.say([
        ['pip', 'You saw them all! There are even more: wireframes, UI mockups, resumes, research reports, HTML emails, flyers, color + type pairings, diagrams…'],
        ['pip', 'But did you notice? Everything kinda looks the same. Claude has its own <b>design tendencies</b>. If you don’t steer it, your design looks like what everyone else makes…'],
        ['pip', 'Uh-oh. That’s how <b>Blandy the Beige Blob</b> got so strong. Look, the booth up there has gone all beige! Hop up to the <b>Brand Booth</b>!'],
      ]);
      this.stage = 'booth';
      this.paths.booth.forEach((s, i) => this.reveal(s, 200 + i * 300));
    } else {
      await ui.say(['pip', 'Go go go! Make the studio colorful again! 🎨']);
    }
    this.setObj();
  }

  getTemplate(t, glow, lab) {
    if (this.stage !== 'templates' || this.templates.has(t.key)) return;
    this.templates.add(t.key);
    glow.visible = false;
    Sfx.good();
    this.game.fx.burst(this.scene, glow.position, t.color, 14);
    this.game.ui.toast(`${t.icon} Template: <b>${t.name}</b> (${this.templates.size}/5)<br><small>${t.tip}</small>`, 3800);
    if (this.templates.size === 5) this.game.ui.toast('All five templates! Go tell Pip. 🎨', 2600);
    this.setObj();
  }

  async boothTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'booth') {
      await ui.say(['sparky', ['pip', 'templates'].includes(this.stage) ? 'This booth is all beige… let’s look at the templates first.' : 'Our Pastel Pop design system is ready! 🎨']);
      return;
    }
    await ui.say(['sparky', 'The best way to steer Claude away from its default look is a <b>design system</b>: your brand’s style and voice guide. Make it once and every design uses it!']);
    await this.play('Feed the Brand Booth', [
      ['🐙 GitHub', 'Link your existing code…'],
      ['🖼️ Figma', '…or upload a Figma file…'],
      ['📷 Your assets', '…or your own images, logos and website…'],
      ['📝 Notes', '…plus notes to guide it.'],
    ], { mode: 'ring' });
    await ui.say(['jesi', 'I’ll drop in my mood board and add a note: “Soft pastels, rounded shapes, friendly and playful.” I’ll call it Pastel Pop!']);
    await ui.say(['design', 'Continue to generation… Working on it! This takes a few minutes. ✨']);
    for (let i = 0; i < this.swatches.length; i++) {
      const s = this.swatches[i];
      s.material = toon(s.userData.color, { emissive: s.userData.color, emissiveIntensity: 0.3 });
      this.game.fx.burst(this.scene, V(this.S[0] - 0.96 + i * 0.48, this.S[1] + 1.1, this.S[2] - 1.3), s.userData.color, 8);
      Sfx.pop();
      await this.wait(300);
    }
    this.boothPlat.mesh.children[0].material = toon(0xffd6ea);
    await ui.say([
      ['design', 'Your design system is ready! Brand, voice and tone, color palettes, type, buttons, badges, icons, a wordmark, a slide style…'],
      ['jesi', 'It made a whole brand book from one mood board!'],
    ]);
    await this.play('Polish the wordmark', [['🖊️ Edit anything', 'Upload your real logo, edit by hand, or <b>ask Claude</b> for changes.']], { mode: 'chase' });
    await ui.say(['pip', 'Color is coming back! Now let’s USE it. Hop over to the <b>Mockup Monitor</b> and make a website!']);
    this.stage = 'mockup';
    this.paths.mockup.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async mockupTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'mockup') {
      await ui.say(['sparky', ['deck', 'stage', 'gate', 'boss', 'done'].includes(this.stage) ? 'Our website is designed and sent to Claude Code! 🖥️' : 'We need a design system first!']);
      return;
    }
    await ui.say(['sparky', 'Pick the <b>UI mockup</b> template, select our <b>Pastel Pop</b> design system, and give it a simple prompt: “Create a website for my plushie shop with a homepage, shop and about page.”']);
    await ui.say([
      ['design', 'Before I start: how many options would you like for the homepage hero?'],
      ['jesi', 'Two or three, so I can compare them!'],
    ]);
    for (const h of this.heroes) { h.card.visible = true; h.lab.visible = true; this.game.fx.burst(this.scene, h.card.position, 0xffffff, 8); Sfx.pop(); await this.wait(300); }
    await ui.say(['design', 'Done! The <b>tweaks</b> panel lets you try each hero. The last one you touch is the one we keep!']);
    const hero = await this.play('Try the hero designs', [
      ['Hero A', 'Flip between options in the <b>tweaks</b> panel…', 0xff8fb1],
      ['Hero B', '…compare how each one feels…', 0xffd166],
      ['Hero C', '…and keep your favorite.', 0x7fb4ff],
    ], { mode: 'high' });
    this.heroes.forEach((h, i) => { if (i !== hero) { h.card.visible = false; h.lab.visible = false; } });
    await this.play('Finish the website', [
      ['✏️ Inline edit', 'Fix words, size, font or spacing by <b>selecting them</b>. No prompt needed!'],
      ['🖍️ Annotate', 'Or draw right on the design to show what you mean.'],
      ['🎛️ More tweaks', 'Ask for “a bunch of different tweaks” to play with.'],
      ['📦 Send to Code', 'Needs a database or payments? <b>Share → Send to Claude Code</b> (copy the prompt or download the zip).'],
    ], { mode: 'ring' });
    await ui.say(['pip', 'Designed in Design, built in Code. Perfect teamwork! Next stop: the <b>Deck & Docs</b> desk.']);
    this.stage = 'deck';
    this.paths.deck.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async deckTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'deck') {
      await ui.say(['sparky', ['stage', 'gate', 'boss', 'done'].includes(this.stage) ? 'Deck exported! 📽️' : 'Let’s finish the website first.']);
      return;
    }
    await ui.say([
      ['sparky', 'Slides are extra nice in Design because they use the <b>same design system</b>, so the deck matches the website!'],
      ['design', 'Here’s your on-brand deck, with speaker notes. You can do the same inline edits, annotations and tweaks here too.'],
    ]);
    await this.play('Catch the exports', [
      ['📽️ PowerPoint', 'Share as an <b>editable PowerPoint</b>.'],
      ['📄 PDF', 'Or as a <b>PDF</b>.'],
      ['🖌️ Canva', 'Or straight to <b>Canva</b> with a connector.'],
      ['🧾 Documents', 'On-brand invoices, contracts, forms and reports, too.'],
    ], { mode: 'fall' });
    await ui.say(['pip', 'Now my FAVORITE: the <b>Animation Stage</b>. The video’s creator uses it in every one of their videos!']);
    this.stage = 'stage';
    this.paths.stage.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async stageTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'stage') {
      await ui.say(['sparky', ['gate', 'boss', 'done'].includes(this.stage) ? 'Our motion graphic is exported! 🎬' : 'The stage isn’t ready yet.']);
      return;
    }
    await ui.say([
      ['sparky', 'Pick the <b>Animation</b> template and type: “Animate a visual explanation of how a design system works.”'],
      ['design', 'Quick questions: Who’s it for? How long? What aspect ratio?'],
      ['jesi', 'Designers, 30 seconds, 16:9!'],
      ['design', 'Generating… and you can watch it build live!'],
    ]);
    await ui.say(['sparky', 'Here’s the secret: Claude isn’t making a video file. It writes real <b>code</b>! Three kinds work together. Grab each one and watch the steps behind the stage!']);
    await this.play('Build the animation', [
      ['🧱 HTML', '<b>Structure</b>: what’s on screen. The keyframe steps appear!'],
      ['🎨 CSS', '<b>Styling</b>: colors, fonts and looks. Now they have style!'],
      ['✨ JavaScript', '<b>Motion</b>: what moves and when. Now they MOVE!'],
    ], { mode: 'trail', onGet: (i) => {
      const k = this.keyframes[i];
      if (i === 0) this.keyframes.forEach((s, j) => this.reveal(s, 150 + j * 200));
      if (i === 1) this.keyframes.forEach((s) => (s.mesh.children[0].material = toon(0xff9ecf)));
      if (i === 2) { this.mover(this.keyframes[1], V(1.6, 0, 0), 3.5, -this.t); this.animating = true; }
      this.game.fx.burst(this.scene, k.mesh.position.clone().add(V(0, 0.5, 0)), 0xff9ecf, 10);
    } });
    await this.play('Polish and export', [
      ['✏️ Precise edits', 'It’s code, so asking for a change changes <b>just that part</b>.'],
      ['🎙️ SRT transcript', 'Timestamps sync the graphics to <b>your words</b>.'],
      ['🧍 Leave space', 'Ask for minimal text, with the right third open for a <b>talking head</b>.'],
      ['📤 Export', '<b>Share → Video → 1080p MP4</b>.'],
    ], { mode: 'fall' });
    await ui.say([
      ['sparky', 'One more pro tip: one reference image gets <b>recreated with code</b>, not just wiggled. Several images keep ONE animation consistent, and a <b>design system</b> keeps the style across ALL of them.'],
      ['pip', 'The keyframe steps are dancing! Ride them up to Gumdrop. Blandy is waiting on the big blank canvas…'],
    ]);
    this.stage = 'gate';
    this.setObj();
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.stage !== 'gate') { await ui.say(['gum', 'Hiya! Finish your designs first! 🍬']); return; }
    await ui.say(['gum', 'Ooh, pretty! Catch my candies. Past this gate is <b>Blandy the Beige Blob</b>. Blandy wants every design to look the same…']);
    await this.gateCandies([
      ['🎨 Find it', '<b>Design</b> in the Claude sidebar, or claude.ai/design.'],
      ['🧵 System first', 'A design system steers Claude away from its default look.'],
      ['🛠️ Ship it', 'Payments or a database? <b>Send it to Claude Code</b>.'],
    ]);
    await ui.say(['gum', 'Gorgeous! Go paint that blob! 🎨']);
    this.gate.openGate();
    this.setObj();
  }

  // ----- boss: Blandy the Beige Blob -----
  async startBoss() {
    const ui = this.game.ui, A = this.arena;
    this.spawn.set(A.x, A.y + 0.1, A.z + 10.5);
    this.stage = 'boss';
    const blob = makeBlandy();
    this.boss = new Boss(this, {
      name: 'Blandy the Beige Blob', model: blob, arena: A, hp: 3, radius: 2.4, height: 4.6, speaker: 'blandy',
      attacks: ['hop', 'spit', 'bubbles', 'rain'], perDizzy: 2, chase: 1.4, shotColor: 0xd8cbb8, rainColor: 0xe9dfcf, ringColor: 0xbfae96,
      padLabel: 'Design System Pad', padColor: 0xff9ecf,
      tips: [
        'A <b>design system</b> keeps everything on brand.',
        'Claude Design comes with any <b>paid plan</b>.',
        'Ask for <b>2–3 options</b> and flip between them in the tweaks panel.',
        'Animations are real code: <b>HTML, CSS and JavaScript</b>.',
        'A reference image gets <b>recreated with code</b>.',
        'Edit an animation in plain words, naming the section by its <b>title</b>.',
        'Export slides as <b>PowerPoint, PDF or to Canva</b>.',
      ],
      lines: {
        hit: ['Hey! Those are… COLORS?! Get that design system off me!', 'Stop it! Rounded corners?! A brand VOICE?! I’m becoming… interesting!'],
      },
      onUpdate: (b) => { const k = 1 - b.hp / b.maxHp; blob.userData.mat.color.setHex(0xd8cbb8).lerp(new THREE.Color(0xff9ecf), k); },
      onDefeat: () => this.bossDefeated(),
    });
    this.game.player.frozen = true;
    this.game.sparkyOverride = V(A.x + 2, A.y + 3, A.z + 8);
    await this.wait(500);
    ui.banner('Blandy the Beige Blob', 'BONUS BOSS');
    await this.wait(1200);
    await ui.say([
      ['blandy', 'Ugh. Colors. Personality. So… much… effort. Why not just use the default look? Everybody else does.'],
      ['blandy', 'I’ll roll everything in beige. Same fonts. Same layout. Same, same, SAME!'],
      ['sparky', 'It <b>hops</b>, spits <b>paint blobs</b>, blows <b>bubbles</b> and makes it <b>rain beige</b>! When it gets dizzy, step on the <b>Design System Pad</b>!'],
    ]);
    this.game.sparkyOverride = null;
    this.game.player.frozen = false;
    this.boss.begin();
    this.setObj();
  }

  tick(dt, t) {
    if (this.boss) this.boss.update(dt, t);
  }
  onDefeat() { if (this.boss) this.boss.reset(); }

  async bossDefeated() {
    const ui = this.game.ui;
    await ui.say([
      ['blandy', 'Whoa… I’m… PINK. And I have a brand voice. And it’s… kinda fun?'],
      ['blandy', 'Maybe I’ll make my own design system. “Blandy: Now in Color.” Thanks, {name}. 🎨'],
      ['pip', 'The Design Studio is full of color again! Remember: start with a <b>design system</b>, iterate with tweaks and inline edits, and send it to Code when it’s time to ship!'],
    ]);
    this.stage = 'done';
    const A = this.arena;
    this.portal(A.x, A.y, A.z + 2, 0xff9ecf);
    this.trigger(A.x, A.y, A.z + 2, 1.3, () => this.game.completeWorld('design', ['claudeDesign', 'motionGraphics']));
    this.setObj();
  }

  setObj() {
    const ui = this.game.ui, s = this.stage;
    if (s === 'pip') ui.setObjective('Talk to Pip the Palette');
    else if (s === 'templates' && this.templates.size < 5) ui.setObjective(`Visit the template easels (${this.templates.size}/5)`);
    else if (s === 'templates') ui.setObjective('Tell Pip you saw every template');
    else if (s === 'booth') ui.setObjective('Build a design system at the Brand Booth');
    else if (s === 'mockup') ui.setObjective('Design a website at the Mockup Monitor');
    else if (s === 'deck') ui.setObjective('Make slides at the Deck & Docs desk');
    else if (s === 'stage') ui.setObjective('Make a motion graphic at the Animation Stage');
    else if (s === 'gate' && !this.gate.open) ui.setObjective('Ride the keyframes up to Gumdrop');
    else if (s === 'gate') ui.setObjective('Cross to the big blank canvas… something beige is waiting');
    else if (s === 'boss') ui.setObjective('Dodge Blandy. When it’s dizzy, step on the Design System Pad!');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Design Studio', 'Bonus World');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'The Design Studio! Both videos showed how to make gorgeous things with Claude Design. You’re a designer, so this one’s for YOU!'],
      ['sparky', 'Let’s find Pip!'],
    ]);
  }
}

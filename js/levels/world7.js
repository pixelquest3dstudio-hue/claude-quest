import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere } from '../toon.js';
import { makeFace } from '../creatures.js';
import { makeRobotCat, makeTower } from '../creatures2.js';
import { makeBug, makeRocket, makeBook, makeVagueKing } from '../creatures3.js';
import { Boss } from '../boss.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';
import { WORLDS } from '../data.js';
import { isWatched } from '../theater.js';

// WORLD 7 - CODE CLOUD CASTLE (+ the FINAL BOSS)
// Lessons (from "From Zero to Claude Code in 19 Minutes (no code)" by Futurepedia):
//   anyone can build apps, sites, games, extensions with no code; paid plan + desktop app -> Code tab;
//   Code creates and edits files on your computer, so it needs a folder (a dedicated folder with a subfolder per project);
//   PLAN MODE first (adjust the plan before building); it asks questions; it tests itself and corrects course (agentic);
//   iterate in plain words, screenshots help, ask questions and it explains instead of building;
//   models: plan & first build with the top model, follow-up edits with a lighter one (Pro plan);
//   /init creates CLAUDE.md (permanent project memory); context window = working memory -> summary + fresh chat;
//   MCPs = connectors (Context7 for up-to-date docs), plugins (Superpowers), skills (security review before going public);
//   deploy: Git -> GitHub (version control, like an undo button) -> Vercel (redeploys automatically).
// The Vague King is sealed behind the Grand Lesson: "Full Claude Code Tutorial for Non-Technical Beginners" (Futurepedia),
//   which adds: one change at a time, never paste API keys in the chat (.env.local, which git ignores),
//   usage resets every 5 hours (+ weekly cap), plan with Opus / iterate with Sonnet, parallel sessions,
//   drop assets into the project folder, ask "anything else before going live?", add env variables in Vercel.

export class World7 extends Level {
  build() {
    this.env({ top: '#b9c2ff', bottom: '#fdf0ff', fog: 0xf1ecff, sun: 1.45 });
    this.clouds(22, 100, 2, -45);
    const ui = this.game.ui;
    ui.speakers.cody = { name: 'Cody the Builder Bot', color: '#6b74d6', svg: blobSVG('#a0a8ff'), pitch: 1.3 };
    ui.speakers.code = { name: 'Claude Code', color: '#e07a5f', svg: blobSVG('#ffb36b'), pitch: 1.4 };
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.king = { name: 'The Vague King', color: '#7a7090', svg: blobSVG('#b9b3c9'), pitch: 0.55 };
    this.stage = 'cody';
    const style = { top: 0xd9dcff, side: 0xf3eaff };
    const P = (o) => this.platform({ ...style, ...o });

    // ---- cloud gate ----
    P({ x: 0, y: 0, z: 0, r: 12, h: 2.5, top: 0xe6e8ff });
    this.decorate(0, 0, 0, 12, { trees: 2, flowers: 20, flowerColors: [0xa0a8ff, 0xffffff, 0xff9ecf], leaf: 0xb9c2ff, avoid: [[0, -4, 3], [6, -6, 3], [0, 8, 3], [-7, -5, 3]] });
    this.spawn.set(0, 0.1, 8);
    this.checkpoint(0, 0, 4, 10);
    this.label('Code Cloud Castle', 0, 6.5, -8, { size: 0.8, border: '#a0a8ff' });
    this.add(makeRobotCat(0xa0a8ff), 0, 0, -4);
    this.solids.push({ shape: 'cyl', x: 0, z: -4, r: 0.55, top: 2, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(V(0, 0, -4), 2.4, 'Talk to Cody', () => this.codyTalk());
    this.makeBlueprint(6, 0, -6);
    this.star(-9, 1, 2);
    // a castle silhouette far away
    for (const [x, z, s] of [[-30, -110, 2.2], [-12, -118, 2.8], [8, -112, 2.2]]) {
      const t = makeTower(0xa0a8ff);
      t.scale.setScalar(s);
      this.add(t, x, -4, z);
    }

    // ---- plan bridge (ghost blueprint platforms) to the bug garden ----
    const B = [0, 3, -24, 6];
    this.paths = {};
    this.paths.plan = this.stones([0, 0, 0, 12], B, 2, { hidden: true, ...style, top: 0x9be7ff });
    P({ x: B[0], y: B[1], z: B[2], r: B[3], top: 0xc9f0c0 });
    this.checkpoint(B[0], B[1], B[2], 5);
    this.label('🐞 Bug Garden (testing!)', B[0], B[1] + 4, B[2] - 4, { size: 0.36, border: '#ff5c6b' });
    this.bugs = [
      this.tokenTot(-2.5, B[1], B[2] + 1.5, 'x', 1.8, 1.6, makeBug),
      this.tokenTot(2.5, B[1], B[2] - 1.5, 'x', 1.8, 1.9, makeBug),
      this.tokenTot(-1, B[1], B[2] - 3.5, 'z', 1.2, 1.4, makeBug),
      this.tokenTot(3.5, B[1], B[2] + 2.5, 'z', 1.2, 1.7, makeBug),
    ];
    this.bugs.forEach((b) => { b.obj.visible = false; b.alive = false; });

    // ---- iteration station ----
    const I = [12, 5, -34, 4];
    this.paths.iter = this.stones(B, I, 1, { hidden: true, ...style });
    P({ x: I[0], y: I[1], z: I[2], r: I[3] });
    this.checkpoint(I[0], I[1], I[2], 3.5);
    this.makeStation(I[0], I[1], I[2] - 1.2);
    this.star(I[0] + 2.5, I[1] + 1, I[2] + 1.5);

    // ---- CLAUDE.md library ----
    const L = [0, 7, -46, 4.5];
    this.paths.lib = this.stones(I, L, 2, { hidden: true, ...style });
    P({ x: L[0], y: L[1], z: L[2], r: L[3] });
    this.checkpoint(L[0], L[1], L[2], 4);
    this.book = makeBook(0xa0a8ff);
    this.book.scale.setScalar(0.5);
    this.add(this.book, L[0], L[1], L[2] - 1.5);
    this.solids.push({ shape: 'cyl', x: L[0], z: L[2] - 1.5, r: 1, top: L[1] + 0.5, bottom: L[1], enabled: true, delta: V(), noLand: true });
    this.label('📖 CLAUDE.md Library', L[0], L[1] + 3, L[2] - 1.5, { size: 0.36, border: '#a0a8ff' });
    this.interact(V(L[0], L[1], L[2] - 1.5), 2.6, 'Visit the library', () => this.libraryTalk());
    // the high shelf (reached by standing on the grown book)
    this.platform({ shape: 'box', x: L[0], y: L[1] + 3.4, z: L[2] - 5.6, w: 3, d: 2, h: 0.8, ...style });
    this.star(L[0], L[1] + 4.5, L[2] - 5.6);

    // ---- launch pad ----
    const D = [-12, 8, -56, 4.5];
    this.paths.launch = this.stones(L, D, 1, { hidden: true, ...style });
    P({ x: D[0], y: D[1], z: D[2], r: D[3] });
    this.checkpoint(D[0], D[1], D[2], 4);
    this.rocket = makeRocket();
    this.add(this.rocket, D[0], D[1], D[2] - 1.5);
    this.solids.push({ shape: 'cyl', x: D[0], z: D[2] - 1.5, r: 0.9, top: D[1] + 4.3, bottom: D[1], enabled: true, delta: V(), noLand: true });
    this.label('🚀 Deploy Rocket', D[0], D[1] + 5.4, D[2] - 1.5, { size: 0.36, border: '#ff8fb1' });
    this.interact(V(D[0], D[1], D[2] - 1.5), 2.6, 'Launch it live!', () => this.launchTalk());

    // ---- castle courtyard (gate) + throne arena ----
    const Q = [-12, 14, -74, 4];
    P({ x: Q[0], y: Q[1], z: Q[2], r: Q[3], top: 0xe6e8ff });
    this.checkpoint(Q[0], Q[1], Q[2], 3.5);
    this.Q = Q;
    this.gate = this.fogGate(Q[0], Q[1], -77.9, 9, { color: 0xa0a8ff });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());
    this.arena = { x: -12, y: 14, z: -92, r: 13 };
    P({ x: -12, y: 14, z: -92, r: 13, h: 3, top: 0xd9dcff });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const t = makeTower(0xa0a8ff);
      t.scale.setScalar(0.7);
      this.add(t, -12 + Math.cos(a) * 14.5, 11, -92 + Math.sin(a) * 14.5);
    }
    this.trigger(-12, 14, -92, 10.5, () => this.startBoss());
    this.killY = -12;
    this.setObj();
  }

  // ----- props -----
  makeBlueprint(x, y, z) {
    const g = new THREE.Group();
    const table = mesh(new THREE.BoxGeometry(2.6, 0.2, 1.6), 0xd9a07a, { outline: 1.04 });
    table.position.y = 1;
    const leg = mesh(new THREE.CylinderGeometry(0.2, 0.3, 1, 10), 0xb07a5a);
    leg.position.y = 0.5;
    const paper = mesh(new THREE.BoxGeometry(2.3, 0.03, 1.4), toon(0x7fb4ff, { emissive: 0x203060, emissiveIntensity: 0.3 }));
    paper.position.y = 1.12;
    for (let i = 0; i < 4; i++) {
      const l = mesh(new THREE.BoxGeometry(1.8, 0.035, 0.04), 0xffffff);
      l.position.set(0, 1.14, -0.45 + i * 0.3);
      g.add(l);
    }
    g.add(table, leg, paper);
    this.add(g, x, y, z);
    g.rotation.y = -0.5;
    this.solids.push({ shape: 'cyl', x, z, r: 1.2, top: 1.15, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.label('📐 Plan Table', x, 2.6, z, { size: 0.34, border: '#7fb4ff' });
    this.planIt = this.interact(V(x, y, z), 2.6, 'Start a new build', () => this.planTalk());
  }

  makeStation(x, y, z) {
    const g = new THREE.Group();
    const scr = mesh(new THREE.BoxGeometry(2.2, 1.5, 0.2), 0x5b3b5e, { outline: 1.04 });
    scr.position.y = 1.8;
    const glow = mesh(new THREE.PlaneGeometry(1.9, 1.2), toon(0x9be7ff, { emissive: 0x336677, emissiveIntensity: 0.6 }));
    glow.position.set(0, 1.8, 0.11);
    const face = makeFace({ eyeR: 0.12, spacing: 0.25 });
    face.position.set(0, 1.85, 0.13);
    const post = mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.1, 8), 0xa0a8ff);
    post.position.y = 0.55;
    g.add(scr, glow, face, post);
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 0.6, top: y + 1.1, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('🔁 Iteration Station', x, y + 3.2, z, { size: 0.34, border: '#a0a8ff' });
    this.interact(V(x, y, z), 2.4, 'Make some changes', () => this.iterateTalk());
  }

  // ----- story -----
  async codyTalk() {
    const ui = this.game.ui;
    if (this.stage === 'cody') {
      await ui.say([
        ['cody', 'Beep boop, {name}! Welcome to Code Cloud Castle, the last world! I’m Cody, and I build things with <b>Claude Code</b>.'],
        ['cody', 'People think you need to be technical for Claude Code. NOT TRUE! Anyone can build apps, websites, games, Chrome extensions and automations, with no code.'],
        ['cody', 'You need a paid plan and the Claude <b>desktop app</b>. Click the <b>Code</b> tab, type what you want like any prompt, and it builds.'],
        ['cody', 'The big difference from Chat: Claude Code actually <b>creates and edits files on your computer</b>. So first, it needs a folder to work in!'],
      ]);
      await this.play('Tidy the folders', [
        ['📁 Main folder', 'One dedicated <b>Claude Code folder</b>…'],
        ['🗂️ Subfolder', '…with a new <b>subfolder</b> for each project.'],
      ], { mode: 'trail' });
      await ui.say(['cody', 'Tidy! Now head to the <b>Plan Table</b> and let’s build our first thing!']);
      this.stage = 'plan';
    } else if (this.stage === 'plan') {
      await ui.say(['cody', 'The Plan Table is right there with the blue paper!']);
    } else {
      await ui.say(['cody', 'Keep going! Just pick something you’d actually use and build it! Beep!']);
    }
    this.setObj();
  }

  ghost(s, on) {
    s.mesh.visible = on;
    s.mesh.position.y = s.top;
    s.mesh.traverse((o) => {
      if (!o.material || o.userData.outline) return;
      if (!o.userData.mat0) o.userData.mat0 = o.material;
      o.material = on ? new THREE.MeshBasicMaterial({ color: 0x9be7ff, transparent: true, opacity: 0.35, depthWrite: false }) : o.userData.mat0;
    });
  }

  async planTalk() {
    const ui = this.game.ui;
    if (this.stage === 'cody') { await ui.say(['sparky', 'Let’s say hi to Cody first!']); return; }
    if (this.stage !== 'plan') { ui.toast('The plan is already approved! ✅'); return; }
    await ui.say(['sparky', 'Our prompt: “Build me a cloud bridge game that’s visual, gamified and fun!” Before we send it…']);
    await this.play('Switch modes', [['📐 Plan mode', 'Claude lays out the plan first. It’s much easier to adjust a plan than fix a finished build.']], { mode: 'chase' });
    await ui.say([
      ['code', 'Before I make the plan: what visual style should the bridge have?'],
      ['jesi', 'Fluffy clouds!'],
    ]);
    await ui.say(['code', 'Great! Here’s the full plan: gameplay loop, layout, build steps. You can highlight a part and add notes, or accept it.']);
    this.paths.plan.forEach((s) => this.ghost(s, true));
    ui.toast('👻 The plan appears as a see-through blueprint bridge!', 2600);
    await this.wait(900);
    await this.play('Walk into “Accept plan”', [['✅ Accept plan', 'You can add notes to a plan first. Happy with it? Accept, and Claude builds.']], { mode: 'ring' });
    Sfx.good();
    await ui.say(['code', 'Building! I’m creating files, using tools, and… now I’m <b>testing</b> it myself.']);
    this.paths.plan.forEach((s, i) => { this.ghost(s, false); s.mesh.visible = true; s.enabled = true; this.game.fx.burst(this.scene, s.mesh.position.clone().add(V(0, 0.5, 0)), 0x9be7ff, 10); });
    Sfx.portal();
    this.planIt.enabled = false;
    this.bugs.forEach((b) => { b.obj.visible = true; b.alive = true; });
    await ui.say([
      ['code', 'Uh-oh, my testing found some bugs in the garden! I need to correct course…'],
      ['sparky', 'That’s what makes it <b>agentic</b>: it tests, finds problems and fixes them all on its own, before it hands you the result. Let’s help! Stomp the 4 bugs!'],
    ]);
    this.stage = 'bugs';
    this.setObj();
  }

  async bugsDone() {
    const ui = this.game.ui;
    await ui.say([
      ['code', 'Bugs fixed, tested again, and everything works! Here’s your game! ✨'],
      ['jesi', 'From a two-sentence prompt and a few answers. That’s wild!'],
      ['sparky', 'Now we <b>iterate</b>! The Iteration Station is across those clouds.'],
    ]);
    this.stage = 'iterate';
    this.paths.iter.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async iterateTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'iterate') { await ui.say(['sparky', ['lib', 'launch', 'gate', 'boss', 'done'].includes(this.stage) ? 'Iterating like a pro! 🔁' : 'Not yet! Let’s finish the build first.']); return; }
    await this.play('Ship your changes', [
      ['1️⃣ One at a time', 'Send <b>one change at a time</b>, so if something breaks you know why.'],
      ['📸 Show it', 'Easier to show? Drop a <b>screenshot</b> into the chat.'],
      ['💬 Just ask', 'Ask a question and Claude <b>explains</b> instead of building.'],
      ['🦉 Pick the model', 'Top model for the plan and first build, a lighter one for follow-up edits.'],
    ], { mode: 'fall' });
    await ui.say(['cody', 'You iterate like a pro! Next: give your project a <b>memory</b>. To the CLAUDE.md Library!']);
    this.stage = 'lib';
    this.paths.lib.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async libraryTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'lib') { await ui.say(['sparky', ['launch', 'gate', 'boss', 'done'].includes(this.stage) ? 'Our CLAUDE.md is safe and sound! 📖' : 'The library is closed for now.']); return; }
    await ui.say(['sparky', 'Claude Code needs a permanent reference file for the project: the rules, the tech stack, the important stuff. That’s a <b>CLAUDE.md</b> file!']);
    await this.play('Type the magic command', [['⌨️ /init', 'Type <b>/init</b> and Claude reads the code and chat, then writes the CLAUDE.md file.']], { mode: 'chase' });
    // the book grows into a platform you can stand on
    const b = this.book, start = performance.now();
    await new Promise((res) => { const a = () => { const k = Math.min(1, (performance.now() - start) / 700); b.scale.setScalar(0.5 + k * 1.0); if (k < 1) requestAnimationFrame(a); else res(); }; a(); });
    const L = [0, 7, -46];
    this.solids.push({ shape: 'box', min: V(L[0] - 1.8, L[1], L[2] - 1.5 - 2.25), max: V(L[0] + 1.8, L[1] + 0.75, L[2] - 1.5 + 2.25), top: L[1] + 0.75, bottom: L[1], x: L[0], z: L[2] - 1.5, enabled: true, delta: V() });
    this.game.fx.confetti(this.scene, V(L[0], L[1] + 2, L[2] - 1.5));
    await ui.say([
      ['code', 'CLAUDE.md created! It’s just a markdown text file, not code. You can ask me to update it anytime, like “update CLAUDE.md with anything important we covered.”'],
      ['sparky', 'And the <b>context window</b> is Claude’s working memory for one chat. It has a limit! When it gets full, Claude compacts it, but details can get lost…'],
    ]);
    await this.play('Start fresh', [
      ['1 · Summary', 'Chat getting long? Ask for a <b>summary</b>.'],
      ['2 · Fresh chat', 'Open a new chat on the same folder and paste it in. Claude reads CLAUDE.md automatically!'],
    ], { mode: 'trail' });
    await ui.say(['sparky', 'Three power-ups just popped out of the book! (The video also recommends the <b>Context7</b> connector, which keeps Claude on up-to-date docs.)']);
    await this.play('Grab the power-ups', [
      ['🔌 MCPs', 'Connect Claude to <b>outside tools</b>. Anthropic calls them connectors.'],
      ['📇 Skills', 'A repeatable <b>process</b>, like a security review.'],
      ['📚 Plugins', '<b>Bundle</b> skills, MCPs and more together.'],
    ], { mode: 'high' });
    await ui.say(['cody', 'Amazing! Hop on the book to reach the high shelf if you want a star. Then, to the <b>Deploy Rocket</b>, so the whole world can play your game!']);
    this.stage = 'launch';
    this.paths.launch.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async launchTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'launch') { await ui.say(['sparky', ['gate', 'boss', 'done'].includes(this.stage) ? 'Already live on the web! 🌍' : 'The rocket isn’t fueled yet.']); return; }
    await ui.say(['cody', 'Right now the game only lives on your computer. Let’s put it on the web! Fuel up the rocket, step by step.']);
    await this.play('Fuel the rocket', [
      ['1 · Security review', 'Before going public, ask Claude to check for weak spots and exposed API keys.'],
      ['2 · Git', 'Check that Git is installed. Claude can install it for you.'],
      ['3 · GitHub', 'Connect Claude to your GitHub account.'],
      ['4 · Push', 'Create a repository and push the code.'],
      ['5 · Vercel', 'Import that repository on Vercel.'],
      ['6 · Deploy!', 'Hit Deploy and get your live link!'],
    ], { mode: 'trail' });
    await ui.say([
      ['sparky', 'GitHub is like an <b>undo button</b> for your whole project, with saved snapshots. And the setup is a one-time thing. After that it’s just “push it to GitHub.”'],
      ['sparky', 'And Vercel watches GitHub, so every change you push gets <b>redeployed automatically</b>!'],
      ['cody', '3… 2… 1… LAUNCH! Hold on tight, {name}!'],
    ]);
    // launch!
    const r = this.rocket, p = this.game.player;
    p.frozen = true;
    r.userData.flame.visible = true;
    Sfx.dash();
    const y0 = r.position.y, start = performance.now();
    await new Promise((res) => { const a = () => { const k = Math.min(1, (performance.now() - start) / 1400); r.position.y = y0 + k * k * 30; p.pos.y = Math.max(p.pos.y, r.position.y); if (k < 1) requestAnimationFrame(a); else res(); }; a(); });
    await ui.fadeOut(300);
    const Q = this.Q;
    this.spawn.set(Q[0], Q[1] + 0.1, Q[2] + 2);
    p.reset(this.spawn, Math.PI);
    this.game.cam.yaw = Math.PI;
    r.position.set(Q[0] + 2.6, Q[1], Q[2] + 1);
    r.userData.flame.visible = false;
    this.solids.push({ shape: 'cyl', x: Q[0] + 2.6, z: Q[2] + 1, r: 0.9, top: Q[1] + 4.3, bottom: Q[1], enabled: true, delta: V(), noLand: true });
    await ui.fadeIn(300);
    p.frozen = false;
    Sfx.win();
    await ui.say([
      ['code', 'Deployed! Your game is live at a real web link you can send to anyone. 🌍'],
      ['sparky', 'We landed in the castle courtyard! The Vague King’s throne room is just past Gumdrop…'],
    ]);
    this.stage = 'gate';
    this.setObj();
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.stage !== 'gate') { await ui.say(['gum', 'Hiya! How did you even get up here? 🍬']); return; }
    if (!this.candyDone) {
      await ui.say(['gum', 'My last and best candies! Catch them, and then… well, there’s one more lock after this. 🍬']);
      await this.gateCandies([
        ['📐 Plan mode', 'Adjust the plan <b>before</b> it builds.'],
        ['📖 /init', 'Creates <b>CLAUDE.md</b>, the project’s permanent memory.'],
        ['🚀 Go live', 'Push to <b>GitHub</b>, then deploy with <b>Vercel</b>.'],
      ]);
      this.candyDone = true;
    }
    if (!isWatched('codeFull')) {
      await ui.say([
        ['gum', 'Wonderful! But the throne-room door has a second lock. It only opens for heroes who watched the <b>Grand Lesson</b>: the full Claude Code tutorial for beginners.'],
        ['sparky', 'It’s a long one, about 40 minutes, but it’s full of what we need to beat the King. Let’s grab snacks and watch together!'],
      ]);
      const w = WORLDS.find((x) => x.key === 'w7');
      await this.game.theater.open(w, { videoKeys: ['codeFull'], playLabel: '▶ Face the Vague King', heading: 'The Grand Lesson · Final Boss' });
      if (!isWatched('codeFull')) { await ui.say(['gum', 'Come back and talk to me once you’ve watched the Grand Lesson! I’ll wait right here. 🍬']); this.setObj(); return; }
    }
    await ui.say(['gum', 'You did it all! The throne room is open. Go show that vague old King what a <b>clear prompt</b> looks like!']);
    this.gate.openGate();
    this.setObj();
  }

  // ----- FINAL BOSS: the Vague King -----
  async startBoss() {
    const ui = this.game.ui, A = this.arena;
    this.spawn.set(A.x, A.y + 0.1, A.z + 10.5);
    this.stage = 'boss';
    const king = makeVagueKing();
    this.boss = new Boss(this, {
      name: 'The Vague King', model: king, arena: A, hp: 4, radius: 2.6, height: 5.5, speaker: 'king',
      attacks: ['bubbles', 'hop', 'rain', 'charge', 'spit'], perDizzy: 2, chase: 1.5, shotColor: 0xc9b6ff, rainColor: 0xb9b3c9, ringColor: 0xa0a8ff,
      padLabel: 'Clarity Pad', padColor: 0xa0a8ff,
      tips: [
        'API keys go in <b>.env.local</b>. Never paste them into the chat.',
        '<b>.gitignore</b> keeps .env.local from being pushed to GitHub.',
        'AI part broken on Vercel? Add your <b>environment variables</b> there.',
        'Claude Code usage resets <b>every 5 hours</b>, with a weekly cap.',
        '<b>Plan and build with Opus</b>, iterate with Sonnet.',
        'Drop your logo or images right into the <b>project folder</b>.',
        'Use Claude Code in the desktop app, the terminal or an IDE.',
        'Ask: <b>“Is there anything else I should know before making this live?”</b>',
        'You can run <b>multiple sessions in parallel</b>.',
      ],
      lines: {
        hit: ['WHAT?! Specific instructions? CLEAR context? My fog… it’s thinning!', 'No… NO! Plans! Tests! One change at a time! Stop being so… CLEAR!', 'My crown… my beautiful vague crown… it’s slipping!'],
      },
      onUpdate: (b) => { const k = 1 - b.hp / b.maxHp; king.userData.mat.color.setHex(0xb9b3c9).lerp(new THREE.Color(0xe8e4ff), k); },
      onDefeat: () => this.bossDefeated(),
    });
    this.game.player.frozen = true;
    this.game.sparkyOverride = V(A.x + 2, A.y + 3, A.z + 8);
    await this.wait(500);
    ui.banner('The Vague King', 'FINAL BOSS');
    await this.wait(1300);
    await ui.say([
      ['king', 'Sooo… you’re the one who’s been clearing the fog from my kingdom. Hmm. Whatever. Make me something. Something… good.'],
      ['king', 'No context! No details! No plan! Just “make it pop”! I am the <b>Vague King</b>, and every prompt in Promptopia shall be VAGUE!'],
      ['sparky', 'This is it, {name}! He uses EVERY attack: <b>bubbles</b>, <b>stomps</b>, <b>rain</b>, <b>charges</b> and <b>blasts</b>. When he’s dizzy, hit the <b>Clarity Pad</b> and I’ll beam him with what we learned in the Grand Lesson!'],
    ]);
    this.game.sparkyOverride = null;
    this.game.player.frozen = false;
    this.boss.begin();
    this.setObj();
  }

  tick(dt, t) {
    if (this.boss) this.boss.update(dt, t);
    if (this.stage === 'bugs') {
      const n = this.bugs.filter((b) => !b.alive).length;
      if (n !== this.lastBugs) { this.lastBugs = n; this.setObj(); }
    }
    if (this.stage === 'bugs' && this.bugs.every((b) => !b.alive) && !this.bugsCleared) {
      this.bugsCleared = true;
      this.bugsDone();
    }
  }
  onDefeat() {
    if (this.boss) this.boss.reset();
    // bring back any squashed bugs so the challenge stays fair
    if (this.stage === 'bugs') this.bugs.forEach((b) => { if (!b.alive) { b.alive = true; b.obj.scale.set(1, 1, 1); this.scene.add(b.obj); } });
  }

  async bossDefeated() {
    const ui = this.game.ui;
    await ui.say([
      ['king', 'My fog… it’s all gone. I can see… EVERYTHING. Clear instructions. Real context. A plan. Tests. Wow. It’s… beautiful.'],
      ['king', 'I suppose I wasn’t really evil. I just never knew what I wanted. Thank you, {name}. From now on I’ll be… the <b>Clear King</b>! 👑'],
      ['sparky', 'YOU DID IT, {name}!!! Promptopia is fog-free! You know Chat, models, prompting, connectors, projects, skills, Cowork AND Claude Code!'],
      ['jesi', 'Now there’s only one thing left to do… go build something real!'],
    ]);
    this.stage = 'done';
    const A = this.arena;
    this.portal(A.x, A.y, A.z + 2, 0xa0a8ff);
    this.trigger(A.x, A.y, A.z + 2, 1.3, () => this.game.completeWorld('w7', ['claudeCode', 'deploy']));
    this.setObj();
  }

  setObj() {
    const ui = this.game.ui, s = this.stage;
    if (s === 'cody') ui.setObjective('Talk to Cody the Builder Bot');
    else if (s === 'plan') ui.setObjective('Start a build at the Plan Table');
    else if (s === 'bugs') ui.setObjective(`Help test! Stomp the bugs (${this.bugs.filter((b) => !b.alive).length}/4)`);
    else if (s === 'iterate') ui.setObjective('Make changes at the Iteration Station');
    else if (s === 'lib') ui.setObjective('Visit the CLAUDE.md Library');
    else if (s === 'launch') ui.setObjective('Launch the Deploy Rocket');
    else if (s === 'gate' && !this.gate.open) ui.setObjective('Talk to Gumdrop at the castle gate');
    else if (s === 'gate') ui.setObjective('Enter the throne room…');
    else if (s === 'boss') ui.setObjective('Defeat the Vague King! When he’s dizzy, step on the Clarity Pad!');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Code Cloud Castle', 'World 7');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'The Code Cloud Castle… the Vague King lives at the very top. This is where we BUILD things!'],
      ['sparky', 'Let’s talk to that builder bot!'],
    ]);
  }
}

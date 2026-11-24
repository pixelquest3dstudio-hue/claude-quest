import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere } from '../toon.js';
import { makeFace, makeCrystal } from '../creatures.js';
import { makeRobotCat, makeSpark } from '../creatures2.js';
import { makeHelperBot, makeFolder, makeAlarmClock, makeRecipeCard } from '../creatures3.js';
import { Boss } from '../boss.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';

// WORLD 6 - COWORK CLOCKTOWER
// Lessons (from "Full Claude Cowork Tutorial" by Futurepedia):
//   Cowork is an AI agent on your computer you DELEGATE to: describe the outcome, step away, come back to finished work;
//   desktop app, paid plan (Pro or Max), three tabs: Chat / Cowork / Code; same agentic architecture as Claude Code;
//   direct file access, sub-agents in parallel, real documents/spreadsheets/decks, long-running tasks;
//   give it a NEW or DUPLICATED folder (not your originals); Sonnet with thinking for most things, Opus for very complex (more tokens);
//   it asks permission and clarifying questions, shows a checklist; try a smaller batch first;
//   scheduled tasks (desktop app must be open, otherwise it runs the next time you open it);
//   skills (recipe cards, can also be triggered with slash commands), plugins (whole cookbook), connectors, Claude in Chrome (web);
//   meeting-prep demo (calendar notes -> brief + deck + email draft, in parallel); use the Chat tab to expand a prompt;
//   no memory across sessions yet: have it keep a running log file in the folder.
// Boss: Ringo the Alarm Clock, who insists you do every single step yourself.

const FOLDERS = [
  { name: 'Bold Text', color: 0xff8fb1, at: [7, -2] },
  { name: 'Faces', color: 0xffd166, at: [8.5, 2] },
  { name: 'Ads', color: 0x7fb4ff, at: [7, 6] },
];
const TOOLS = [
  { key: 'skill', name: 'Skills', icon: '📇', color: 0xffd166, tip: 'Skills = recipe cards. Claude loads the right ones automatically, or you can trigger one with a <b>slash command</b>.' },
  { key: 'plugin', name: 'Plugins', icon: '📚', color: 0xb79cf0, tip: 'Plugins = a whole cookbook: skills + connectors + slash commands for a job like sales, legal or marketing.' },
  { key: 'connector', name: 'Connectors', icon: '🔌', color: 0xffb86b, tip: 'Connectors link Claude to your apps: Gmail, Google Drive, Calendar, Slack, Notion and lots more.' },
  { key: 'chrome', name: 'Claude in Chrome', icon: '🌐', color: 0x7fd6c2, tip: 'Claude in Chrome is a simple browser extension that gives Cowork access to the web. Make sure it’s toggled on!' },
];

export class World6 extends Level {
  build() {
    this.env({ top: '#9fd9d0', bottom: '#f3fff8', fog: 0xeafaf5, sun: 1.45 });
    this.clouds(16, 90, 6, -40);
    const ui = this.game.ui;
    ui.speakers.cog = { name: 'Cog the Clockwork Cat', color: '#3f9f8a', svg: blobSVG('#9ad0c2'), pitch: 1.25 };
    ui.speakers.cowork = { name: 'Cowork', color: '#e07a5f', svg: blobSVG('#ffb36b'), pitch: 1.4 };
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.ringo = { name: 'Ringo the Alarm Clock', color: '#e05a5a', svg: blobSVG('#ff8f8f'), pitch: 1.0 };
    this.stage = 'cog';
    this.tools = new Set();
    const style = { top: 0xbfeee0, side: 0xc9b6a0 };
    const P = (o) => this.platform({ ...style, ...o });

    // ---- plaza ----
    const G = [0, 0, 0, 12];
    P({ x: 0, y: 0, z: 0, r: 12, h: 2.5, top: 0xc8f2d8 });
    this.decorate(0, 0, 0, 12, { trees: 3, flowers: 22, avoid: [[0, -4, 3], [-6, -3, 3], ...FOLDERS.map((f) => [f.at[0], f.at[1], 2]), [0, 8, 3], [-3, 2, 6]] });
    this.spawn.set(0, 0.1, 8);
    this.checkpoint(0, 0, 4, 10);
    this.label('Cowork Clocktower', 0, 6.5, -7, { size: 0.8, border: '#5fb8a5' });
    const cog = this.add(makeRobotCat(0x9ad0c2), 0, 0, -4);
    this.solids.push({ shape: 'cyl', x: 0, z: -4, r: 0.55, top: 2, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(V(0, 0, -4), 2.4, 'Talk to Cog', () => this.cogTalk());
    this.makeDesk(-6, 0, -3);
    // the messy files scattered all over the plaza
    this.files = [];
    const spots = [[-8, 2], [-4, 5], [-1, 1.5], [3, 4], [-6, 7.5], [2, -1]];
    spots.forEach(([x, z], i) => {
      const f = makeRecipeCard([0xff8fb1, 0xffd166, 0x7fb4ff][i % 3]);
      f.scale.setScalar(0.55);
      f.rotation.set(-1.2, i, 0);
      this.add(f, x, 0.2, z);
      this.files.push({ obj: f, folder: i % 3, home: V(x, 0.2, z) });
    });
    this.folders = FOLDERS.map((f) => {
      const m = makeFolder(f.color);
      m.rotation.y = -Math.PI / 2;
      this.add(m, f.at[0], 0, f.at[1]);
      this.label(f.name, f.at[0], 1.7, f.at[1], { size: 0.24 });
      return m;
    });
    this.helpers = [];
    this.star(-10, 1, -4);

    // ---- floor 1: the schedule clock ----
    const F1 = [9, 2.5, -19, 4];
    this.paths = {};
    this.paths.f1 = this.stones(G, F1, 1, { hidden: true, ...style, top: 0x7fb4ff });
    P({ x: F1[0], y: F1[1], z: F1[2], r: F1[3] });
    this.checkpoint(F1[0], F1[1], F1[2], 3.5);
    this.makeClock(F1[0], F1[1], F1[2] - 1.2);
    this.tokenTot(F1[0] + 1.5, F1[1], F1[2] + 1, 'x', 1.5, 1.6, makeSpark);

    // ---- floor 2: the toolbelt (via the clock-hand elevator) ----
    const F2 = [0, 5, -30, 4];
    const hand = this.hiddenPlatform({ x: 4.5, y: 3.4, z: -24.5, r: 1.3, h: 0.6, top: 0xffd166, side: 0x5b3b5e, island: false });
    this.mover(hand, V(0, 2.2, 0), 4.5);
    this.paths.f2 = [hand];
    P({ x: F2[0], y: F2[1], z: F2[2], r: F2[3] });
    this.checkpoint(F2[0], F2[1], F2[2], 3.5);
    this.makeRack(F2[0], F2[1], F2[2]);
    this.toolOrbs = TOOLS.map((t, i) => {
      const a = Math.PI * 0.15 + (i / 4) * Math.PI * 1.1;
      const x = F2[0] + Math.cos(a) * 5.4 * -1, z = F2[2] - Math.sin(a) * 5.4;
      const ledge = this.platform({ shape: 'box', x, y: F2[1] + 1.4, z, w: 2, d: 2, h: 0.8, ...style });
      const orb = mesh(sphere(0.38), toon(t.color, { emissive: t.color, emissiveIntensity: 0.35 }), { outline: 1.08 });
      const lab = this.label(`${t.icon} ${t.name}`, 0, 0.8, 0, { size: 0.24 });
      const g = new THREE.Group(); g.add(orb); this.scene.remove(lab); g.add(lab);
      g.userData.update = (tt) => { g.position.y = F2[1] + 2.5 + Math.sin(tt * 2 + i) * 0.15; };
      this.add(g, x, F2[1] + 2.5, z);
      g.visible = false;
      this.trigger(x, F2[1] + 1.4, z, 1.2, () => this.getTool(t, g), { once: false });
      return { ledge, g };
    });
    this.star(F2[0], F2[1] + 1, F2[2] + 3);

    // ---- floor 3: meeting prep ----
    const F3 = [-11, 8, -26, 4];
    this.paths.f3 = this.stones(F2, F3, 1, { hidden: true, ...style });
    P({ x: F3[0], y: F3[1], z: F3[2], r: F3[3] });
    this.checkpoint(F3[0], F3[1], F3[2], 3.5);
    this.makeCalendar(F3[0], F3[1], F3[2] - 1.4);
    this.tokenTot(F3[0] + 1, F3[1], F3[2] + 1.5, 'x', 1.6, 1.8, makeSpark);
    this.star(F3[0] - 3, F3[1] + 1, F3[2] + 2);

    // ---- gate + tower-top arena ----
    const Q = [-4, 11, -38, 3.4];
    this.paths.gate = this.stones(F3, Q, 2, { hidden: true, ...style });
    P({ x: Q[0], y: Q[1], z: Q[2], r: Q[3] });
    this.checkpoint(Q[0], Q[1], Q[2], 3);
    this.gate = this.fogGate(Q[0], Q[1], -41.9, 9, { color: 0x9ad0c2 });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());
    this.arena = { x: -4, y: 11, z: -56, r: 13 };
    P({ x: -4, y: 11, z: -56, r: 13, h: 16, top: 0xc8f2d8, side: 0xe6dccf, island: false });
    // clock faces on the tower sides
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const c = mesh(new THREE.CircleGeometry(2.4, 32), toon(0xfffaf3, { side: THREE.DoubleSide }));
      c.position.set(-4 + Math.sin(a) * 12.9, 4, -56 + Math.cos(a) * 12.9);
      c.rotation.y = a;
      this.scene.add(c);
    }
    this.decorate(-4, 11, -56, 13, { trees: 0, flowers: 14, avoid: [[-4, -56, 11]] });
    this.trigger(-4, 11, -56, 10.5, () => this.startBoss());
    this.killY = -12;
    this.setObj();
  }

  // ----- props -----
  makeDesk(x, y, z) {
    const g = new THREE.Group();
    const top = mesh(new THREE.BoxGeometry(2.4, 0.2, 1.2), 0xd9a07a, { outline: 1.04 });
    top.position.y = 1;
    for (const [lx, lz] of [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]]) {
      const l = mesh(new THREE.BoxGeometry(0.15, 1, 0.15), 0xb07a5a);
      l.position.set(lx, 0.5, lz);
      g.add(l);
    }
    const laptop = mesh(new THREE.BoxGeometry(1.0, 0.65, 0.06), 0x5b3b5e, { outline: 1.06 });
    laptop.position.set(0, 1.45, -0.3);
    laptop.rotation.x = -0.2;
    const screen = mesh(new THREE.PlaneGeometry(0.85, 0.5), toon(0x9be7ff, { emissive: 0x336677, emissiveIntensity: 0.5 }));
    screen.position.set(0, 1.45, -0.26);
    screen.rotation.x = -0.2;
    const face = makeFace({ eyeR: 0.06, spacing: 0.1 });
    face.position.set(0, 1.47, -0.24);
    face.rotation.x = -0.2;
    g.add(top, laptop, screen, face);
    this.add(g, x, y, z);
    g.rotation.y = 0.6;
    this.solids.push({ shape: 'cyl', x, z, r: 1.2, top: 1.1, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.label('💻 Cowork Desk', x, 2.7, z, { size: 0.34, border: '#e07a5f' });
    this.deskIt = this.interact(V(x, y, z), 2.6, 'Delegate a task to Cowork', () => this.delegate());
  }

  makeClock(x, y, z) {
    const g = new THREE.Group();
    const face = mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 32), 0xfffaf3, { outline: 1.04 });
    face.rotation.x = Math.PI / 2;
    face.position.y = 2;
    const rim = mesh(new THREE.TorusGeometry(1.6, 0.14, 8, 32), 0x5fb8a5);
    rim.position.y = 2;
    const h1 = mesh(new THREE.BoxGeometry(0.1, 0.9, 0.05), 0x5b3b5e);
    h1.geometry.translate(0, 0.45, 0);
    h1.position.set(0, 2, 0.2);
    const h2 = mesh(new THREE.BoxGeometry(0.08, 1.25, 0.05), 0x5b3b5e);
    h2.geometry.translate(0, 0.6, 0);
    h2.position.set(0, 2, 0.22);
    const eyes = makeFace({ eyeR: 0.14, spacing: 0.4 });
    eyes.position.set(0, 1.6, 0.2);
    const post = mesh(new THREE.CylinderGeometry(0.15, 0.2, 1, 8), 0x5fb8a5);
    post.position.y = 0.5;
    g.add(face, rim, h1, h2, eyes, post);
    g.userData.update = (t) => { h2.rotation.z = -t * (this.scheduled ? 3 : 0.4); h1.rotation.z = -t * 0.1; };
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 0.5, top: y + 1, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('⏰ Schedule Clock', x, y + 4.1, z, { size: 0.34, border: '#5fb8a5' });
    this.interact(V(x, y, z), 2.4, 'Set up a schedule', () => this.scheduleTalk());
  }

  makeRack(x, y, z) {
    const g = new THREE.Group();
    const belt = mesh(new THREE.TorusGeometry(0.8, 0.15, 8, 24), 0xd9a07a, { outline: 1.05 });
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 1.2;
    const post = mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 10), 0x5fb8a5);
    post.position.y = 0.6;
    this.beltSlots = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const s = mesh(sphere(0.2), toon(0xdddddd));
      s.position.set(Math.cos(a) * 0.8, 1.2, Math.sin(a) * 0.8);
      g.add(s); this.beltSlots.push(s);
    }
    g.add(belt, post);
    g.userData.update = (t) => { g.rotation.y = t * 0.6; };
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 1, top: y + 1.4, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('🧰 The Toolbelt', x, y + 2.6, z, { size: 0.34, border: '#5fb8a5' });
    this.interact(V(x, y, z), 2.6, 'Check the Toolbelt', () => this.toolbeltTalk());
  }

  makeCalendar(x, y, z) {
    const g = new THREE.Group();
    const page = mesh(new THREE.BoxGeometry(2.2, 2.4, 0.15), 0xfffaf3, { outline: 1.04 });
    page.position.y = 1.6;
    const head = mesh(new THREE.BoxGeometry(2.2, 0.5, 0.17), 0xff8f8f);
    head.position.y = 2.6;
    const face = makeFace({ eyeR: 0.12, spacing: 0.25 });
    face.position.set(0, 1.8, 0.09);
    for (let i = 0; i < 6; i++) {
      const c = mesh(new THREE.BoxGeometry(0.4, 0.3, 0.17), i === 4 ? 0xffd166 : 0xe8e0f0);
      c.position.set(-0.6 + (i % 3) * 0.6, 1.15 - Math.floor(i / 3) * 0.4, 0);
      g.add(c);
    }
    g.add(page, head, face);
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 0.9, top: y + 2.8, bottom: y, enabled: true, delta: V(), noLand: true });
    this.label('📅 Meeting Prep', x, y + 3.5, z, { size: 0.34, border: '#ff8f8f' });
    this.calPos = V(x, y, z);
    this.interact(V(x, y, z), 2.6, 'Prep for the meeting', () => this.meetingTalk());
  }

  // ----- story -----
  async cogTalk() {
    const ui = this.game.ui;
    if (this.stage === 'cog') {
      await ui.say([
        ['cog', 'Tick-tock, hello {name}! I’m Cog. This is the Cowork Clocktower, where nobody does busywork by hand anymore!'],
        ['cog', '<b>Cowork</b> is an AI agent that lives on your computer. It’s not just an assistant that answers questions. It’s a co-worker you can <b>delegate</b> to!'],
        ['cog', 'You get it in the Claude <b>desktop app</b> on a paid plan (Pro or Max). Up top there are three tabs: <b>Chat</b>, <b>Cowork</b> and <b>Code</b>.'],
        ['cog', 'It uses the same powerful agent brain as Claude Code. It can read and write your files, run <b>sub-agents in parallel</b>, make real docs, spreadsheets and decks, and work on long tasks without timing out.'],
        ['cog', 'The big idea: <b>describe the outcome, step away, and come back to finished work.</b>'],
        ['cog', 'Look at this plaza! Inspiration screenshots EVERYWHERE. Let’s delegate the cleanup. Go to the Cowork Desk!'],
      ]);
      this.stage = 'desk';
    } else if (this.stage === 'desk') {
      await ui.say(['cog', 'The Cowork Desk is right over there with the laptop!']);
    } else if (this.stage === 'working') {
      await ui.say(['cog', 'Cowork is busy! You don’t have to watch… but it’s fun to!']);
    } else {
      await ui.say(['cog', 'Up the tower you go! Tick-tock!']);
    }
    this.setObj();
  }

  async delegate() {
    const ui = this.game.ui;
    if (this.stage === 'cog') { await ui.say(['sparky', 'Let’s talk to Cog first!']); return; }
    if (this.stage !== 'desk') { ui.toast(this.stage === 'working' ? 'Cowork is already on it! ✨' : 'That job is done!'); return; }
    await ui.say(['sparky', 'Let’s hand this job over! Follow the sparks.']);
    await this.play('Delegate the cleanup', [
      ['1 · A safe folder', 'Use a NEW folder or a <b>duplicate</b>, so your originals stay untouched.'],
      ['2 · A clear prompt', '“These are thumbnail screenshots. Rename them so it’s obvious what they are, then organize them into folders.”'],
      ['3 · A model', '<b>Sonnet with thinking</b> is plenty for most things. Opus burns through limits faster.'],
      ['4 · Allow access', 'Cowork asks <b>permission</b> to open the folder. We gave it a copy, so it’s safe to allow.'],
    ], { mode: 'trail' });
    await ui.say([
      ['cowork', 'Quick check before I start: how would you like the folders organized?'],
      ['jesi', 'By style and type, please!'],
    ]);
    await ui.say([
      ['cowork', 'Got it! I counted the files. That’s a big enough job to split into batches, so I’m starting <b>sub-agents in parallel</b>!'],
      ['sparky', 'Tip: for huge jobs, test on a smaller batch first. And sometimes Cowork pauses for approval mid-task, so peek back now and then!'],
    ]);
    this.deskIt.enabled = false;
    this.stage = 'working';
    this.startHelpers();
    this.setObj();
  }

  startHelpers() {
    const desk = V(-6, 1.5, -3);
    this.helpers = [0, 1, 2].map((i) => {
      const h = makeHelperBot([0x7fd6c2, 0xffb36b, 0xb79cf0][i]);
      this.add(h, desk.x + i * 0.6 - 0.6, desk.y, desk.z);
      return { obj: h, jobs: this.files.filter((f) => f.folder === i), state: 'go', carry: null, i };
    });
    this.work = { t: 0, checks: 0 };
    const checklist = ['☑ Analyze images in parallel batches', '☑ Create the folder structure', '☑ Rename and move every file', '☑ Verify everything is organized'];
    this.checklist = checklist;
    this.game.ui.toast('📋 Cowork checklist:<br>☐ Analyze images · ☐ Create folders · ☐ Rename & move · ☐ Verify', 3000);
  }

  updateHelpers(dt) {
    if (this.stage !== 'working' || !this.helpers.length) return;
    this.work.t += dt;
    let allDone = true;
    for (const h of this.helpers) {
      const o = h.obj;
      if (h.state === 'done') continue;
      allDone = false;
      const job = h.jobs[0];
      if (!job) { h.state = 'done'; continue; }
      const target = h.carry ? (() => { const f = FOLDERS[job.folder].at; return V(f[0] - 1, 1.4, f[1]); })() : job.obj.position.clone().add(V(0, 0.9, 0));
      const d = target.clone().sub(o.position);
      const step = 7 * dt;
      if (d.length() > step) { o.position.addScaledVector(d.normalize(), step); o.rotation.y = Math.atan2(d.x, d.z); }
      else if (!h.carry) { h.carry = job; o.userData.box.visible = true; job.obj.visible = false; Sfx.pop(); }
      else {
        h.carry = null; o.userData.box.visible = false; h.jobs.shift();
        Sfx.good();
        this.game.fx.burst(this.scene, target, FOLDERS[job.folder].color, 8);
        const fo = this.folders[job.folder];
        fo.scale.setScalar(1 + 0.15 * (2 - h.jobs.length));
      }
    }
    const t = this.work.t;
    if (this.work.checks < 3 && t > 2 + this.work.checks * 2.5) { this.game.ui.toast(`📋 ${this.checklist.slice(0, this.work.checks + 1).join('<br>')}`, 2200); this.work.checks++; }
    if (allDone && !this.work.finished) { this.work.finished = true; this.finishDelegation(); }
  }

  async finishDelegation() {
    const ui = this.game.ui;
    for (const h of this.helpers) { this.scene.remove(h.obj); this.animators = this.animators.filter((a) => a !== h.obj); }
    this.helpers = [];
    ui.toast(`📋 ${this.checklist.join('<br>')}`, 2500);
    this.game.fx.confetti(this.scene, V(7, 3, 2));
    await ui.say([
      ['cowork', 'All done! Every file is renamed and sorted into folders by style. Here’s a summary table of what went where. ✨'],
      ['jesi', 'From ONE prompt?! I barely told it anything!'],
      ['cog', 'Tick-tock-TERRIFIC! And you never have to do it by hand again… if you put it on a <b>schedule</b>. The Schedule Clock is up the stairs!'],
    ]);
    this.stage = 'clock';
    this.paths.f1.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async scheduleTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'clock') { await ui.say(['sparky', this.stage === 'desk' || this.stage === 'cog' || this.stage === 'working' ? 'A clock! Let’s finish the plaza cleanup first.' : 'Our task is scheduled for the 1st of every month! ⏰']); return; }
    await ui.say([
      ['sparky', 'We can tell Cowork: “On the first of every month, go through this folder, sort any new images, rename them and move them to the right folders.”'],
      ['sparky', 'Then it shows up as a scheduled task, set for 9:00 a.m. on the 1st!'],
    ]);
    await this.play('Set the schedule', [
      ['📅 1st of the month', 'Set for 9:00 a.m. on the 1st, every month.'],
      ['💻 App open', 'Keep the desktop app open. If it’s closed, the task just runs the <b>next time you open it</b>.'],
    ], { mode: 'fall' });
    this.scheduled = true;
    await ui.say(['cog', 'Scheduled! Look, the clock hand is spinning into an elevator. Ride it up to the Toolbelt!']);
    this.stage = 'tools';
    this.paths.f2.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.toolOrbs.forEach((o) => (o.g.visible = true));
    this.setObj();
  }

  getTool(t, g) {
    if (this.tools.has(t.key) || !g.visible || this.stage !== 'tools') return;
    this.tools.add(t.key);
    g.visible = false;
    this.beltSlots[this.tools.size - 1].material = toon(t.color, { emissive: t.color, emissiveIntensity: 0.4 });
    Sfx.good();
    this.game.fx.burst(this.scene, g.position, t.color, 14);
    this.game.ui.toast(`${t.icon} <b>${t.name}</b> (${this.tools.size}/4)<br><small>${t.tip}</small>`, 3800);
    this.setObj();
  }

  async toolbeltTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'tools') { await ui.say(['sparky', this.stage === 'meeting' || this.stage === 'gate' || this.stage === 'boss' || this.stage === 'done' ? 'The Toolbelt is full! 🧰' : 'An empty toolbelt…']); return; }
    if (this.tools.size < 4) { await ui.say(['sparky', `Grab the glowing tools on the ledges around this floor! (${this.tools.size}/4)`]); return; }
    await this.play('Clip on the tools', TOOLS.map((t) => [`${t.icon} ${t.name}`, t.tip, t.color]), { mode: 'ring' });
    await ui.say(['cog', 'Toolbelt complete! Cowork figures out which skills to use all by itself. Now, the big one: <b>meeting prep</b>!']);
    this.stage = 'meeting';
    this.paths.f3.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async meetingTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'meeting') { await ui.say(['sparky', this.stage === 'gate' || this.stage === 'boss' || this.stage === 'done' ? 'Meeting prepped! ✅' : 'The calendar is still locked.']); return; }
    await ui.say([
      ['sparky', 'Here’s the prompt from the video: “Check my calendar for meetings and help me prepare. Each meeting has notes about the documents I need. Read the notes and follow all the instructions.”'],
      ['sparky', 'The meeting notes ask for a one-page <b>company brief</b>, a <b>PowerPoint</b> deck, and a <b>draft email</b> in Gmail. Click + → Connectors and toggle on what it needs!'],
    ]);
    await this.play('Toggle on the connectors', [
      ['✉️ Gmail', 'To draft the email.'],
      ['📅 Google Calendar', 'To read the meeting and its notes.'],
      ['🌐 Claude in Chrome', 'To research the company on the web.'],
    ], { mode: 'high' });
    await ui.say(['cowork', 'Found the meeting! I’m researching on the web and found the PowerPoint skill. Starting the brief and the deck <b>in parallel</b>…']);
    const outs = [['📄 Brief', 0xffd166], ['📽️ Deck', 0xff8f6b], ['✉️ Email draft', 0x7fb4ff]];
    for (let i = 0; i < 3; i++) {
      const p = this.calPos.clone().add(V(-1.6 + i * 1.6, 3.6, 1.2));
      const c = makeRecipeCard(outs[i][1]);
      c.scale.setScalar(0.8);
      this.add(c, p.x, p.y, p.z);
      this.label(outs[i][0], p.x, p.y + 0.9, p.z, { size: 0.24 });
      this.game.fx.burst(this.scene, p, outs[i][1], 12);
      Sfx.pop();
      await this.wait(450);
    }
    await ui.say([
      ['jesi', 'A brief, a real editable deck AND an email draft. All while we stepped away!'],
      ['sparky', 'Pro tip from the video: for a long, detailed prompt, ask the <b>Chat</b> tab to help you expand and format it for Cowork, then paste it in. The tabs work great together!'],
    ]);
    await ui.say(['sparky', 'One limitation: right now Cowork doesn’t remember across sessions. But there’s a trick!']);
    await this.play('Grab the trick', [['📓 Running log', 'Ask Cowork to keep a <b>running log file</b> in the folder and update it every session.']], { mode: 'chase' });
    await ui.say(['cog', 'Tick-tock-tremendous! The bridge to the tower top is ready. Gumdrop is waiting!']);
    this.stage = 'gate';
    this.paths.gate.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.stage !== 'gate') { await ui.say(['gum', 'Hiya! Finish your Cowork tasks first! 🍬']); return; }
    await ui.say(['gum', 'Right on time! Catch my candies. On the roof lives <b>Ringo the Alarm Clock</b>. Ringo thinks you should do EVERYTHING yourself…']);
    await this.gateCandies([
      ['✅ Delegate', 'Describe the outcome, step away, come back to finished work.'],
      ['🤖 Sub-agents', 'Big jobs get split up and run <b>in parallel</b>.'],
      ['🌐 Web', '<b>Claude in Chrome</b> gives Cowork access to the web.'],
    ]);
    await ui.say(['gum', 'Tasty timing! Careful up there, Ringo is LOUD.']);
    this.gate.openGate();
    this.setObj();
  }

  // ----- boss: Ringo the Alarm Clock -----
  async startBoss() {
    const ui = this.game.ui, A = this.arena;
    this.spawn.set(A.x, A.y + 0.1, A.z + 10.5);
    this.stage = 'boss';
    this.boss = new Boss(this, {
      name: 'Ringo the Alarm Clock', model: makeAlarmClock(), arena: A, radius: 2.0, height: 4.6, speaker: 'ringo',
      attacks: ['charge', 'rain', 'hop', 'spit'], perDizzy: 2, chase: 1.5, shotColor: 0xffd166, rainColor: 0xffd166, ringColor: 0xff8f8f,
      padLabel: 'Delegate Pad', padColor: 0x7fd6c2,
      tips: [
        '<b>Delegate</b>: describe the outcome and come back to finished work.',
        'Cowork is on paid plans: <b>Pro or Max</b>.',
        'If Cowork pauses, it may need your <b>approval</b> or an answer.',
        '<b>Sonnet with thinking</b> is plenty for most tasks.',
        'Have Cowork keep a <b>running log file</b> in the folder to remember between sessions.',
        'Find Cowork in the Claude <b>desktop app</b>, next to Chat and Code.',
      ],
      lines: {
        hit: ['BRRRING?! You… you DELEGATED it? And it got done while you were away?!', 'STOP USING SUB-AGENTS! Real work means doing every… single… step… by HAND! BRRRING!'],
      },
      onDefeat: () => this.bossDefeated(),
    });
    this.game.player.frozen = true;
    this.game.sparkyOverride = V(A.x + 2, A.y + 3, A.z + 8);
    await this.wait(500);
    ui.banner('Ringo the Alarm Clock', 'BOSS');
    await this.wait(1200);
    await ui.say([
      ['ringo', 'BRRRRRING! WAKE UP! Time to rename 345 files! BY HAND! No helpers! No delegating!'],
      ['ringo', 'If you want something done right, you do EVERY step yourself! BRRRING BRRRING!'],
      ['sparky', 'It <b>charges</b>, drops <b>gears</b>, <b>stomps</b> and throws <b>springs</b>! When it gets dizzy, step on the <b>Delegate Pad</b>!'],
    ]);
    this.game.sparkyOverride = null;
    this.game.player.frozen = false;
    this.boss.begin();
    this.setObj();
  }

  tick(dt, t) {
    if (this.boss) this.boss.update(dt, t);
    this.updateHelpers(dt);
  }
  onDefeat() { if (this.boss) this.boss.reset(); }

  async bossDefeated() {
    const ui = this.game.ui;
    await ui.say([
      ['ringo', 'brring… brr… okay. Maybe… maybe I can just describe what I want and check back later.'],
      ['ringo', 'I’ll set myself a nice scheduled task instead. Thanks, {name}. ⏰'],
      ['cog', 'The Clocktower is ticking happily again! Remember: Cowork is a co-worker. <b>Delegate</b>, and spend your time on the fun stuff!'],
    ]);
    this.stage = 'done';
    const A = this.arena;
    this.portal(A.x, A.y, A.z + 2, 0x9ad0c2);
    this.trigger(A.x, A.y, A.z + 2, 1.3, () => this.game.completeWorld('w6', ['cowork', 'coworkTools']));
    this.setObj();
  }

  setObj() {
    const ui = this.game.ui, s = this.stage;
    if (s === 'cog') ui.setObjective('Talk to Cog the Clockwork Cat');
    else if (s === 'desk') ui.setObjective('Delegate the cleanup at the Cowork Desk');
    else if (s === 'working') ui.setObjective('Cowork is working… watch the helpers (or explore!)');
    else if (s === 'clock') ui.setObjective('Climb to the Schedule Clock');
    else if (s === 'tools' && this.tools.size < 4) ui.setObjective(`Collect the four tools (${this.tools.size}/4)`);
    else if (s === 'tools') ui.setObjective('Check the Toolbelt');
    else if (s === 'meeting') ui.setObjective('Prep for the meeting at the calendar');
    else if (s === 'gate' && !this.gate.open) ui.setObjective('Talk to Gumdrop at the gate');
    else if (s === 'gate') ui.setObjective('Climb to the tower top… something is ticking');
    else if (s === 'boss') ui.setObjective('Dodge Ringo. When it’s dizzy, step on the Delegate Pad!');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Cowork Clocktower', 'World 6');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'The Cowork Clocktower! The video says this one really changes how you work, because it feels like a co-worker.'],
      ['sparky', 'Let’s find Cog!'],
    ]);
  }
}

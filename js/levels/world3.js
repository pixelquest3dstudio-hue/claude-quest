import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere } from '../toon.js';
import { makeFace, makeCrystal } from '../creatures.js';
import { makeRobotCat, makeTower, makeSpark, makeSnakeHead, makeSnakeSegment } from '../creatures2.js';
import { Boss } from '../boss.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';

// WORLD 3 - CONNECTOR CLIFFS
// Lessons (from "Use Claude Better Than 99% of People", 6:00 to 7:31, plus the ecosystem video):
//   connectors bring context in (mail, calendar, meeting notes, files), where to add them, permissions,
//   and custom connectors (e.g. bringing in an image generator, since Claude can't make images itself).
// Mini-boss: the Static Snake, who hates when tools are connected.

const ISLANDS = [
  { key: 'mail', name: 'Mail', icon: '✉️', at: [-8, 1.5, -18, 3.5], color: 0xff8fb1, why: 'Claude learns <b>how you reply</b>, and which clients and projects you have.' },
  { key: 'calendar', name: 'Calendar', icon: '📅', at: [4, 3, -30, 3.5], color: 0x7fb4ff, why: 'Claude gets <b>up-to-date info</b> on what’s going on in your life or business.' },
  { key: 'notes', name: 'Meeting Notes', icon: '📝', at: [-4, 4.5, -42, 3.5], color: 0x8fd694, why: 'Claude can <b>analyze your notes</b> and pull out useful info, like drafting a follow-up.' },
  { key: 'drive', name: 'File Drive', icon: '📁', at: [6, 6, -53, 3.5], color: 0xffd166, why: 'Claude gets <b>access to your files</b>.' },
];
const IS = [0, 7, -65, 4];
const Q = [0, 7, -75.5, 3.4];

export class World3 extends Level {
  build() {
    this.env({ top: '#ff9e7a', bottom: '#ffe7c4', fog: 0xffd9bd, sun: 1.6 });
    this.clouds(16, 90, 0, -45);
    const ui = this.game.ui;
    ui.speakers.plug = { name: 'Plug the Robot Cat', color: '#f08a5d', svg: blobSVG('#ffb86b'), pitch: 1.3 };
    ui.speakers.paint = { name: 'Paint Bot', color: '#ff7aa6', svg: blobSVG('#ff9ecf'), pitch: 1.5 };
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.snake = { name: 'Static Snake', color: '#d9a400', svg: blobSVG('#ffe45c'), pitch: 0.8 };
    this.stage = 'kiosk';
    this.connected = 0;
    const style = { top: 0xffcf9e, side: 0xd9906a };
    const P = (o) => this.platform({ ...style, ...o });
    const S = [0, 0, 0, 7];

    P({ x: 0, y: 0, z: 0, r: 7, h: 2, top: 0xb8e6a8 });
    this.decorate(0, 0, 0, 7, { trees: 2, flowers: 12, avoid: [[0, 2, 3], [0, -2, 2], [3, -3, 2]] });
    this.spawn.set(0, 0.1, 4);
    this.checkpoint(0, 0, 2, 6);
    this.label('Connector Cliffs', 0, 7.4, -2, { size: 0.8, border: '#f08a5d' });
    this.tower = this.add(makeTower(), 0, 0, -2);
    this.solids.push({ shape: 'cyl', x: 0, z: -2, r: 0.9, top: 5, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.towerTop = V(0, 5.2, -2);
    const plug = this.add(makeRobotCat(), 3, 0, -3);
    plug.rotation.y = -0.5;
    this.solids.push({ shape: 'cyl', x: 3, z: -3, r: 0.5, top: 2, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(V(3, 0, -3), 2.4, 'Talk to Plug', () => this.plugTalk());

    // app islands, each unlocked by connecting the one before
    this.paths = [];
    let prev = S;
    ISLANDS.forEach((isl, i) => {
      const a = isl.at;
      this.paths.push(this.stones(prev, a, i === 3 ? 2 : 2, { hidden: true, ...style }));
      P({ x: a[0], y: a[1], z: a[2], r: a[3] });
      this.checkpoint(a[0], a[1], a[2], 3);
      this.socket(i, a[0], a[1], a[2] - 1.2);
      this.label(`${isl.icon} ${isl.name} Island`, a[0], a[1] + 3.6, a[2] - 1.2, { size: 0.34, border: '#' + new THREE.Color(isl.color).getHexString() });
      prev = a;
    });
    this.tokenTot(4, 3, -28.5, 'x', 2.2, 1.6, makeSpark);
    this.tokenTot(-4, 4.5, -40.5, 'x', 2.2, 1.8, makeSpark);
    this.tokenTot(6, 6, -51.5, 'x', 2.2, 2.0, makeSpark);
    this.star(-8, 3, -15.5);
    this.star(7, 4.5, -31);
    this.star(-7, 6, -43);
    this.star(9, 7.5, -53);

    // Image Studio (custom connector)
    this.paths.push(this.stones(ISLANDS[3].at, IS, 1, { hidden: true, ...style }));
    P({ x: IS[0], y: IS[1], z: IS[2], r: IS[3] });
    this.checkpoint(IS[0], IS[1], IS[2], 3.5);
    const paint = this.add(makeRobotCat(0xff9ecf), 0, IS[1], IS[2] - 1.5);
    this.solids.push({ shape: 'cyl', x: 0, z: IS[2] - 1.5, r: 0.5, top: IS[1] + 2, bottom: IS[1], enabled: true, delta: V(), noLand: true });
    this.label('🎨 Image Studio', 0, IS[1] + 3.6, IS[2] - 1.5, { size: 0.38, border: '#ff9ecf' });
    this.interact(V(0, IS[1], IS[2] - 1.5), 2.4, 'Talk to Paint Bot', () => this.paintTalk());
    this.easel = new THREE.Group();
    const board = mesh(new THREE.BoxGeometry(1.4, 1.1, 0.08), 0xffffff, { outline: 1.04 });
    board.position.y = 1.4;
    const leg = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), 0xc98b5e);
    leg.position.y = 0.7;
    this.easel.add(board, leg);
    this.easelBoard = board;
    this.add(this.easel, 2, IS[1], IS[2] - 0.5);
    this.easel.rotation.y = -0.4;

    // gate + arena
    this.paths.push(this.stones(IS, Q, 1, { hidden: true, ...style }));
    P({ x: Q[0], y: Q[1], z: Q[2], r: Q[3] });
    this.checkpoint(Q[0], Q[1], Q[2], 3);
    this.gate = this.fogGate(0, Q[1], -79.4, 9, { color: 0xffb3d1 });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());
    this.arena = { x: 0, y: 7, z: -93, r: 13 };
    P({ x: 0, y: 7, z: -93, r: 13, h: 2.5, top: 0xffd9a8 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const post = mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8), 0xfff1dc);
      post.position.set(Math.cos(a) * 12.3, 7.6, -93 + Math.sin(a) * 12.3);
      this.scene.add(post);
    }
    this.trigger(0, 7, -93, 10.5, () => this.startBoss());
    this.killY = -12;
    this.setObj();
  }

  socket(i, x, y, z) {
    const isl = ISLANDS[i];
    const g = new THREE.Group();
    const box = mesh(new THREE.BoxGeometry(1.3, 1.6, 0.9), 0xfff1dc, { outline: 1.04 });
    box.position.y = 0.8;
    const plate = mesh(new THREE.CircleGeometry(0.42, 24), toon(isl.color));
    plate.position.set(0, 1.0, 0.46);
    const face = makeFace({ eyeR: 0.09, spacing: 0.15 });
    face.position.set(0, 1.05, 0.48);
    g.add(box, plate, face);
    this.add(g, x, y, z);
    this.solids.push({ shape: 'box', min: V(x - 0.65, y, z - 0.45), max: V(x + 0.65, y + 1.6, z + 0.45), top: y + 1.6, bottom: y, enabled: true, delta: V() });
    isl.done = false;
    isl.plate = plate;
    isl.socketPos = V(x, y + 1.6, z);
    isl.it = this.interact(V(x, y, z + 0.9), 2.4, `Connect ${isl.name}`, () => this.connect(i));
  }

  async plugTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'kiosk') { await ui.say(['plug', 'Beep! Connect every island to the tower. Each socket has a plug to catch!']); return; }
    await ui.say([
      ['plug', 'Beep boop! I’m Plug! These cliffs used to be connected to the Claude Tower, but the <b>Static Snake</b> chewed through every cable!'],
      ['plug', '<b>Connectors</b> link Claude to the tools you already use. They’re a super easy way to bring in context, and Claude can even take actions for you.'],
      ['plug', 'And YOU stay in control: each connector has a permissions list, so you choose what Claude can and can’t do. Some are read-only, some can take actions.'],
      ['plug', 'Let’s add one together! Follow the sparks. Bzzt!'],
    ]);
    await this.play('Add a connector', [
      ['1 · Customize', 'Open <b>Customize</b>, then <b>Connectors</b>.'],
      ['2 · Browse', 'Click <b>Add</b>, then <b>Browse connectors</b>.'],
      ['3 · Pick a tool', 'Find your tool and click its <b>+</b> button.'],
      ['4 · Sign in', '<b>Sign in</b> to that account. Connected!'],
    ], { mode: 'trail' });
    await ui.say(['plug', 'Purr-fect! The path to <b>Mail Island</b> is back. Go plug in each island’s socket!']);
    this.stage = 'islands';
    this.paths[0].forEach((s, k) => this.reveal(s, 200 + k * 350));
    this.setObj();
  }

  async connect(i) {
    const ui = this.game.ui, isl = ISLANDS[i];
    if (isl.done) return;
    await this.play(`Catch the ${isl.name} plug`, [[`${isl.icon} ${isl.name} plug`, isl.why, isl.color], ['⚡ Power', 'Plugged in! No more copy-pasting.', 0xffe45c]], { mode: i % 2 ? 'high' : 'chase' });
    isl.done = true;
    isl.it.enabled = false;
    Sfx.good();
    isl.plate.material = toon(isl.color, { emissive: isl.color, emissiveIntensity: 0.5 });
    this.cable(this.towerTop.clone(), isl.socketPos.clone(), isl.color);
    this.game.fx.confetti(this.scene, isl.socketPos.clone());
    this.connected++;
    ui.toast(`${isl.icon} ${isl.name} connected!`);
    this.paths[i + 1].forEach((s, k) => this.reveal(s, 300 + k * 350));
    if (i === 3) {
      await ui.say(['sparky', 'All four tools are connected! Now Claude can pull context from your mail, calendar, notes and files without you copy-pasting anything. Let’s visit the Image Studio!']);
      this.stage = 'studio';
    }
    this.setObj();
  }

  async paintTalk() {
    const ui = this.game.ui;
    if (this.stage === 'islands' || this.stage === 'kiosk') { await ui.say(['paint', 'Beep! Connect all four islands first, then come paint with me!']); return; }
    if (this.stage !== 'studio') { await ui.say(['paint', 'Look at my bridge painting! Custom connectors are the best. Beep!']); return; }
    await ui.say([
      ['paint', 'Beep-boop, I’m Paint Bot! Here’s a secret: Claude doesn’t have its own image generator.'],
      ['jesi', 'Wait, really? Then how do I make images?'],
      ['paint', 'You can bring one in with a <b>custom connector</b>! Image and video tools usually list a connector URL. Help me set one up so I can paint a bridge!'],
    ]);
    await this.play('Set up the custom connector', [
      ['1 · Add custom', 'Click <b>Add</b>, then <b>Add custom connector</b>.'],
      ['2 · Name it', 'Give it a <b>name</b>.'],
      ['3 · Paste the URL', 'Paste in the tool’s connector <b>URL</b>.'],
      ['4 · Log in', '<b>Log in</b> when it asks you to. Done!'],
    ], { mode: 'trail' });
    Sfx.good();
    // paint a bridge onto the easel
    const c = document.createElement('canvas');
    c.width = 256; c.height = 200;
    const x = c.getContext('2d');
    x.fillStyle = '#bfe6ff'; x.fillRect(0, 0, 256, 200);
    x.fillStyle = '#ffcf9e'; x.fillRect(0, 140, 70, 60); x.fillRect(186, 140, 70, 60);
    x.strokeStyle = '#ff8fb1'; x.lineWidth = 14; x.beginPath(); x.arc(128, 220, 110, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
    x.fillStyle = '#ffd166'; x.beginPath(); x.arc(210, 40, 22, 0, Math.PI * 2); x.fill();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    this.easelBoard.material = new THREE.MeshBasicMaterial({ map: tex });
    this.game.fx.confetti(this.scene, V(2, IS[1] + 2, IS[2] - 0.5));
    await ui.say([
      ['paint', 'Connected! Now when you ask for an image, Claude can make it through that connector. Look, I painted a bridge… and it’s REAL!'],
      ['sparky', 'Custom connectors let you bring in almost any tool. Gumdrop’s gate is just ahead!'],
    ]);
    this.paths[5].forEach((s, k) => this.reveal(s, 200 + k * 350));
    this.stage = 'gate';
    this.setObj();
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.stage !== 'gate') { await ui.say(['gum', 'Hiya! Connect every island and help Paint Bot first. 🍬']); return; }
    await ui.say(['gum', 'Everything’s plugged in! Catch my candies. The <b>Static Snake</b> is hiding back there. It HATES connected tools…']);
    await this.gateCandies([
      ['🔌 Connectors', 'They bring context in fast and can take actions in your tools.'],
      ['🎨 Images', 'Claude has no image generator of its own, but a connector can bring one in.'],
      ['🔐 Permissions', 'You choose what each connector can and can’t do.'],
    ]);
    await ui.say(['gum', 'Zappy good job! Out of the way I go!']);
    this.gate.openGate();
    this.setObj();
  }

  // ----- mini-boss: Static Snake -----
  async startBoss() {
    const ui = this.game.ui, A = this.arena;
    this.spawn.set(0, A.y + 0.1, A.z + 10.5);
    this.stage = 'boss';
    const head = makeSnakeHead();
    this.segments = [];
    for (let i = 0; i < 8; i++) { const s = makeSnakeSegment(i); this.scene.add(s); this.segments.push(s); }
    this.trail = [];
    for (let i = 0; i < 60; i++) this.trail.push(V(A.x, A.y, A.z - 4 - i * 0.25));
    this.boss = new Boss(this, {
      name: 'Static Snake', model: head, arena: A, radius: 1.15, height: 2.4, speaker: 'snake', hp: 3,
      attacks: ['charge', 'spit', 'hop'], chase: 2.2, shotColor: 0xffe45c, ringColor: 0xffe45c,
      padLabel: 'Plug Socket', padColor: 0xffb86b,
      tips: [
        'Find connectors under <b>Customize → Connectors</b>.',
        'Connectors link Claude to tools you already use, to pull in context or take actions.',
        'After clicking a connector’s <b>+</b>, just <b>sign in</b> to that account.',
        'A <b>custom connector</b> needs a name and the tool’s URL.',
        '<b>You</b> control what a connector can do, with its permissions.',
        'A calendar connector keeps Claude up to date on what’s going on.',
      ],
      lines: {
        hit: ['Sssss! My static is fizzling! Fine, I’ll slither FASTER!', 'Ssstop connecting things! Copy-paste is the only way! Sssss!'],
      },
      onUpdate: (b) => this.snakeBody(b),
      onDefeat: (b) => this.bossDefeated(b),
    });
    this.game.player.frozen = true;
    this.game.sparkyOverride = V(2, A.y + 3, A.z + 8);
    await this.wait(500);
    ui.banner('Static Snake', 'MINI-BOSS');
    await this.wait(1200);
    await ui.say([
      ['snake', 'Sssss! Who’s been plugging in all these tools?! I LOVE it when nothing is connected!'],
      ['snake', 'No connectors means copy-pasting context into every single chat. Forever! Sssss!'],
      ['sparky', 'Watch out, {name}! It <b>charges</b> straight at you and spits sparks. Its tail hurts too! When it gets dizzy, step on the <b>Plug Socket</b>!'],
    ]);
    this.game.sparkyOverride = null;
    this.game.player.frozen = false;
    this.boss.begin();
    this.setObj();
  }

  snakeBody(b) {
    const head = b.obj.position;
    const last = this.trail[0];
    if (last.distanceTo(head) > 0.25) { this.trail.unshift(head.clone()); if (this.trail.length > 80) this.trail.pop(); }
    const p = this.game.player;
    this.segments.forEach((s, i) => {
      const tp = this.trail[Math.min(this.trail.length - 1, (i + 1) * 5)];
      s.position.set(tp.x, this.arena.y + s.userData.r * 0.9 + Math.sin(this.t * 6 + i) * 0.08, tp.z);
      if (b.state !== 'dizzy' && b.state !== 'dead') {
        const d = Math.hypot(p.pos.x - s.position.x, p.pos.z - s.position.z);
        if (d < s.userData.r + 0.3 && p.pos.y < s.position.y + s.userData.r - 0.2) p.hurt(s.position);
      }
    });
  }

  tick(dt, t) { if (this.boss) this.boss.update(dt, t); }
  onDefeat() { if (this.boss) this.boss.reset(); }

  async bossDefeated() {
    const ui = this.game.ui;
    await ui.say([
      ['snake', 'Sss… my static… it’s gone. Everything’s connected now… and it actually feels kind of nice. So… plugged in.'],
      ['sparky', 'Connector Cliffs is back online! Claude can reach all your tools now, and you choose what it’s allowed to do.'],
    ]);
    this.stage = 'done';
    const A = this.arena;
    this.portal(A.x, A.y, A.z + 2, 0xffb86b);
    this.trigger(A.x, A.y, A.z + 2, 1.3, () => this.game.completeWorld('w3', ['connectors', 'customConnector']));
    this.setObj();
  }

  setObj() {
    const ui = this.game.ui, s = this.stage;
    if (s === 'kiosk') ui.setObjective('Talk to Plug the robot cat');
    else if (s === 'islands') ui.setObjective(`Plug in each island’s connector (${this.connected}/4)`);
    else if (s === 'studio') ui.setObjective('Help Paint Bot in the Image Studio');
    else if (s === 'gate' && !this.gate.open) ui.setObjective('Talk to Gumdrop at the gate');
    else if (s === 'gate') ui.setObjective('Enter the arena… sssomething’s hissing!');
    else if (s === 'boss') ui.setObjective('Dodge the Static Snake. When it’s dizzy, step on the Plug Socket!');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Connector Cliffs', 'World 3');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'Connector Cliffs! The video said connectors are another way to bring context into Claude, straight from the tools you already use.'],
      ['sparky', 'All the cables to the Claude Tower are broken! Let’s find Plug the robot cat. And watch out for the zappy <b>Sparks</b>!'],
    ]);
  }
}

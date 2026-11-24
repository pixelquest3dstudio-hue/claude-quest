import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere } from '../toon.js';
import { makeCrystal, makeFace } from '../creatures.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';
import { shuffle } from '../ui.js';

// WORLD 0 - MEMORY PORTAL
// Lessons (from "Understand the FULL Claude Ecosystem" + the memory-transfer tip):
//   the four products (Chat=think, Cowork=delegate, Code=build, Design=create), the ecosystem layers,
//   importing memory from another AI and turning on memory settings.
// Teaches: walking, jumping, double jump, dash, moving platforms.

const ORBS = {
  chat: { name: 'Chat', verb: 'THINK', color: 0xff8fb1, icon: '💬' },
  cowork: { name: 'Cowork', verb: 'DELEGATE', color: 0x7fd6c2, icon: '✅' },
  code: { name: 'Code', verb: 'BUILD', color: 0xa0a8ff, icon: '🛠️' },
  design: { name: 'Design', verb: 'CREATE', color: 0xffc857, icon: '🎨' },
};

export class World0 extends Level {
  build() {
    this.gentle = true;
    this.env({ top: '#c7b5ff', bottom: '#ffe4f3', fog: 0xf3e6ff });
    this.clouds(18, 90, 0, -50);
    const ui = this.game.ui;
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.bloom = { name: 'Memory Bloom', color: '#9b7bea', svg: blobSVG('#d9c9ff') };
    this.carried = new Set();
    this.placed = new Set();
    this.switches = {};
    this.stage = 'orbs';
    const L = (o) => this.platform({ top: 0xd4c4ff, side: 0xb39ae0, ...o });

    // A. start island
    L({ x: 0, y: 0, z: 0, r: 6, h: 2 });
    this.decorate(0, 0, 0, 6, { trees: 2, flowers: 12, leaf: 0xc9b6ff, avoid: [[0, 2, 2]] });
    this.spawn.set(0, 0.1, 2.5);
    this.checkpoint(0, 0, 0, 5);
    this.label('Memory Portal', 0, 4, -4, { size: 0.8, border: '#b79cf0' });

    // B. stepping stones (jump tutorial)
    L({ x: 0, y: 0, z: -9.5, r: 1.6, h: 1 });
    L({ x: 0, y: 0.6, z: -14, r: 1.6, h: 1 });
    L({ x: 0, y: 1.2, z: -18.5, r: 1.6, h: 1 });
    this.star(0, 1.4, -9.5);
    this.star(0, 2.6, -14);
    this.trigger(0, 0, -5, 3, () => ui.toast('Press <b>Space</b> to jump! Hold it for a higher jump.', 2600));

    // C. Chat nook
    L({ x: 0, y: 1.2, z: -25, r: 4.5 });
    this.decorate(0, 1.2, -25, 4.5, { trees: 1, flowers: 8, leaf: 0xc9b6ff, avoid: [[0, -25, 1.5], [0, -29, 2]] });
    this.checkpoint(0, 1.2, -25, 4);
    this.orb('chat', 0, 2.3, -25);
    // bonus side island
    L({ x: 7.5, y: 2.2, z: -24, r: 1.4, h: 1 });
    this.star(7.5, 3.4, -24);

    // D. Cowork cliff (double jump)
    // the cliff touches the Chat nook so you can never get stuck in a gap at its base
    this.platform({ shape: 'box', x: 0, y: 3.8, z: -32.6, w: 5, d: 6.8, h: 6, top: 0xd4c4ff, side: 0xb39ae0 });
    this.trigger(0, 1.2, -28.5, 2.5, () => ui.toast('Too high! Jump, then press <b>Space</b> again in the air to <b>double jump</b>!', 3200));
    this.checkpoint(0, 3.8, -33, 2.5);
    this.orb('cowork', 0, 4.9, -33.5);
    for (let i = 0; i < 3; i++) { const c = makeCrystal(0xc9b6ff, 1.2); c.position.set(-2 + i * 2, 4.2, -35.6); this.scene.add(c); }

    // E. Code crag (dash)
    L({ x: 0, y: 3.8, z: -47, r: 3 });
    this.trigger(0, 3.8, -35, 2.5, () => ui.toast('Big gap! Jump, double jump, then press <b>Shift</b> to <b>dash</b> across!', 3400));
    this.star(0, 6.2, -40);
    this.checkpoint(0, 3.8, -47, 2.5);
    this.orb('code', 0, 4.9, -47);

    // F. moving platform down to Design Dell
    const mp = this.platform({ shape: 'box', x: 0, y: 3.8, z: -51.8, w: 3, d: 3, h: 0.6, top: 0xffe08a, side: 0xffc857, island: false });
    this.mover(mp, V(0, -1.8, -8.6), 7);
    this.star(0, 5.5, -56);
    L({ x: 0, y: 2, z: -67, r: 4.5 });
    this.checkpoint(0, 2, -67, 4);
    this.orb('design', 0, 3.1, -67);
    this.decorate(0, 2, -67, 4.5, { trees: 1, flowers: 8, leaf: 0xc9b6ff, avoid: [[0, -67, 1.5], [0, -63, 2]] });

    // G. Plaza with pedestals + memory bloom
    L({ x: 0, y: 2, z: -80, r: 8.5, h: 2.5 });
    this.checkpoint(0, 2, -80, 7);
    this.plazaY = 2;
    const verbs = shuffle(Object.keys(ORBS));
    const spots = [[-4.5, -76.5], [4.5, -76.5], [-4.5, -83.5], [4.5, -83.5]];
    this.pedestals = spots.map(([x, z], i) => this.pedestal(x, z, verbs[i]));
    this.makeBloom(0, 2, -80);
    this.star(-7, 3, -80);
    this.star(7, 3, -80);

    // switches
    this.makeSwitch('search', 'Search &\nreference chats', -3.2, -86.2);
    this.makeSwitch('generate', 'Generate memory\nfrom chat history', 3.2, -86.2);

    // H. Gate + exit portal
    L({ x: 0, y: 2, z: -94, r: 3.6 });
    this.gate = this.fogGate(0, 2, -89.6, 8, { color: 0xff9ecf });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());
    this.exitPortal = null;
    this.killY = -16;
    this.setObj();
  }

  // ----- product orbs -----
  orb(key, x, y, z) {
    const o = ORBS[key];
    const g = new THREE.Group();
    const ball = mesh(sphere(0.42, 24, 16), toon(o.color, { transparent: true, opacity: 0.9, emissive: o.color, emissiveIntensity: 0.25 }), { outline: 1.06 });
    const face = makeFace({ eyeR: 0.09, spacing: 0.12 });
    face.position.z = 0.38;
    g.add(ball, face);
    const lab = this.label(`${o.icon} ${o.name}`, 0, 0.95, 0, { size: 0.32 });
    this.scene.remove(lab);
    g.add(lab);
    g.position.set(x, y, z);
    g.userData.update = (t) => { g.position.y = y + Math.sin(t * 2.2 + x) * 0.18; ball.rotation.y = t; face.userData.eyes.forEach((e) => (e.scale.y = (t + x) % 3.3 < 0.12 ? 0.1 : 1)); };
    this.add(g, x, y, z);
    this.trigger(x, y - 1.1, z, 1.1, () => this.collectOrb(key, g), { once: true, h: 3 });
  }

  async collectOrb(key, g) {
    const o = ORBS[key];
    this.carried.add(key);
    this.scene.remove(g);
    this.game.fx.burst(this.scene, g.position, o.color, 18);
    Sfx.good();
    const lines = {
      chat: [['sparky', '💬 You found the <b>Chat</b> orb! Chat is how you <b>THINK</b> with Claude. You ask, it answers, and you go back and forth.'],
        ['sparky', 'Use it when the work IS the conversation: thinking something through, writing, research, working out an idea. And your chats sync across phone, web and desktop!']],
      cowork: [['sparky', '✅ The <b>Cowork</b> orb! Cowork is how you <b>DELEGATE</b>. You hand it a task, walk away, and come back to finished work.'],
        ['sparky', 'It works in a folder on your computer, like organizing a messy desktop or prepping a whole meeting. It’s Claude with a to-do list!']],
      code: [['sparky', '🛠️ The <b>Code</b> orb! Claude Code is how you <b>BUILD</b>: apps, websites, automations, even games like this one!'],
        ['jesi', 'But I’m not a developer…'],
        ['sparky', 'You don’t need to be! You just describe what you want in plain English, and it writes all the code. Then you ask for changes the same way.']],
      design: [['sparky', '🎨 The <b>Design</b> orb! Design is how you <b>CREATE</b>: prototypes, slide decks, one-pagers, landing pages, even animations.'],
        ['jesi', 'Ooh, that one’s SO me.'],
        ['sparky', 'Right?! No design tools needed. Just describe the look. And when it’s ready, you can hand it straight to Code to ship it.']],
    }[key];
    await this.game.ui.say(lines);
    if (this.carried.size === 4) await this.game.ui.say(['sparky', 'All four orbs! Now let’s carry them to the plaza ahead and put each one on the pedestal that matches what it does.']);
    this.setObj();
  }

  pedestal(x, z, key) {
    const y = this.plazaY;
    const p = new THREE.Group();
    const col = mesh(new THREE.CylinderGeometry(0.6, 0.75, 1, 20), 0xfff1dc, { outline: 1.05 });
    col.position.y = 0.5;
    const ring = mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 24), 0xb79cf0);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.02;
    p.add(col, ring);
    this.add(p, x, y, z);
    this.label(ORBS[key].verb, x, y + 2.3, z, { size: 0.45, border: '#b79cf0' });
    this.solids.push({ shape: 'cyl', x, z, r: 0.75, top: y + 1, bottom: y, enabled: true, delta: V() });
    const ped = { x, z, key, group: p, filled: false };
    ped.it = this.interact(V(x, y, z), 2.2, `Place an orb (${ORBS[key].verb})`, () => this.placeOrb(ped));
    return ped;
  }

  async placeOrb(ped) {
    const ui = this.game.ui;
    if (ped.filled) return;
    const k = ped.key;
    if (!this.carried.has(k)) { await ui.say(['sparky', `This pedestal is for <b>${ORBS[k].name}</b>, the one that helps you ${ORBS[k].verb}. We haven’t found that orb yet!`]); return; }
    ped.filled = true;
    ped.it.enabled = false;
    this.placed.add(k);
    Sfx.good();
    const ball = mesh(sphere(0.42, 24, 16), toon(ORBS[k].color, { transparent: true, opacity: 0.9, emissive: ORBS[k].color, emissiveIntensity: 0.4 }), { outline: 1.06 });
    ball.position.y = 1.5;
    ped.group.add(ball);
    this.game.fx.burst(this.scene, V(ped.x, this.plazaY + 1.5, ped.z), ORBS[k].color, 16);
    ui.toast(`${ORBS[k].icon} ${ORBS[k].name} → ${ORBS[k].verb}!`);
    if (this.placed.size === 4) {
      this.stage = 'bloom';
      await this.wait(500);
      this.bloomOpen = true;
      Sfx.portal();
      await ui.say([
        ['sparky', 'Chat to think, Cowork to delegate, Code to build, Design to create. You got them all!'],
        ['sparky', 'Look, the Memory Bloom in the middle is waking up! Go talk to it.'],
      ]);
    }
    this.setObj();
  }

  // ----- memory bloom (import memory puzzle) -----
  makeBloom(x, y, z) {
    const g = new THREE.Group();
    const stem = mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 10), 0x7fd6c2);
    stem.position.y = 0.7;
    g.add(stem);
    const petals = [];
    for (let i = 0; i < 6; i++) {
      const pv = new THREE.Group();
      const pm = mesh(sphere(0.5, 16, 12), 0xd9c9ff, { outline: 1.05 });
      pm.scale.set(0.6, 1.2, 0.3);
      pm.position.y = 0.55;
      pv.add(pm);
      pv.position.y = 1.4;
      pv.rotation.order = 'YXZ';
      pv.rotation.y = (i / 6) * Math.PI * 2;
      g.add(pv);
      petals.push(pv);
    }
    const heart = mesh(sphere(0.38, 20, 14), 0xffe08a);
    heart.position.y = 1.55;
    const face = makeFace({ eyeR: 0.09, spacing: 0.12 });
    face.position.set(0, 1.58, 0.34);
    g.add(heart, face);
    this.bloomOpen = false;
    let open = 0;
    g.userData.update = (t, dt) => {
      open += ((this.bloomOpen ? 1 : 0) - open) * Math.min(1, dt * 2);
      for (const pv of petals) pv.rotation.x = 0.12 + open * 1.0;
      face.visible = open > 0.6;
      g.rotation.y = Math.sin(t * 0.7) * 0.2;
      g.position.y = y + Math.sin(t * 1.5) * 0.05;
    };
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 0.9, top: y + 1.6, bottom: y, enabled: true, delta: V(), noLand: true });
    this.interact(V(x, y, z), 2.6, 'Talk to the Memory Bloom', () => this.bloomTalk());
  }

  async bloomTalk() {
    const ui = this.game.ui;
    if (!this.bloomOpen) { await ui.say(['bloom', '…zzz… (It’s a sleepy flower bud. Maybe it wakes up when the four orbs are home?)']); return; }
    if (this.stage === 'switches' || this.stage === 'gate') { await ui.say(['bloom', 'Now step on both memory switches by the gate so Claude can keep learning about you!']); return; }
    await ui.say([
      ['bloom', 'Hello, traveler. I am the Memory Bloom. I keep everything Claude learns about you.'],
      ['jesi', 'Oh no… all my history is in the old AI I used before. Do I have to start from zero?'],
      ['bloom', 'Not at all! Claude can <b>import memory</b> from other AI providers. But the steps got all jumbled up in the fog…'],
      ['bloom', 'Not at all! Claude can <b>import memory</b> from other AI providers. Follow my petals and we’ll carry your memories over!'],
    ]);
    await this.play('Follow the memory petals', [
      ['1 · Start import', 'Open <b>Settings → Capabilities</b> and press <b>Start import</b> next to “Import memory”.'],
      ['2 · Copy the prompt', 'Claude gives you a <b>prompt</b>. Copy it.'],
      ['3 · Ask your old AI', 'Paste that prompt into your <b>old AI</b> (ChatGPT, Gemini…).'],
      ['4 · Add to memory', 'Copy its answer, paste it into Claude and hit <b>Add to memory</b>.'],
    ], { mode: 'trail' });
    this.game.fx.confetti(this.scene, V(0, 4, -80));
    await ui.say([
      ['bloom', 'Wonderful! Your memories flow in like spring rain. 🌧️'],
      ['bloom', 'One more thing: in that same settings area, make sure <b>Search & reference chats</b> and <b>Generate memory from chat history</b> are switched ON.'],
      ['bloom', 'That lets Claude build up memory about you and become more personal over time. The two big switches are by the gate!'],
    ]);
    this.stage = 'switches';
    this.setObj();
  }

  makeSwitch(key, text, x, z) {
    const y = this.plazaY;
    const g = new THREE.Group();
    const base = mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.2, 24), 0xfff1dc, { receive: true });
    base.position.y = 0.1;
    const btn = mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.2, 24), 0xff7aa6, { outline: 1.04 });
    btn.position.y = 0.3;
    g.add(base, btn);
    this.add(g, x, y, z);
    this.label(text + '\nOFF', x, y + 2.2, z, { size: 0.32 });
    const sw = { on: false, btn, x, z, text };
    sw.label = this.scene.children[this.scene.children.length - 1];
    this.switches[key] = sw;
    this.trigger(x, y, z, 1.1, async () => {
      if (sw.on) return;
      if (this.stage !== 'switches') { this.game.ui.toast('This switch is sleeping. Help the Memory Bloom first!'); return; }
      sw.on = true;
      sw.btn.material = toon(0x7fd6c2);
      sw.btn.position.y = 0.2;
      this.scene.remove(sw.label);
      sw.label = this.label(sw.text + '\nON ✓', x, y + 2.2, z, { size: 0.32, border: '#7fd6c2' });
      Sfx.good();
      this.game.fx.burst(this.scene, V(x, y + 0.5, z), 0x7fd6c2, 14);
      if (Object.values(this.switches).every((s) => s.on)) {
        this.stage = 'gate';
        await this.game.ui.say(['sparky', 'Both memory switches are ON! Claude can remember you now. Let’s go see Gumdrop at the gate!']);
      }
      this.setObj();
    }, { once: false });
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.stage !== 'gate') {
      await ui.say(['gum', 'Halt-y halt! Nobody passes until the orbs are home, the Memory Bloom is happy, and both memory switches are ON. Gatekeeper rules! 🍬']);
      return;
    }
    await ui.say(['gum', 'Ooh, you did everything! Let’s celebrate. Catch my candies and I’ll wobble out of your way!']);
    await this.gateCandies([
      ['🧭 Four products', 'Chat to <b>think</b>, Cowork to <b>delegate</b>, Code to <b>build</b>, Design to <b>create</b>.'],
      ['📚 Plugins', '<b>Skills</b> repeat tasks, <b>connectors</b> link your tools, and <b>plugins</b> bundle them together for a role.'],
      ['🧠 Memory', 'Import it from <b>Settings → Capabilities</b>, then let Claude keep learning about you.'],
    ]);
    await ui.say(['gum', 'Yum! Wobble wobble, out of the way I go!']);
    this.gate.openGate();
    await this.wait(900);
    this.exitPortal = this.portal(0, 2, -94.5, 0xb79cf0, { faceYaw: 0 });
    this.trigger(0, 2, -94.5, 1.3, () => this.finish());
    this.setObj();
  }

  async finish() {
    this.game.player.frozen = true;
    await this.game.ui.say(['sparky', 'The Memory Portal is glowing again! Look at all that color! We make a great team, {name}!']);
    this.game.player.frozen = false;
    await this.game.completeWorld('w0', ['products', 'layers', 'memory']);
  }

  setObj() {
    const ui = this.game.ui;
    if (this.carried.size < 4) ui.setObjective(`Collect the 4 product orbs (${this.carried.size}/4)`);
    else if (this.placed.size < 4) ui.setObjective(`Put each orb on its matching pedestal (${this.placed.size}/4)`);
    else if (this.stage === 'bloom') ui.setObjective('Talk to the Memory Bloom');
    else if (this.stage === 'switches') ui.setObjective(`Step on both memory switches (${Object.values(this.switches).filter((s) => s.on).length}/2)`);
    else if (!this.gate.open) ui.setObjective('Talk to Gumdrop at the gate');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Memory Portal', 'World 0');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'Ooh, the video said Claude has grown from a box you type into into a whole <b>ecosystem</b>! This world is where it all begins.'],
      ['sparky', 'Four glowing <b>product orbs</b> are scattered across these islands. Let’s collect them all! Don’t worry, falling here doesn’t cost hearts.'],
    ]);
  }
}

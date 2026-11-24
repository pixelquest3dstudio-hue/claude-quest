import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere } from '../toon.js';
import { makeCrystal, makeMushroomFolk, makeFace } from '../creatures.js';
import { makeFuzzle, makeBat, makeSiren } from '../creatures2.js';
import { Boss } from '../boss.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';

// WORLD 2 - CONTEXT CAVES
// Lessons (from "Full Claude Tutorial: Beginner to Advanced in 19 Minutes"):
//   the ICC prompt formula (Instructions, Context, Constraints + an example), the context interview,
//   iterate like a collaborator, web search ("ground first, ask second"), file uploads, artifacts, Research.
// Boss: the Shiny Siren, whose first answers always look perfect.

const CRYSTALS = {
  instructions: { name: 'Instructions', color: 0x7fb4ff, icon: '🎯' },
  context: { name: 'Context', color: 0xff8fb1, icon: '📚' },
  constraints: { name: 'Constraints', color: 0xffd166, icon: '📏' },
};

export class World2 extends Level {
  build() {
    this.env({ top: '#2e2350', bottom: '#6b4f9e', fog: 0x4a3a78, fogNear: 30, fogFar: 120, sun: 1.1 });
    this.scene.add(new THREE.AmbientLight(0xb79cf0, 0.35));
    const ui = this.game.ui;
    ui.speakers.questy = { name: 'Questy the Cave Bat', color: '#7b5bd0', svg: blobSVG('#9b7bd4'), pitch: 1.6 };
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.siren = { name: 'Shiny Siren', color: '#3fb6c8', svg: blobSVG('#7fd6e8'), pitch: 1.3 };
    ui.speakers.filo = { name: 'Filo the Mushroom', color: '#ff6f91', svg: blobSVG('#ff9fb8') };
    ui.speakers.arti = { name: 'Arti the Mushroom', color: '#7fb4ff', svg: blobSVG('#b6d4ff') };
    ui.speakers.ressa = { name: 'Ressa the Mushroom', color: '#8fd694', svg: blobSVG('#c8f0c0') };
    this.got = new Set();
    this.stage = 'crystals';
    this.talked = new Set();
    const P = (o) => this.platform({ top: 0x8a7bc4, side: 0x5b4a8e, ...o });
    const glow = (x, y, z, c, s = 1) => { const k = makeCrystal(c, s); k.position.set(x, y + 0.4 * s, z); this.scene.add(k); const l = new THREE.PointLight(c, 0.8, 6); l.position.set(x, y + 1, z); this.scene.add(l); };

    // S. cave mouth
    P({ x: 0, y: 0, z: 0, r: 7, h: 2 });
    this.spawn.set(0, 0.1, 3);
    this.checkpoint(0, 0, 0, 6);
    this.label('Context Caves', 0, 4.2, -3, { size: 0.8, border: '#7fb4ff' });
    glow(-5, 0, -2, 0x7fb4ff, 1.3); glow(5, 0, -2, 0xff8fb1, 1.3); glow(-4, 0, 4, 0xffd166);
    for (let i = 0; i < 4; i++) this.add(makeMushroomFolk([0x7fb4ff, 0xff8fb1, 0xffd166, 0xb79cf0][i]), -5.5 + i * 3.6, 0, 5.2).scale.setScalar(0.5);

    // A. Instructions crystal (stepping stones)
    const A = [0, 1, -21, 4];
    this.stones([0, 0, 0, 7], A, 2, { top: 0x8a7bc4, side: 0x5b4a8e });
    P({ x: A[0], y: A[1], z: A[2], r: A[3] });
    this.checkpoint(0, 1, -21, 3.5);
    this.crystal('instructions', 0, 2.1, -21.5);
    this.tokenTot(0, 1, -19, 'x', 2.5, 1.5, makeFuzzle);
    this.star(0, 2.6, -11.5);

    // B. Context crystal (double-jump ledge)
    this.platform({ shape: 'box', x: 0, y: 3.6, z: -28.4, w: 5, d: 6.6, h: 6, top: 0x8a7bc4, side: 0x5b4a8e });
    this.checkpoint(0, 3.6, -28.4, 2.5);
    this.crystal('context', 0, 4.7, -29);
    glow(-2, 3.6, -31, 0xff8fb1, 0.8);

    // C. Constraints crystal (jump gap) + moving platform down to the forge
    P({ x: 0, y: 3.6, z: -40, r: 3 });
    this.checkpoint(0, 3.6, -40, 2.5);
    this.crystal('constraints', 0, 4.7, -40);
    this.star(0, 5.8, -34.5);
    const mp = this.platform({ shape: 'box', x: 0, y: 3.6, z: -44.5, w: 2.6, d: 2.6, h: 0.6, top: 0xffd166, side: 0xffc857, island: false });
    this.mover(mp, V(0, -1.6, -4.6), 6);

    // D. Prompt Forge plaza
    const D = [0, 2, -55, 6];
    P({ x: D[0], y: D[1], z: D[2], r: D[3], h: 2.5 });
    this.checkpoint(0, 2, -55, 5);
    this.makeForge(0, 2, -55);
    this.tokenTot(-3, 2, -52, 'z', 1.8, 1.4, makeFuzzle);
    this.star(5, 3, -55);
    const bat = this.add(makeBat(), 4, 2, -58.5);
    bat.rotation.y = -0.6;
    this.interact(V(4, 2, -58.5), 2.6, 'Talk to Questy', () => this.questyTalk());
    this.interviewGate = this.fogGate(0, 2, -60.6, 9, { color: 0xffffff });
    this.interviewGate.gum.visible = false; this.interviewGate.gumSolid.enabled = false;

    // E. Echo tunnel: lantern reveals the stones
    const lanternPost = new THREE.Group();
    const post = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.3, 8), 0x5b4a8e);
    post.position.y = 0.65;
    const lamp = mesh(sphere(0.32, 16, 12), toon(0x9b90b0));
    lamp.position.y = 1.5;
    lanternPost.add(post, lamp);
    this.add(lanternPost, -3, 2, -59.2);
    this.lamp = lamp;
    this.lanternLight = new THREE.PointLight(0xffe08a, 0, 14);
    this.lanternLight.position.set(-3, 4, -59.2);
    this.scene.add(this.lanternLight);
    this.lanternIt = this.interact(V(-3, 2, -59.2), 2.2, 'Light the Search Lantern', () => this.lantern());
    this.lanternIt.enabled = false;
    const E = [0, 3, -76, 3.8];
    this.tunnel = this.stones(D, E, 3, { hidden: true, top: 0x8a7bc4, side: 0x5b4a8e });
    P({ x: E[0], y: E[1], z: E[2], r: E[3] });
    this.checkpoint(0, 3, -76, 3);
    this.star(0, 4.5, -67);

    // E. the gallery mushrooms (files, artifacts, research)
    const g1 = this.add(makeMushroomFolk(0xff6f91), -2.6, 3, -75); g1.rotation.y = 0.8;
    const g2 = this.add(makeMushroomFolk(0x7fb4ff), 2.6, 3, -75); g2.rotation.y = -0.8;
    const g3 = this.add(makeMushroomFolk(0x8fd694), -2.2, 3, -78); g3.rotation.y = 0.6;
    for (const [x, z] of [[-2.6, -75], [2.6, -75], [-2.2, -78]]) this.solids.push({ shape: 'cyl', x, z, r: 0.5, top: 4.2, bottom: 3, enabled: true, delta: V(), noLand: true });
    this.interact(g1, 2, 'Talk to Filo', () => this.gallery('filo'));
    this.interact(g2, 2, 'Talk to Arti', () => this.gallery('arti'));
    this.interact(g3, 2, 'Talk to Ressa', () => this.gallery('ressa'));

    // gate + arena
    this.gate = this.fogGate(0, 3, -80.1, 9, { color: 0xffb3d1 });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());
    this.arena = { x: 0, y: 3, z: -94, r: 13 };
    P({ x: 0, y: 3, z: -94, r: 13, h: 2.5, top: 0x9b8fd0 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; glow(Math.cos(a) * 12.2, 3, -94 + Math.sin(a) * 12.2, [0x7fb4ff, 0xff8fb1, 0xffd166][i % 3], 1.1); }
    this.trigger(0, 3, -94, 10.5, () => this.startBoss());
    this.killY = -14;
    this.setObj();
  }

  crystal(key, x, y, z) {
    const c = CRYSTALS[key];
    const g = new THREE.Group();
    const k = makeCrystal(c.color, 1.1);
    const face = makeFace({ eyeR: 0.08, spacing: 0.1 });
    face.position.set(0, 0.05, 0.3);
    g.add(k, face);
    const lab = this.label(`${c.icon} ${c.name}`, 0, 1.3, 0, { size: 0.3 });
    this.scene.remove(lab); g.add(lab);
    const light = new THREE.PointLight(c.color, 1, 5);
    g.add(light);
    g.userData.update = (t) => { g.position.y = y + Math.sin(t * 2 + x) * 0.15; k.rotation.y = t; };
    this.add(g, x, y, z);
    this.trigger(x, y - 1.1, z, 1.1, () => this.collect(key, g), { h: 3 });
  }

  async collect(key, g) {
    this.got.add(key);
    this.scene.remove(g);
    this.game.fx.burst(this.scene, g.position, CRYSTALS[key].color, 18);
    Sfx.good();
    const lines = {
      instructions: [['sparky', '🎯 The <b>Instructions</b> crystal! Part one of the video’s prompt formula: say exactly what task you want Claude to do.']],
      context: [['sparky', '📚 The <b>Context</b> crystal! Set the stage: your role, your goals, the background. The video says to err on the side of MORE context. A full context dump is fine!']],
      constraints: [['sparky', '📏 The <b>Constraints</b> crystal! Rules, style, tone, length, output format… and an <b>example</b> of what you want helps a LOT.'],
        ['sparky', 'Instructions, Context, Constraints. That’s the <b>ICC formula</b>! Let’s ride down to the Prompt Forge and build a real prompt.']],
    }[key];
    await this.game.ui.say(lines);
    this.setObj();
  }

  // ----- the Prompt Forge (ICC puzzle) -----
  makeForge(x, y, z) {
    const g = new THREE.Group();
    const anvil = mesh(new THREE.CylinderGeometry(1.1, 1.4, 1.1, 8), 0x6b5aa8, { outline: 1.04 });
    anvil.position.y = 0.55;
    const top = mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.25, 8), 0x9b8fd0);
    top.position.y = 1.2;
    const face = makeFace({ eyeR: 0.14, spacing: 0.25 });
    face.position.set(0, 0.6, 1.25);
    g.add(anvil, top, face);
    this.slots = {};
    Object.keys(CRYSTALS).forEach((k, i) => {
      const s = makeCrystal(0x6b6380, 0.6);
      const a = (i / 3) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.7, 1.6, Math.sin(a) * 0.7);
      g.add(s);
      this.slots[k] = s;
    });
    this.add(g, x, y, z);
    this.solids.push({ shape: 'cyl', x, z, r: 1.3, top: y + 1.3, bottom: y, enabled: true, delta: V() });
    this.label('Prompt Forge', x, y + 3, z, { size: 0.4, border: '#7fb4ff' });
    this.interact(V(x, y, z + 1.6), 2.4, 'Use the Prompt Forge', () => this.forge());
  }

  async forge() {
    const ui = this.game.ui;
    if (this.stage !== 'crystals') { await ui.say(['sparky', 'The forge is happy! Now let’s go see Questy the bat.']); return; }
    if (this.got.size < 3) { await ui.say(['sparky', `We need all three crystals first! We have ${this.got.size} of 3.`]); return; }
    await ui.say([
      ['sparky', 'Okay, {name}! Here’s a real job: you want Claude’s help with a <b>tech pack for a new hoodie</b>. A vague prompt just gets a generic answer.'],
      ['sparky', 'Let’s forge a great prompt, one crystal at a time!'],
    ]);
    const keys = ['instructions', 'context', 'constraints'];
    await this.play('Forge the prompt', [
      ['🎯 Instructions', '“Write a tech pack for my new hoodie design.” The exact task.', 0x7fb4ff],
      ['📚 Context', '“I’m a technical designer at a small brand. Fleece pullover, fall line, XS to XL, due Friday.” The background.', 0xff8fb1],
      ['📏 Constraints', '“A measurement table plus construction notes, 2 pages, matching this example.” The rules.', 0xffd166],
    ], { mode: 'high', onGet: (i) => { const k = keys[i]; this.slots[k].material = toon(CRYSTALS[k].color, { emissive: CRYSTALS[k].color, emissiveIntensity: 0.4 }); } });
    this.game.fx.confetti(this.scene, V(0, 4, -55));
    await ui.say([
      ['sparky', 'BEAUTIFUL prompt! But even a great prompt isn’t perfect on the first try. The video says: <b>iterate</b>. Treat Claude like a collaborator and go back and forth.'],
      ['sparky', 'And there’s one more pro tip… Questy the bat knows it. Let’s go ask!'],
    ]);
    this.stage = 'interview';
    this.setObj();
  }

  // ----- context interview -----
  async questyTalk() {
    const ui = this.game.ui;
    if (this.stage === 'crystals') { await ui.say(['questy', 'Eep! Hi! Come back after you use the Prompt Forge. I have a secret trick!']); return; }
    if (this.stage !== 'interview') { await ui.say(['questy', 'Remember: when you’re not sure what context to give, let Claude interview you! Eep!']); return; }
    await ui.say([
      ['questy', 'Eep! Hello! It’s hard to think of ALL the context Claude needs. You always leave something out!'],
      ['questy', 'So the video’s trick is a <b>context interview</b>. Add one magic line to the end of your prompt. Claude knows what it needs better than you do!'],
    ]);
    await this.play('Catch the magic line', [['💬 “Ask me any questions you need”', 'Add this to the end of your prompt: <b>“Ask me any questions you need to give the best result.”</b>']], { mode: 'chase' });
    await ui.say([
      ['questy', 'Yes! Now watch, I’ll be Claude and interview you about that hoodie. Who is it for? Eep eep!'],
      ['jesi', 'Teens who love cozy streetwear!'],
      ['questy', 'And what’s the biggest worry with this factory?'],
      ['jesi', 'Getting the measurements exactly right.'],
    ]);
    await ui.say([
      ['questy', 'See? Now Claude knows your audience AND your biggest worry, so the answer is tailored to YOU. ICC + a context interview = a first answer that’s almost always usable!'],
      ['questy', 'The fog is lifting! But the tunnel ahead is pitch dark… light the <b>Search Lantern</b> to find the path.'],
    ]);
    this.interviewGate.openGate();
    this.stage = 'lantern';
    this.lanternIt.enabled = true;
    this.setObj();
  }

  // ----- web search lantern -----
  async lantern() {
    const ui = this.game.ui;
    await ui.say(['sparky', 'The <b>Search Lantern</b>! Web search gives Claude up-to-date info and helps reduce <b>hallucinations</b>, when an AI makes stuff up.']);
    await this.play('Light the lantern', [
      ['1 · Ground first', 'Ask Claude to <b>research the topic</b> so it’s up to date.'],
      ['2 · Ask second', 'THEN ask your real question. Now the answer stands on solid facts.'],
    ], { mode: 'trail' });
    this.lanternIt.enabled = false;
    this.lamp.material = toon(0xffe08a, { emissive: 0xffc030, emissiveIntensity: 0.9 });
    this.lanternLight.intensity = 2.5;
    this.tunnel.forEach((s, i) => this.reveal(s, 300 + i * 400));
    await this.wait(1500);
    await ui.say(['sparky', 'The path lit up! Tip from the video: web search is usually on, but Claude doesn’t always use it. If it matters, just <b>ask it to search the web</b>.']);
    this.stage = 'gallery';
    this.setObj();
  }

  async gallery(who) {
    const ui = this.game.ui;
    const lines = {
      filo: [['filo', 'Welcome to the gallery! I’m Filo, and I love <b>file uploads</b>. Drag in PDFs, images, spreadsheets, even a 200-page contract!'],
        ['filo', 'Claude reads, summarizes, extracts and analyzes them. But careful: it can <b>understand</b> images… it just can’t <b>generate</b> them by itself.']],
      arti: [['arti', 'I’m Arti! <b>Artifacts</b> are standalone things Claude makes in their own side panel: dashboards, flowcharts, landing pages, even little games!'],
        ['arti', 'You can keep changing them without losing them in the chat. And if Claude doesn’t make one, just say “create this as an artifact.”']],
      ressa: [['ressa', 'I’m Ressa, and I do <b>Research</b>! Click the + button, then Research. Claude makes a plan, then runs lots of searches that build on each other.'],
        ['ressa', 'It takes a bit longer, but it does hours of research in minutes, and everything comes with <b>citations</b> so you can check it.']],
    }[who];
    await ui.say(lines);
    this.talked.add(who);
    if (this.talked.size === 3 && this.stage === 'gallery') {
      this.stage = 'gate';
      await ui.say(['sparky', 'You talked to the whole gallery! Gumdrop is waiting at the gate.']);
    }
    this.setObj();
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.stage !== 'gate') { await ui.say(['gum', 'Hiya! Light the lantern and talk to all three gallery mushrooms first. Then candy time! 🍬']); return; }
    await ui.say(['gum', 'You explored the whole cave! Catch my candies. And watch out, the <b>Shiny Siren</b> lives behind me. Her answers ALWAYS look perfect…']);
    await this.gateCandies([
      ['💎 ICC', '<b>Instructions, Context, Constraints</b>, plus an example.'],
      ['🦇 Interview', 'Let Claude ask YOU for the context it needs.'],
      ['🏮 Ground first', 'Have Claude <b>research first</b>, then ask your real question.'],
    ]);
    await ui.say(['gum', 'Wow-wee! Okay, scooting! Remember: first answers aren’t always perfect…']);
    this.gate.openGate();
    this.setObj();
  }

  // ----- boss -----
  async startBoss() {
    const ui = this.game.ui, A = this.arena;
    this.spawn.set(0, A.y + 0.1, A.z + 10.5);
    this.stage = 'boss';
    this.boss = new Boss(this, {
      name: 'Shiny Siren', model: makeSiren(), arena: A, radius: 1.7, height: 4, speaker: 'siren', floaty: true,
      attacks: ['bubbles', 'rain'], chase: 1.4, rainColor: 0xbff3ff,
      padLabel: 'Push-Back Pad', padColor: 0x7fd6e8,
      tips: [
        'First answers usually aren’t perfect. <b>Push back</b> and ask what’s missing.',
        '<b>ICC</b>: Instructions, Context, Constraints.',
        'Not sure what context to give? Ask Claude to <b>interview you</b>.',
        '<b>Web search</b> brings up-to-date info and helps reduce hallucinations.',
        '<b>Research</b> runs many searches and gives citations you can check.',
        'An <b>example</b> of what you want is a great constraint.',
      ],
      lines: {
        hit: ['Ow! You saw right through my sparkle! Fine, I’ll shine EVEN BRIGHTER!', 'No no no! You keep pushing back! My perfect answers… they’re getting… better?!'],
      },
      onDefeat: (b) => this.bossDefeated(b),
    });
    this.game.player.frozen = true;
    this.game.sparkyOverride = V(2, A.y + 3, A.z + 8);
    await this.wait(500);
    ui.banner('Shiny Siren', 'BOSS');
    await this.wait(1200);
    await ui.say([
      ['siren', 'Ooh, hello darling! Let me give you the PERFECT answer. My first answers are always flawless~ ✨'],
      ['siren', 'Don’t you DARE question them. Just copy and paste! Mwah!'],
      ['sparky', '{name}, the video warned us: AI always SOUNDS good at first, but the first answer usually isn’t. Dodge her <b>bubbles</b> and the falling <b>crystals</b>!'],
      ['sparky', 'When she gets dizzy, step on the <b>Push-Back Pad</b> and I’ll zap her with a clear-thinking beam!'],
    ]);
    this.game.sparkyOverride = null;
    this.game.player.frozen = false;
    this.boss.begin();
    this.setObj();
  }

  tick(dt, t) { if (this.boss) this.boss.update(dt, t); }
  onDefeat() { if (this.boss) this.boss.reset(); }

  async bossDefeated(b) {
    const ui = this.game.ui;
    await ui.say([
      ['siren', '…you pushed back, again and again. And every time, my answer got better.'],
      ['siren', 'Maybe being a good collaborator is prettier than being “perfect.” Thank you, {name}. 💙'],
      ['sparky', 'The caves are sparkling again! Great prompts, a context interview, search, and always iterate. You’re a prompting pro!'],
    ]);
    this.stage = 'done';
    const A = this.arena;
    this.portal(A.x, A.y, A.z + 2, 0x6fb7e9);
    this.trigger(A.x, A.y, A.z + 2, 1.3, () => this.game.completeWorld('w2', ['prompting', 'research']));
    this.setObj();
  }

  setObj() {
    const ui = this.game.ui;
    const s = this.stage;
    if (s === 'crystals' && this.got.size < 3) ui.setObjective(`Collect the 3 ICC crystals (${this.got.size}/3)`);
    else if (s === 'crystals') ui.setObjective('Use the Prompt Forge');
    else if (s === 'interview') ui.setObjective('Talk to Questy the bat');
    else if (s === 'lantern') ui.setObjective('Light the Search Lantern');
    else if (s === 'gallery') ui.setObjective(`Cross the tunnel and talk to the gallery mushrooms (${this.talked.size}/3)`);
    else if (s === 'gate' && !this.gate.open) ui.setObjective('Talk to Gumdrop at the gate');
    else if (s === 'gate') ui.setObjective('Enter the arena… sparkly danger ahead!');
    else if (s === 'boss') ui.setObjective('Dodge the Siren. When she’s dizzy, step on the Push-Back Pad!');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Context Caves', 'World 2');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'Ooh, it’s dark and sparkly in here! The video said a basic prompt gets you basic, generic results. It’s all in <b>how</b> you ask.'],
      ['sparky', 'Three glowing <b>prompt crystals</b> are hidden in these caves. Let’s find them! And watch out for the <b>Fuzzles</b>. They’re made of vague fog. Jump on them!'],
    ]);
  }
}

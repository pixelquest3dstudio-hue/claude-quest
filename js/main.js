import * as THREE from 'three';
import { Input, bindCanvas, endFrame } from './input.js';
import { UI } from './ui.js';
import { SaveMenu } from './savemenu.js';
import { Theater, allWatched } from './theater.js';
import { Player } from './player.js';
import { FX } from './fx.js';
import { Sfx } from './audio.js';
import { makeSparky, animateSparky } from './creatures.js';
import { save, persist, resetSave, hasProgress } from './save.js';
import { SPARKY_SVG, heroSVG } from './portraits.js';
import { WORLDS, CARDS } from './data.js';
import { HubLevel } from './levels/hub.js';
import { World0 } from './levels/world0.js';
import { World1 } from './levels/world1.js';
import { World2 } from './levels/world2.js';
import { World3 } from './levels/world3.js';
import { World4 } from './levels/world4.js';
import { World5 } from './levels/world5.js';
import { World6 } from './levels/world6.js';
import { World7 } from './levels/world7.js';
import { DesignStudio } from './levels/design.js';

const LEVELS = { hub: HubLevel, w0: World0, w1: World1, w2: World2, w3: World3, w4: World4, w5: World5, w6: World6, w7: World7, design: DesignStudio };

class Game {
  constructor() {
    const canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    this.cam = { yaw: 0, pitch: 0.38, dist: 9.5, target: new THREE.Vector3(), orbit: false };
    bindCanvas(canvas);
    this.ui = new UI(this);
    this.saves = new SaveMenu(this);
    this.theater = new Theater(this);
    this.fx = new FX();
    this.player = new Player(this);
    if (save.avatar) this.player.setAvatar(save.avatar);
    this.sparky = makeSparky();
    this.sparkyPos = new THREE.Vector3();
    this.level = null;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.shakeAmt = 0;
    this.sparkyOverride = null;
    Sfx.muted = !!save.muted;
    this.ui.setHearts(3, 3);
    this.ui.setStars(Object.keys(save.stars).length);
    addEventListener('resize', () => this.resize());
    this.resize();
    window.jesiDev = { save, unlockAll: () => { WORLDS.forEach((w) => { save.done[w.key] = true; w.videos.forEach((v) => (save.watched[v] = true)); }); persist(); location.reload(); }, reset: () => { resetSave(); location.reload(); } };
    this.titleScreen();
    this.loop();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 70 : 55;
    this.camera.updateProjectionMatrix();
  }

  toggleMute() {
    Sfx.muted = !Sfx.muted;
    save.muted = Sfx.muted; persist();
    document.getElementById('btn-mute').textContent = Sfx.muted ? '🔇' : '🔊';
    this.ui.toast(Sfx.muted ? 'Sound off' : 'Sound on', 900);
  }

  // ---------- title ----------
  async titleScreen() {
    await this.goTo('hub', { title: true });
    const t = document.getElementById('title');
    const cont = document.getElementById('btn-continue');
    const start = document.getElementById('btn-start');
    cont.style.display = hasProgress() ? '' : 'none';
    start.textContent = hasProgress() ? 'New Game' : 'Start Adventure';
    t.classList.remove('hidden');
    this.ui.showHud(false);
    this.cam.orbit = true;
    const go = async (fresh) => {
      Sfx.unlock(); Sfx.portal();
      if (fresh && hasProgress()) {
        if (!confirm('Start a new game? Your saved progress will be erased.')) return;
        resetSave();
        this.ui.setStars(0);
      }
      if (fresh || !save.playerName || !save.avatar) {
        t.classList.add('hidden');
        const who = await this.askName();
        if (who == null) { t.classList.remove('hidden'); return; }
        save.playerName = who.name;
        save.avatar = who.avatar;
        persist();
        this.player.setAvatar(who.avatar);
      }
      t.classList.add('hidden');
      this.cam.orbit = false;
      this.ui.showHud(true);
      // pick up in the world the player was last in
      const w = !fresh && WORLDS.find((x) => x.key === save.world);
      await this.goTo(w && w.built && this.unlocked(w) && allWatched(w.videos) ? w.key : 'hub');
    };
    start.onclick = () => go(true);
    cont.onclick = () => go(false);
  }

  // Avatar + name screen. Resolves { name, avatar }, or null if the player goes back.
  askName() {
    const box = document.getElementById('name-entry');
    const form = document.getElementById('name-form');
    const input = document.getElementById('name-input');
    document.getElementById('name-sparky').innerHTML = SPARKY_SVG;
    document.getElementById('avatar-female').innerHTML = heroSVG('female');
    document.getElementById('avatar-male').innerHTML = heroSVG('male');
    const err = document.getElementById('name-error');
    err.textContent = '';
    input.value = save.playerName || '';
    input.oninput = () => { err.textContent = ''; };
    let avatar = save.avatar || '';
    const opts = [...document.querySelectorAll('.avatar-opt')];
    const mark = () => opts.forEach((o) => o.classList.toggle('selected', o.dataset.avatar === avatar));
    mark();
    opts.forEach((o) => (o.onclick = () => { avatar = o.dataset.avatar; err.textContent = ''; Sfx.pop(); mark(); input.focus(); }));
    const shake = (msg) => {
      Sfx.bad();
      err.textContent = msg;
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    };
    box.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
    return new Promise((res) => {
      const done = (v) => {
        box.classList.add('hidden');
        form.onsubmit = null;
        document.getElementById('name-back').onclick = null;
        input.blur();
        res(v);
      };
      form.onsubmit = (e) => {
        e.preventDefault();
        const name = input.value.replace(/\s+/g, ' ').trim().slice(0, 14);
        if (!avatar) { shake('Please select a character first!'); return; }
        if (!name) { shake('Please type your name first!'); input.focus(); return; }
        Sfx.good();
        done({ name, avatar });
      };
      document.getElementById('name-back').onclick = () => done(null);
    });
  }

  // ---------- level flow ----------
  async goTo(key, opts = {}) {
    this.transitioning = true;
    if (this.level) await this.ui.fadeOut();
    this.fx.clear();
    if (this.level) { this.level.scene.remove(this.player.obj, this.sparky); this.level.dispose(); }
    const L = LEVELS[key];
    const level = new L(this, key, opts);
    level.build(opts);
    level.scene.add(this.player.obj, this.sparky);
    this.level = level;
    if (!opts.title) { save.world = key === 'hub' ? '' : key; persist(); }
    this.player.hp = this.player.maxHp;
    this.ui.setHearts(this.player.hp, this.player.maxHp);
    this.ui.boss(null);
    this.ui.prompt(null);
    this.cam.yaw = level.spawnYaw;
    this.player.reset(level.spawn, level.spawnYaw);
    this.cam.target.copy(level.spawn).add(new THREE.Vector3(0, 1.3, 0));
    this.sparkyPos.copy(level.spawn).add(new THREE.Vector3(1, 2.2, 1));
    await this.ui.fadeIn();
    this.transitioning = false;
    if (!opts.title && level.start) level.start(opts);
  }

  unlocked(world) {
    if (world.key === 'w0') return true;
    if (world.bonus) return !!save.done.w0;
    const i = WORLDS.findIndex((w) => w.key === world.key);
    return !!save.done[WORLDS[i - 1].key];
  }

  async enterWorld(key) {
    const w = WORLDS.find((x) => x.key === key);
    if (!this.unlocked(w)) { this.ui.toast('🔒 Finish the world before this one first!'); return false; }
    if (!w.built) { this.ui.toast(`🚧 ${w.name} is still being built. Coming soon!`, 2400); return false; }
    Sfx.portal();
    const res = await this.theater.open(w);
    if (res === 'play' && allWatched(w.videos)) { await this.goTo(key); return true; }
    return false;
  }

  async completeWorld(key, stickers = []) {
    save.done[key] = true;
    for (const s of stickers) if (!save.stickers.includes(s)) save.stickers.push(s);
    persist();
    Sfx.win();
    this.fx.confetti(this.level.scene, this.player.pos.clone().add(new THREE.Vector3(0, 2, 0)));
    const w = WORLDS.find((x) => x.key === key);
    this.ui.banner(`${w.name} restored!`, 'World complete');
    await this.level.wait(1600);
    if (stickers.length) {
      await this.ui.say(['sparky', `You earned ${stickers.length > 1 ? 'new stickers' : 'a new sticker'} for your Sticker Book: ${stickers.map((s) => '“' + CARDS[s].title + '”').join(' and ')}! Press <b>B</b> anytime to read your cheat sheets.`]);
    }
    if (key === 'w7') await this.showEnding();
    await this.goTo('hub', { from: key });
  }

  showEnding() {
    const el = document.getElementById('ending');
    document.getElementById('end-name').textContent = save.playerName || 'Adventurer';
    this.ui.pushModal();
    el.classList.remove('hidden');
    this.fx.confetti(this.level.scene, this.player.pos.clone().add(new THREE.Vector3(0, 3, 0)));
    return new Promise((res) => {
      document.getElementById('end-close').onclick = () => { el.classList.add('hidden'); this.ui.popModal(); Sfx.good(); res(); };
    });
  }

  // ---------- player events ----------
  playerFell() {
    const p = this.player;
    this.fx.puff(this.level.scene, p.pos.clone(), 0xffffff, 10);
    if (!this.level.gentle) {
      p.hp -= 1;
      this.ui.setHearts(p.hp, p.maxHp);
      Sfx.hurt();
      if (p.hp <= 0) { this.playerDefeated(); return; }
    } else Sfx.pop();
    p.reset(this.level.spawn, this.cam.yaw);
    p.invuln = 1;
  }

  async playerDefeated() {
    if (this.defeating) return;
    this.defeating = true;
    const p = this.player;
    p.frozen = true;
    await this.ui.fadeOut(350);
    p.hp = p.maxHp;
    this.ui.setHearts(p.hp, p.maxHp);
    p.reset(this.level.spawn, this.cam.yaw);
    this.level.onDefeat && this.level.onDefeat();
    await this.ui.fadeIn(350);
    await this.ui.say(['sparky', 'Oof! That’s okay. Every great designer iterates! Hearts refilled. Let’s try again!']);
    p.frozen = false;
    this.defeating = false;
  }

  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }

  // ---------- main loop ----------
  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    this.time += dt;
    const t = this.time;
    const L = this.level;
    this.ui.tick(dt);
    if (L) {
      const blocked = this.ui.blocking || this.transitioning || this.cam.orbit;
      if (!blocked) {
        L.t += dt;
        L.updateMovers(dt);
        this.player.update(dt, t);
        L.update(dt);
        L.tick && L.tick(dt, t);
      } else {
        this.player.idle(t, dt);
      }
      L.animate(t, dt);
      this.updateSparky(dt, t);
      this.updateCamera(dt, t);
      if (L.sun) {
        L.sun.position.copy(this.player.pos).add(new THREE.Vector3(12, 25, 10));
        L.sun.target.position.copy(this.player.pos);
      }
      this.fx.update(dt);
      this.renderer.render(L.scene, this.camera);
    }
    endFrame();
  }

  updateSparky(dt, t) {
    const p = this.player.pos;
    let target;
    if (this.sparkyOverride) target = this.sparkyOverride;
    else {
      const yaw = this.cam.yaw;
      target = new THREE.Vector3(p.x + Math.cos(yaw) * 0.95 + Math.sin(yaw) * 0.3, p.y + 2.0, p.z - Math.sin(yaw) * 0.95 + Math.cos(yaw) * 0.3);
    }
    this.sparkyPos.lerp(target, 1 - Math.pow(0.02, dt));
    this.sparky.position.copy(this.sparkyPos);
    const cp = this.camera.position;
    this.sparky.rotation.y = Math.atan2(cp.x - this.sparkyPos.x, cp.z - this.sparkyPos.z);
    animateSparky(this.sparky, t);
  }

  updateCamera(dt, t) {
    const c = this.cam;
    if (c.orbit) {
      c.yaw += dt * 0.12;
      c.target.lerp(new THREE.Vector3(0, 1.5, 0), 1 - Math.pow(0.1, dt));
    } else {
      c.yaw -= Input.dx * 0.006;
      c.pitch = THREE.MathUtils.clamp(c.pitch + Input.dy * 0.004, 0.05, 1.25);
      if (Input.down.has('KeyQ')) c.yaw += dt * 2.2;
      if (Input.down.has('KeyR')) c.yaw -= dt * 2.2;
      c.dist = THREE.MathUtils.clamp(c.dist + Input.wheel * 0.8, 5, 18);
      const p = this.player.pos;
      const tgt = new THREE.Vector3(p.x, p.y + 1.3, p.z);
      c.target.x += (tgt.x - c.target.x) * (1 - Math.pow(0.0005, dt));
      c.target.z += (tgt.z - c.target.z) * (1 - Math.pow(0.0005, dt));
      c.target.y += (tgt.y - c.target.y) * (1 - Math.pow(0.02, dt));
    }
    const dist = c.orbit ? 26 : c.dist;
    const pitch = c.orbit ? 0.45 : c.pitch;
    const pos = new THREE.Vector3(
      c.target.x + Math.sin(c.yaw) * Math.cos(pitch) * dist,
      c.target.y + Math.sin(pitch) * dist,
      c.target.z + Math.cos(c.yaw) * Math.cos(pitch) * dist,
    );
    if (this.shakeAmt > 0) {
      pos.x += (Math.random() - 0.5) * this.shakeAmt;
      pos.y += (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.2);
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(c.target);
  }
}

window.game = new Game();

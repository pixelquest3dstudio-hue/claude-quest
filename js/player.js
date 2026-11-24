import * as THREE from 'three';
import { makeJesi, animateJesi } from './creatures.js';
import { Input, held, hit } from './input.js';
import { Sfx } from './audio.js';

const SPEED = 6.5, JUMP = 10, DJUMP = 9, GRAV = 28, DASH = 16, DASH_T = 0.18;

export class Player {
  constructor(game) {
    this.game = game;
    this.model = makeJesi('female');
    this.style = 'female';
    this.obj = this.model.root;
    this.pos = new THREE.Vector3();
    this.prev = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.facing = 0;
    this.radius = 0.35;
    this.height = 1.5;
    this.grounded = false;
    this.ground = null;
    this.coyote = 0; this.buffer = 0; this.jumps = 0;
    this.dashT = 0; this.dashCd = 0; this.canDash = true; this.dashDir = new THREE.Vector3();
    this.maxHp = 3; this.hp = 3; this.invuln = 0;
    this.frozen = false;
    this.squash = 0;
    this.wasGrounded = false;
  }

  // swap between the girl and boy avatar (keeps the same root object in the scene)
  setAvatar(style) {
    if (this.style === style) return;
    this.style = style;
    const m = makeJesi(style);
    this.obj.remove(this.model.body);
    this.obj.add(m.body);
    m.root = this.obj;
    this.model = m;
  }

  reset(pos, yaw = 0) {
    this.pos.copy(pos); this.prev.copy(pos); this.vel.set(0, 0, 0);
    this.facing = yaw + Math.PI;
    this.ground = null; this.dashT = 0; this.jumps = 0;
    this.obj.position.copy(pos);
    this.obj.rotation.y = this.facing;
  }

  update(dt, t) {
    const g = this.game;
    if (this.ground && this.ground.delta) this.pos.add(this.ground.delta);

    // movement input relative to the camera
    let ix = 0, iz = 0;
    if (!this.frozen) {
      if (held('KeyW', 'ArrowUp')) iz += 1;
      if (held('KeyS', 'ArrowDown')) iz -= 1;
      if (held('KeyA', 'ArrowLeft')) ix -= 1;
      if (held('KeyD', 'ArrowRight')) ix += 1;
    }
    const yaw = g.cam.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
    const ml = Math.hypot(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }

    if (!this.frozen && hit('Space')) this.buffer = 0.13;
    this.buffer -= dt;
    this.dashCd -= dt;

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vel.x = this.dashDir.x * DASH;
      this.vel.z = this.dashDir.z * DASH;
      this.vel.y = Math.max(this.vel.y, 0) * 0.5;
      if (Math.random() < 0.6) g.fx.puff(g.level.scene, this.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 0xffe3f1, 1);
    } else {
      const accel = this.grounded ? 45 : 20;
      const tx = mx * SPEED, tz = mz * SPEED;
      this.vel.x += THREE.MathUtils.clamp(tx - this.vel.x, -accel * dt, accel * dt);
      this.vel.z += THREE.MathUtils.clamp(tz - this.vel.z, -accel * dt, accel * dt);
    }

    // jumping (with coyote time + a double jump)
    if (this.buffer > 0) {
      if (this.grounded || this.coyote > 0) {
        this.vel.y = JUMP; this.jumps = 1; this.coyote = 0; this.buffer = 0; this.grounded = false; this.ground = null;
        this.squash = -0.25; Sfx.jump();
      } else if (this.jumps < 2) {
        this.vel.y = DJUMP; this.jumps = 2; this.buffer = 0; this.dashT = 0;
        this.squash = -0.2; Sfx.djump();
        g.fx.spawn(g.level.scene, this.pos.clone(), 0xffffff, { n: 8, speed: 2, size: 0.12, up: -1, life: 0.4 });
      }
    }

    // dash
    if (!this.frozen && hit('ShiftLeft', 'ShiftRight') && this.dashCd <= 0 && this.canDash) {
      if (ml > 0.1) this.dashDir.set(mx, 0, mz).normalize();
      else this.dashDir.set(Math.sin(this.facing), 0, Math.cos(this.facing));
      this.dashT = DASH_T; this.dashCd = 0.5;
      if (!this.grounded) this.canDash = false;
      Sfx.dash();
    }

    // gravity (falls faster if you let go of jump early = variable jump height)
    if (this.dashT <= 0) {
      const extra = this.vel.y > 0 && !held('Space') ? 2.2 : 1;
      this.vel.y -= GRAV * extra * dt;
      if (this.vel.y < -30) this.vel.y = -30;
    }

    this.prev.copy(this.pos);
    this.pos.addScaledVector(this.vel, dt);
    g.level.resolvePlayer(this);

    if (this.grounded) {
      if (!this.wasGrounded && this.prevVy < -6) { this.squash = 0.25; Sfx.land(); }
      this.coyote = 0.1; this.jumps = 0; this.canDash = true;
    } else {
      this.coyote -= dt;
      if (this.jumps === 0 && this.coyote <= 0) this.jumps = 1; // walked off a ledge: only the double jump is left
    }
    this.wasGrounded = this.grounded;
    this.prevVy = this.vel.y;

    // facing
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (ml > 0.1 || this.dashT > 0) {
      const target = this.dashT > 0 ? Math.atan2(this.dashDir.x, this.dashDir.z) : Math.atan2(mx, mz);
      let d = target - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * Math.min(1, dt * 14);
    }

    if (this.pos.y < g.level.killY) g.playerFell();

    // visuals
    this.invuln -= dt;
    this.obj.visible = this.invuln > 0 ? Math.floor(t * 20) % 2 === 0 : true;
    this.obj.position.copy(this.pos);
    this.obj.rotation.y = this.facing;
    this.squash *= Math.pow(0.0001, dt);
    const sq = this.squash;
    this.model.body.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    animateJesi(this.model, { speed: hs, grounded: this.grounded, vy: this.vel.y, dashing: this.dashT > 0 }, t, dt);
  }

  idle(t, dt) {
    this.obj.position.copy(this.pos);
    animateJesi(this.model, { speed: 0, grounded: true, vy: 0, dashing: false }, t, dt);
  }

  hurt(from, dmg = 1) {
    if (this.invuln > 0) return;
    const g = this.game;
    this.hp -= dmg;
    this.invuln = 1.4;
    Sfx.hurt();
    g.shake(0.35);
    g.ui.setHearts(this.hp, this.maxHp);
    g.ui.flash();
    if (from) {
      const d = new THREE.Vector3(this.pos.x - from.x, 0, this.pos.z - from.z);
      if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
      d.normalize().multiplyScalar(8);
      this.vel.set(d.x, 7, d.z);
      this.dashT = 0;
    }
    if (this.hp <= 0) g.playerDefeated();
  }
}

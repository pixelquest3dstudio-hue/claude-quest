import * as THREE from 'three';

const geo = new THREE.SphereGeometry(1, 8, 6);
geo.userData.shared = true;
const box = new THREE.BoxGeometry(1, 1, 0.2);
box.userData.shared = true;

// Little particle puffs, sparkles and confetti.
export class FX {
  constructor() { this.items = []; }

  spawn(scene, pos, color, { n = 10, speed = 3, size = 0.12, life = 0.7, up = 2, gravity = 6, shape = geo } = {}) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({ color, transparent: true }));
      m.scale.setScalar(size * (0.6 + Math.random() * 0.8));
      m.position.copy(pos);
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI * 0.5;
      const v = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).multiplyScalar(speed * (0.5 + Math.random()));
      v.y += up;
      scene.add(m);
      this.items.push({ m, v, life, max: life, scene, gravity, spin: (Math.random() - 0.5) * 10 });
    }
  }

  burst(scene, pos, color, n = 12) { this.spawn(scene, pos, color, { n, speed: 3.5, size: 0.1, life: 0.6 }); }
  puff(scene, pos, color = 0xffffff, n = 8) { this.spawn(scene, pos, color, { n, speed: 1.5, size: 0.2, life: 0.5, up: 0.8, gravity: 0 }); }
  confetti(scene, pos) {
    const colors = [0xff8fb1, 0xffd166, 0xb79cf0, 0x7fd6c2, 0x9be7ff];
    for (const c of colors) this.spawn(scene, pos, c, { n: 14, speed: 6, size: 0.14, life: 1.8, up: 6, gravity: 7, shape: box });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      p.v.y -= p.gravity * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += p.spin * dt; p.m.rotation.y += p.spin * dt;
      p.m.material.opacity = Math.max(0, p.life / p.max);
      if (p.life <= 0) {
        p.scene.remove(p.m);
        p.m.material.dispose();
        this.items.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.items) { p.scene.remove(p.m); p.m.material.dispose(); }
    this.items = [];
  }
}

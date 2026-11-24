// Cute synthesized sound effects (no audio files needed).
let ctx = null;
let master = null;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(f, d, { type = 'sine', vol = 0.15, to = null, delay = 0 } = {}) {
  if (Sfx.muted) return;
  try {
    const c = ac();
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + d + 0.03);
  } catch (e) { /* audio not available */ }
}

const seq = (notes, step, opts) => notes.forEach((f, i) => tone(f, step * 1.6, { ...opts, delay: i * step }));

export const Sfx = {
  muted: false,
  jump: () => tone(420, 0.15, { to: 760, vol: 0.1 }),
  djump: () => tone(620, 0.16, { to: 1180, vol: 0.1, type: 'triangle' }),
  dash: () => tone(900, 0.18, { to: 260, vol: 0.06, type: 'sawtooth' }),
  land: () => tone(170, 0.06, { vol: 0.06 }),
  star: () => seq([880, 1175, 1568], 0.06, { vol: 0.09, type: 'triangle' }),
  talk: (p = 1) => tone(480 * p + Math.random() * 120, 0.035, { vol: 0.035, type: 'square' }),
  good: () => seq([660, 830, 990, 1320], 0.07, { vol: 0.09, type: 'triangle' }),
  bad: () => tone(320, 0.28, { to: 150, vol: 0.09, type: 'triangle' }),
  hurt: () => tone(520, 0.25, { to: 110, vol: 0.11, type: 'square' }),
  boom: () => tone(140, 0.45, { to: 40, vol: 0.22 }),
  stomp: () => tone(300, 0.12, { to: 950, vol: 0.1 }),
  click: () => tone(820, 0.05, { vol: 0.05 }),
  portal: () => seq([523, 659, 784, 1047, 1319], 0.08, { vol: 0.08, type: 'sine' }),
  win: () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.11, { vol: 0.1, type: 'triangle' }),
  beam: () => tone(300, 0.6, { to: 1600, vol: 0.12, type: 'sawtooth' }),
  pop: () => tone(700, 0.08, { to: 1400, vol: 0.08 }),
  unlock: () => { try { ac(); } catch (e) {} },
};

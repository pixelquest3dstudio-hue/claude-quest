// Keyboard + mouse input. `pressed` holds keys pressed this frame, `down` holds keys currently held.
export const Input = { down: new Set(), pressed: new Set(), dx: 0, dy: 0, wheel: 0, dragging: false };

const BLOCK = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (!e.repeat) Input.pressed.add(e.code);
  Input.down.add(e.code);
  if (BLOCK.includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => Input.down.delete(e.code));
window.addEventListener('blur', () => Input.down.clear());

export function bindCanvas(canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    Input.dragging = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!Input.dragging) return;
    Input.dx += e.movementX;
    Input.dy += e.movementY;
  });
  const up = () => (Input.dragging = false);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { Input.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
}

export const held = (...codes) => codes.some((c) => Input.down.has(c));
export const hit = (...codes) => codes.some((c) => Input.pressed.has(c));

export function endFrame() {
  Input.pressed.clear();
  Input.dx = 0; Input.dy = 0; Input.wheel = 0;
}

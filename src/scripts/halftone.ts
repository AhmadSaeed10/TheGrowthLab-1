// Live halftone burst for the hero. Dots swell and turn red under the pointer.
export function initHalftone(): (() => void) | undefined {
  const c = document.getElementById('halftone') as HTMLCanvasElement | null;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let w = 0, h = 0, dpr = 1, raf = 0, visible = true, lastMove = -1e9;
  let rect = c.getBoundingClientRect();
  const p = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  const resize = () => {
    rect = c.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce) draw(0);
  };

  const draw = (t: number) => {
    ctx.clearRect(0, 0, w, h);
    const g = w < 640 ? 11 : 15;
    const cx = w * 0.5, cy = h * 0.5;
    const R = Math.min(w, h) * 0.5;
    const rot = t * 0.00005;
    const maxR = g * 0.56;
    const infl = Math.max(120, Math.min(w, h) * 0.22);
    const blk = new Path2D(), red = new Path2D();
    for (let y = g / 2; y < h; y += g) {
      for (let x = g / 2; x < w; x += g) {
        const dx = x - cx, dy = y - cy;
        const d = Math.hypot(dx, dy);
        const th = Math.atan2(dy, dx) + rot;
        const edge = R * (0.46 + 0.54 * Math.pow(Math.abs(Math.cos(4 * th)), 1.25));
        let f = 1 - d / edge;
        f = f < 0 ? 0 : Math.pow(f, 0.75);
        f *= 1 + 0.07 * Math.sin(t * 0.0016 + d * 0.025);
        const pd = Math.hypot(x - p.x, y - p.y);
        let q = 0;
        if (pd < infl) { q = 1 - pd / infl; q = q * q * (3 - 2 * q); }
        const r = Math.min(maxR * 1.08, (f * 1.12 + q * 0.95) * maxR);
        if (r < 0.4) continue;
        const path = q > 0.18 ? red : blk;
        path.moveTo(x + r, y);
        path.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = '#141414'; ctx.fill(blk);
    ctx.fillStyle = '#d3151b'; ctx.fill(red);
  };

  const loop = (t: number) => {
    if (!visible) { raf = 0; return; }
    const idle = t - lastMove > 2200;
    if (!fine || idle) {
      // Gentle autopilot for touch devices and idle desktops
      p.tx = w * 0.5 + Math.cos(t * 0.0007) * w * 0.28;
      p.ty = h * 0.5 + Math.sin(t * 0.0011) * h * 0.24;
    }
    p.x += (p.tx - p.x) * 0.14; p.y += (p.ty - p.y) * 0.14;
    draw(t);
    raf = requestAnimationFrame(loop);
  };

  const move = (e: PointerEvent) => {
    rect = c.getBoundingClientRect();
    p.tx = e.clientX - rect.left; p.ty = e.clientY - rect.top; lastMove = performance.now();
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf && !reduce) raf = requestAnimationFrame(loop);
  });
  const ro = new ResizeObserver(resize);

  resize();
  if (!reduce) {
    io.observe(c);
    if (fine) addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(loop);
  }
  ro.observe(c);

  return () => {
    cancelAnimationFrame(raf); raf = 0; io.disconnect(); ro.disconnect();
    removeEventListener('pointermove', move);
  };
}

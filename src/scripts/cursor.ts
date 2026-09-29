export const cursorState = { on: false };

export function initCursor() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.getElementById('cursor');
  if (!fine || reduced || !el) return;
  const label = el.querySelector<HTMLElement>('.cursor__label')!;
  cursorState.on = true;
  document.documentElement.classList.add('has-cursor');
  el.classList.add('is-hidden');

  addEventListener(
    'pointermove',
    (e) => {
      el.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
      el.classList.remove('is-hidden');
    },
    { passive: true }
  );
  document.addEventListener('mouseleave', () => el.classList.add('is-hidden'));
  addEventListener('pointerdown', () => el.classList.add('is-down'));
  addEventListener('pointerup', () => el.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element;
    const typing = t.closest('input, textarea, select');
    el.classList.toggle('is-hidden', !!typing);
    const c = t.closest<HTMLElement>('[data-cursor]');
    const link = t.closest('a, button, summary, label, [role="button"]');
    el.classList.toggle('is-link', !!link);
    if (c && c.dataset.cursor) {
      label.textContent = c.dataset.cursor;
      el.classList.add('has-label');
    } else {
      el.classList.remove('has-label');
    }
  });
}

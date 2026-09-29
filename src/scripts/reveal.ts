const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function splitWords(el: HTMLElement) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  let i = 0;
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const parts = (n.textContent || '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) return frag.appendChild(document.createTextNode(' '));
          const w = document.createElement('span');
          w.className = 'w';
          const s = document.createElement('span');
          s.textContent = p;
          s.style.setProperty('--i', String(i++));
          w.appendChild(s);
          frag.appendChild(w);
        });
        n.parentNode!.replaceChild(frag, n);
      } else if (n.nodeType === 1) {
        const e = n as HTMLElement;
        if (e.tagName !== 'BR' && !e.classList.contains('w')) walk(e);
      }
    });
  };
  walk(el);
}

export function initReveal() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const loneHl = Array.from(document.querySelectorAll<HTMLElement>('.hl')).filter((h) => !h.closest('[data-reveal]'));

  if (reduced()) {
    [...targets, ...loneHl].forEach((t) => t.classList.add('is-in'));
    return;
  }

  targets.forEach((el) => {
    if (el.dataset.reveal === 'words') splitWords(el);
    if (el.dataset.reveal === 'stagger') Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i)));
    const d = el.dataset.delay;
    if (d) el.style.setProperty('--d', d);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  [...targets, ...loneHl].forEach((t) => io.observe(t));
}

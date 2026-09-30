const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

let disposers: Array<() => void> = [];
function listen<K extends keyof WindowEventMap>(t: Window | Document | HTMLElement, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions) {
  t.addEventListener(type, fn as EventListener, opts);
  disposers.push(() => t.removeEventListener(type, fn as EventListener, opts));
}
export function disposeUi() {
  disposers.forEach((d) => d());
  disposers = [];
  document.documentElement.style.overflow = '';
}

/* ---------- Header: progress, hide on scroll down, sticky CTA ---------- */
export function initGlobalScroll() {
  let last = scrollY, ticking = false;
  const run = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--progress', String(max > 0 ? y / max : 0));
    const header = $('.site-header');
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      const open = document.documentElement.classList.contains('menu-open');
      header.classList.toggle('is-hidden', !open && y > 320 && y > last + 4);
      if (y < last - 4) header.classList.remove('is-hidden');
    }
    $('.mcta')?.classList.toggle('is-on', y > innerHeight * 0.9);
    last = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  document.addEventListener('astro:page-load', run);
  run();
}

/* ---------- Mobile menu ---------- */
export function initMenu() {
  const html = document.documentElement;
  html.classList.remove('menu-open');
  const btn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  if (!btn || !menu) return;
  const set = (open: boolean) => {
    html.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.toggleAttribute('inert', !open);
    html.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu)?.focus();
  };
  menu.setAttribute('inert', '');
  listen(btn, 'click', () => set(!html.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => listen(a, 'click', () => set(false)));
  listen(document, 'keydown', (e: KeyboardEvent) => { if (e.key === 'Escape' && html.classList.contains('menu-open')) { set(false); btn.focus(); } });
}

/* ---------- Counters ---------- */
export function initCounters() {
  const els = $$('[data-count]');
  if (!els.length || reduced()) return;
  const fmt = (el: HTMLElement, v: number) => (el.dataset.prefix || '') + v.toFixed(+(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
  els.forEach((el) => (el.textContent = fmt(el, 0)));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target as HTMLElement, to = parseFloat(el.dataset.count!), t0 = performance.now(), dur = 1700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(el, to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
  disposers.push(() => io.disconnect());
}

/* ---------- Service list: floating image preview ---------- */
export function initServiceList() {
  const list = $('[data-svc-list]');
  if (!list || !fine() || reduced()) return;
  const prev = $('.svc-preview', list)!;
  const imgs = $$('img', prev);
  const rows = $$('[data-svc-row]', list);
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const loop = () => {
    x += (tx - x) * 0.16; y += (ty - y) * 0.16;
    const lim = list.clientWidth - 150;
    prev.style.transform = `translate3d(${Math.min(x, lim)}px,${y}px,0) translate(60px,-50%) rotate(${Math.max(-8, Math.min(8, (tx - x) * 0.06))}deg)`;
    if (prev.classList.contains('on') || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(loop); else raf = 0;
  };
  rows.forEach((row, i) => {
    listen(row, 'pointerenter', () => { imgs.forEach((im, k) => im.classList.toggle('on', k === i)); prev.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); });
    listen(row, 'pointerleave', () => prev.classList.remove('on'));
  });
  listen(list, 'pointermove', (e: PointerEvent) => { const r = list.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (!prev.classList.contains('on')) { x = tx; y = ty; } });
}

/* ---------- Work reel: drag + buttons + progress ---------- */
export function initReel() {
  const reel = $('[data-reel]');
  if (!reel) return;
  const thumb = $('[data-reel-thumb]');
  let down = false, sx = 0, sl = 0, moved = 0;
  const sync = () => {
    if (!thumb) return;
    const ratio = reel.clientWidth / reel.scrollWidth;
    thumb.style.width = `${Math.min(1, ratio) * 100}%`;
    thumb.style.transform = `translateX(${(reel.scrollLeft / reel.scrollWidth) * (100 / Math.max(ratio, 0.01))}%)`;
  };
  listen(reel, 'scroll', sync, { passive: true });
  listen(window, 'resize', sync);
  sync();
  listen(reel, 'pointerdown', (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; sx = e.clientX; sl = reel.scrollLeft; moved = 0; });
  listen(window, 'pointermove', (e: PointerEvent) => {
    if (!down) return;
    const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
    if (moved > 6) reel.classList.add('drag');
    reel.scrollLeft = sl - dx;
  });
  listen(window, 'pointerup', () => { down = false; reel.classList.remove('drag'); });
  listen(reel, 'click', (e: Event) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, { capture: true });
  const step = () => (reel.firstElementChild as HTMLElement).getBoundingClientRect().width + 20;
  $('[data-reel-prev]')?.addEventListener('click', () => reel.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('[data-reel-next]')?.addEventListener('click', () => reel.scrollBy({ left: step(), behavior: 'smooth' }));
}

/* ---------- TGL model: scroll-driven steps ---------- */
export function initModel() {
  const root = $('[data-model]');
  if (!root) return;
  const steps = $$('[data-step]', root);
  const words = $$('[data-word]', root);
  const info = $$('[data-info]', root);
  const set = (i: number) => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    words.forEach((w, k) => { w.classList.toggle('is-active', k === i); w.setAttribute('aria-current', String(k === i)); });
    info.forEach((n, k) => n.classList.toggle('is-active', k === i));
    root.style.setProperty('--p', String((i + 1) / steps.length));
  };
  set(0);
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(steps.indexOf(e.target as HTMLElement)); }), { rootMargin: '-45% 0px -50% 0px' });
  steps.forEach((s) => io.observe(s));
  disposers.push(() => io.disconnect());
  words.forEach((w, i) => listen(w, 'click', () => steps[i].scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' })));
}

/* ---------- Work filter ---------- */
export function initFilter() {
  const bar = $('[data-filter-bar]');
  if (!bar) return;
  const items = $$('[data-cats]');
  const btns = $$('button[data-filter]', bar);
  const count = $('[data-filter-count]');
  btns.forEach((b) => listen(b, 'click', () => {
    const f = b.dataset.filter!;
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    let n = 0;
    items.forEach((it) => {
      const show = f === 'all' || it.dataset.cats!.split('|').includes(f);
      it.hidden = !show;
      if (show) { n++; it.classList.remove('pop'); void it.offsetWidth; it.classList.add('pop'); }
    });
    if (count) count.textContent = `${n} ${n === 1 ? 'brand' : 'brands'}`;
  }));
}

/* ---------- Lightbox ---------- */
export function initLightbox() {
  const dlg = document.getElementById('lightbox') as HTMLDialogElement | null;
  const triggers = $$('[data-lb]');
  if (!dlg || !triggers.length) return;
  const img = $<HTMLImageElement>('img', dlg)!, cap = $('[data-lb-cap]', dlg)!, cnt = $('[data-lb-count]', dlg)!;
  let i = 0;
  const show = () => {
    const t = triggers[i];
    img.src = t.dataset.src!; img.alt = t.dataset.alt || '';
    cap.textContent = t.dataset.alt || ''; cnt.textContent = `${i + 1} / ${triggers.length}`;
    [i + 1, i - 1].forEach((k) => { const n = triggers[(k + triggers.length) % triggers.length]; if (n) new Image().src = n.dataset.src!; });
  };
  const go = (d: number) => { i = (i + d + triggers.length) % triggers.length; show(); };
  triggers.forEach((t, k) => listen(t, 'click', () => { i = k; show(); dlg.showModal(); document.documentElement.style.overflow = 'hidden'; }));
  listen($('[data-lb-close]', dlg)!, 'click', () => dlg.close());
  listen($('[data-lb-prev]', dlg)!, 'click', () => go(-1));
  listen($('[data-lb-next]', dlg)!, 'click', () => go(1));
  listen(dlg, 'click', (e: MouseEvent) => { if (e.target === dlg) dlg.close(); });
  listen(dlg, 'close', () => (document.documentElement.style.overflow = ''));
  listen(dlg, 'keydown', (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
}

/* ---------- Brief builder ---------- */
export function initBrief() {
  $$<HTMLFormElement>('[data-brief]').forEach((form) => {
    const steps = $$('[data-brief-step]', form);
    const count = $('[data-brief-count]', form)!, bar = $('[data-brief-bar]', form)!;
    const err = $('[data-brief-err]', form)!;
    const back = $('[data-back]', form)!, next = $('[data-next]', form)!, send = $('[data-send]', form)!;
    const done = $('[data-brief-done]', form)!, body = $('[data-brief-body]', form)!;
    const sent = $('[data-brief-sent]', form)!;
    let n = 0;

    const go = (to: number, focus = true) => {
      n = to; err.textContent = '';
      steps.forEach((s, k) => (s.hidden = k !== n));
      count.textContent = `Step ${n + 1} of ${steps.length}`;
      bar.style.setProperty('--p', String((n + 1) / steps.length));
      back.hidden = n === 0; next.hidden = n === steps.length - 1; send.hidden = n !== steps.length - 1;
      if (focus) $<HTMLElement>('legend, h3', steps[n])?.focus();
    };
    const val = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() || '';
    const checked = (name: string) => $$<HTMLInputElement>(`input[name="${name}"]:checked`, form).map((i) => i.value);

    const validate = () => {
      if (n === 0 && !checked('need').length) { err.textContent = 'Pick at least one, so we know where to start.'; return false; }
      if (n === steps.length - 1) {
        if (!val('name')) { err.textContent = 'Add your name so we know who to reply to.'; $<HTMLInputElement>('[name=name]', form)?.focus(); return false; }
        const email = $<HTMLInputElement>('[name=email]', form);
        if (!val('email') || !email?.checkValidity()) { err.textContent = 'Add a valid email so we can reply.'; email?.focus(); return false; }
        const consent = $<HTMLInputElement>('[name=consent]', form);
        if (consent && !consent.checked) { err.textContent = 'Tick the box so we can use your details to reply.'; consent.focus(); return false; }
      }
      return true;
    };
    listen(next, 'click', () => { if (validate()) go(n + 1); });
    listen(back, 'click', () => go(n - 1));
    listen(form, 'submit', async (e: Event) => {
      e.preventDefault();
      if (!validate() || send.hasAttribute('aria-busy')) return;
      const msg = [
        'Hi The Growth Lab, here is my brief.',
        `Name: ${val('name')}`,
        `Email: ${val('email')}`,
        val('contact') ? `WhatsApp: ${val('contact')}` : '',
        val('brand') ? `Brand or website: ${val('brand')}` : '',
        `I need help with: ${checked('need').join(', ')}`,
        checked('stage')[0] ? `Where I am: ${checked('stage')[0]}` : '',
        checked('budget')[0] ? `Monthly ad budget: ${checked('budget')[0]}` : '',
        val('notes') ? `Notes: ${val('notes')}` : '',
      ].filter(Boolean).join('\n');
      const hideForm = () => {
        steps.forEach((s) => (s.hidden = true));
        $('[data-brief-nav]', form)!.hidden = true; $('[data-brief-head]', form)!.hidden = true;
        err.textContent = '';
      };

      const showSent = () => {
        hideForm();
        $('[data-sent-name]', sent)!.textContent = `, ${val('name').split(' ')[0]}`;
        sent.hidden = false; $<HTMLElement>('h3', sent)?.focus();
      };

      // Post straight to the inbox. On failure keep the form open with the reason so it can be retried.
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        if (val('_honey')) { showSent(); return; }
        const label = send.firstChild!.textContent;
        send.setAttribute('aria-busy', 'true'); send.firstChild!.textContent = 'Sending';
        err.textContent = '';
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              name: val('name'), email: val('email'), contact: val('contact'), consent: checked('consent').length ? 'yes' : 'no', brand: val('brand'),
              need: checked('need').join(', '), stage: checked('stage')[0] || '', budget: checked('budget')[0] || '',
              notes: val('notes'), page: location.href,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && String(data.success) === 'true') { showSent(); return; }
          console.warn('Brief not sent:', res.status, data);
          err.textContent = data.message || 'We could not send your brief just now. Please try again.';
        } catch (e) {
          console.warn('Brief not sent:', e);
          err.textContent = 'We could not send your brief right now. Please try again in a moment.';
        } finally { send.removeAttribute('aria-busy'); send.firstChild!.textContent = label; }
        return;
      }

      const wa = form.dataset.wa, mail = form.dataset.email;
      const url = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : `mailto:${mail}?subject=${encodeURIComponent('New brief from ' + val('name'))}&body=${encodeURIComponent(msg)}`;
      body.value = msg;
      hideForm();
      done.hidden = false; $<HTMLElement>('h3', done)?.focus();
      $('[data-channel]', form)!.textContent = wa ? 'WhatsApp' : 'your email app';
      if (wa) window.open(url, '_blank', 'noopener'); else window.location.href = url;
    });
    const copy = $('[data-copy]', form);
    if (copy) listen(copy, 'click', async () => { try { await navigator.clipboard.writeText(body.value); copy.textContent = 'Copied'; } catch { body.select(); } });

    // Prefill from ?need=slug
    const want = new URLSearchParams(location.search).get('need');
    if (want) $$<HTMLInputElement>('input[name="need"]', form).forEach((i) => { if (i.dataset.slug === want) i.checked = true; });
    go(0, false);
  });
}

/* ---------- Five partners vs one ---------- */
export function initJuggle() {
  const root = $('[data-juggle]');
  if (!root) return;
  const btns = $$('button[data-state]', root);
  const live = $('[data-juggle-live]', root)!;
  const text: Record<string, string> = {
    five: 'Five partners means five briefs, five timelines and nobody accountable for the whole.',
    one: 'One team, one plan, and one group accountable for all of it.',
  };
  let touched = false;
  const set = (s: string) => {
    root.dataset.state = s;
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === s)));
    live.textContent = text[s];
  };
  btns.forEach((b) => listen(b, 'click', () => { touched = true; set(b.dataset.state!); }));
  set('five');
  if (!reduced()) {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); setTimeout(() => { if (!touched) set('one'); }, 1500); }
    }, { threshold: 0.6 });
    io.observe(root);
    disposers.push(() => io.disconnect());
  } else set('one');
}

/* ---------- Tilt + magnetic ---------- */
export function initTilt() {
  if (!fine() || reduced()) return;
  $$('[data-tilt]').forEach((el) => {
    const zone = (el.closest('section') as HTMLElement) || el;
    const max = parseFloat(el.dataset.tilt || '6');
    listen(zone, 'pointermove', (e: PointerEvent) => {
      const r = zone.getBoundingClientRect();
      el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * max * 2}deg`);
      el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * max * 2}deg`);
    });
  });
}
export function initMagnetic() {
  if (!fine() || reduced()) return;
  $$('[data-magnetic]').forEach((el) => {
    listen(el, 'pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    listen(el, 'pointerleave', () => (el.style.transform = ''));
  });
}

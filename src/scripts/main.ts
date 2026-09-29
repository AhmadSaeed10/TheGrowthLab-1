import { initReveal } from './reveal';
import { initCursor, cursorState } from './cursor';
import { initHalftone } from './halftone';
import * as ui from './ui';

let ready = false;
let stopHalftone: (() => void) | undefined;

function page() {
  ui.disposeUi();
  stopHalftone?.();
  initReveal();
  stopHalftone = initHalftone();
  ui.initMenu();
  ui.initCounters();
  ui.initServiceList();
  ui.initReel();
  ui.initModel();
  ui.initFilter();
  ui.initLightbox();
  ui.initBrief();
  ui.initJuggle();
  ui.initTilt();
  ui.initMagnetic();
}

document.addEventListener('astro:page-load', () => {
  if (!ready) {
    ready = true;
    initCursor();
    ui.initGlobalScroll();
  }
  page();
});
document.addEventListener('astro:before-swap', () => {
  ui.disposeUi();
  stopHalftone?.();
  stopHalftone = undefined;
});
document.addEventListener('astro:after-swap', () => {
  const root = document.documentElement;
  root.classList.add('js');
  if (cursorState.on) root.classList.add('has-cursor');
});

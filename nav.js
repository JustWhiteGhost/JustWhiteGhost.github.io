/* nav.js — shared across all pages */

const PAGES = [
  { href: 'index.html',   label: 'Home',    iso: 'ISO 800',  f: 'F/2.8', mode: 'EXPLORE', lbl: 'Hero · Rooftop',    sub: 'F/2.8 · AF-S · ISO 800',  cam: 'CAM-01 · HERO · ROOFTOP' },
  { href: 'systems.html', label: 'Systems', iso: 'ISO 3200', f: 'F/4.0', mode: 'SCAN: ENV',lbl: 'Systems · Forest',  sub: 'F/4.0 · MF · ISO 3200',   cam: 'CAM-02 · ENV SYSTEMS · SECTOR 4' },
  { href: 'models.html',  label: 'Models',  iso: 'ISO 1600', f: 'F/5.6', mode: 'CAPTURE',  lbl: 'Models · Workshop', sub: 'F/5.6 · AF-C · ISO 1600',  cam: 'CAM-03 · MODEL VAULT · LEVEL B' },
  { href: 'art.html',     label: 'Art',     iso: 'ISO 400',  f: 'F/1.4', mode: 'COMPOSE',  lbl: 'Art · Studio',      sub: 'F/1.4 · AF-S · ISO 400',   cam: 'CAM-04 · ART LAB · WING C' },
  { href: 'about.html',   label: 'About',   iso: 'ISO 100',  f: 'F/8.0', mode: 'REFLECT',  lbl: 'About · Contact',   sub: 'F/8.0 · MF · ISO 100',     cam: 'CAM-05 · ARCHIVE · ABOUT' }
];

/* ── Determine current page index ── */
function getCurrentIdx() {
  const file = location.pathname.split('/').pop() || 'index.html';
  const idx = PAGES.findIndex(p => p.href === file);
  return idx >= 0 ? idx : 0;
}

/* ── Build nav HTML ── */
function buildNav() {
  const idx = getCurrentIdx();
  const page = PAGES[idx];

  const navBar = document.getElementById('nav-bar');
  navBar.innerHTML = `
    <div id="nav-inner">
      <div id="nav-readouts">
        <span class="readout" id="r-iso">${page.iso}</span>
        <span class="readout" id="r-f">${page.f}</span>
      </div>
      <div id="nav-links">
        ${PAGES.map((p, i) => `
          ${i > 0 ? '<div class="nav-divider"></div>' : ''}
          <a class="nav-item${i === idx ? ' active-nav' : ''}" href="${p.href}" data-idx="${i}">
            <div class="nav-marker"></div>
            <span class="nav-label">${p.label}</span>
          </a>
        `).join('')}
      </div>
      <span id="nav-mode-pill">MODE: ${page.mode}</span>
    </div>
  `;

  /* Section label */
  const sl = document.getElementById('section-label');
  if (sl) {
    sl.querySelector('.sl-main').textContent = page.lbl;
    sl.querySelector('.sl-sub').textContent  = page.sub;
  }

  /* Intercept nav clicks for CCTV transition */
  navBar.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const targetIdx = parseInt(el.dataset.idx);
      if (targetIdx === idx) return;
      cctvCut(targetIdx, () => {
        window.location.href = PAGES[targetIdx].href;
      });
    });
  });

  /* Logo click */
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', e => {
      e.preventDefault();
      if (idx === 0) return;
      cctvCut(0, () => { window.location.href = 'index.html'; });
    });
  }
}

/* ── CCTV static transition ── */
let cctvAnim = null;

function drawStatic(ctx, w, h, intensity) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() < intensity ? Math.floor(Math.random() * 80 + 10) : 0;
    d[i] = v * 0.6; d[i+1] = v * 0.9; d[i+2] = v * 0.5; d[i+3] = v * 2.5;
  }
  const bandH = Math.floor(h * (0.05 + Math.random() * 0.12));
  const bandY = Math.floor(Math.random() * (h - bandH));
  for (let y = bandY; y < bandY + bandH; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      d[i] = 40; d[i+1] = 70; d[i+2] = 30; d[i+3] = 180;
    }
  }
  const tearY = Math.floor(Math.random() * h);
  for (let x = 0; x < w; x++) {
    const i = (tearY * w + x) * 4;
    d[i] = 80; d[i+1] = 140; d[i+2] = 60; d[i+3] = 220;
  }
  ctx.putImageData(img, 0, 0);
}

function cctvCut(nextIdx, callback) {
  const overlay = document.getElementById('cctv-overlay');
  const canvas  = document.getElementById('cctv-canvas');
  const stamp   = document.getElementById('cctv-stamp');
  if (!overlay || !canvas) { callback && callback(); return; }

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  if (cctvAnim) clearTimeout(cctvAnim);
  overlay.style.opacity = '1';
  stamp.style.opacity   = '0';

  const FRAMES = [0.9, 0.95, 1.0, 0.85, 0.6, 0.3, 0.1, 0];
  let frame = 0;

  setTimeout(() => {
    stamp.textContent = PAGES[nextIdx]?.cam || 'CAM-00';
    stamp.style.transition = 'opacity 0.04s';
    stamp.style.opacity = '1';
    setTimeout(() => { stamp.style.opacity = '0'; }, 160);
  }, 60);

  function tick() {
    if (frame < FRAMES.length) {
      const intensity = FRAMES[frame];
      if (intensity > 0) {
        drawStatic(ctx, canvas.width, canvas.height, intensity);
        overlay.style.opacity = String(Math.min(intensity + 0.1, 1));
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        overlay.style.opacity = '0';
      }
      frame++;
      const delay = frame < 4 ? 28 : frame < 6 ? 40 : 60;
      cctvAnim = setTimeout(tick, delay);
    } else {
      overlay.style.opacity = '0';
      callback && callback();
    }
  }

  tick();
  setTimeout(callback, 80);
}

/* ── Page-entry CCTV reveal (clears static on load) ── */
function cctvReveal() {
  const overlay = document.getElementById('cctv-overlay');
  const canvas  = document.getElementById('cctv-canvas');
  if (!overlay || !canvas) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  overlay.style.opacity = '1';

  const FRAMES = [1.0, 0.9, 0.7, 0.4, 0.15, 0];
  let frame = 0;
  function tick() {
    if (frame < FRAMES.length) {
      const intensity = FRAMES[frame];
      if (intensity > 0) {
        drawStatic(ctx, canvas.width, canvas.height, intensity);
        overlay.style.opacity = String(Math.min(intensity + 0.05, 1));
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        overlay.style.opacity = '0';
      }
      frame++;
      setTimeout(tick, frame < 3 ? 30 : 50);
    }
  }
  tick();
}

/* ── Rec timer ── */
let startTime = Date.now();
function updateTimer() {
  const s  = Math.floor((Date.now() - startTime) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const el = document.getElementById('rec-timer');
  if (el) el.textContent = `${mm}:${ss}`;
}

/* ── Keyboard nav ── */
function initKeyboard() {
  const idx = getCurrentIdx();
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const next = Math.min(idx + 1, PAGES.length - 1);
      if (next !== idx) cctvCut(next, () => { window.location.href = PAGES[next].href; });
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prev = Math.max(idx - 1, 0);
      if (prev !== idx) cctvCut(prev, () => { window.location.href = PAGES[prev].href; });
    }
  });
}

/* ── Init on DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  cctvReveal();
  initKeyboard();
  setInterval(updateTimer, 1000);
});

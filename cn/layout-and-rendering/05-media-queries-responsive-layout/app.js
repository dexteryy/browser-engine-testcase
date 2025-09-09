// app.js
// JS here is strictly for status display and performance observation.
// It does NOT participate in responsive layout (which is pure CSS).

(function () {
  'use strict';

  // Cache elements
  const vwEl = document.getElementById('vw');
  const bpEl = document.getElementById('bp');
  const clsEl = document.getElementById('cls');
  const resetBtn = document.getElementById('reset-cls');

  // Breakpoint matchers (keep in sync with CSS)
  const mMobile = window.matchMedia('(max-width: 799.98px)');
  const mTablet = window.matchMedia('(min-width: 800px) and (max-width: 1199.98px)');
  const mDesktop = window.matchMedia('(min-width: 1200px)');

  // rAF-throttled resize handler to avoid jank
  let ticking = false;
  function onResize() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        vwEl.textContent = Math.round(window.innerWidth);
        updateBreakpoint();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('resize', onResize, { passive: true });

  function updateBreakpoint() {
    let label = '—';
    if (mDesktop.matches) label = '桌面（≥1200px）';
    else if (mTablet.matches) label = '平板（800–1199px）';
    else if (mMobile.matches) label = '移动（<800px）';
    bpEl.textContent = label;
  }

  // CLS via PerformanceObserver
  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries = [];
  let po;

  function initPO() {
    if (po) po.disconnect();
    clsValue = 0;
    sessionValue = 0;
    sessionEntries = [];
    if ('PerformanceObserver' in window) {
      po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Ignore shifts from user typing/clicking
          if (!entry.hadRecentInput) {
            const first = sessionEntries[0];
            const last = sessionEntries[sessionEntries.length - 1];
            // Same session if within 1s and 5s window per CLS definition
            if (sessionValue && entry.startTime - last.startTime < 1000 && entry.startTime - first.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              clsEl.textContent = clsValue.toFixed(3);
            }
          }
        }
      });
      try {
        po.observe({ type: 'layout-shift', buffered: true });
      } catch(e) {
        // Some environments may not support buffered option
        po.observe({ type: 'layout-shift' });
      }
    }
  }

  resetBtn.addEventListener('click', () => {
    clsEl.textContent = '0.000';
    initPO();
  });

  // Initial paint
  onResize();
  mMobile.addEventListener('change', updateBreakpoint);
  mTablet.addEventListener('change', updateBreakpoint);
  mDesktop.addEventListener('change', updateBreakpoint);
  initPO();
})();

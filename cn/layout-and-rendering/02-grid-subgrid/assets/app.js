
/* =====================================================
   Shared JS harness for Grid/Subgrid test pages.
   - Provides: feature detection, overlay rendering,
     gap binding, simple alignment checker, and reflow timing.
   - No frameworks; only modern DOM & Web APIs.
   ===================================================== */
(function () {
  // Tiny helper
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => root.querySelectorAll(sel);

  // Render dashed grid lines by measuring track boundaries.
  class GridOverlay {
    /**
     * @param {HTMLElement} host - The element whose grid tracks are visualized.
     * @param {'columns'|'rows'|'both'} axis - Which axis to draw.
     * @param {{useSubgrid?: boolean}} [opts]
     */
    constructor(host, axis = 'columns', opts = {}) {
      this.host = host;
      this.axis = axis;
      this.useSubgrid = !!opts.useSubgrid;
      this.enabled = false;
      this.overlay = document.createElement('div');
      this.overlay.className = 'grid-overlay';
      // Make overlay a grid itself so we can place invisible sentinels inside
      this.overlay.style.display = 'grid';
      this._applyTrackTemplate();
      this.host.appendChild(this.overlay);
      // Observe size changes
      this.ro = new ResizeObserver(() => this.redraw());
      this.ro.observe(this.host);
      window.addEventListener('resize', this._onWinResize = () => this.redraw());
      this.redraw();
    }

    // Ensure the overlay grid uses the same track list
    _applyTrackTemplate() {
      const cs = getComputedStyle(this.host);
      // Column tracks
      if (this.axis === 'columns' || this.axis === 'both') {
        if (this.useSubgrid) {
          // Inherit the parent's tracks through subgrid
          this.overlay.style.gridTemplateColumns = 'subgrid';
        } else {
          this.overlay.style.gridTemplateColumns = cs.gridTemplateColumns;
        }
        this.overlay.style.columnGap = cs.columnGap;
      }
      // Row tracks
      if (this.axis === 'rows' || this.axis === 'both') {
        if (this.useSubgrid) {
          this.overlay.style.gridTemplateRows = 'subgrid';
        } else {
          this.overlay.style.gridTemplateRows = cs.gridTemplateRows;
        }
        this.overlay.style.rowGap = cs.rowGap;
      }
    }

    setEnabled(flag) {
      this.enabled = !!flag;
      this.overlay.style.visibility = this.enabled ? 'visible' : 'hidden';
      if (this.enabled) this.redraw();
    }

    destroy() {
      try { this.ro.disconnect(); } catch {}
      try { window.removeEventListener('resize', this._onWinResize); } catch {}
      this.overlay.remove();
    }

    // Compute visual line positions and draw dashed lines
    redraw() {
      if (!this.enabled) return;
      this._applyTrackTemplate();
      // clear
      this.overlay.innerHTML = '';
      const rectOverlay = this.overlay.getBoundingClientRect();
      // sentinel-based measurement
      const maxTracks = 24; // safety upper bound

      const columns = [];
      if (this.axis === 'columns' || this.axis === 'both') {
        for (let i = 1; i <= maxTracks; i++) {
          const s = document.createElement('div');
          s.style.gridColumn = `${i}`; // occupies column i
          s.style.gridRow = '1';
          s.style.visibility = 'hidden';
          s.style.height = '1px'; s.style.width = '1px';
          this.overlay.appendChild(s);
          const r = s.getBoundingClientRect();
          if (r.width <= 0.5) { s.remove(); break; }
          columns.push(r);
        }
        // First left edge
        if (columns.length) {
          const x0 = columns[0].left - rectOverlay.left;
          this._addVLine(x0);
          // Each sentinel's right edge is a grid line
          for (const sRect of columns) {
            const x = sRect.right - rectOverlay.left;
            this._addVLine(x);
          }
        }
      }

      const rows = [];
      if (this.axis === 'rows' || this.axis === 'both') {
        for (let i = 1; i <= maxTracks; i++) {
          const s = document.createElement('div');
          s.style.gridRow = `${i}`; // occupies row i
          s.style.gridColumn = '1';
          s.style.visibility = 'hidden';
          s.style.height = '1px'; s.style.width = '1px';
          this.overlay.appendChild(s);
          const r = s.getBoundingClientRect();
          if (r.height <= 0.5) { s.remove(); break; }
          rows.push(r);
        }
        // First top edge
        if (rows.length) {
          const y0 = rows[0].top - rectOverlay.top;
          this._addHLine(y0);
          // Each sentinel's bottom edge is a grid line
          for (const sRect of rows) {
            const y = sRect.bottom - rectOverlay.top;
            this._addHLine(y);
          }
        }
      }

      // cached for external checks
      this._columnsPx = this._readAll('.line.v').map(el => parseFloat(el.style.left));
      this._rowsPx    = this._readAll('.line.h').map(el => parseFloat(el.style.top));
    }

    _readAll(sel) { return Array.from(this.overlay.querySelectorAll(sel)); }
    get columnsPx() { return this._columnsPx || []; }
    get rowsPx() { return this._rowsPx || []; }

    _addVLine(x) {
      const line = document.createElement('div');
      line.className = 'line v';
      line.style.left = `${Math.round(x)}px`;
      line.style.top = '0';
      this.overlay.appendChild(line);
    }
    _addHLine(y) {
      const line = document.createElement('div');
      line.className = 'line h';
      line.style.top = `${Math.round(y)}px`;
      line.style.left = '0';
      this.overlay.appendChild(line);
    }
  }

  // Feature detection
  function supportsSubgrid() {
    return CSS.supports('grid-template-columns', 'subgrid')
        || CSS.supports('grid-template-rows', 'subgrid');
  }

  // Bind a range <input> to change the gap of a grid container
  function bindGap(slider, gridEl, displayEl) {
    const apply = () => {
      const v = Number(slider.value) || 0;
      gridEl.style.gap = `${v}px`;
      if (displayEl) displayEl.textContent = `${v}px`;
    };
    slider.addEventListener('input', apply);
    apply();
  }

  // One-off reflow measurement by changing a function that mutates styles
  async function measureReflow(mutator, readEl) {
    await new Promise(r => requestAnimationFrame(r));
    const t0 = performance.now();
    mutator();
    // force layout
    (readEl || document.body).getBoundingClientRect();
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    return performance.now() - t0;
  }

  // Compare child subgrid lines against the parent's grid column lines.
  function checkSubgridColumnsAlign(parentGrid, subgridBox, statusEl) {
    // Build overlays off-screen to read positions
    const oParent = new GridOverlay(parentGrid, 'columns', { useSubgrid: false });
    const oChild  = new GridOverlay(subgridBox, 'columns', { useSubgrid: true });
    oParent.setEnabled(true);
    oChild.setEnabled(true);
    oParent.redraw(); oChild.redraw();

    const parentRect = parentGrid.getBoundingClientRect();
    const childRect  = subgridBox.getBoundingClientRect();

    const parentXs = oParent.columnsPx.map(x => x + parentRect.left);
    const childXs  = oChild.columnsPx.map(x => x + childRect.left);

    // Destroy temporary overlays to avoid affecting the visible toggles
    oParent.destroy(); oChild.destroy();

    // Each child line must sit on a parent line (within 1px)
    let ok = childXs.length > 1;
    const tol = 1.1;
    for (const cx of childXs) {
      const hit = parentXs.some(px => Math.abs(px - cx) <= tol);
      if (!hit) { ok = false; break; }
    }
    // Additionally, require every .card inside subgrid to align its left/right to subgrid lines.
    const subLines = childXs.map(x => x - childRect.left); // relative to subgrid
    subgridBox.querySelectorAll('.card').forEach(card => {
      const r = card.getBoundingClientRect();
      const left = r.left - childRect.left;
      const right = r.right - childRect.left;
      const nearL = subLines.some(px => Math.abs(px - left) <= tol);
      const nearR = subLines.some(px => Math.abs(px - right) <= tol);
      if (!(nearL && nearR)) ok = false;
    });

    if (statusEl) {
      statusEl.textContent = ok ? '对齐校验：通过 ✓' : '对齐校验：不通过 ✗';
      statusEl.style.color = ok ? '#0a7f49' : '#c12a2a';
    }
    return ok;
  }

  // Export minimal API for individual pages
  window.GridHarness = {
    $, $$,
    GridOverlay,
    supportsSubgrid,
    bindGap,
    measureReflow,
    checkSubgridColumnsAlign,
  };
})();

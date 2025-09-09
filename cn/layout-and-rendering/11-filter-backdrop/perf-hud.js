
// Lightweight FPS/Jank HUD. Updates ~4 times per second to reduce overhead.
export class PerfHUD {
  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'perf-hud hidden';
    this.root.innerHTML = `
      <div class="row"><b>FPS</b> <span id="fps">–</span></div>
      <div class="bar"><i id="fpsBar"></i></div>
      <div class="row"><span>帧时P95</span> <span id="p95" class="muted">–</span></div>
      <div class="row"><span>Jank(>16.7ms)</span> <span id="jank" class="muted">0</span></div>
      <div class="row"><span>LongTasks</span> <span id="lt" class="muted">0</span></div>
      <div class="row"><span>Scroll/s</span> <span id="scrolls" class="muted">0</span></div>
    `;
    document.body.appendChild(this.root);

    this.running = false;
    this.frames = [];
    this.last = 0;
    this.jankCount = 0;
    this.longTasks = 0;
    this.scrollsThisSec = 0;
    this._raf = this._raf.bind(this);

    // Observe long tasks if available
    try {
      this.ltObs = new PerformanceObserver(list => {
        this.longTasks += list.getEntries().length;
      });
      this.ltObs.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // not supported; ignore
    }

    // passive scroll watcher
    window.addEventListener('scroll', () => {
      this.scrollsThisSec++;
    }, { passive: true });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.root.classList.remove('hidden');
    this.frames.length = 0;
    this.jankCount = 0;
    this.longTasks = 0;
    this.last = performance.now();
    this.lastUi = 0;
    requestAnimationFrame(this._raf);
  }

  stop() {
    this.running = false;
    this.root.classList.add('hidden');
  }

  _raf(now) {
    if (!this.running) return;
    const dt = now - this.last;
    this.last = now;
    if (this.frames.length > 240) this.frames.shift();
    this.frames.push(dt);
    if (dt > 16.7) this.jankCount++;

    // Update UI every ~250ms
    if (!this.lastUi || now - this.lastUi > 250) {
      this.lastUi = now;
      const fps = 1000 / (this.frames.reduce((a,b)=>a+b,0) / this.frames.length);
      // p95 frame time
      const sorted = [...this.frames].sort((a,b)=>a-b);
      const p95 = sorted[Math.min(sorted.length-1, Math.floor(sorted.length*0.95))] || 0;

      const fpsEl = this.root.querySelector('#fps');
      const barEl = this.root.querySelector('#fpsBar');
      const p95El = this.root.querySelector('#p95');
      const jankEl = this.root.querySelector('#jank');
      const ltEl = this.root.querySelector('#lt');
      const scEl = this.root.querySelector('#scrolls');

      fpsEl.textContent = fps.toFixed(0);
      p95El.textContent = p95.toFixed(1) + ' ms';
      jankEl.textContent = String(this.jankCount);
      ltEl.textContent = String(this.longTasks);
      scEl.textContent = String(this.scrollsThisSec);

      const pct = Math.max(0, Math.min(1, fps/60)) * 100;
      barEl.style.width = pct + '%';

      this.scrollsThisSec = 0;
    }

    requestAnimationFrame(this._raf);
  }
}

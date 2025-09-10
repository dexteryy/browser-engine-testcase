
/*! PerfHUD (no-module) - lightweight FPS/Jank HUD */
(function(){
  function PerfHUD(){
    this.root = document.createElement('div');
    this.root.className = 'perf-hud hidden';
    this.root.innerHTML = '\
      <div class="row"><b>FPS</b> <span id="fps">–</span></div>\
      <div class="bar"><i id="fpsBar"></i></div>\
      <div class="row"><span>帧时P95</span> <span id="p95" class="muted">–</span></div>\
      <div class="row"><span>Jank(>16.7ms)</span> <span id="jank" class="muted">0</span></div>\
      <div class="row"><span>LongTasks</span> <span id="lt" class="muted">0</span></div>\
      <div class="row"><span>Scroll/s</span> <span id="scrolls" class="muted">0</span></div>';
    document.addEventListener('DOMContentLoaded', ()=>{
      document.body.appendChild(this.root);
    });

    this.running = false;
    this.frames = [];
    this.last = 0;
    this.jankCount = 0;
    this.longTasks = 0;
    this.scrollsThisSec = 0;
    this._raf = this._raf.bind(this);

    // Long task observer (if supported)
    var self = this;
    try {
      this.ltObs = new PerformanceObserver(function(list){
        self.longTasks += list.getEntries().length;
      });
      this.ltObs.observe({ entryTypes: ['longtask'] });
    } catch (e) { /* ignore */ }

    // Passive scroll watcher
    window.addEventListener('scroll', ()=>{ self.scrollsThisSec++; }, { passive:true });
  }
  PerfHUD.prototype.start = function(){
    if (this.running) return;
    this.running = true;
    this.root.classList.remove('hidden');
    this.frames.length = 0;
    this.jankCount = 0;
    this.longTasks = 0;
    this.last = performance.now();
    this.lastUi = 0;
    requestAnimationFrame(this._raf);
  };
  PerfHUD.prototype.stop = function(){
    this.running = false;
    this.root.classList.add('hidden');
  };
  PerfHUD.prototype._raf = function(now){
    if (!this.running) return;
    var dt = now - this.last;
    this.last = now;
    if (this.frames.length > 240) this.frames.shift();
    this.frames.push(dt);
    if (dt > 16.7) this.jankCount++;

    if (!this.lastUi || now - this.lastUi > 250) {
      this.lastUi = now;
      var sum = 0; for (var i=0;i<this.frames.length;i++) sum += this.frames[i];
      var fps = 1000 / (sum / this.frames.length);
      var sorted = this.frames.slice().sort(function(a,b){return a-b;});
      var idx = Math.min(sorted.length-1, Math.floor(sorted.length*0.95));
      var p95 = sorted[idx] || 0;

      var fpsEl = this.root.querySelector('#fps');
      var barEl = this.root.querySelector('#fpsBar');
      var p95El = this.root.querySelector('#p95');
      var jankEl = this.root.querySelector('#jank');
      var ltEl = this.root.querySelector('#lt');
      var scEl = this.root.querySelector('#scrolls');

      fpsEl.textContent = fps.toFixed(0);
      p95El.textContent = p95.toFixed(1) + ' ms';
      jankEl.textContent = String(this.jankCount);
      ltEl.textContent = String(this.longTasks);
      scEl.textContent = String(this.scrollsThisSec);

      var pct = Math.max(0, Math.min(1, fps/60)) * 100;
      barEl.style.width = pct + '%';

      this.scrollsThisSec = 0;
    }
    requestAnimationFrame(this._raf);
  };

  window.PerfHUD = PerfHUD;
})();

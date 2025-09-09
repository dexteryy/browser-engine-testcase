// Shared JS for all pages. Only vanilla APIs (no frameworks).
// English comments; on-page text remains Chinese.

(function(){
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Update the dynamic container query rule by injecting a style block. */
  function setThreshold(px){
    const style = document.getElementById('cqDynamic');
    // Regenerate the rule so that the at-rule condition uses the new px.
    style.textContent = `@container card (width >= ${px}px){
  .cq-card{ flex-direction: row; align-items: flex-start; }
  .cq-card .media{ width: 44%; min-width: 240px; }
  .cq-card .body{ flex: 1; }
  .cq-card .meta{ display: flex; flex-wrap: wrap; }
}`;
  }

  /** ResizeObserver to show container size badges and highlight threshold crossing. */
  function bindSizeBadges(containers, getThreshold){
    const ro = new ResizeObserver(entries => {
      for(const entry of entries){
        const el = entry.target;
        const w = Math.round(entry.contentBoxSize?.[0]?.inlineSize || el.clientWidth);
        const badge = $('.size-badge', el);
        if(!badge) continue;
        const th = getThreshold();
        badge.textContent = `容器：${w}px / 阈值：${th}px`;
        badge.style.background = w >= th ? '#14532d' : '#111827';
        badge.style.boxShadow = w >= th ? '0 0 0 1px #16a34a inset' : 'none';
      }
    });
    containers.forEach(c => ro.observe(c));
  }

  /** Page: index */
  function initIndex(){
    const threshold = $('#threshold');
    const thresholdOut = $('#thresholdOut');
    const widthA = $('#widthA'), widthAOut = $('#widthAOut');
    const widthB = $('#widthB'), widthBOut = $('#widthBOut');
    const containerA = $('#containerA');
    const containerB = $('#containerB');
    const showSize = $('#showSize');
    const mqDebug = $('#mqDebug');
    const resetBtn = $('#resetBtn');

    // Init dynamic threshold CSS
    setThreshold(Number(threshold.value));

    // Wiring sliders
    const updateA = () => { containerA.style.width = widthA.value + 'px'; widthAOut.value = widthA.value; };
    const updateB = () => { containerB.style.width = widthB.value + 'px'; widthBOut.value = widthB.value; };
    updateA(); updateB();

    threshold.addEventListener('input', () => {
      thresholdOut.value = threshold.value;
      setThreshold(Number(threshold.value));
      // Force a reflow hint (not necessary but helps the size badge update instantly)
      containerA.style.paddingRight = (parseInt(getComputedStyle(containerA).paddingRight)||12) + 'px';
      containerA.offsetHeight; // touch layout
      containerA.style.paddingRight = '';
    });

    widthA.addEventListener('input', updateA);
    widthB.addEventListener('input', updateB);

    // Container name hookup (represented by data-name), ensure attribute aligns with CSS name
    // Note: 'container-name' is set in CSS; we expose the name via a data attr for visibility/debug.

    // Size badges
    bindSizeBadges([containerA, containerB], () => Number(threshold.value));
    showSize.addEventListener('change', () => {
      document.body.classList.toggle('hide-badge', !showSize.checked);
      $$('.size-badge').forEach(b => b.style.display = showSize.checked ? '' : 'none');
    });

    mqDebug.addEventListener('change', () => {
      document.body.classList.toggle('mq-debug', mqDebug.checked);
    });

    resetBtn.addEventListener('click', () => {
      threshold.value = 400; thresholdOut.value = 400; setThreshold(400);
      widthA.value = 780; widthB.value = 320; updateA(); updateB();
      mqDebug.checked = false; document.body.classList.remove('mq-debug');
      showSize.checked = true; $$('.size-badge').forEach(b => b.style.display = '');
    });
  }

  /** Page: nested - demonstrates nested containers and named scoping */
  function initNested(){
    const threshold = $('#thresholdN');
    const out = $('#thresholdNOut');
    const wrap = $('#outerContainer');
    const inner = $('#innerContainer');

    const setRule = (px) => {
      const style = $('#cqDynamic');
      style.textContent = `/* Outer query by name */
@container outer (width >= ${px}px){
  .cq-card .meta{ display:flex; }
  .cq-card{ flex-direction: row; }
}
/* Inner query by a different name */
@container inner (width >= ${Math.max(240, px - 100)}px){
  .cq-card .action{ display: inline-block; }
  .cq-card .body h3{ font-size: clamp(16px, 2cqw, 24px); }
}`;
    };
    setRule(Number(threshold.value));

    threshold.addEventListener('input', () => {
      out.value = threshold.value;
      setRule(Number(threshold.value));
    });

    // Show size badges
    const badge = (el) => {
      const b = document.createElement('div');
      b.className = 'size-badge';
      el.appendChild(b);
      return b;
    };
    const b1 = badge(wrap);
    const b2 = badge(inner);
    const ro = new ResizeObserver(entries => {
      for(const ent of entries){
        const el = ent.target;
        const w = Math.round(ent.contentBoxSize?.[0]?.inlineSize || el.clientWidth);
        const b = $('.size-badge', el);
        b.textContent = `${el.id}：${w}px`;
      }
    });
    ro.observe(wrap); ro.observe(inner);

    // Allow manual resize of inner
    const w = $('#innerW');
    const outW = $('#innerWOut');
    const updateW = () => { inner.style.width = w.value + 'px'; outW.value = w.value; }
    w.addEventListener('input', updateW);
    updateW();
  }

  /** Page: stress - many components to inspect performance of style recalculation */
  function initStress(){
    const grid = $('#grid');
    const count = 120;
    const makeCard = (i) => {
      const card = document.createElement('article');
      card.className = 'cq-card';
      card.innerHTML = `<figure class="media">
        <svg viewBox="0 0 400 300"><rect width="400" height="300" fill="#eef2ff"/><circle cx="${80+(i%5)*40}" cy="160" r="30" fill="#a5b4fc"/></svg>
        <figcaption>第 ${i+1} 张</figcaption>
      </figure>
      <div class="body">
        <h3>卡片 ${i+1}</h3>
        <p>用于压力测试：快速调整容器宽度，观察样式切换开销。</p>
        <ul class="meta"><li>编号：${i+1}</li><li>类型：测试</li></ul>
        <button class="action">操作</button>
      </div>`;
      return card;
    };
    // Create containers each acting as a size container
    for(let i=0;i<count;i++){
      const c = document.createElement('div');
      c.className = 'cq-container mini';
      c.style.width = (240 + (i%6)*40) + 'px';
      const badge = document.createElement('div');
      badge.className = 'size-badge';
      c.appendChild(badge);
      c.appendChild(makeCard(i));
      grid.appendChild(c);
    }
    // Observe sizes
    const ro = new ResizeObserver(entries => {
      for(const e of entries){
        const el = e.target;
        const w = Math.round(e.contentBoxSize?.[0]?.inlineSize || el.clientWidth);
        const badge = el.querySelector('.size-badge');
        if(badge) badge.textContent = `${w}px`;
      }
    });
    $$('.cq-container.mini', grid).forEach(el => ro.observe(el));

    // Controls
    const spread = $('#spread'), spreadOut = $('#spreadOut');
    const speed = $('#speed'), speedOut = $('#speedOut');
    const auto = $('#auto');
    spread.addEventListener('input', () => {
      spreadOut.value = spread.value;
      // Stretch all containers by a factor centered around 300px
      const base = 300;
      const factor = Number(spread.value);
      $$('.cq-container.mini', grid).forEach((el,i) => {
        const init = 240 + (i%6)*40;
        el.style.width = Math.max(220, init + (base-init) * (factor - 1)).toFixed(0) + 'px';
      });
    });
    speed.addEventListener('input', () => { speedOut.value = speed.value; });

    // Auto oscillation
    let raf = 0, t0 = 0;
    function tick(t){
      if(!t0) t0 = t;
      const dt = (t - t0)/1000;
      const s = Number(speed.value);
      const f = 0.5 + 0.5*Math.sin(dt * s * 2*Math.PI); // 0..1
      spread.value = (0.6 + 0.8*f).toFixed(2);
      spread.dispatchEvent(new Event('input'));
      raf = requestAnimationFrame(tick);
    }
    auto.addEventListener('change', () => {
      if(auto.checked){
        t0 = 0;
        raf = requestAnimationFrame(tick);
      }else{
        cancelAnimationFrame(raf);
      }
    });
  }

  // Entrypoint by page
  const page = document.body.dataset.page;
  if(page === 'index') initIndex();
  if(page === 'nested') initNested();
  if(page === 'stress') initStress();
})();

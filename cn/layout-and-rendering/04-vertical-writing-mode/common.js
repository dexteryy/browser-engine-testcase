// Shared JS helpers for Test Case 04
// All comments in English per requirements
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function updateMeters(target, meterBox){
    if(!target || !meterBox) return;
    const cs = getComputedStyle(target);
    const rect = target.getBoundingClientRect();
    const wm = cs.writingMode || cs.getPropertyValue('writing-mode');
    const isVertical = /vertical/.test(wm);
    const inlineSize = isVertical ? rect.height : rect.width;
    const blockSize  = isVertical ? rect.width  : rect.height;
    meterBox.innerHTML = `
      <div class="meter">写字模式 <code>${wm}</code></div>
      <div class="meter">text-orientation <code>${cs.textOrientation || cs.getPropertyValue('text-orientation')}</code></div>
      <div class="meter">inline-size <code>${inlineSize.toFixed(0)}px</code></div>
      <div class="meter">block-size <code>${blockSize.toFixed(0)}px</code></div>
      <div class="meter">font-size <code>${cs.fontSize}</code></div>
      <div class="meter">line-height <code>${cs.lineHeight}</code></div>
      <div class="meter">letter-spacing <code>${cs.letterSpacing}</code></div>
    `;
  }

  function wireCommonControls(ctx){
    // ctx should contain: target (Element), meters (Element)
    const target = ctx.target;
    const meters = ctx.meters;

    const byId = id => document.getElementById(id);

    const wmSel = byId('ctrl-wm');
    if(wmSel){
      wmSel.addEventListener('change', () => {
        target.classList.remove('vertical-rl','vertical-lr','horizontal-tb');
        target.classList.add(wmSel.value);
        updateMeters(target, meters);
      });
    }

    const toRadios = $$('input[name="ctrl-to"]');
    if(toRadios.length){
      toRadios.forEach(r => r.addEventListener('change', () => {
        target.classList.remove('tor-mixed','tor-upright','tor-sideways');
        target.classList.add('tor-' + (r.value));
        updateMeters(target, meters);
      }));
    }

    const fs = byId('ctrl-fs');
    if(fs){
      const apply = ()=>{
        target.style.setProperty('--fs', fs.value + 'px');
        updateMeters(target, meters);
      };
      fs.addEventListener('input', apply);
      apply();
    }

    const lh = byId('ctrl-lh');
    if(lh){
      const apply = ()=>{
        target.style.setProperty('--lh', lh.value + 'px');
        target.style.setProperty('--baseline-step', lh.value + 'px'); // keep overlay in sync
        updateMeters(target, meters);
      };
      lh.addEventListener('input', apply);
      apply();
    }

    const letter = byId('ctrl-letter');
    if(letter){
      const apply = ()=>{
        target.style.setProperty('--letter', letter.value + 'px');
        updateMeters(target, meters);
      };
      letter.addEventListener('input', apply);
      apply();
    }

    const inlineSize = byId('ctrl-inline');
    if(inlineSize){
      const apply = ()=>{
        target.style.setProperty('--inline-size', inlineSize.value + 'em');
        updateMeters(target, meters);
      };
      inlineSize.addEventListener('input', apply);
      apply();
    }

    const blockSize = byId('ctrl-block');
    if(blockSize){
      const apply = ()=>{
        target.style.setProperty('--block-size', blockSize.value + 'em');
        updateMeters(target, meters);
      };
      blockSize.addEventListener('input', apply);
      apply();
    }

    const baseline = byId('ctrl-baseline');
    const overlay = $('.overlay-baseline');
    if(baseline && overlay){
      const apply = ()=> overlay.style.display = baseline.checked ? 'block' : 'none';
      baseline.addEventListener('change', apply);
      apply();
    }

    const outline = byId('ctrl-outline');
    const testArea = $('.test-area');
    if(outline && testArea){
      const apply = ()=> testArea.classList.toggle('debug-outline', outline.checked);
      outline.addEventListener('change', apply);
      apply();
    }

    // text-combine-upright toggles (digits 2 / all) for spans with .num
    const tcuDigits2 = byId('ctrl-tcu-d2');
    const tcuAll = byId('ctrl-tcu-all');
    if(tcuDigits2){
      tcuDigits2.addEventListener('change', () => {
        $$('.num', target).forEach(el => {
          el.classList.toggle('tcu-d2', tcuDigits2.checked);
        });
      });
    }
    if(tcuAll){
      tcuAll.addEventListener('change', () => {
        $$('.num', target).forEach(el => {
          el.classList.toggle('tcu-all', tcuAll.checked);
        });
      });
    }

    // Force upright/sideways for .latin spans (page 02)
    const forceUpright = byId('ctrl-force-upright');
    if(forceUpright){
      forceUpright.addEventListener('change', () => {
        $$('.latin', target).forEach(el => el.classList.toggle('force-upright', forceUpright.checked));
      });
    }
    const forceSideways = byId('ctrl-force-sideways');
    if(forceSideways){
      forceSideways.addEventListener('change', () => {
        $$('.latin', target).forEach(el => el.classList.toggle('force-sideways', forceSideways.checked));
      });
    }

    // Update meters on resize
    const ro = new ResizeObserver(()=> updateMeters(target, meters));
    ro.observe(target);
    updateMeters(target, meters);
  }

  // Expose helpers globally
  window.Test04 = {
    wireCommonControls,
    updateMeters
  };
})();

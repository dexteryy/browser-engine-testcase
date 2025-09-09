
// Common helpers for all pages (comments in English).
// Keep code minimal and deterministic to not influence rendering metrics too much.

export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

export function on(el, type, fn){ el.addEventListener(type, fn); return ()=>el.removeEventListener(type, fn); }
export function byId(id){ return document.getElementById(id); }

export function copy(text){
  navigator.clipboard?.writeText(text).then(()=>{
    toast('已复制 CSS');
  }).catch(()=>{
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); toast('已复制 CSS');
  });
}

export function toast(msg){
  let n = document.createElement('div');
  n.textContent = msg;
  Object.assign(n.style, {position:'fixed',left:'50%',top:'20px',transform:'translateX(-50%)',background:'#111',color:'#fff',padding:'8px 12px',borderRadius:'8px',fontSize:'12px',zIndex:9999,opacity:'0'});
  document.body.appendChild(n);
  requestAnimationFrame(()=>{ n.style.transition='opacity .2s ease, transform .2s ease'; n.style.opacity='1'; n.style.transform='translateX(-50%) translateY(8px)'; });
  setTimeout(()=>{ n.style.opacity='0'; n.style.transform='translateX(-50%)'; setTimeout(()=>n.remove(), 300); }, 1200);
}

export function cssSupports(prop, value){
  if (window.CSS && CSS.supports) return CSS.supports(prop, value);
  return false;
}

// Simple FPS meter using rAF.
export class FpsMeter{
  constructor(){ this._running=false; this._frames=0; this.samples=[]; this.last=0; }
  start(){
    this._running = true; this._frames = 0; this.samples = []; this.last = performance.now();
    const loop = (t)=>{
      if(!this._running) return;
      const dt = t - this.last;
      if (dt>0 && dt<1000) this.samples.push(dt);
      this.last = t; this._frames++;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop(){
    this._running = false;
    const avg = this.samples.length ? this.samples.reduce((a,b)=>a+b,0)/this.samples.length : 0;
    const fps = avg ? (1000/avg) : 0;
    const p95 = this.samples.length ? quantile(this.samples, 0.95) : 0;
    const p99 = this.samples.length ? quantile(this.samples, 0.99) : 0;
    return {frames:this._frames, samples:this.samples.length, avg, fps, p95, p99};
  }
}
function quantile(arr, q){
  const a = arr.slice().sort((x,y)=>x-y);
  const pos = (a.length-1)*q;
  const base = Math.floor(pos);
  const rest = pos-base;
  if(a[base+1]!==undefined) return a[base] + rest*(a[base+1]-a[base]);
  else return a[base];
}

export function setBar(el, ratio){
  // Clamp ratio to [0,1]
  ratio = Math.max(0, Math.min(1, ratio));
  el.querySelector('i').style.width = (ratio*100).toFixed(1) + '%';
}

export function number(n, digits=2){
  return Number(n).toFixed(digits);
}

// Build CSS string from mask-related computed values.
export function extractMaskCSS(target){
  const cs = getComputedStyle(target);
  const props = [
    'mask-image','mask-mode','mask-size','mask-position','mask-repeat','mask-origin','mask-clip','mask-type','mask'
  ];
  const lines = props.map(p => `${p}: ${cs.getPropertyValue(p)};`).join('\n');
  return lines;
}

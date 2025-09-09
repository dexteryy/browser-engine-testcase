
// ---------- Utilities used across pages (English comments only) ----------

/** Shortcut query selector */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
/** Create element helper */
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (Array.isArray(children)) children.forEach(c => node.appendChild(c));
  else if (children != null) node.appendChild(children);
  return node;
};

/** Bind <input type="range"> to an <output> element showing its current value. */
function bindRangeOutput(rangeEl, outputEl, map = (v) => v + "px") {
  const render = () => outputEl.textContent = map(rangeEl.value);
  rangeEl.addEventListener("input", render);
  render();
}

/** Convert "12.34px" to number 12.34 */
function pxToNumber(px) {
  return parseFloat(px || "0");
}

/** Generate Chinese-like filler text */
function makeChineseParagraph() {
  const pool = [
    "这是用于测试的中文段落，用来观察多列布局在拆分文本时的表现。",
    "当容器宽度、列数和列间距变化时，文本应该在各列中均匀分布。",
    "若某些元素设置了避免断开，浏览器需要把它们整体移动到下一列。",
    "滚动时应当保持顺畅，无明显掉帧与重绘异常。",
    "如果启用了跨栏标题，那么该标题需要跨越所有列显示。",
    "这里包含一些较长的句子，以便观察换行与字间距的细节和渲染稳定性。",
    "图片作为块级替代元素，不应被拆分，且与相邻段落保持合理间距。"
  ];
  // Randomly stitch 2-4 sentences
  const len = 2 + Math.floor(Math.random() * 3);
  let s = [];
  for (let i = 0; i < len; i++) s.push(pool[Math.floor(Math.random() * pool.length)]);
  return s.join("");
}

/** Create a <p> with optional class */
function createP(cls) {
  const p = document.createElement("p");
  if (cls) p.className = cls;
  p.textContent = makeChineseParagraph();
  return p;
}

/** Create a section heading that should not break across columns */
function createSectionHeading(text) {
  const h = document.createElement("h3");
  h.className = "section avoid-break";
  h.textContent = text;
  return h;
}

/** Create an inline SVG placeholder as an "image" */
function createSVGPlaceholder(width, height, label) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "ph");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  // Background rect
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "0");
  rect.setAttribute("y", "0");
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", "#f1f3f5");
  rect.setAttribute("stroke", "#e9ecef");
  svg.appendChild(rect);
  // Diagonal lines
  const line1 = document.createElementNS(svgNS, "line");
  line1.setAttribute("x1", "0"); line1.setAttribute("y1", "0");
  line1.setAttribute("x2", width); line1.setAttribute("y2", height);
  line1.setAttribute("stroke", "#ced4da");
  svg.appendChild(line1);
  const line2 = document.createElementNS(svgNS, "line");
  line2.setAttribute("x1", width); line2.setAttribute("y1", "0");
  line2.setAttribute("x2", "0"); line2.setAttribute("y2", height);
  line2.setAttribute("stroke", "#ced4da");
  svg.appendChild(line2);
  // Label
  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", width/2);
  text.setAttribute("y", height/2);
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", Math.max(12, Math.min(22, height/6)));
  text.setAttribute("fill", "#868e96");
  text.textContent = label || `${width}x${height}`;
  svg.appendChild(text);
  return svg;
}

/** Create a figure with placeholder image and caption */
function createFigure(height, idx) {
  const fig = document.createElement("figure");
  fig.className = "avoid-break";
  const svg = createSVGPlaceholder(800, height, `图像 ${idx} - ${height}px`);
  const cap = document.createElement("figcaption");
  cap.textContent = "图像说明：此处用于测试跨列时的替代元素表现。";
  fig.appendChild(svg);
  fig.appendChild(cap);
  return fig;
}

/** Fill a multi-column container with content */
function fillContent(container, options = {}) {
  const {
    paragraphs = 30,
    insertFigureEvery = 6,
    figureHeights = [140, 220, 320, 420],
    startIndex = 1,
    withSpanningHeader = true
  } = options;

  // Optional spanning header at the top of columns
  if (withSpanningHeader) {
    const spanHeader = document.createElement("div");
    spanHeader.className = "span-all";
    spanHeader.textContent = "跨栏标题：用于测试 column-span: all 的渲染效果";
    container.appendChild(spanHeader);
  }

  let idx = startIndex;
  for (let i = 0; i < paragraphs; i++) {
    // Insert a section header periodically
    if (i % 5 === 0) container.appendChild(createSectionHeading("小节标题（避免跨列拆分）"));

    // Paragraph
    container.appendChild(createP());

    // Optional figure
    if (insertFigureEvery && (i % insertFigureEvery === insertFigureEvery - 1)) {
      const h = figureHeights[i % figureHeights.length];
      container.appendChild(createFigure(h, idx++));
    }
  }
}

/** Simple performance measurement helpers */
function mark(name) { performance.mark(name); }
function measure(name, start, end) { 
  try { performance.measure(name, start, end); } catch(e) {}
  const m = performance.getEntriesByName(name).pop();
  return m ? m.duration : 0;
}

/** Auto scroll a container and report a simple FPS estimate */
function autoScroll(container, durationMs = 8000, pxPerSec = 600) {
  return new Promise((resolve) => {
    const startTop = container.scrollTop;
    const maxTop = container.scrollHeight - container.clientHeight;
    const start = performance.now();
    let last = start, frames = 0, drops = 0;

    function step(t) {
      frames++;
      const dt = t - last;
      if (dt > 26) drops++; // ~ >38fps as a simple drop heuristic
      last = t;
      const elapsed = t - start;
      const dist = Math.min(maxTop - startTop, (elapsed / 1000) * pxPerSec);
      container.scrollTop = startTop + dist;
      if (elapsed < durationMs && container.scrollTop < maxTop) {
        requestAnimationFrame(step);
      } else {
        const total = performance.now() - start;
        const fps = (frames / total) * 1000;
        resolve({ fps: Math.round(fps), frames, drops });
      }
    }
    requestAnimationFrame(step);
  });
}

/** Long Tasks observer helper */
function createLongTaskObserver() {
  const records = [];
  let observer = null;
  return {
    start() {
      records.length = 0;
      try {
        observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(e => records.push(e.duration));
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch(e) {
        // Longtasks may be unavailable; ignore.
      }
    },
    stop() {
      if (observer) observer.disconnect();
    },
    summary() {
      if (!records.length) return { count: 0, max: 0, avg: 0 };
      const sum = records.reduce((a,b)=>a+b,0);
      const max = Math.max(...records);
      return { count: records.length, max: Math.round(max), avg: Math.round(sum / records.length) };
    }
  };
}

/** Compute effective column count approximation */
function computeEffectiveColumns(el) {
  const cs = getComputedStyle(el);
  const count = cs.columnCount;
  if (count && count !== "auto") return parseInt(count, 10);
  const gap = pxToNumber(cs.columnGap);
  const width = el.clientWidth;
  const cwidth = cs.columnWidth === "auto" ? 0 : pxToNumber(cs.columnWidth);
  if (!cwidth) return 1;
  // floor((containerWidth + gap) / (colWidth + gap))
  const columns = Math.max(1, Math.floor((width + gap) / (cwidth + gap)));
  return columns;
}

/** Utility to update a small metrics badge block */
function renderMetrics(el, target) {
  const cs = getComputedStyle(el);
  const columns = computeEffectiveColumns(el);
  const gap = cs.columnGap;
  const rule = `${cs.columnRuleWidth} ${cs.columnRuleStyle} ${cs.columnRuleColor}`;
  const fill = cs.columnFill;
  target.innerHTML = `
    <span class="badge">实际列数：${columns}</span>
    <span class="badge">列间距：${gap}</span>
    <span class="badge">列分隔线：${rule}</span>
    <span class="badge">column-fill：${fill}</span>
  `;
}

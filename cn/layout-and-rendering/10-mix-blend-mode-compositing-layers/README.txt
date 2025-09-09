# 测试用例10：混合模式叠加效果与合成层

本目录包含 4 个独立网页：

- `index.html`：核心演示。可交互地设置混合模式、颜色、Alpha 和隔离；支持拖拽位置调整；提供简单的近似混合色计算（仅 multiply/screen）。
- `text-image.html`：分别测试文本与 SVG 图像的混合效果，并可切换隔离。
- `layers.html`：用于观察合成层边界，包含多种层提升提示（transform、will-change、filter）。
- `perf-stress.html`：用于压力测试（大量混合元素 + 动画），查看 FPS 与流畅度。

> 要求：仅需在最新 Chromium 浏览器中打开测试即可。

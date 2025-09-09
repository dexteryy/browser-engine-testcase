
测试用例12：CSS 遮罩（Mask）效果及性能
=====================================

目录结构
--------
- index.html                入口与导航
- 01-basic-mask.html        基础：SVG/图像/渐变遮罩裁剪与透明验证
- 02-gradient-mask.html     渐变遮罩与半透明边缘
- 03-multi-mask.html        多图层遮罩与合成（如浏览器不支持则退化）
- 04-performance.html       动画场景下的性能对比与合成层观察
- assets/
  - common.css, common.js   统一样式与工具函数
  - avatar.svg              充当被遮罩内容的“照片”
  - circle.svg, star.svg, ring.svg, soft-circle.svg  遮罩形状

使用说明（简述）
--------------
1. 打开 index.html，进入各页面。
2. 顶栏与工具栏提供控制项，实时作用于测试区域的元素。
3. 页面底部提供解释与操作建议（例如在 DevTools → Rendering 打开 Layer borders / Paint flashing）。
4. 在 04-performance.html 里点击“开始 5 秒测试”统计帧率，对比遮罩与未遮罩列的相对差异。

实现要点
--------
- 仅使用原生 HTML/CSS/JS 和标准 Web API，无任何第三方库。
- 可视元素文本全部为中文，代码注释为英文。
- 统一白底风格：顶栏全宽，其余区域统一最大宽度。
- 工具栏参数控制真实可用，支持复制当前 CSS 以便复现。

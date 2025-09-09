测试用例1：Flexbox弹性布局与动态重排

包含的页面：
- basic.html：基础与悬停扩展
- nested.html：多层嵌套与对齐
- wrap.html：多行换行与 align-content
- basis-vs-grow.html：flex-grow 与 flex-basis 扩展对比

使用说明：
各页面均在“工具栏”提供可视化参数控制（纯 CSS，无 JavaScript）。打开 Chrome 的 DevTools → Rendering 面板可开启 “Show layout shift regions” 观察重排区域；在 Performance 面板录制一次悬停操作评估开销。
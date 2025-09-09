# 测试用例7：Shadow DOM 样式封装隔离

> 目标：验证 Chrome 对 Shadow DOM 的样式封装（Style Encapsulation）是否正确，确保组件内部样式与外部页面样式相互隔离。

## 目录结构
- `index.html`：入口与导航。
- `01-basic.html`：基础隔离。
- `02-slotted.html`：slot 分发与 `::slotted`。
- `03-host.html`：`:host` 选择器。
- `04-performance.html`：多实例与样式隔离观测。
- `base.css`：统一 UI 样式。
- `global.css`：模拟“全局干扰样式”。

## 使用方法
1. 在最新 Chromium 浏览器打开任意页面。
2. 使用页面顶部工具栏切换“全局干扰样式”和“可视化轮廓”。
3. 打开 DevTools 展开各自定义元素，检查 Shadow Root 内的样式作用域。

> 代码中的注释均为英文；页面文本全部为中文。

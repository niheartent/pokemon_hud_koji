# 第三方来源

- 弦九 HUD 核心：[xianjiu0926/pkm-hud](https://github.com/xianjiu0926/pkm-hud)。输入快照保留原代码；业务和数据接口来自上游。src/shared/presentation.js 的基础模板从 v3.3.29 一次迁入，由本仓库维护；固定样式基础也保留其上游来源。未给整份上游代码另行声明本仓库许可。
- Acorn：MIT，解析器在完整版中内嵌。每个发布包提供 Acorn-LICENSE.txt。
- PostCSS、Playwright、fflate：构建或测试依赖，版本锁定在 package-lock.json；依赖许可随 npm 安装包提供。
- 宝可梦、道具与徽章等素材：沿用核心的在线来源，相关权利归原权利人。本仓库中的美化与适配不改变这些素材的权利归属。

本仓库公开用于版本管理和交付；未另行授予所有第三方素材统一开源许可。

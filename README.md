# Pokémon HUD · Koji 美化版

弦九宝可梦 HUD 的黑白2与剑盾界面，在同一仓库独立维护、独立发布。

## 下载与使用

| 版本 | 下载入口 | 更新方式 |
| --- | --- | --- |
| 黑白2完整版 v0.3.10 | [黑白2发布页](https://github.com/niheartent/pokemon_hud_koji/releases/tag/bw2-v0.3.10) | 设置 → 检查更新，检查美化版与弦九核心 |
| 黑白2独立版 v0.3.10 | 同一发布页的 independent JSON | 重新导入升级 |
| 剑盾版 v1.5.1 | [剑盾发布页](https://github.com/niheartent/pokemon_hud_koji/releases/tag/swsh-v1.5.1) | 设置 → 检查更新，检查美化版与弦九核心 |

下载 Release 附件中的 JSON，导入酒馆助手脚本并替换对应旧版。只启用一个 HUD 脚本。旧版首次接入本仓库更新源需要重新导入一次。

本次发布保持已验证的内置核心基线：黑白2 v3.3.1，剑盾 v3.0.16；检查更新可取得新核心。黑白2已对实际 v3.3.19 验证合成启动，剑盾的原生装饰方式也会先检查接口。内置基线与远程最新核心是两个不同版本字段。

## 更新逻辑

1. 同时检查本仓库对应美化通道和弦九核心。
2. 有美化更新时，先核对通道、版本与 SHA-256，再使用新版适配规则。
3. 新核心通过兼容检查后合成完整脚本，由用户点击安装。
4. 新核心不兼容时，可采用已发布的兼容美化包，但不降低当前核心。
5. 本地缓存保存成功后尝试写回角色卡；写回失败时可以复制合成内容手动导入。

运行缓存按两种界面隔离，启动时同时比较核心与美化版本。只更新美化版、连续更新美化版也可在刷新后加载。

## 开发

需要 Node.js 22 或更新版本。

```sh
npm ci
npx playwright install chromium
npm run build
npm test
npm run package
npm run verify
```

Windows 可复用已安装的 Chrome；也可通过 `CHROME_PATH` 指定浏览器。CI 安装 Playwright Chromium。构建、截图和报告输出在被 Git 忽略的生成目录与 `artifacts/`。

## 目录

```text
src/bw2/       黑白2源码、核心快照、构建与回归
src/swsh/      剑盾源码、核心快照、构建与回归
src/shared/    双来源更新器与双版本启动判断
tests/         远程更新、真实浏览器缓存启动测试
tools/         版本调整、打包、校验
updates/       各通道固定更新清单
versions/      按版本保存的发布脚本
docs/          发布说明、代码边界与验证记录
```

[发布流程](docs/PUBLISHING.md) · [代码边界](docs/ARCHITECTURE.md) · [第三方来源](THIRD_PARTY.md)

## 致谢

核心业务来自 [弦九 pkm-hud](https://github.com/xianjiu0926/pkm-hud)，精灵与道具图像继续使用核心已有在线数据源。本仓库管理美化与适配代码，不包含用户真实聊天存档。

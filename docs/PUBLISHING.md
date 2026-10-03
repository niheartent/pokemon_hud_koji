# 发布流程

黑白与剑盾分开编号。修改共享更新器时，两版都应提高版本并执行回归。

## 1. 修改与编号

在仓库根目录执行，例如：

```sh
node tools/set-version.cjs bw2 0.3.10
```

剑盾使用 `swsh` 和自己的新版本号。修改对应 `docs/bw2-release.md` 或 `docs/swsh-release.md` 的发布说明。编号工具同步该通道构建器、预览与测试中的版本引用。

## 2. 构建与检查

```sh
npm ci
npm run build
npm test
npm run package
npm run verify
```

打包产生 `versions/<通道>/<版本>/`、固定通道更新清单和 `artifacts/` 附件。已存在的版本如果内容不同，打包会报错，必须提高版本。

## 3. 提交与标签

```sh
git add .
git commit -m "Release bw2 v0.3.10"
git tag bw2-v0.3.10
git push --atomic origin main bw2-v0.3.10
```

剑盾标签例如 `swsh-v1.4.5`。修改源码但不发布时，只推送 main。正式发布必须把源码、版本文件与更新清单放在同一次提交，再推送对应标签。

## 4. 自动发布

GitHub Actions 在标签推送后安装依赖、构建、测试、核对版本文件，然后创建 Release 并上传对应通道的 ZIP 和 JSON。黑白 Release 另含独立版 JSON。

固定更新清单指向标签文件，用户无需更改地址。源码提交不会改动已发布的标签文件。

首次仓库初始化或需要补发附件时，可在 Actions → Publish HUD release → Run workflow 输入已存在的标签。此模式使用 main 的修复后的构建与测试流程，源码版本必须与输入标签一致；版本文件内容不符时仍会拒绝发布。

## 失败与回退

CI 失败先查看 Actions 日志并修复，未通过时不会创建发布附件。用户遇到更新问题可重新导入 Release 中的 JSON。需要撤回更新提示时，将对应 updates 清单改为先前发布版本并提交；不会自动降低已经安装的用户版本。

不要重新指向已发布标签，也不要覆盖旧版本目录。更正正式发布内容时使用新版本号。

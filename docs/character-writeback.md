# 角色卡写回适配

桌面端写回由 `src/shared/koji-updater.js` 管理，两个完整版共用；独立版不带远程更新器。

## 已核对的宿主接口

TauriTavern 源码快照 f6126b4fc9243eb3990f2c0bad86e2afcb502f22：

- [头像文件名到存储标识](https://github.com/Darkatse/TauriTavern/blob/f6126b4fc9243eb3990f2c0bad86e2afcb502f22/src/tauri/main/services/characters/character-identity.js)：头像文件名去掉 `.png` 后是存储标识，不能用显示名称替代，也不能解码或修剪文件名。
- [角色命令](https://github.com/Darkatse/TauriTavern/blob/f6126b4fc9243eb3990f2c0bad86e2afcb502f22/src-tauri/crates/tauritavern/src/presentation/commands/character_commands.rs)：`get_character({name})`、`update_character({name,dto})`、`clear_character_cache({})`。
- [更新 DTO](https://github.com/Darkatse/TauriTavern/blob/f6126b4fc9243eb3990f2c0bad86e2afcb502f22/src-tauri/crates/tt-application/src/dto/character_dto.rs)：扩展可独立提交，避免把旧描述、名字等字段写回。

旧逻辑扫描第一张含 HUD 的角色卡，并把显示名称传给后端。新逻辑读取当前会话角色的头像标识，读取最新卡片，只替换 HUD 脚本，再以相同标识写回并回读校验。找不到角色时清理角色缓存并最多重试一次。保存确认后同步当前会话中的脚本副本。

缺少头像的旧桥接，仅允许从实时列表中找到唯一名称匹配后取得头像标识；同名多卡时拒绝写入。写入前确认当前卡未切换。找不到当前卡时不会改写其他卡。

## 旧版迁移

旧版本发起安装时仍运行旧写回函数。若显示本地已保存，可刷新启用新版本，再在设置点击「重新写回当前角色卡」。此操作读取已安装的隔离更新槽，核对其核心和 UI 版本与当前运行版本一致后再写入，不需要新发布或重新下载。

## 验证范围

`node tests/character-writeback.cjs`：严格模拟后端存储标识、缓存失效、当前角色为索引 0、多张同名卡、切卡、卡已删除、无 HUD、权限错误、回读不一致；并在两版生成的浏览器页面执行实际写回函数与补写按钮。宿主接口是模拟的，不修改用户的真实角色卡。远程更新与 IndexedDB 流程另由 `tests/remote-update.cjs` 和发布升级测试覆盖。

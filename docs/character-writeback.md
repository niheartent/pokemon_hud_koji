# 角色卡写回适配

桌面端写回由 `src/shared/character-writeback.js` 提供，更新编排在 `src/shared/koji-updater.js`，两个完整版共用；独立版不带远程更新器。

## 已核对的宿主接口

TauriTavern 源码快照 f6126b4fc9243eb3990f2c0bad86e2afcb502f22：

- [头像文件名到存储标识](https://github.com/Darkatse/TauriTavern/blob/f6126b4fc9243eb3990f2c0bad86e2afcb502f22/src/tauri/main/services/characters/character-identity.js)：头像文件名去掉 `.png` 后是存储标识，不能用显示名称替代，也不能解码或修剪文件名。
- [角色命令](https://github.com/Darkatse/TauriTavern/blob/f6126b4fc9243eb3990f2c0bad86e2afcb502f22/src-tauri/crates/tauritavern/src/presentation/commands/character_commands.rs)：`get_character({name})`、`update_character({name,dto})`、`clear_character_cache({})`。
- [更新 DTO](https://github.com/Darkatse/TauriTavern/blob/f6126b4fc9243eb3990f2c0bad86e2afcb502f22/src-tauri/crates/tt-application/src/dto/character_dto.rs)：扩展可独立提交，避免把旧描述、名字等字段写回。

旧逻辑扫描第一张含 HUD 的角色卡，并把显示名称传给后端。新逻辑读取当前会话角色的头像标识，读取最新卡片，只替换 HUD 脚本，再以相同标识写回并回读校验。找不到角色时清理角色缓存并最多重试一次。保存确认后同步当前会话中的脚本副本。

缺少头像的旧桥接，仅允许从实时列表中找到唯一名称匹配后取得头像标识；同名多卡时拒绝写入。写入前确认当前卡未切换。找不到当前卡时不会改写其他卡。

## 旧版迁移：保存不需要刷新

通过 SHA-256 和语法检查后，旧更新器会调用已验证新包的合成器。合成器为当前 HUD 的安装按钮登记临时捕获处理器；检查阶段不写卡、不安装。点击安装时阻止旧安装处理器，直接运行本次已验证包携带的独立更新槽安装器及角色卡写入器。保存成功后移除临时处理器；宿主 API 始终不做替换。重复点击由 pending 状态拦截。

`src/shared/install-runtime.cjs` 从固定核心提取原有的 `pkSha256Text`、`pkDbOpen`、`pkInstallRecord` 及相关常量，构造纯安装器。复用原子事务、active/previous 备份和 SHA-256 记录结构，核对合成脚本内的数据库标识与包的隔离数据库一致。不执行下载的 HUD，刷新仅用于切换正在运行的界面版本。

写回器只选择启用中的对应通道脚本，跳过 enabled=false 的旧 HUD；存在多个同通道启用项时拒绝猜测。保存后同步当前会话中被更新的脚本，禁用脚本保持原内容与顺序。

新版安装器的直接函数调用也采用本次已验证候选包中的纯写入器工厂。旧版在线迁移需要正常下载美化包并成功合成；离线或无法合成时旧客户端没有执行新合成器的入口。设置中的「重新写回当前角色卡」保留为单独重试入口。

## 验证范围

`node tests/character-writeback.cjs`：严格模拟后端存储标识、缓存失效、当前角色为索引 0、多张同名卡、切卡、卡已删除、无 HUD、权限错误、回读不一致；并在两版生成的浏览器页面执行实际写回函数与补写按钮。宿主接口是模拟的，不修改用户的真实角色卡。远程更新与 IndexedDB 流程另由 `tests/remote-update.cjs` 和发布升级测试覆盖。

`node tests/live-writeback-upgrade.cjs` 使用真实发布过的旧脚本和实际安装按钮，模拟按存储标识工作的桌面后端，先复现旧报错，再验证同一页面内直接保存当前角色卡、其他卡不变、只写一次、读回一致、临时处理器移除、宿主 API 不变，导航次数始终为 1。设置 `UPSTREAM_CANDIDATE` 可先把旧包合成为指定真实核心，再执行同样的测试。

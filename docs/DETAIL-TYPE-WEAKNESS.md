# 精灵详情属性克制入口适配

## 为什么核心更新成功，功能入口却没有出现

v4.0.45 新增三个函数：typeWeakChipHTML 生成可点击属性标签，detailTypesHTML 收集精灵的双属性，showTypeWeakness 根据双属性计算倍率并打开子弹窗。核心的点击代理识别 data-type-weak。

原版 detailHTML 改为调用 detailTypesHTML。但美化版由自有展示模块生成 detailHTML，黑白版进一步使用 bw2DetailHTML。我们的详情仍调用 typesHTML，只有普通标签，没有 data-type-weak。因此核心能正常下载、合成和运行，新计算函数也存在，但用户没有可点击入口。语法与接口检查不能证明新增功能已接入。

## 本次代码边界

- src/shared/presentation.js：新增 kojiDetailTypesHTML，用本地 typeColor／typeLabel 生成属性标签，仅用于详情。
- src/bw2/bw2-ui.js：上屏详情属性使用共享入口。
- src/shared/feature-adapter.js：一次性注册回车／空格监听，调用同一个业务服务。
- src/shared/upstream/pkm-hud.js：固定 v4.0.45 的上游代码，保留原版倍率计算和子弹窗服务。
- src/swsh/swsh-colors.css 与 src/bw2/bw2-theme.css：仅增加可点击、悬停与焦点样式，属性颜色仍由本地方案管理。

点击通过原版的 data-type-weak 事件协议调用 showTypeWeakness。展示层不复制 TYPE_CHART，不维护另一套计算算法，不引入原版 CSS。

## 双属性合并含义

每一个进攻属性分别对精灵的两个防御属性计算倍率，再相乘。草＋钢受到火攻击是 2×2=4；毒对草是2，但钢免疫毒，因此总倍率是0。点击两个标签中的任意一个，都查看整只精灵的防御关系，不是只看被点击的单一属性。结果显示4倍、2倍、半倍、四分之一倍和免疫，普通1倍不列出。

## 新旧核心兼容

入口判断 showTypeWeakness 是否存在。存在时显示带 data-type-weak、role=button、tabindex=0 的标签；不存在时调用原有 typesHTML。因此旧核心可以继续运行，不会显示失效按钮。列表、附近精灵和其他普通属性标签不改成新的详情入口。

## 两种 UI 的结果展示

剑盾子弹窗继续采用独立的白天／黑夜配色；黑白子弹窗继续使用上屏对话框。关闭计算结果只关闭子弹窗，保留原精灵详情和已有操作。

## 已验证范围及后续检查方法

浏览器验证覆盖剑盾、黑白完整版和独立版的真实详情入口，点击、回车、空格，双属性倍率，免疫与关闭后详情保留。旧 v4.0.43 验证普通标签回退。完整回归覆盖页面、样式隔离、业务操作及历史版本升级。

以后上游改变渲染函数时，先区分业务服务是否变化、事件协议是否变化、原版模板是否变化。自有模板不会自动继承原版新入口；必须检查入口生成和点击闭环，而不仅是脚本能否合成。若 showTypeWeakness 或事件协议被替换，调整展示适配器；算法变化仍由上游核心承担。

# Mermaid Gantt Studio

本地 Mermaid 排期工作台：编辑源码、实时预览、点击任务反向修改源码，并导出 SVG / PNG。基于官方 Mermaid 11.17.2，保留泳道分隔、右侧标签、风险颜色与发布日期线。

## 启动网页

需要 Node.js 20 或更高版本。网页自带 Mermaid，无需安装依赖。

```sh
npm start
```

地址为 http://127.0.0.1:4173 ，仅监听本机。macOS 可双击 `editor/启动编辑器.command`。

支持双栏和专注视图、点击任务编辑、撤销、手势与滚轮缩放、自定义画布及 SVG / PNG 导出。所有编辑在本机进行，离开页面前请保存源码。

详细说明见 [网页编辑器](editor/README.md)。

## 命令行渲染

```sh
npm run setup:renderer
cd renderer
npx playwright install chromium
node gantt.mjs examples/ws53.mmd -o result --width 2560 --release 2026-10-15
```

默认输出 SVG 和 PNG，高度自动适应。参数见 [渲染器文档](renderer/README.md)。

## 工程结构

- `editor/`：网页、启动服务、交互源码与测试。
- `renderer/`：官方引擎适配器、CLI、依赖锁文件、示例图与兼容性测试。
- `editor/dist/vendor/`：离线 Mermaid 包与许可证。

`dist` 是直接维护的静态网页源码，需要纳入版本控制。网页与 CLI 的 `browser-render.mjs` 应保持相同，网页测试会核对。

## 检查

```sh
npm run check
npm test
npm run test:renderer
```

渲染器测试需要先安装依赖与 Chromium，也可通过 `GANTT_BROWSER` 指定已有 Chrome。第三方许可证见 `editor/dist/vendor/MERMAID-LICENSE`。依赖缓存、本地部署信息和打包归档不纳入源码仓库。

## 在线版

入口：https://github.sanchuanhehe.com/mermaid-gantt-studio/

公开静态网页位于账号主页仓库 `sanchuanhehe/sanchuanhehe.github.io` 的 `mermaid-gantt-studio/` 目录。完整工程继续保持私有。公开网页使用通用排期示例，并移除了内部计划备注；本仓库的私人示例不会自动发布。

更新在线版时，应只同步 `editor/dist` 中的网页资产，并保留公开版的通用示例和备注，再提交账号主页仓库。

# 版本生命周期

当前基线：**0.1.0**。此前 package.json 中的 1.0.0 / 2.0.0 是原型阶段占位版本，未发布对应标签；自此统一网页、CLI 与根工程版本。

## 开发与版本规则

- `main`：可部署的开发主线，每次推送经过检查后只更新 preview；stable 对应最新正式 Release。
- 功能或修复使用短期分支和 PR；PR 执行网页、版本及官方渲染兼容性检查。当前不强制分支保护，仓库管理员仍可直接推送。
- `0.1.1`：修复或兼容的小改动；`0.2.0`：功能迭代，也可包含明确记录的破坏性变更。
- 预览版使用 `0.2.0-beta.1` / `0.2.0-rc.1`，发布时标记 prerelease。
- `1.0.0`：公开接口、文件格式与核心操作达到稳定承诺后再发布。
- 已发布标签与安装包不可覆盖。发现问题发布补丁版本；不移动已有标签。

## Changelog 规范

遵循 [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)。CHANGELOG 面向使用者人工整理，描述值得关注的变化及影响，不直接粘贴 git log 或提交列表。

- 顶部保留 `[Unreleased]`，已发布版本按新到旧排列。
- 版本标题使用 `## [0.1.0] - YYYY-MM-DD`，日期为实际发布日期。
- 使用以下分类，只列有内容的分类，不添加空分类占位：

  | 分类 | 内容 |
  |---|---|
  | Added | 新功能 |
  | Changed | 现有功能的变化 |
  | Deprecated | 即将移除的功能 |
  | Removed | 已移除的功能 |
  | Fixed | 错误修复 |
  | Security | 安全漏洞修复 |

- 标明破坏性变更、受影响的使用方式和必要的迁移步骤。
- `[Unreleased]` 链接为最新标签到 HEAD 的比较；后续版本链接为前后标签比较。首版没有前一个标签，链接到该版 Release。
- 撤回的版本保留记录，并在版本标题后加 `[YANKED]`，说明原因，不删除历史。
- 可修正文档中的遗漏和错误，但不因此覆盖已发布的 Git 标签或安装包。

## 发布流程

1. 将变更记录写入 CHANGELOG.md 的 Unreleased 段。
2. 执行 `npm run version:set -- 0.1.1`，同步三个 package.json、锁文件和界面版本。
3. 把 Unreleased 内容整理为带日期的 `[0.1.1]` 段并更新比较链接。
4. 修改 CHANGELOG 后运行 `npm run changelog:build`，同步网站更新日志页面并提交。执行 `npm run check`、`npm test`。渲染器需 `npm run setup:renderer` 与 Chromium，再运行 `npm run test:renderer`。
5. 合并 / 提交到 main 并等待 CI 通过；在该提交创建标签：

   ```sh
   git tag -a v0.1.1 -m 'Release v0.1.1'
   git push origin v0.1.1
   ```

6. Release 工作流重新验证版本与标签、变更记录、网页测试和渲染兼容性，然后生成 GitHub Release、离线网页包、完整源码包与 SHA256SUMS。
7. 核对 Release 的提交与附件。Release 继承仓库私有权限；公开 Pages 仅发布经过清理的网页资产。

若某次发布失败，可在修复运行条件后重跑对应 Actions；不要修改已发布标签。预览版本不会被设为 latest。

## 线上发布与回退

Pages 按下文的三个通道组合部署，发布前复用完整 CI。域名继承账号主页，不在项目里设置 CNAME。

- 快速恢复：对导致问题的提交执行 `git revert` 并推送 main，保留可审计记录，CI 通过后恢复 preview，stable 不受影响。
- 已发版出现问题：修复后发布新的 patch；历史 Release 留存，用户可下载旧版本。
- 本地复现旧版本：下载对应 Release 或 `git checkout v0.1.0`。

## 维护与停止支持

0.x 默认维护最新次版本系列；旧版本不承诺持续修复。移除功能提前在 CHANGELOG 的 Deprecated 中说明，并在实际移除版本中标明迁移方式。停止项目维护时在 README / Release 中说明状态，再决定是否归档仓库，不自动删除历史版本。

## 已知边界

当前图上编辑支持标题、泳道名称、备注、图例以及带唯一显式 ID 的任务，可新增泳道和节点，尚不支持拖拽排期。浏览器截图/手势的自动端到端测试尚未纳入 CI；现有 CI 包括编辑状态逻辑测试和 Chromium 内的官方渲染兼容性测试。


## Pages 发布通道

| 通道 | 项目内路径 | 更新时机 |
| --- | --- | --- |
| 最新 stable | / | 最新正式 GitHub Release 发布成功后 |
| 最新 preview | /preview/ | main 通过检查后 |
| 版本快照 | /versions/vX.Y.Z/ | 对应 GitHub Release 发布成功后 |

现有地址 https://github.sanchuanhehe.com/mermaid-gantt-studio/ 始终提供最新 stable。预发布版本也有独立快照，例如 versions/v0.2.0-rc.1/，但不会替换 stable。preview 页头显示提交短 SHA，避免与正式版混淆。

Pages 一次部署覆盖整个站点，因此构建时组合所有通道：preview 来自 main；stable 与历史快照从已发布的公开 web.zip 构建产物提取，先校验 SHA256SUMS.txt，再复制其中的 dist 文件。不会用 main 重建旧版本或把私有源码包发布到网页。缺少正式版本、附件或校验失败时停止部署，保留线上已有站点。

Release 工作流成功完成会触发 Pages 更新；普通 main 提交只更新 preview。手动运行 Pages 工作流可重新同步。禁止修改或删除已发布的标签与附件，以保持历史快照；需要修复时发布新版本。channels.json 提供当前通道与版本索引。离线发布包仍为单版本，不包含整个多通道网站。

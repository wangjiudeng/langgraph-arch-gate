# Changelog

遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范。

## [1.0.0] - 2026-11-28

### Added

- 四层架构：`domain`（状态与类型）/ `infra`（扫描、落盘、存档工厂）/ `graph`（节点、边、装配）/ `cli`（演示与验收）
- 五个节点：`scan`、`architect`、`gate`、`apply`、`revise`
- `gate` 节点基于 `interrupt` 实现人工闸门，配合 `Command({ resume })` 从断点恢复
- `revise → architect` 闭环：驳回计入轮次，意见回注下一轮方案
- `docs/plan.md` 作为评审结论的唯一事实源（SSOT）
- 7 条断言验收（`npm run verify`）与 5 个单元测试（`npm test`）
- GitHub Actions：Node 20 / 22 双版本 typecheck + test + smoke
- `docs/architecture.md`：分层理由、五个设计取舍、已知边界

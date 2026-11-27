/**
 * 落盘：评审结论写入 docs/plan.md，作为后续编码的唯一事实源（SSOT）。
 * 单独抽出来，是为了将来换存储（数据库 / 对象存储）时不动业务节点。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ReviewRecord } from "../domain/types";

export function writeReviewPlan(root: string, record: ReviewRecord): string {
  const dir = join(root, "docs");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "plan.md");

  const body = [
    "# 架构评审结论",
    "",
    `- 需求：${record.requirement}`,
    `- 结论：${record.approval.approved ? "通过" : "驳回"}`,
    `- 修订轮次：${record.revision}`,
    `- 确认时间：${record.decidedAt}`,
    `- 意见：${record.approval.comment ?? "无"}`,
    "",
    "## 方案",
    "",
    record.plan,
    "",
  ].join("\n");

  writeFileSync(file, body);
  return `docs/plan.md`;
}

/**
 * 演示：跑到闸门会停、停下能拿到待审方案、用同一 thread_id 恢复后继续。
 */
import { buildGraph, Command } from "../index";

const app = buildGraph();

console.log("=== 场景一：评审通过 ===\n");

const threadA = { configurable: { thread_id: "req-001" } };

console.log("[1] 启动流水线 → 预计停在 gate 节点");
const run1 = await app.invoke({ requirement: "给无人机控制台加一个批量航线导入功能" }, threadA);
console.log("    已暂停，等待人工确认（decision 仍为空）:", run1.decision === null);
console.log("    扫描结果:", run1.files);
console.log(
  "    待审方案:\n" +
    String(run1.plan)
      .split("\n")
      .map((l) => "      " + l)
      .join("\n"),
);

console.log("\n[2] 人工确认通过 → 用同一 thread_id 恢复");
const run2 = await app.invoke(
  new Command({ resume: { approved: true, comment: "同意，但回滚方案要补上" } }),
  threadA,
);
console.log(
  "    最终计划:\n" +
    String(run2.plan)
      .split("\n")
      .map((l) => "      " + l)
      .join("\n"),
);

console.log("\n=== 场景二：驳回 → 重写 → 再通过 ===\n");

const threadB = { configurable: { thread_id: "req-002" } };

console.log("[1] 启动 → 暂停等确认");
await app.invoke({ requirement: "把控制台首页改成暗色主题" }, threadB);

console.log("[2] 驳回，退回重写");
const r2 = await app.invoke(
  new Command({ resume: { approved: false, comment: "改动面太大，先只改配色变量" } }),
  threadB,
);
console.log("    修订轮次:", r2.revision);

console.log("[3] 二次评审通过");
const r3 = await app.invoke(
  new Command({ resume: { approved: true, comment: "这版可以，按此执行" } }),
  threadB,
);
console.log(
  "    " +
    String(r3.plan)
      .split("\n")
      .join("\n    "),
);

console.log("\n=== 完成 ===");

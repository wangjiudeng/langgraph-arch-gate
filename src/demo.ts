/**
 * 演示三件事：
 *  1) 跑到人工确认那一步会停住（interrupt）
 *  2) 停住之后能拿到当前状态和待确认的方案
 *  3) 用同一个 thread_id 恢复，越过闸门继续跑（断点续跑）
 */
import { Command, buildGraph } from "./graph";

const app = buildGraph();

const REQ = "给无人机控制台加一个批量航线导入功能";
const threadA = { configurable: { thread_id: "req-001" } };

console.log("=== 场景一：评审通过 ===\n");

console.log("[1] 启动流水线，跑到 gate 节点");
const run1 = await app.invoke({ requirement: REQ }, threadA);
const interruptPayload = (run1 as Record<string, unknown>).__interrupt__;
console.log("   状态：已暂停，等待人工确认");
console.log("   扫描到文件：", (run1 as Record<string, unknown>).files);
console.log("   待确认方案：\n" + (run1.plan as string).split("\n").map((l) => "      " + l).join("\n"));

console.log("\n[2] 人工确认：通过");
const run2 = await app.invoke(
  new Command({ resume: { approved: true, comment: "同意，但回滚方案要补上" } }),
  threadA,
);
console.log("   最终计划：\n" + (run2.plan as string).split("\n").map((l) => "      " + l).join("\n"));
console.log("   归档位置：docs/plan.md\n");

console.log("=== 场景二：评审驳回，退回重写 ===\n");

const threadB = { configurable: { thread_id: "req-002" } };
const r1 = await app.invoke({ requirement: "把控制台首页改成暗色主题" }, threadB);
console.log("[1] 暂停，等确认");

const r2 = await app.invoke(
  new Command({ resume: { approved: false, comment: "改动面太大，先只改配色变量" } }),
  threadB,
);
console.log("[2] 已驳回，退回重写，当前修订次数：", r2.revision);
const r3 = await app.invoke(
  new Command({ resume: { approved: true, comment: "这版可以，按此执行" } }),
  threadB,
);
console.log("[3] 二次评审通过：\n" + (r3.plan as string).split("\n").map((l) => "      " + l).join("\n"));

console.log("\n=== 完成 ===\n");

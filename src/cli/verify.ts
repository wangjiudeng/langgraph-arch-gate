/**
 * 验收脚本：把两条主链路的预期结果写成断言，跑通即通过。
 * 作用不是"看日志"，而是让"评审闸门真的拦得住"这件事可被自动验证。
 */
import { buildGraph, Command } from "../index";

let failures = 0;

function check(name: string, pass: boolean, detail?: string) {
  console.log(`${pass ? "✓" : "✗"} ${name}${detail ? "  → " + detail : ""}`);
  if (!pass) failures++;
}

const app = buildGraph();

// —— 用例 1：通过路径
const t1 = { configurable: { thread_id: "verify-001" } };
const r1 = await app.invoke({ requirement: "新增批量航线导入" }, t1);
check("闸门确实停在人工确认前（未自动往下跑）", r1.decision === null, `decision=${r1.decision}`);
check("中断时已产出方案", String(r1.plan).includes("方案："));
check("中断时未写盘", !String(r1.plan).includes("评审通过"));

const r1b = await app.invoke(new Command({ resume: { approved: true, comment: "同意" } }), t1);
check("确认通过后流程走完并落盘", String(r1b.plan).includes("评审通过"));

// —— 用例 2：驳回 → 重写 → 通过
const t2 = { configurable: { thread_id: "verify-002" } };
await app.invoke({ requirement: "首页改暗色主题" }, t2);
const r2 = await app.invoke(new Command({ resume: { approved: false, comment: "改动面太大" } }), t2);
check("驳回后退回重写并计轮次", r2.revision === 1, `revision=${r2.revision}`);

const r3 = await app.invoke(new Command({ resume: { approved: true, comment: "这版可以" } }), t2);
check("二轮方案吸收了上一轮意见", String(r3.plan).includes("改动面太大"));

// —— 用例 3：断点续跑（同一 thread 状态未丢）
check("跨调用保持同一状态（未重新扫描）", Array.isArray(r1b.files) && (r1b.files as string[]).length > 0);

console.log(`\n${failures === 0 ? "全部通过" : `失败 ${failures} 项`}`);
process.exit(failures === 0 ? 0 : 1);

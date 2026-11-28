import test from "node:test";
import assert from "node:assert/strict";
import { buildGraph, Command } from "../src/index";

const cfg = (threadId: string) => ({ configurable: { thread_id: threadId } });

test("闸门在人工确认前中断：不自动往下跑、不写盘", async () => {
  const app = buildGraph();
  const result = await app.invoke({ requirement: "新增批量航线导入" }, cfg("t-interrupt"));

  assert.equal(result.decision, null, "decision 必须为空，说明卡在闸门");
  assert.match(result.plan, /方案：/, "中断时应已产出方案");
  assert.doesNotMatch(result.plan, /评审通过/, "中断时不得落盘");
});

test("确认通过后走完链路并落盘", async () => {
  const app = buildGraph();
  const thread = cfg("t-approve");
  await app.invoke({ requirement: "新增批量航线导入" }, thread);
  const done = await app.invoke(
    new Command({ resume: { approved: true, comment: "同意" } }),
    thread,
  );

  assert.match(done.plan, /评审通过/);
  assert.equal(done.decision?.approved, true);
});

test("驳回计入轮次，且意见回注下一轮方案", async () => {
  const app = buildGraph();
  const thread = cfg("t-reject");

  await app.invoke({ requirement: "首页改暗色主题" }, thread);
  const rejected = await app.invoke(
    new Command({ resume: { approved: false, comment: "改动面太大，先只改配色变量" } }),
    thread,
  );
  assert.equal(rejected.revision, 1);

  const approved = await app.invoke(
    new Command({ resume: { approved: true, comment: "这版可以" } }),
    thread,
  );
  assert.match(approved.plan, /改动面太大/);
  assert.equal(approved.revision, 1);
});

test("同一 thread 跨调用保留状态：不重复扫描", async () => {
  const app = buildGraph();
  const thread = cfg("t-state");
  const first = await app.invoke({ requirement: "改配色" }, thread);
  const resumed = await app.invoke(new Command({ resume: { approved: true } }), thread);

  assert.ok(Array.isArray(first.files) && first.files.length > 0);
  assert.deepEqual(resumed.files, first.files, "恢复后应沿用中断前的扫描结果");
});

test("不同 thread 互不串味", async () => {
  const app = buildGraph();
  const a = await app.invoke({ requirement: "需求A" }, cfg("t-a"));
  const b = await app.invoke({ requirement: "需求B" }, cfg("t-b"));

  assert.match(a.plan, /需求A/);
  assert.match(b.plan, /需求B/);
});

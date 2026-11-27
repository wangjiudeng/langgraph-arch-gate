/**
 * 架构评审闸门 —— LangGraph 版
 *
 * 把「AI 交付流水线」里的第一步（现状扫描 + 架构评审 + 人工确认）
 * 抽成一个独立的 graph，用来演示三件事：
 *   1. StateGraph：节点 + 条件边
 *   2. Checkpointer：每个节点走完自动存档，可断点续跑
 *   3. interrupt：在不可逆操作前暂停，等人确认后再继续
 */
import {
  StateGraph,
  Annotation,
  MemorySaver,
  interrupt,
  Command,
  START,
} from "@langchain/langgraph";
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

/** 全局状态：在节点之间流转的那张纸 */
const ArchState = Annotation.Root({
  requirement: Annotation<string>(),
  files: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  stack: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  risks: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  plan: Annotation<string>({ reducer: (_a, b) => b, default: () => "" }),
  revision: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),
  decision: Annotation<{ approved: boolean; comment?: string } | null>({
    reducer: (_a, b) => b, default: () => null,
  }),
});

type State = typeof ArchState.State;

/** 节点 1：扫描存量代码与技术栈 */
function scanNode(_state: State) {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === ".git") continue;
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|json)$/.test(name)) files.push(relative(ROOT, full));
    }
  };
  walk(ROOT);

  const stack: string[] = [];
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    stack.push(...Object.keys(pkg.dependencies ?? {}));
  } catch { /* 忽略 */ }

  return { files, stack };
}

/** 节点 2：产出架构方案（这里用规则生成，换成 LLM 就是真产能） */
function architectNode(state: State) {
  const plan = [
    `目标：${state.requirement}`,
    `现状：${state.files.length} 个源码/配置文件，主要技术栈 ${state.stack.join(", ") || "未识别"}`,
    `方案：`,
    `  1) 新增 arch-gate 模块承载评审逻辑，不改动既有调用方；`,
    `  2) 评审结果写入 docs/plan.md，作为后续编码的唯一依据；`,
    `  3) 编码前必须通过人工确认，未通过不落代码。`,
    state.revision > 0 ? `修订说明：第 ${state.revision} 次修订，已吸收上一轮意见「${state.decision?.comment ?? "无"}」` : "",
  ].filter(Boolean).join("\n");

  const risks = [
    "方案涉及新增依赖，需确认与既有技术栈兼容",
    "若评审结论不落盘，后续无法回答「这行代码按什么依据改的」",
  ];

  return { plan, risks };
}

/** 节点 3：人工确认闸门 —— 停在这里，等人点头 */
async function gateNode(state: State) {
  const answer = interrupt({
    step: "架构评审",
    ask: "是否通过该架构方案？（true=进入编码，false=退回重写）",
    plan: state.plan,
    risks: state.risks,
  }) as { approved: boolean; comment?: string };

  return { decision: answer };
}

/** 节点 4：通过 —— 落盘，作为唯一事实源 */
function applyNode(state: State) {
  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(
    join(ROOT, "docs", "plan.md"),
    `# 架构评审结论\n\n状态：通过\n\n${state.plan}\n\n备注：${state.decision?.comment ?? "无"}\n`,
  );
  return { plan: `${state.plan}\n→ 评审通过，已写入 docs/plan.md，可进入编码` };
}

/** 节点 5：驳回 —— 退回重写，带着意见重来 */
function reviseNode(state: State) {
  return {
    revision: state.revision + 1,
    plan: `${state.plan}\n← 评审驳回：${state.decision?.comment ?? "未给出意见"}，退回重写`,
  };
}

/** 条件边：根据人的决定选择走向 */
function routeAfterGate(state: State) {
  return state.decision?.approved ? "apply" : "revise";
}

export function buildGraph() {
  const graph = new StateGraph(ArchState)
    .addNode("scan", scanNode)
    .addNode("architect", architectNode)
    .addNode("gate", gateNode)
    .addNode("apply", applyNode)
    .addNode("revise", reviseNode)
    .addEdge(START, "scan")
    .addEdge("scan", "architect")
    .addEdge("architect", "gate")
    .addConditionalEdges("gate", routeAfterGate, { apply: "apply", revise: "revise" })
    .addEdge("revise", "architect");

  // Checkpointer：每个节点执行完自动存档
  const checkpointer = new MemorySaver();

  return graph.compile({ checkpointer });
}

export { Command };

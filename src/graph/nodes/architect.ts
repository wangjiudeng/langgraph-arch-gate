import type { State } from "../../domain/state";

export const RISK_DEFAULTS = [
  "方案涉及新增依赖，需确认与既有技术栈兼容",
  "若评审结论不落盘，后续无法回答「这行代码按什么依据改的」",
];

/**
 * 节点 2：产出架构方案。
 * 这一版用规则生成（只为让流程可跑、可读）；换成 LLM + 上下文检索即是产线形态。
 */
export function architectNode(state: State) {
  const lines = [
    `目标：${state.requirement}`,
    `现状：${state.files.length} 个源码/配置文件，主要技术栈 ${state.stack.join(", ") || "未识别"}`,
    "方案：",
    "  1) 新增 arch-gate 模块承载评审逻辑，不改动既有调用方；",
    "  2) 评审结论写入 docs/plan.md，作为后续编码的唯一依据；",
    "  3) 编码前必须通过人工确认，未通过不落代码。",
  ];

  if (state.revision > 0) {
    lines.push(`修订说明：第 ${state.revision} 次修订，已吸收上一轮意见「${state.decision?.comment ?? "无"}」`);
  }

  return { plan: lines.join("\n"), risks: RISK_DEFAULTS };
}

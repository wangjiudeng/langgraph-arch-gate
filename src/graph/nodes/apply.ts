import { writeReviewPlan } from "../../infra/plan-writer";
import type { State } from "../../domain/state";

/** 节点 4：通过 —— 结论落盘，成为唯一事实源 */
export function applyNode(state: State) {
  const path = writeReviewPlan(process.cwd(), {
    requirement: state.requirement,
    approval: state.decision ?? { approved: true },
    plan: state.plan,
    revision: state.revision,
    decidedAt: new Date().toISOString(),
  });

  return { plan: `${state.plan}\n→ 评审通过，已写入 ${path}，可进入编码` };
}

import type { State } from "../../domain/state";

/** 节点 5：驳回 —— 记下意见，退回重写；下一轮 architect 会带着意见重新出方案 */
export function reviseNode(state: State) {
  return { revision: state.revision + 1 };
}

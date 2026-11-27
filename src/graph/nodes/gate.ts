import { interrupt } from "@langchain/langgraph";
import type { State } from "../../domain/state";
import type { GatePayload } from "../../domain/types";

/** 节点 3：人工确认闸门 —— 走到这里就停住，等人点头 */
export async function gateNode(state: State) {
  const payload: GatePayload = {
    step: "架构评审",
    ask: "是否通过该架构方案？（true=进入编码，false=退回重写）",
    plan: state.plan,
    risks: state.risks,
  };

  const answer = interrupt(payload) as { approved: boolean; comment?: string };
  return { decision: answer };
}

export const GATE_ROUTE = { apply: "apply", revise: "revise" } as const;

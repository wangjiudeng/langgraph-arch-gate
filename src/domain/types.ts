/**
 * 领域类型：只表达业务语义，不依赖 LangGraph。
 * 放在最底层，任何一层都可以引它，它不引任何人。
 */

/** 人工审批的结论 */
export interface Approval {
  approved: boolean;
  comment?: string;
}

/** 闸门抛给「人」的载荷，前端拿到它就渲染一张审批卡 */
export interface GatePayload {
  step: string;
  ask: string;
  plan: string;
  risks: string[];
}

/** 评审结论的落盘形态 */
export interface ReviewRecord {
  requirement: string;
  approval: Approval;
  plan: string;
  revision: number;
  decidedAt: string;
}

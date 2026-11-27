import type { State } from "../domain/state";

/**
 * 条件边：分流依据是「人的决定」，不是「模型的输出」。
 * 这一行就是"不可逆操作必须过人"在代码里的落点。
 */
export function routeAfterGate(state: State): "apply" | "revise" {
  return state.decision?.approved ? "apply" : "revise";
}

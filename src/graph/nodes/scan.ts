import { scanRepo } from "../../infra/repo-scanner";
import type { State } from "../../domain/state";

/** 节点 1：扫描存量代码与技术栈 —— 评审要有事实依据，不能拍脑袋 */
export function scanNode(_state: State) {
  const { files, stack } = scanRepo(process.cwd());
  return { files, stack };
}

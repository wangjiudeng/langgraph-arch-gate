/**
 * 全局状态：在节点之间流转的那张纸。
 * 只定义「是什么」，不定义「怎么算」——算法在节点里。
 */
import { Annotation } from "@langchain/langgraph";
import type { Approval } from "./types";

export const ArchState = Annotation.Root({
  requirement: Annotation<string>(),
  files: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  stack: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  risks: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  plan: Annotation<string>({ reducer: (_a, b) => b, default: () => "" }),
  revision: Annotation<number>({ reducer: (_a, b) => b, default: () => 0 }),
  decision: Annotation<Approval | null>({ reducer: (_a, b) => b, default: () => null }),
});

export type State = typeof ArchState.State;

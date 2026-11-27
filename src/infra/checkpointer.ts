/**
 * Checkpointer 工厂：换存档介质只改这一处。
 * memory 适合演示与单进程；生产换 SqliteSaver / PostgresSaver 即可跨进程续跑。
 */
import { MemorySaver } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";

export type CheckpointerKind = "memory";

export function createCheckpointer(kind: CheckpointerKind = "memory"): BaseCheckpointSaver {
  switch (kind) {
    case "memory":
    default:
      return new MemorySaver();
  }
}

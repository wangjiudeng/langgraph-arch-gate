/**
 * 编排层：只负责"把节点连成图"，不写业务。
 * 节点是纯函数，边是纯判断，装配集中在这里。
 */
import { StateGraph, START, END } from "@langchain/langgraph";
import { ArchState } from "../domain/state";
import { scanNode } from "./nodes/scan";
import { architectNode } from "./nodes/architect";
import { gateNode } from "./nodes/gate";
import { applyNode } from "./nodes/apply";
import { reviseNode } from "./nodes/revise";
import { routeAfterGate } from "./edges";
import { createCheckpointer, type CheckpointerKind } from "../infra/checkpointer";

export interface BuildOptions {
  checkpointer?: CheckpointerKind;
}

export function buildGraph(options: BuildOptions = {}) {
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
    .addEdge("revise", "architect")
    .addEdge("apply", END);

  return graph.compile({ checkpointer: createCheckpointer(options.checkpointer) });
}

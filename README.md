# langgraph-arch-gate

把 AI 交付流水线里最贵的一步——**架构评审**——做成一个可暂停、可回放、可续跑的 LangGraph 工作流。

> 背景：AI 写代码很快，但"写完不敢信"。真正卡住落地的不是生成能力，而是**谁来确认、依据是什么、出问题能不能追溯**。这个小项目就是把这三件事工程化。

## 它解决什么

| 问题 | 这个项目怎么解 |
|---|---|
| AI 直接落代码，架构错了返工很贵 | 评审节点前置，**架构不通过不落代码** |
| 无法回答"这行代码按什么依据改的" | 评审结论落盘 `docs/plan.md`，作为唯一事实源 |
| 不可逆操作不敢交给 AI 自主执行 | `interrupt` 在闸门处暂停，**人工确认后才继续** |
| 长流程断了要重头跑 | `Checkpointer` 每个节点存档，同 `thread_id` 断点续跑 |

## 图长什么样

```
START → scan(扫描存量代码/技术栈)
      → architect(产出架构方案)
      → gate(⏸ interrupt：等人点头)
           ├─ approved → apply(落盘 docs/plan.md) → END
           └─ rejected → revise(记下驳回意见) → architect（带意见重写）
```

- **节点**是纯函数，只返回对 state 的部分更新
- **条件边**按人的决定分流，不是按模型输出
- **state** 在节点间流转，`revision` 记录往返轮次

## 三个概念，一句话各解释一遍

- **state**：一张在节点之间传递的纸，每个节点读它、改它、写回。
- **checkpoint**：游戏存档。每走完一个节点自动存一份，断了能接着跑，也能回看当时状态。
- **interrupt**：暂停等人。跑到闸门停住，把方案交出来给人看，人答了才用存档继续。

## 跑起来

```bash
npm install
npm run demo
```

不需要任何模型 API Key——`architect` 节点用规则生成方案，方便直接看到流程；把这一步换成 LLM 调用，就是真实产线版本。

运行结果会打印两个场景：**评审通过**与**驳回后重写再通过**。

## 文件

```
src/graph.ts   # 状态定义、五个节点、条件边、checkpointer
src/demo.ts    # 两个场景的完整演示
docs/plan.md   # 评审通过后生成的唯一事实源（运行后出现）
```

## 下一步可以接的东西

- 把 `MemorySaver` 换成 `SqliteSaver` / `PostgresSaver`，实现跨进程续跑
- `architect` 接真实 LLM + 仓库上下文检索（Repomix / 向量库）
- 闸门接入前端：把 `interrupt` 的 payload 渲染成审批卡片
- 加一个 eval 节点：评审结论与最终改动比对，量化"返工率"

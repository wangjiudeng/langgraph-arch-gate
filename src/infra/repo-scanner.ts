/**
 * 基础设施层：跟框架无关的脏活。
 * 换成别的编排框架（LangGraph / 自研 / Temporal），这一层基本可以原样搬走。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface ScanResult {
  files: string[];
  stack: string[];
}

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage"]);
const CODE_EXT = /\.(ts|tsx|js|mjs|json|md)$/;

/** 扫描仓库：文件清单 + 技术栈，给评审提供"现状"依据 */
export function scanRepo(root: string, maxDepth = 4): ScanResult {
  const files: string[] = [];

  const walk = (dir: string, depth: number) => {
    if (depth > maxDepth) return;
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full, depth + 1);
      else if (CODE_EXT.test(name)) files.push(relative(root, full));
    }
  };

  walk(root, 0);

  const stack: string[] = [];
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    stack.push(...Object.keys(pkg.dependencies ?? {}));
  } catch {
    // 没有 package.json 就不识别技术栈，不阻断流程
  }

  return { files, stack };
}

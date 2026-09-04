import type { GoalWithPacing } from "@/lib/guidance/engine";

export function findGoalById(id: number, tree: GoalWithPacing[]): GoalWithPacing | null {
  for (const g of tree) {
    if (g.id === id) return g;
    const found = findGoalById(id, g.children);
    if (found) return found;
  }
  return null;
}

export function findParent(goalId: number, tree: GoalWithPacing[]): GoalWithPacing | null {
  for (const g of tree) {
    for (const c of g.children) {
      if (c.id === goalId) return g;
      const found = findParent(goalId, [c]);
      if (found) return found;
    }
  }
  return null;
}

export function findParentChain(goalId: number, tree: GoalWithPacing[]): GoalWithPacing[] {
  const chain: GoalWithPacing[] = [];
  function walk(g: GoalWithPacing, path: GoalWithPacing[]): boolean {
    if (g.id === goalId) {
      chain.push(...path);
      return true;
    }
    for (const child of g.children) {
      if (walk(child, [...path, g])) return true;
    }
    return false;
  }
  for (const root of tree) {
    if (walk(root, [])) break;
  }
  return chain;
}

export function flattenAll(tree: GoalWithPacing[]): GoalWithPacing[] {
  const r: GoalWithPacing[] = [];
  function w(g: GoalWithPacing) { r.push(g); g.children.forEach(w); }
  tree.forEach(w);
  return r;
}

export function getDepthLabel(goal: GoalWithPacing, allGoals: GoalWithPacing[]): string {
  if (goal.children.length > 0 && !goal.parentGoalId) return "EPIC";
  if (goal.parentGoalId) {
    const parent = findGoalById(goal.parentGoalId, allGoals);
    if (parent && parent.parentGoalId) return "TASK";
    return "ISSUE";
  }
  if (goal.goalType === "cadence") return "CADENCE";
  return "GOAL";
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
}

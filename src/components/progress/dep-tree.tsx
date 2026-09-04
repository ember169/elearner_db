import { FT_COMMON_CORE, type FtProject } from "@/lib/guidance/ft-project-tree";

interface DepTreeProps {
  completedProjects: string[];
  inProgressProjects: string[];
  availableSlugs: string[];
  currentCircle: number;
}

type NodeStatus = "done" | "in-progress" | "available" | "locked";

function getStatus(
  slug: string,
  completed: Set<string>,
  inProgress: Set<string>,
  available: Set<string>,
): NodeStatus {
  if (completed.has(slug)) return "done";
  if (inProgress.has(slug)) return "in-progress";
  if (available.has(slug)) return "available";
  return "locked";
}

const STATUS_FILL: Record<NodeStatus, string> = {
  done: "var(--cb-success-tint)",
  "in-progress": "var(--cb-or-tint)",
  available: "var(--cb-or-tint)",
  locked: "var(--cb-raised)",
};
const STATUS_STROKE: Record<NodeStatus, string> = {
  done: "var(--cb-success)",
  "in-progress": "var(--cb-or)",
  available: "var(--cb-or)",
  locked: "var(--cb-line)",
};
const STATUS_TEXT: Record<NodeStatus, string> = {
  done: "var(--cb-success)",
  "in-progress": "var(--cb-or)",
  available: "var(--cb-or)",
  locked: "var(--cb-text-muted)",
};

const NODE_W = 100;
const NODE_H = 32;
const GAP_X = 12;
const GAP_Y = 48;
const GROUP_PAD = 6;
const GROUP_LABEL_H = 14;

type LayoutNode = {
  slug: string;
  name: string;
  status: NodeStatus;
  x: number;
  y: number;
  w: number;
  h: number;
  group?: string;
};

type GroupBox = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Edge = {
  fromSlug: string;
  toSlug: string;
};

function layoutTree(
  completed: Set<string>,
  inProgress: Set<string>,
  available: Set<string>,
) {
  const byCircle = new Map<number, FtProject[]>();
  for (const p of FT_COMMON_CORE) {
    const arr = byCircle.get(p.circle) ?? [];
    arr.push(p);
    byCircle.set(p.circle, arr);
  }

  const nodes: LayoutNode[] = [];
  const groups: GroupBox[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, LayoutNode>();

  let globalY = 16;

  for (const [circle, projects] of Array.from(byCircle.entries()).sort(([a], [b]) => a - b)) {
    // Separate into sub-rows based on intra-circle dependencies
    const subRows = buildSubRows(projects, circle);

    for (const subRow of subRows) {
      const { items, rowH } = layoutRow(subRow, globalY, completed, inProgress, available);

      for (const item of items) {
        if (item.kind === "node") {
          nodes.push(item.node);
          nodeMap.set(item.node.slug, item.node);
        } else {
          groups.push(item.groupBox);
          for (const n of item.nodes) {
            nodes.push(n);
            nodeMap.set(n.slug, n);
          }
        }
      }

      globalY += rowH + GAP_Y;
    }
  }

  // Build edges from actual prerequisites
  for (const p of FT_COMMON_CORE) {
    for (const prereq of p.prerequisites) {
      if (nodeMap.has(prereq) && nodeMap.has(p.slug)) {
        edges.push({ fromSlug: prereq, toSlug: p.slug });
      }
    }
  }

  return { nodes, groups, edges, nodeMap, totalH: globalY + 16 };
}

type SubRow = FtProject[];

function buildSubRows(projects: FtProject[], circle: number): SubRow[] {
  // Find projects whose prerequisites are ALL from previous circles (entry points)
  // vs projects that depend on other projects within this circle
  const slugsInCircle = new Set(projects.map((p) => p.slug));
  const entryProjects: FtProject[] = [];
  const dependentProjects: FtProject[] = [];

  for (const p of projects) {
    const hasIntraCircleDep = p.prerequisites.some((pr) => slugsInCircle.has(pr));
    if (hasIntraCircleDep) {
      dependentProjects.push(p);
    } else {
      entryProjects.push(p);
    }
  }

  if (dependentProjects.length === 0) {
    return [entryProjects];
  }

  // Build layers: keep pulling projects whose intra-circle deps are all placed
  const rows: SubRow[] = [entryProjects];
  const placed = new Set(entryProjects.map((p) => p.slug));
  let remaining = [...dependentProjects];

  while (remaining.length > 0) {
    const nextRow: FtProject[] = [];
    const stillRemaining: FtProject[] = [];

    for (const p of remaining) {
      const intraDeps = p.prerequisites.filter((pr) => slugsInCircle.has(pr));
      if (intraDeps.every((d) => placed.has(d))) {
        nextRow.push(p);
      } else {
        stillRemaining.push(p);
      }
    }

    if (nextRow.length === 0) {
      // Avoid infinite loop — dump remaining into last row
      rows.push(stillRemaining);
      break;
    }

    rows.push(nextRow);
    for (const p of nextRow) placed.add(p.slug);
    remaining = stillRemaining;
  }

  return rows;
}

type RowItem =
  | { kind: "node"; node: LayoutNode }
  | { kind: "group"; groupBox: GroupBox; nodes: LayoutNode[] };

function layoutRow(
  projects: FtProject[],
  y: number,
  completed: Set<string>,
  inProgress: Set<string>,
  available: Set<string>,
): { items: RowItem[]; rowH: number } {
  const items: RowItem[] = [];
  let x = 20;
  let maxH = NODE_H;

  const seenGroups = new Set<string>();

  for (const p of projects) {
    const status = getStatus(p.slug, completed, inProgress, available);

    if (p.group) {
      if (seenGroups.has(p.group)) continue;
      seenGroups.add(p.group);

      const members = projects.filter((q) => q.group === p.group);
      const memberW = Math.max(60, ...members.map((m) => m.name.length * 7 + 16));
      const totalInnerW = members.length * memberW + (members.length - 1) * 4;
      const boxW = totalInnerW + GROUP_PAD * 2;
      const boxH = NODE_H + GROUP_LABEL_H + GROUP_PAD * 2;

      const label = p.group.replace(/^circle\d+-/, "").replace(/-/g, " ");
      const groupBox: GroupBox = { label, x, y, w: boxW, h: boxH };

      const groupNodes: LayoutNode[] = members.map((m, i) => {
        const st = getStatus(m.slug, completed, inProgress, available);
        return {
          slug: m.slug,
          name: m.name,
          status: st,
          x: x + GROUP_PAD + i * (memberW + 4),
          y: y + GROUP_LABEL_H + GROUP_PAD,
          w: memberW,
          h: NODE_H - 4,
          group: p.group,
        };
      });

      items.push({ kind: "group", groupBox, nodes: groupNodes });
      x += boxW + GAP_X;
      maxH = Math.max(maxH, boxH);
    } else {
      const w = Math.max(NODE_W, p.name.length * 8 + 20);
      const node: LayoutNode = {
        slug: p.slug,
        name: p.name,
        status,
        x,
        y,
        w,
        h: NODE_H,
      };
      items.push({ kind: "node", node });
      x += w + GAP_X;
    }
  }

  return { items, rowH: maxH };
}

export function DepTree({
  completedProjects,
  inProgressProjects,
  availableSlugs,
  currentCircle,
}: DepTreeProps) {
  const completed = new Set(completedProjects);
  const inProgress = new Set(inProgressProjects);
  const available = new Set(availableSlugs);

  const { nodes, groups, edges, nodeMap, totalH } = layoutTree(
    completed,
    inProgress,
    available,
  );

  const maxX = Math.max(
    ...nodes.map((n) => n.x + n.w),
    ...groups.map((g) => g.x + g.w),
    600,
  );
  const svgW = maxX + 60;

  // Identify circles for labels
  const circleYs = new Map<number, number>();
  for (const p of FT_COMMON_CORE) {
    const node = nodeMap.get(p.slug);
    if (node) {
      const existing = circleYs.get(p.circle);
      if (existing === undefined || node.y < existing) {
        circleYs.set(p.circle, node.y);
      }
    }
  }

  // Deduplicate edges for & gates: when multiple edges share the same target
  // AND source from the same circle, draw a gate
  const edgesByTarget = new Map<string, Edge[]>();
  for (const e of edges) {
    const arr = edgesByTarget.get(e.toSlug) ?? [];
    arr.push(e);
    edgesByTarget.set(e.toSlug, arr);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-cb-sans text-cb-card text-cb-text">
          Dependency tree
        </h2>
        <span className="cb-label-mono text-cb-caption text-cb-muted">
          prerequisites &amp; gates
        </span>
      </div>

      <div className="overflow-x-auto rounded-cb-card border border-cb-line bg-cb-card p-4">
        <svg
          viewBox={`0 0 ${svgW} ${totalH}`}
          width="100%"
          style={{ minWidth: 600 }}
          className="block"
        >
          <defs>
            <marker
              id="dep-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path
                d="M2 1L8 5L2 9"
                fill="none"
                stroke="context-stroke"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>

          {/* Circle labels */}
          {Array.from(circleYs.entries()).map(([circle, y]) => (
            <text
              key={`cl${circle}`}
              x={svgW - 12}
              y={y + NODE_H / 2}
              textAnchor="end"
              dominantBaseline="central"
              fill={circle <= currentCircle ? "var(--cb-or)" : "var(--cb-text-muted)"}
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="500"
              letterSpacing=".1em"
            >
              C{circle}
            </text>
          ))}

          {/* Groups */}
          {groups.map((g) => (
            <g key={g.label}>
              <rect
                x={g.x}
                y={g.y}
                width={g.w}
                height={g.h}
                rx={6}
                fill="none"
                stroke="var(--cb-or)"
                strokeWidth={0.5}
                strokeDasharray="3 2"
              />
              <text
                x={g.x + GROUP_PAD}
                y={g.y + 10}
                fill="var(--cb-or)"
                fontSize={9}
                fontFamily="var(--font-mono)"
                fontWeight={500}
                letterSpacing=".08em"
              >
                PICK ONE · {g.label.toUpperCase()}
              </text>
            </g>
          ))}

          {/* Nodes */}
          {nodes.map((n) => (
            <g key={n.slug} opacity={n.group && n.status === "locked" ? 0.5 : 1}>
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={n.group ? 4 : 6}
                fill={STATUS_FILL[n.status]}
                stroke={STATUS_STROKE[n.status]}
                strokeWidth={0.5}
              />
              <text
                x={n.x + n.w / 2}
                y={n.y + n.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={STATUS_TEXT[n.status]}
                fontSize={n.group ? 10 : 11}
                fontWeight={n.status === "done" ? 600 : 400}
              >
                {n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name}
              </text>
            </g>
          ))}

          {/* Edges */}
          {edges.map((e, i) => {
            const from = nodeMap.get(e.fromSlug);
            const to = nodeMap.get(e.toSlug);
            if (!from || !to) return null;

            const x1 = from.x + from.w / 2;
            const y1 = from.y + from.h;
            const x2 = to.x + to.w / 2;
            const y2 = to.y;

            if (Math.abs(y2 - y1) < 4) {
              // Same row — horizontal arrow
              const startX = from.x + from.w;
              const endX = to.x;
              return (
                <line
                  key={i}
                  x1={startX + 2}
                  y1={from.y + from.h / 2}
                  x2={endX - 2}
                  y2={to.y + to.h / 2}
                  stroke="var(--cb-line)"
                  strokeWidth={1}
                  markerEnd="url(#dep-arrow)"
                />
              );
            }

            // Vertical or L-shaped
            const midY = y1 + (y2 - y1) / 2;
            if (Math.abs(x1 - x2) < 2) {
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1 + 2}
                  x2={x2}
                  y2={y2 - 2}
                  stroke="var(--cb-line)"
                  strokeWidth={1}
                  markerEnd="url(#dep-arrow)"
                />
              );
            }

            return (
              <path
                key={i}
                d={`M${x1} ${y1 + 2} L${x1} ${midY} L${x2} ${midY} L${x2} ${y2 - 2}`}
                fill="none"
                stroke="var(--cb-line)"
                strokeWidth={1}
                markerEnd="url(#dep-arrow)"
              />
            );
          })}

          {/* & gates — one badge per unique prerequisite set */}
          {(() => {
            const seen = new Set<string>();
            const gates: React.ReactNode[] = [];

            for (const [target, tEdges] of edgesByTarget.entries()) {
              if (tEdges.length < 2) continue;
              const key = [...tEdges.map((e) => e.fromSlug)].sort().join(",");
              if (seen.has(key)) continue;
              seen.add(key);

              const toNode = nodeMap.get(target);
              if (!toNode) continue;
              const fromNodes = tEdges
                .map((e) => nodeMap.get(e.fromSlug))
                .filter((n): n is LayoutNode => !!n);
              if (fromNodes.length < 2) continue;

              const ySpread =
                Math.max(...fromNodes.map((n) => n.y)) -
                Math.min(...fromNodes.map((n) => n.y));
              if (ySpread > NODE_H) continue;

              const minX = Math.min(...fromNodes.map((n) => n.x + n.w / 2));
              const maxX = Math.max(...fromNodes.map((n) => n.x + n.w / 2));
              const midX = (minX + maxX) / 2;
              const fromY = fromNodes[0].y + fromNodes[0].h;
              const midY = fromY + (toNode.y - fromY) / 2;

              gates.push(
                <g key={`gate-${key}`}>
                  <rect
                    x={midX - 18}
                    y={midY - 8}
                    width={36}
                    height={16}
                    rx={8}
                    fill="var(--cb-or-tint)"
                    stroke="var(--cb-or)"
                    strokeWidth={0.5}
                  />
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--cb-or)"
                    fontSize={8}
                    fontWeight={700}
                    fontFamily="var(--font-mono)"
                  >
                    &amp; ALL
                  </text>
                </g>,
              );
            }
            return gates;
          })()}
        </svg>

        <div className="mt-3 flex flex-wrap gap-4">
          <LegendItem color="var(--cb-success)" label="Done" />
          <LegendItem color="var(--cb-or)" label="In progress / available" />
          <LegendItem color="var(--cb-line)" label="Locked" hollow />
          <span className="flex items-center gap-1.5 font-cb-mono text-cb-caption text-cb-muted">
            <span
              className="inline-flex items-center justify-center rounded-lg bg-cb-or-tint px-1.5 py-px text-cb-caption font-bold text-cb-or"
              style={{ border: "0.5px solid var(--cb-or)" }}
            >
              &amp;
            </span>
            All prerequisites required
          </span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  hollow,
}: {
  color: string;
  label: string;
  hollow?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 font-cb-mono text-cb-caption text-cb-muted">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={hollow ? { border: `1.5px solid ${color}` } : { background: color }}
      />
      {label}
    </span>
  );
}

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
  locked: "var(--cb-muted)",
};

type Row = { circle: number; nodes: TreeNode[] };
type TreeNode =
  | { kind: "single"; project: FtProject; status: NodeStatus }
  | { kind: "group"; label: string; projects: { project: FtProject; status: NodeStatus }[] }
  | { kind: "chain"; label: string; projects: FtProject[]; status: NodeStatus };

function buildRows(
  completed: Set<string>,
  inProgress: Set<string>,
  available: Set<string>,
): Row[] {
  const byCircle = new Map<number, FtProject[]>();
  for (const p of FT_COMMON_CORE) {
    const list = byCircle.get(p.circle) ?? [];
    list.push(p);
    byCircle.set(p.circle, list);
  }

  const rows: Row[] = [];
  for (const [circle, projects] of Array.from(byCircle.entries()).sort(([a], [b]) => a - b)) {
    const nodes: TreeNode[] = [];
    const seen = new Set<string>();

    for (const p of projects) {
      if (seen.has(p.slug)) continue;

      if (p.group) {
        const members = projects.filter((q) => q.group === p.group);
        for (const m of members) seen.add(m.slug);
        const label = p.group.replace(/^circle\d+-/, "").replace(/-/g, " ");
        nodes.push({
          kind: "group",
          label,
          projects: members.map((m) => ({
            project: m,
            status: getStatus(m.slug, completed, inProgress, available),
          })),
        });
        continue;
      }

      // Detect sequential chains (cpp00→cpp01→...)
      const chain: FtProject[] = [p];
      seen.add(p.slug);
      let current = p;
      while (true) {
        const next = projects.find(
          (q) => !seen.has(q.slug) && q.prerequisites.length === 1 && q.prerequisites[0] === current.slug && !q.group,
        );
        if (!next) break;
        chain.push(next);
        seen.add(next.slug);
        current = next;
      }

      if (chain.length >= 3) {
        const chainStatus = chain.every((c) => completed.has(c.slug))
          ? "done" as const
          : chain.some((c) => inProgress.has(c.slug) || completed.has(c.slug))
            ? "in-progress" as const
            : available.has(chain[0].slug)
              ? "available" as const
              : "locked" as const;
        const first = chain[0].name.replace(/ Module /, "");
        const last = chain[chain.length - 1].name.replace(/ Module /, "");
        nodes.push({ kind: "chain", label: `${first} → ${last}`, projects: chain, status: chainStatus });
      } else {
        for (const c of chain) {
          nodes.push({ kind: "single", project: c, status: getStatus(c.slug, completed, inProgress, available) });
        }
      }
    }
    rows.push({ circle, nodes });
  }
  return rows;
}

const NODE_H = 34;
const NODE_GAP = 10;
const ROW_GAP = 56;
const GROUP_PAD = 4;
const MINI_H = 22;
const MINI_W = 56;

function nodeWidth(n: TreeNode): number {
  switch (n.kind) {
    case "single":
      return Math.max(80, n.project.name.length * 8 + 24);
    case "group":
      return n.projects.length * (MINI_W + 4) + GROUP_PAD * 2 + 8;
    case "chain":
      return Math.max(120, n.label.length * 7.5 + 24);
  }
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
  const rows = buildRows(completed, inProgress, available);

  const rowWidths = rows.map((r) =>
    r.nodes.reduce((sum, n) => sum + nodeWidth(n) + NODE_GAP, -NODE_GAP),
  );
  const maxW = Math.max(...rowWidths, 600);
  const svgW = maxW + 80;

  let y = 16;
  const rowPositions: { circle: number; y: number; nodes: { x: number; w: number; node: TreeNode }[] }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const totalW = rowWidths[i];
    let x = (svgW - 40 - totalW) / 2 + 20;
    const nodePos: { x: number; w: number; node: TreeNode }[] = [];
    const nodeH = row.nodes.some((n) => n.kind === "group") ? NODE_H + MINI_H + GROUP_PAD * 2 : NODE_H;

    for (const n of row.nodes) {
      const w = nodeWidth(n);
      nodePos.push({ x, w, node: n });
      x += w + NODE_GAP;
    }
    rowPositions.push({ circle: row.circle, y, nodes: nodePos });
    y += nodeH + ROW_GAP;
  }

  const svgH = y + 20;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-cb-sans text-[17px] font-bold text-cb-text">
          Dependency tree
        </h2>
        <span className="cb-label-mono text-[10px] text-cb-muted">
          prerequisites &amp; gates
        </span>
      </div>

      <div className="overflow-x-auto rounded-cb-card border border-cb-line bg-cb-card p-4">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
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

          {rowPositions.map((row, ri) => {
            const nodeH = row.nodes.some((n) => n.node.kind === "group")
              ? NODE_H + MINI_H + GROUP_PAD * 2
              : NODE_H;

            return (
              <g key={ri}>
                {/* Circle label */}
                <text
                  x={svgW - 12}
                  y={row.y + nodeH / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill={row.circle <= currentCircle ? "var(--cb-or)" : "var(--cb-muted)"}
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fontWeight="500"
                  letterSpacing=".1em"
                >
                  C{row.circle}
                </text>

                {/* Nodes */}
                {row.nodes.map((np, ni) => {
                  const n = np.node;
                  if (n.kind === "single") {
                    return (
                      <g key={ni}>
                        <rect
                          x={np.x}
                          y={row.y}
                          width={np.w}
                          height={NODE_H}
                          rx={6}
                          fill={STATUS_FILL[n.status]}
                          stroke={STATUS_STROKE[n.status]}
                          strokeWidth={0.5}
                        />
                        <text
                          x={np.x + np.w / 2}
                          y={row.y + NODE_H / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={STATUS_TEXT[n.status]}
                          fontSize={12}
                          fontWeight={n.status === "done" || n.status === "in-progress" ? 600 : 400}
                        >
                          {n.project.name}
                        </text>
                      </g>
                    );
                  }

                  if (n.kind === "chain") {
                    return (
                      <g key={ni}>
                        <rect
                          x={np.x}
                          y={row.y}
                          width={np.w}
                          height={NODE_H}
                          rx={6}
                          fill={STATUS_FILL[n.status]}
                          stroke={STATUS_STROKE[n.status]}
                          strokeWidth={0.5}
                        />
                        <text
                          x={np.x + np.w / 2}
                          y={row.y + NODE_H / 2 - 4}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={STATUS_TEXT[n.status]}
                          fontSize={11}
                          fontWeight={500}
                        >
                          {n.label}
                        </text>
                        <text
                          x={np.x + np.w / 2}
                          y={row.y + NODE_H / 2 + 8}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="var(--cb-muted)"
                          fontSize={9}
                          fontFamily="var(--font-mono)"
                        >
                          {n.projects.length} modules
                        </text>
                      </g>
                    );
                  }

                  // Group
                  const groupH = NODE_H + MINI_H + GROUP_PAD;
                  return (
                    <g key={ni}>
                      <rect
                        x={np.x}
                        y={row.y}
                        width={np.w}
                        height={groupH}
                        rx={6}
                        fill="none"
                        stroke="var(--cb-or)"
                        strokeWidth={0.5}
                        strokeDasharray="3 2"
                      />
                      <text
                        x={np.x + 6}
                        y={row.y + 10}
                        fill="var(--cb-or)"
                        fontSize={9}
                        fontFamily="var(--font-mono)"
                        fontWeight={500}
                        letterSpacing=".08em"
                      >
                        PICK ONE · {n.label.toUpperCase()}
                      </text>
                      {n.projects.map((gp, gi) => {
                        const mx = np.x + GROUP_PAD + gi * (MINI_W + 4);
                        const my = row.y + NODE_H - 4;
                        return (
                          <g key={gi} opacity={gp.status === "locked" ? 0.5 : 1}>
                            <rect
                              x={mx}
                              y={my}
                              width={MINI_W}
                              height={MINI_H}
                              rx={4}
                              fill={STATUS_FILL[gp.status]}
                              stroke={STATUS_STROKE[gp.status]}
                              strokeWidth={0.5}
                            />
                            <text
                              x={mx + MINI_W / 2}
                              y={my + MINI_H / 2}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={STATUS_TEXT[gp.status]}
                              fontSize={9}
                            >
                              {gp.project.name.length > 8
                                ? gp.project.name.slice(0, 7) + "…"
                                : gp.project.name}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* Connectors to next row */}
                {ri < rowPositions.length - 1 && (
                  <ConnectorSet
                    from={row}
                    to={rowPositions[ri + 1]}
                    fromH={nodeH}
                    svgW={svgW}
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className="mt-3 flex flex-wrap gap-4">
          <LegendItem color="var(--cb-success)" label="Done" />
          <LegendItem color="var(--cb-or)" label="In progress / available" />
          <LegendItem color="var(--cb-line)" label="Locked" hollow />
          <span className="flex items-center gap-1.5 font-cb-mono text-[10px] text-cb-muted">
            <span className="inline-flex items-center justify-center rounded-lg bg-cb-or-tint px-1.5 py-px text-[9px] font-bold text-cb-or" style={{ border: "0.5px solid var(--cb-or)" }}>
              &amp;
            </span>
            All prerequisites required
          </span>
        </div>
      </div>
    </div>
  );
}

function ConnectorSet({
  from,
  to,
  fromH,
  svgW,
}: {
  from: { y: number; nodes: { x: number; w: number; node: TreeNode }[] };
  to: { y: number; nodes: { x: number; w: number; node: TreeNode }[] };
  fromH: number;
  svgW: number;
}) {
  const fromBottom = from.y + fromH;
  const toTop = to.y;
  const midY = (fromBottom + toTop) / 2;

  const fromCenters = from.nodes.map((n) => n.x + n.w / 2);
  const toCenters = to.nodes.map((n) => n.x + n.w / 2);

  const multiplePrereqs = to.nodes.length > 1 && from.nodes.length > 1;

  return (
    <g>
      {/* Lines from source nodes down to midY */}
      {fromCenters.map((cx, i) => (
        <line
          key={`fd${i}`}
          x1={cx}
          y1={fromBottom}
          x2={cx}
          y2={midY}
          stroke="var(--cb-line)"
          strokeWidth={1}
        />
      ))}

      {/* Horizontal connector at midY if multiple sources */}
      {fromCenters.length > 1 && (
        <>
          <line
            x1={Math.min(...fromCenters)}
            y1={midY}
            x2={Math.max(...fromCenters)}
            y2={midY}
            stroke="var(--cb-line)"
            strokeWidth={1}
          />
          {/* & gate */}
          <rect
            x={(Math.min(...fromCenters) + Math.max(...fromCenters)) / 2 - 18}
            y={midY - 8}
            width={36}
            height={16}
            rx={8}
            fill="var(--cb-or-tint)"
            stroke="var(--cb-or)"
            strokeWidth={0.5}
          />
          <text
            x={(Math.min(...fromCenters) + Math.max(...fromCenters)) / 2}
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
        </>
      )}

      {/* Lines from midY down to target nodes */}
      {toCenters.map((cx, i) => (
        <line
          key={`td${i}`}
          x1={cx}
          y1={midY}
          x2={cx}
          y2={toTop}
          stroke="var(--cb-line)"
          strokeWidth={1}
          markerEnd="url(#dep-arrow)"
        />
      ))}
    </g>
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
    <span className="flex items-center gap-1.5 font-cb-mono text-[10px] text-cb-muted">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={hollow ? { border: `1.5px solid ${color}` } : { background: color }}
      />
      {label}
    </span>
  );
}

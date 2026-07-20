"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Pencil,
  Trash2,
  Clock,
  Zap,
  TrendingUp,
  RotateCcw,
  Check,
  ArrowRight,
  GripVertical,
  Plus,
  X,
  Link as LinkIcon,
  Type,
  Hash,
} from "lucide-react";
import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/platform-colors";
import { METRIC_SOURCES } from "@/lib/goals/shared";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { assertOk } from "@/lib/utils";

function findGoalById(id: number, tree: GoalWithPacing[]): GoalWithPacing | null {
  for (const g of tree) {
    if (g.id === id) return g;
    const found = findGoalById(id, g.children);
    if (found) return found;
  }
  return null;
}

function getDepthLabel(goal: GoalWithPacing, allGoals: GoalWithPacing[]): string {
  if (goal.children.length > 0 && !goal.parentGoalId) return "EPIC";
  if (goal.parentGoalId) {
    const parent = findGoalById(goal.parentGoalId, allGoals);
    if (parent && parent.parentGoalId) return "TASK";
    return "ISSUE";
  }
  if (goal.goalType === "cadence") return "CADENCE";
  return "GOAL";
}

function findParentChain(goalId: number, tree: GoalWithPacing[]): GoalWithPacing[] {
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

function flattenAll(tree: GoalWithPacing[]): GoalWithPacing[] {
  const r: GoalWithPacing[] = [];
  function w(g: GoalWithPacing) { r.push(g); g.children.forEach(w); }
  tree.forEach(w);
  return r;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
}

function MetadataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-start gap-x-3 py-1.5">
      <span className="text-[14px] text-muted-foreground">{label}</span>
      <div className="text-[14px]">{children}</div>
    </div>
  );
}

async function patchGoal(id: number, data: Record<string, unknown>, onDone?: () => void) {
  const res = await fetch("/api/goals", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  await assertOk(res);
  onDone?.();
}

function ChildRowContent({
  child,
  childLabel,
  platformColor,
  onSelect,
  dragHandleProps,
  parentDeadline,
  onRefresh,
}: {
  child: GoalWithPacing;
  childLabel: string;
  platformColor: string;
  onSelect: (id: number) => void;
  dragHandleProps?: Record<string, unknown>;
  parentDeadline?: string | null;
  onRefresh?: () => void;
}) {
  const isBehind = child.pacing && !child.pacing.onTrack && child.pacing.percentComplete < 100;
  const isCompleted = child.status === "completed";
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 rounded-sm border text-[14px] cursor-pointer hover:bg-accent/30 transition-colors ${
        isCompleted ? "opacity-40 border-border" : isBehind ? "border-red-500/20" : "border-border"
      }`}
      onClick={() => onSelect(child.id)}
    >
      <span
        className="flex-shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
        {...dragHandleProps}
      >
        <GripVertical className="h-3 w-3" />
      </span>
      {isCompleted ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <span className="h-3.5 w-3.5 border border-muted-foreground/40 rounded-sm flex-shrink-0" />
      )}
      <Badge
        className="text-[14px] font-bold uppercase px-1.5 py-0"
        style={{
          backgroundColor: isCompleted ? "transparent" : platformColor,
          color: isCompleted ? platformColor : "#fff",
          border: isCompleted ? `1px solid ${platformColor}40` : "none",
        }}
      >
        {childLabel}
      </Badge>
      <span className={`flex-1 ${isCompleted ? "line-through" : ""}`}>{child.title}</span>
      {child.ftSlug && (
        <span className="text-[15px] font-mono text-muted-foreground">{child.ftSlug}</span>
      )}
      {isBehind && (
        <Badge variant="outline" className="text-[14px] text-red-400 border-red-400/30 px-1 py-0">
          BEHIND
        </Badge>
      )}
      {isCompleted && (
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={async (e) => {
            e.stopPropagation();
            try { await patchGoal(child.id, { status: "active" }, onRefresh); } catch {}
          }}
          title="Reopen"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
      {child.deadline && (
        <span
          className={`text-[14px] ${
            parentDeadline && child.deadline > parentDeadline
              ? "text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          {parentDeadline && child.deadline > parentDeadline && "⚠ "}
          {fmtMonth(child.deadline)}
        </span>
      )}
      {child.children.length > 0 && (
        <span className="text-[14px] text-muted-foreground">
          {child.children.filter((c) => c.status === "completed").length}/{child.children.length}
        </span>
      )}
    </div>
  );
}

function SortableChildRow({
  child,
  childLabel,
  platformColor,
  onSelect,
  parentDeadline,
  onRefresh,
}: {
  child: GoalWithPacing;
  childLabel: string;
  platformColor: string;
  onSelect: (id: number) => void;
  parentDeadline?: string | null;
  onRefresh: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `child-${child.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ChildRowContent
        child={child}
        childLabel={childLabel}
        platformColor={platformColor}
        onSelect={onSelect}
        dragHandleProps={{ ...attributes, ...listeners }}
        parentDeadline={parentDeadline}
        onRefresh={onRefresh}
      />
    </div>
  );
}

function SortableChildrenList({
  children: childGoals,
  childLabel,
  platformColor,
  onSelect,
  parentId,
  parentDeadline,
  onRefresh,
}: {
  children: GoalWithPacing[];
  childLabel: string;
  platformColor: string;
  onSelect: (id: number) => void;
  parentId: number;
  parentDeadline?: string | null;
  onRefresh: () => void;
}) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeChild = activeId
    ? childGoals.find((c) => `child-${c.id}` === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = childGoals.findIndex((c) => `child-${c.id}` === active.id);
    const newIndex = childGoals.findIndex((c) => `child-${c.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...childGoals];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const patches = reordered.map((c, i) => ({ id: c.id, sortOrder: i }));
    await Promise.all(
      patches.map((p) =>
        fetch("/api/goals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        })
      )
    );
    onRefresh();
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={childGoals.map((c) => `child-${c.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {childGoals.map((child) => (
            <SortableChildRow
              key={child.id}
              child={child}
              childLabel={childLabel}
              platformColor={platformColor}
              onRefresh={onRefresh}
              onSelect={onSelect}
              parentDeadline={parentDeadline}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeChild && (
          <ChildRowContent
            child={activeChild}
            childLabel={childLabel}
            platformColor={platformColor}
            onSelect={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function MoveToSelect({
  goal,
  allGoals,
  onRefresh,
}: {
  goal: GoalWithPacing;
  allGoals: GoalWithPacing[];
  onRefresh: () => void;
}) {
  const [moving, setMoving] = useState(false);
  const flat = flattenAll(allGoals);
  const possibleParents = flat.filter((g) => {
    if (g.id === goal.id) return false;
    if (g.parentGoalId) {
      const gParent = findGoalById(g.parentGoalId, allGoals);
      if (gParent?.parentGoalId) return false;
    }
    return true;
  });

  if (!moving) {
    return (
      <Button variant="ghost" size="sm" className="text-[14px]" onClick={() => setMoving(true)}>
        <ArrowRight className="h-3 w-3 mr-1" />
        Move to...
      </Button>
    );
  }

  return (
    <Select
      value={goal.parentGoalId ? String(goal.parentGoalId) : "none"}
      onValueChange={async (v) => {
        const newParent = !v || v === "none" ? null : parseInt(v);
        try {
          await patchGoal(goal.id, { parentGoalId: newParent }, onRefresh);
        } catch (e) {
          alert(e instanceof Error ? e.message : "Failed to move goal.");
          setMoving(false);
        }
      }}
    >
      <SelectTrigger className="w-[180px] h-7 text-[15px]">
        <SelectValue placeholder="Move to..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Standalone</SelectItem>
        {possibleParents.map((g) => (
          <SelectItem key={g.id} value={String(g.id)}>
            {g.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type CustomField = { label: string; value: string; type: "text" | "url" | "number" };
type CustomFieldsMap = Record<string, CustomField>;

function parseCustomFields(raw: string | null): CustomFieldsMap {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function linkifyText(text: string) {
  const urlRe = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRe);
  return parts.map((part, i) =>
    urlRe.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors" style={{ color: "var(--primary)" }}>{part}</a>
    ) : part
  );
}

function CustomFieldsSection({ goalId, raw, onRefresh }: { goalId: number; raw: string | null; onRefresh: () => void }) {
  const fields = parseCustomFields(raw);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"text" | "url" | "number">("text");

  async function addField() {
    if (!newLabel.trim()) return;
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, "_");
    const updated = { ...fields, [key]: { label: newLabel.trim(), value: newValue, type: newType } };
    await patchGoal(goalId, { customFields: JSON.stringify(updated) }, onRefresh);
    setNewLabel(""); setNewValue(""); setAdding(false);
  }

  async function removeField(key: string) {
    const updated = { ...fields };
    delete updated[key];
    await patchGoal(goalId, { customFields: Object.keys(updated).length ? JSON.stringify(updated) : null }, onRefresh);
  }

  const entries = Object.entries(fields);

  return (
    <div className="mb-4">
      {entries.length > 0 && (
        <div className="space-y-1 mb-2">
          {entries.map(([key, field]) => (
            <div key={key} className="grid grid-cols-[80px_1fr_auto] items-start gap-x-3 py-1.5 group">
              <span className="text-[13px] text-muted-foreground">{field.label}</span>
              <div className="text-[14px] min-w-0">
                {field.type === "url" ? (
                  <a href={field.value} target="_blank" rel="noopener noreferrer" className="underline truncate block" style={{ color: "var(--primary)" }}>
                    {field.value}
                  </a>
                ) : field.type === "text" ? (
                  <span className="whitespace-pre-wrap">{linkifyText(field.value)}</span>
                ) : (
                  <span>{field.value}</span>
                )}
              </div>
              <button onClick={() => removeField(key)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div className="space-y-1.5 p-2 rounded-sm border border-border">
          <div className="flex gap-1.5">
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Field name" className="h-7 text-[13px] flex-1" />
            <div className="flex gap-0.5">
              {(["text", "url", "number"] as const).map((t) => {
                const Icon = t === "url" ? LinkIcon : t === "number" ? Hash : Type;
                return (
                  <button key={t} onClick={() => setNewType(t)} className="p-1 rounded-sm transition-colors" style={{ background: newType === t ? "var(--accent)" : "transparent", color: newType === t ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    <Icon className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          </div>
          <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={newType === "url" ? "https://..." : newType === "number" ? "0" : "Value (supports markdown links)"} className="h-7 text-[13px]" onKeyDown={(e) => e.key === "Enter" && addField()} />
          <div className="flex gap-1.5">
            <Button size="xs" onClick={addField} className="h-6 text-[12px]">Add</Button>
            <button onClick={() => { setAdding(false); setNewLabel(""); setNewValue(""); }} className="text-[12px] text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3 w-3" /> Add field
        </button>
      )}
    </div>
  );
}

function InlineTaskAdd({ parentId, category, onRefresh }: { parentId: number; category: string | null; onRefresh: () => void }) {
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  async function addTask() {
    if (!title.trim()) return;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), parentGoalId: parentId, goalType: "cumulative", category: category ?? "general" }),
    });
    await assertOk(res);
    setTitle("");
    onRefresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors mt-1">
        <Plus className="h-3 w-3" /> Quick add task
      </button>
    );
  }

  return (
    <div className="flex gap-1.5 items-center mt-1">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." className="h-7 text-[13px] flex-1" onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") { setOpen(false); setTitle(""); } }} autoFocus />
      <Button size="xs" onClick={addTask} className="h-6 text-[12px]">Add</Button>
      <button onClick={() => { setOpen(false); setTitle(""); }} className="text-muted-foreground"><X className="h-3 w-3" /></button>
    </div>
  );
}

export function DetailPane({
  goal,
  allGoals,
  onEdit,
  onDelete,
  onSelect,
}: {
  goal: GoalWithPacing | null;
  allGoals: GoalWithPacing[];
  onEdit: (goal: GoalWithPacing) => void;
  onDelete: (goalId: number) => void;
  onSelect: (id: number) => void;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  if (!goal) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-[15px]">
        Select a goal from the tree
      </div>
    );
  }

  const depthLabel = getDepthLabel(goal, allGoals);
  const platformColor = PLATFORM_COLORS[goal.category ?? "general"];
  const platformLabel = PLATFORM_LABELS[goal.category ?? "general"];
  const isBehind = goal.pacing && !goal.pacing.onTrack && goal.pacing.percentComplete < 100;
  const isCompleted = goal.status === "completed";
  const parentChain = findParentChain(goal.id, allGoals);
  const childCompleted = goal.children.filter((c) => c.status === "completed").length;
  const childTotal = goal.children.length;

  const progressPercent =
    goal.targetValue && goal.currentValue != null
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;

  const metricLabel = goal.metricSource
    ? (METRIC_SOURCES as Record<string, { label: string }>)[goal.metricSource]?.label ?? goal.metricSource
    : null;

  const isCadence = goal.goalType === "cadence";
  const isTask = depthLabel === "TASK";
  const isEpic = depthLabel === "EPIC";
  const isIssue = depthLabel === "ISSUE";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        {/* Breadcrumb */}
        {parentChain.length > 0 && (
          <div className="flex items-center gap-1 text-[14px] text-muted-foreground mb-1.5 flex-wrap">
            {parentChain.map((p, i) => (
              <span key={p.id} className="flex items-center gap-1">
                {i > 0 && <span>&rsaquo;</span>}
                <Badge
                  variant="outline"
                  className="text-[14px] font-bold uppercase px-1 py-0"
                  style={{ borderColor: platformColor, color: platformColor }}
                >
                  {getDepthLabel(p, allGoals)}
                </Badge>
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => onSelect(p.id)}
                >
                  {p.title}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          {isCadence ? (
            <span className="text-[15px] font-mono border border-border rounded-sm px-1.5 py-0.5">/wk</span>
          ) : (
            <Badge
              variant="outline"
              className="text-[15px] font-bold uppercase tracking-wider px-2 py-0.5"
              style={{ borderColor: platformColor, color: platformColor }}
            >
              {depthLabel}
            </Badge>
          )}
          {platformLabel !== "GEN" && !parentChain.length && (
            <Badge variant="outline" className="text-[15px] font-bold px-1.5 py-0" style={{ borderColor: platformColor, color: platformColor }}>
              {platformLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          {isTask && (
            <button
              className={`flex-shrink-0 h-[18px] w-[18px] border-2 rounded-sm flex items-center justify-center transition-colors ${
                isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/40 hover:border-foreground"
              }`}
              onClick={async () => {
                try { await patchGoal(goal.id, { status: isCompleted ? "active" : "completed" }, refresh); } catch {}
              }}
            >
              {isCompleted && <Check className="h-3 w-3 text-white" />}
            </button>
          )}
          <h2 className="text-[20px] font-bold tracking-[-0.02em] leading-tight">{goal.title}</h2>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {isCompleted ? (
            <Badge className="text-[15px] font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5">Completed</Badge>
          ) : isBehind ? (
            <Badge className="text-[15px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5">
              {isCadence ? "Behind" : "Behind pace"}
            </Badge>
          ) : goal.pacing ? (
            <Badge className="text-[15px] font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5">
              {isCadence ? "On pace" : "On track"}
            </Badge>
          ) : null}
          {isCadence && (
            <span className="text-[15px] text-muted-foreground">Rolling window &middot; {metricLabel ? "Auto-tracked" : "Manual"}</span>
          )}
          {goal.deadline && !isCadence && (
            <span className="text-[14px] text-muted-foreground">
              by {fmtDate(goal.deadline)}
              {goal.pacing && <span> &middot; {goal.pacing.daysRemaining}d left</span>}
            </span>
          )}
        </div>

        {/* TASK: Metadata grid */}
        {isTask && (
          <div className="mb-4 border-t border-border pt-2">
            <MetadataRow label="Status">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isCompleted ? "bg-green-500" : "bg-yellow-500"}`} />
                {isCompleted ? "Completed" : "In progress"}
              </span>
            </MetadataRow>
            {platformLabel !== "GEN" && (
              <MetadataRow label="Platform">
                <span className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[14px] font-bold px-1 py-0" style={{ borderColor: platformColor, color: platformColor }}>
                    {platformLabel}
                  </Badge>
                  {goal.category === "42" ? "42 Paris" : goal.category === "thm" ? "TryHackMe" : goal.category === "htb" ? "HackTheBox" : goal.category === "rootme" ? "Root-me" : "Maldev"}
                </span>
              </MetadataRow>
            )}
            {goal.ftSlug && (
              <MetadataRow label="Project">
                <span className="font-mono text-[15px]">{goal.ftSlug}</span>
              </MetadataRow>
            )}
            {goal.deadline && (
              <MetadataRow label="Deadline">
                {fmtDate(goal.deadline)}
                {goal.pacing && <span className="text-muted-foreground"> &middot; {goal.pacing.daysRemaining}d left</span>}
              </MetadataRow>
            )}
            {metricLabel && (
              <MetadataRow label="Auto-complete">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  On {metricLabel.toLowerCase().includes("project") ? "project validation" : metricLabel.toLowerCase()}
                </span>
              </MetadataRow>
            )}
          </div>
        )}

        {/* ISSUE: 3-column stat cards */}
        {isIssue && childTotal > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="rounded-sm border border-border p-3.5 text-center">
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-[24px] font-bold">{childCompleted}</span>
                <span className="text-[15px] text-muted-foreground">/{childTotal}</span>
              </div>
              <p className="text-[14px] text-muted-foreground mt-0.5">Tasks</p>
            </div>
            <div className={`rounded-sm border p-3.5 text-center ${isBehind ? "border-red-500/30 bg-red-500/5" : "border-border"}`}>
              <div className="flex items-baseline justify-center gap-0.5">
                <span className={`text-[24px] font-bold ${isBehind ? "text-red-400" : ""}`}>
                  {goal.pacing?.daysRemaining ?? "—"}
                </span>
                <span className={`text-[15px] ${isBehind ? "text-red-400" : "text-muted-foreground"}`}>d</span>
              </div>
              <p className="text-[14px] text-muted-foreground mt-0.5">Left</p>
            </div>
            <div className="rounded-sm border border-border p-3.5 text-center">
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-[24px] font-bold">~{Math.round(goal.children.reduce((s, c) => s + (c.estimatedHours ?? 2), 0))}</span>
                <span className="text-[15px] text-muted-foreground">h</span>
              </div>
              <p className="text-[14px] text-muted-foreground mt-0.5">Est. effort</p>
            </div>
          </div>
        )}

        {/* EPIC: Dual progress cards */}
        {isEpic && goal.targetValue != null && (
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="rounded-sm border border-border p-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] font-bold">{goal.currentValue ?? 0}</span>
                <span className="text-[15px] text-muted-foreground">
                  /{goal.targetValue} {goal.metricSource?.includes("projects") ? "projects" : metricLabel ? metricLabel.split(" ").pop() : "total"}
                </span>
              </div>
              {metricLabel && (
                <p className="text-[14px] text-muted-foreground mt-1">Auto: {goal.metricSource}</p>
              )}
              <Progress value={progressPercent} className="h-[5px] mt-2.5" style={{ "--progress-foreground": platformColor } as React.CSSProperties} />
            </div>
            {childTotal > 0 && (
              <div className="rounded-sm border border-border p-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-[24px] font-bold">{childCompleted}</span>
                  <span className="text-[15px] text-muted-foreground">/{childTotal} milestones</span>
                </div>
                <p className="text-[14px] text-muted-foreground mt-1">Child completion rollup</p>
                <Progress value={childTotal > 0 ? (childCompleted / childTotal) * 100 : 0} className="h-[5px] mt-2.5" style={{ "--progress-foreground": "oklch(0.82 0.055 80)" } as React.CSSProperties} />
              </div>
            )}
          </div>
        )}

        {/* Standalone cumulative with target */}
        {!isEpic && !isTask && !isCadence && goal.targetValue != null && (
          <div className="rounded-sm border border-border p-3 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-bold">{goal.currentValue ?? 0}</span>
              <span className="text-[14px] text-muted-foreground">/{goal.targetValue}</span>
            </div>
            {metricLabel && <p className="text-[14px] text-muted-foreground mt-0.5">Auto: {goal.metricSource}</p>}
            <Progress value={progressPercent} className="h-[4px] mt-2" style={{ "--progress-foreground": platformColor } as React.CSSProperties} />
          </div>
        )}

        {/* CADENCE: big number + progress */}
        {isCadence && (
          <>
            <div className="mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-[44px] font-bold leading-none" style={{ color: platformColor }}>
                  {goal.currentValue ?? 0}
                </span>
                <span className="text-[14px] text-muted-foreground">
                  / {goal.cadenceValue} this {goal.cadenceUnit === "per_month" ? "month" : "week"}
                </span>
              </div>
            </div>
            <Progress
              value={goal.cadenceValue ? Math.min(100, ((goal.currentValue ?? 0) / goal.cadenceValue) * 100) : 0}
              className="h-[5px] mb-2"
              style={{ "--progress-foreground": platformColor } as React.CSSProperties}
            />
            <p className="text-[15px] text-muted-foreground mb-4">
              {(goal.currentValue ?? 0) >= (goal.cadenceValue ?? 0) ? "Target met" : `${(goal.cadenceValue ?? 0) - (goal.currentValue ?? 0)} more needed`}
              {goal.pacing && <> &middot; {goal.pacing.daysRemaining}d left this {goal.cadenceUnit === "per_month" ? "month" : "week"}</>}
            </p>
            {/* Cadence metadata */}
            <div className="mb-4 border-t border-border pt-2">
              {platformLabel !== "GEN" && (
                <MetadataRow label="Platform">
                  <Badge variant="outline" className="text-[14px] font-bold px-1 py-0" style={{ borderColor: platformColor, color: platformColor }}>
                    {platformLabel}
                  </Badge>
                  {" "}{goal.category === "42" ? "42 Paris" : goal.category === "thm" ? "TryHackMe" : goal.category === "htb" ? "HackTheBox" : goal.category === "rootme" ? "Root-me" : "Maldev"}
                </MetadataRow>
              )}
              {metricLabel && (
                <MetadataRow label="Metric">{goal.metricSource}</MetadataRow>
              )}
              <MetadataRow label="Rate">
                &ge; {goal.cadenceValue} per {goal.cadenceUnit === "per_month" ? "month" : "week"}
              </MetadataRow>
            </div>
          </>
        )}

        {/* Pacing row (for epics and standalone cumulative) */}
        {goal.pacing && !isCadence && !isTask && (
          <div className="flex items-center gap-3 text-[15px] text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {goal.pacing.daysRemaining}d left
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {goal.pacing.requiredPace}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Doing {goal.pacing.currentPace}
            </span>
          </div>
        )}

        {/* Children list (EPIC shows ISSUES, ISSUE shows TASKS) */}
        {childTotal > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
                {isEpic ? "ISSUES" : "TASKS"} &middot; {childCompleted}/{childTotal}
              </p>
              <button
                className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onEdit({ ...goal, id: -1 } as GoalWithPacing)}
              >
                + Add {isEpic ? "issue" : "task"}
              </button>
            </div>
            <SortableChildrenList
              parentId={goal.id}
              childLabel={isEpic ? "ISSUE" : "TASK"}
              platformColor={platformColor}
              onSelect={onSelect}
              parentDeadline={goal.deadline}
              onRefresh={refresh}
            >
              {goal.children}
            </SortableChildrenList>
            {isIssue && <InlineTaskAdd parentId={goal.id} category={goal.category} onRefresh={refresh} />}
          </div>
        )}

        {/* Empty children — show inline add for issues */}
        {childTotal === 0 && (isEpic || isIssue) && (
          <div className="mb-4">
            <p className="text-[13px] text-muted-foreground mb-1">No {isEpic ? "issues" : "tasks"} yet</p>
            <InlineTaskAdd parentId={goal.id} category={goal.category} onRefresh={refresh} />
          </div>
        )}

        {goal.description && (
          <p className="text-[14px] text-muted-foreground mb-4">{linkifyText(goal.description)}</p>
        )}

        {/* Custom fields */}
        <CustomFieldsSection goalId={goal.id} raw={goal.customFields} onRefresh={refresh} />

        {/* Actions bar */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          {isCompleted ? (
            <Button variant="outline" size="sm" className="text-[14px]" onClick={() => patchGoal(goal.id, { status: "active" }, refresh).catch(() => {})}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Reopen
            </Button>
          ) : isTask ? (
            <Button
              variant="outline"
              size="sm"
              className="text-[14px] text-green-400 border-green-500/30 hover:bg-green-500/10"
              onClick={() => patchGoal(goal.id, { status: "completed" }, refresh).catch(() => {})}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark complete
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="text-[14px]" onClick={() => onEdit(goal)}>
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <MoveToSelect goal={goal} allGoals={allGoals} onRefresh={refresh} />
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="text-[14px] text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
            {goal.children.length > 0 && ` (${goal.children.reduce((a, c) => a + 1 + c.children.length, 0)} items)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import type { GoalWithPacing } from "@/lib/guidance/engine";
import { assertOk } from "@/lib/utils";
import { GoalsTree } from "./goals-tree";
import { DetailPane } from "./detail-pane";
import { CreateForm } from "./create-form";
import { Generate42Dialog } from "./generate-42-dialog";
import { SuggestDialog } from "./suggest-dialog";
import { GoalsMobile } from "./goals-mobile";

type CompetencySlim = { id: string; label: string; area: string; level: number };
type FocusSlim = { type: string; title: string };

function findGoalById(id: number, tree: GoalWithPacing[]): GoalWithPacing | null {
  for (const g of tree) {
    if (g.id === id) return g;
    const found = findGoalById(id, g.children);
    if (found) return found;
  }
  return null;
}

type RightPane =
  | { mode: "detail" }
  | { mode: "create"; parentGoal?: GoalWithPacing | null }
  | { mode: "edit"; goal: GoalWithPacing };

export function GoalsClient({
  goals,
  competencies,
  focusItems = [],
}: {
  goals: GoalWithPacing[];
  competencies: CompetencySlim[];
  focusItems?: FocusSlim[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const param = searchParams.get("goal");
    return param ? parseInt(param, 10) : null;
  });
  const [rightPane, setRightPane] = useState<RightPane>({ mode: "detail" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [show42Dialog, setShow42Dialog] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [mobilePane, setMobilePane] = useState<"nav" | "create" | "edit">("nav");
  const [mobileCreateParent, setMobileCreateParent] = useState<GoalWithPacing | undefined>();
  const [mobileEditGoal, setMobileEditGoal] = useState<GoalWithPacing | null>(null);

  const selectedGoal = selectedId ? findGoalById(selectedId, goals) : null;

  function handleSelect(id: number) {
    setSelectedId(id);
    setRightPane({ mode: "detail" });
  }

  function handleNewGoal() {
    setSelectedId(null);
    setRightPane({ mode: "create" });
  }

  function handleEdit(goal: GoalWithPacing) {
    if (goal.id === -1 && selectedGoal) {
      setRightPane({ mode: "create", parentGoal: selectedGoal });
      return;
    }
    setRightPane({ mode: "edit", goal });
  }

  function handleFormDone() {
    setRightPane({ mode: "detail" });
    router.refresh();
  }

  function handleFormCancel() {
    setRightPane({ mode: "detail" });
  }

  async function deleteGoal(goalId: number) {
    const goal = findGoalById(goalId, goals);
    if (goal && goal.children.length > 0) {
      setDeleteConfirmId(goalId);
      return;
    }
    try {
      const res = await fetch("/api/goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId }),
      });
      await assertOk(res);
      if (selectedId === goalId) setSelectedId(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete goal.");
    }
  }

  async function confirmDelete(orphan: boolean) {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch("/api/goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirmId, orphan }),
      });
      await assertOk(res);
      if (selectedId === deleteConfirmId) setSelectedId(null);
      setDeleteConfirmId(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete goal.");
    }
  }

  const deleteGoalObj = deleteConfirmId ? findGoalById(deleteConfirmId, goals) : null;
  const deleteChildLabel = deleteGoalObj
    ? (deleteGoalObj.children.length > 0 && !deleteGoalObj.parentGoalId ? "issues" : "tasks")
    : "items";
  const deleteDescendantCount = deleteGoalObj
    ? deleteGoalObj.children.reduce((acc, c) => acc + 1 + c.children.length, 0)
    : 0;

  return (
    <>
      {/* Desktop: split panel */}
      <div className="hidden md:flex h-[calc(100vh)]">
        <GoalsTree
          goals={goals}
          selectedId={selectedId}
          onSelect={handleSelect}
          onNewGoal={handleNewGoal}
          onSuggest={() => setShowSuggestDialog(true)}
          on42Plan={() => setShow42Dialog(true)}
        />

        {rightPane.mode === "create" ? (
          <CreateForm
            allGoals={goals}
            parentGoal={rightPane.parentGoal}
            onDone={handleFormDone}
            onCancel={handleFormCancel}
          />
        ) : rightPane.mode === "edit" ? (
          <CreateForm
            allGoals={goals}
            editingGoal={rightPane.goal}
            onDone={handleFormDone}
            onCancel={handleFormCancel}
          />
        ) : (
          <DetailPane
            goal={selectedGoal}
            allGoals={goals}
            onEdit={handleEdit}
            onDelete={deleteGoal}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Mobile: drill-down */}
      <div className="md:hidden h-[calc(100vh)]">
        {mobilePane === "create" ? (
          <CreateForm
            allGoals={goals}
            parentGoal={mobileCreateParent}
            onDone={handleFormDone}
            onCancel={() => setMobilePane("nav")}
            mobile
          />
        ) : mobilePane === "edit" ? (
          <CreateForm
            allGoals={goals}
            editingGoal={mobileEditGoal ?? undefined}
            onDone={handleFormDone}
            onCancel={() => setMobilePane("nav")}
            mobile
          />
        ) : (
          <GoalsMobile
            goals={goals}
            onSuggest={() => setShowSuggestDialog(true)}
            on42Plan={() => setShow42Dialog(true)}
            onNewGoal={() => {
              setMobileCreateParent(undefined);
              setMobilePane("create");
            }}
            onNewChild={(parent) => {
              setMobileCreateParent(parent);
              setMobilePane("create");
            }}
            onEdit={(goal) => {
              setMobileEditGoal(goal);
              setMobilePane("edit");
            }}
            onDelete={deleteGoal}
          />
        )}
      </div>

      <Generate42Dialog
        open={show42Dialog}
        onOpenChange={setShow42Dialog}
        onDone={() => { setShow42Dialog(false); router.refresh(); }}
      />
      <SuggestDialog
        open={showSuggestDialog}
        onOpenChange={setShowSuggestDialog}
        onDone={() => { setShowSuggestDialog(false); router.refresh(); }}
      />

      {/* Delete Confirmation Dialog (D7) */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-[15px]">Delete &ldquo;{deleteGoalObj?.title}&rdquo;?</DialogTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  This {deleteGoalObj?.parentGoalId ? "issue" : "goal"} has {deleteDescendantCount} child {deleteChildLabel}.
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={() => confirmDelete(false)}
              className="w-full"
            >
              Delete {deleteGoalObj?.parentGoalId ? "issue" : "goal"} + {deleteDescendantCount} {deleteChildLabel}
            </Button>
            <Button
              variant="outline"
              onClick={() => confirmDelete(true)}
              className="w-full"
            >
              Orphan {deleteChildLabel} (promote to standalone)
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

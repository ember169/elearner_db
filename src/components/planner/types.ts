export type PlanItemData = {
  id: number;
  title: string;
  type: string;
  why: string | null;
  description: string | null;
  estimatedHours: number | null;
  priority: string;
  dayIndex: number | null;
  status: string;
  ref: string | null;
  link: string | null;
  sortOrder: number | null;
  deferredTo: string | null;
  sourceWeek: string | null;
  attemptCount: number | null;
  blockedReason: string | null;
  blockedSince: string | null;
  completedAt: string | null;
  goalId: number | null;
  category: string | null;
  boardStatus: string | null;
};

export type WeekPlanData = {
  id: number;
  weekStart: string;
  status: string;
  mentorBriefing: string | null;
  collapsedBriefing: string | null;
  items: PlanItemData[];
};

export type GoalSlim = {
  id: number;
  title: string;
  category: string | null;
  goalType: string;
  currentValue: number | null;
  targetValue: number | null;
  cadenceValue: number | null;
  cadenceUnit: string | null;
  parentGoalId: number | null;
  pacing: {
    onTrack: boolean;
    percentComplete: number;
    requiredPace: string;
    currentPace: string;
  } | null;
};

export type SideProject = {
  title: string;
  description: string;
  skills?: string[];
  prerequisites?: { label: string; status: string }[];
  steps?: { title: string; description: string; estimatedHours: number }[];
  bonus_extensions?: string[];
  capstone_connection?: string;
};

export type CompetencyEntry = {
  id: string;
  label: string;
  area: string;
  level: number;
  evidence: string;
};

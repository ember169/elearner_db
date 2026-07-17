export const METRIC_SOURCES = {
  "ft:projects_validated": { label: "42 projects validated", platform: "42" },
  "ft:level": { label: "42 level", platform: "42" },
  "rootme:challenges_solved": {
    label: "Root-me challenges solved",
    platform: "rootme",
  },
  "rootme:score": { label: "Root-me score", platform: "rootme" },
  "maldev:progress": { label: "Maldev progress (%)", platform: "maldev" },
  "thm:rooms_completed": {
    label: "THM rooms completed",
    platform: "thm",
  },
  "htb:owns": { label: "HTB machines owned", platform: "htb" },
  "htb:points": { label: "HTB points", platform: "htb" },
} as const;

export type MetricSourceKey = keyof typeof METRIC_SOURCES;

export type GoalPreset = {
  title: string;
  category: string;
  metricSource: MetricSourceKey;
  goalType: "cumulative" | "cadence";
  targetValue?: number;
  cadenceValue?: number;
  cadenceUnit?: "per_week" | "per_month";
};

export const GOAL_PRESETS: GoalPreset[] = [
  {
    title: "Complete 42 common core",
    category: "42",
    metricSource: "ft:projects_validated",
    goalType: "cumulative",
    targetValue: 31,
  },
  {
    title: "Reach 42 level 10",
    category: "42",
    metricSource: "ft:level",
    goalType: "cumulative",
    targetValue: 10,
  },
  {
    title: "50 Root-me challenges",
    category: "rootme",
    metricSource: "rootme:challenges_solved",
    goalType: "cumulative",
    targetValue: 50,
  },
  {
    title: "Complete maldev elearning",
    category: "maldev",
    metricSource: "maldev:progress",
    goalType: "cumulative",
    targetValue: 100,
  },
  {
    title: "100 THM rooms",
    category: "thm",
    metricSource: "thm:rooms_completed",
    goalType: "cumulative",
    targetValue: 100,
  },
  {
    title: "50 HTB machines",
    category: "htb",
    metricSource: "htb:owns",
    goalType: "cumulative",
    targetValue: 50,
  },
  {
    title: ">= 1 Root-me challenge/week",
    category: "rootme",
    metricSource: "rootme:challenges_solved",
    goalType: "cadence",
    cadenceValue: 1,
    cadenceUnit: "per_week",
  },
  {
    title: ">= 2 THM rooms/week",
    category: "thm",
    metricSource: "thm:rooms_completed",
    goalType: "cadence",
    cadenceValue: 2,
    cadenceUnit: "per_week",
  },
  {
    title: ">= 2 HTB modules/month",
    category: "htb",
    metricSource: "htb:owns",
    goalType: "cadence",
    cadenceValue: 2,
    cadenceUnit: "per_month",
  },
  {
    title: ">= 4 Maldev exercises/week",
    category: "maldev",
    metricSource: "maldev:progress",
    goalType: "cadence",
    cadenceValue: 4,
    cadenceUnit: "per_week",
  },
];

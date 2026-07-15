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

export const GOAL_PRESETS = [
  {
    title: "Complete 42 common core",
    category: "42",
    metricSource: "ft:projects_validated" as MetricSourceKey,
    targetValue: 31,
  },
  {
    title: "Reach 42 level 10",
    category: "42",
    metricSource: "ft:level" as MetricSourceKey,
    targetValue: 10,
  },
  {
    title: "50 Root-me challenges",
    category: "rootme",
    metricSource: "rootme:challenges_solved" as MetricSourceKey,
    targetValue: 50,
  },
  {
    title: "Complete maldev elearning",
    category: "maldev",
    metricSource: "maldev:progress" as MetricSourceKey,
    targetValue: 100,
  },
  {
    title: "100 THM rooms",
    category: "thm",
    metricSource: "thm:rooms_completed" as MetricSourceKey,
    targetValue: 100,
  },
  {
    title: "50 HTB machines",
    category: "htb",
    metricSource: "htb:owns" as MetricSourceKey,
    targetValue: 50,
  },
];

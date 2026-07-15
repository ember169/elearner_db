import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- Settings & Sync ---

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1),
  // 42
  ftClientId: text("ft_client_id"),
  ftClientSecret: text("ft_client_secret"),
  ftUserId: text("ft_user_id"),
  ftAccessToken: text("ft_access_token"),
  ftTokenExpiresAt: integer("ft_token_expires_at"),
  // TryHackMe
  thmUsername: text("thm_username"),
  // HackTheBox
  htbApiToken: text("htb_api_token"),
  htbUserId: text("htb_user_id"),
  // Root-me
  rootmeApiKey: text("rootme_api_key"),
  rootmeCookie: text("rootme_cookie"),
  rootmeUserId: text("rootme_user_id"),
  // Maldev
  maldevDbPath: text("maldev_db_path"),
  // LLM
  llmApiKey: text("llm_api_key"),
  llmModel: text("llm_model").default("claude-sonnet-5"),
  // App
  theme: text("theme").default("dark"),
  syncIntervalMinutes: integer("sync_interval_minutes").default(60),
});

export const syncLog = sqliteTable("sync_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  itemsSynced: integer("items_synced").default(0),
  startedAt: text("started_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

export const dailySnapshots = sqliteTable("daily_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  date: text("date").notNull(),
  data: text("data").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// --- 42 Data ---

export const ftProfile = sqliteTable("ft_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  login: text("login").notNull(),
  level: real("level").default(0),
  correctionPoints: integer("correction_points").default(0),
  wallet: integer("wallet").default(0),
  coalition: text("coalition"),
  coalitionScore: integer("coalition_score"),
  campus: text("campus"),
  imageUrl: text("image_url"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const ftSkills = sqliteTable("ft_skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").notNull(),
  name: text("name").notNull(),
  level: real("level").default(0),
  cursusId: integer("cursus_id"),
});

export const ftProjects = sqliteTable("ft_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug"),
  status: text("status"),
  finalMark: integer("final_mark"),
  validated: integer("validated", { mode: "boolean" }),
  markedAt: text("marked_at"),
});

export const ftAchievements = sqliteTable("ft_achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  achievementId: integer("achievement_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  tier: text("tier"),
  kind: text("kind"),
});

export const ftLogtimes = sqliteTable("ft_logtimes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  durationSeconds: integer("duration_seconds").default(0),
  host: text("host"),
});

// --- TryHackMe Data ---

export const thmProfile = sqliteTable("thm_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
  rank: integer("rank"),
  rankTitle: text("rank_title"),
  points: integer("points").default(0),
  roomsCompleted: integer("rooms_completed").default(0),
  badgesCount: integer("badges_count").default(0),
  streak: integer("streak").default(0),
  level: integer("level").default(0),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const thmRooms = sqliteTable("thm_rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomCode: text("room_code").notNull(),
  roomName: text("room_name").notNull(),
  completedAt: text("completed_at"),
  difficulty: text("difficulty"),
  roomType: text("room_type"),
});

export const thmBadges = sqliteTable("thm_badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  badgeId: text("badge_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
});

// --- HackTheBox Data ---

export const htbProfile = sqliteTable("htb_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
  rank: text("rank"),
  rankId: integer("rank_id"),
  points: integer("points").default(0),
  ranking: integer("ranking"),
  systemOwns: integer("system_owns").default(0),
  userOwns: integer("user_owns").default(0),
  systemBloods: integer("system_bloods").default(0),
  userBloods: integer("user_bloods").default(0),
  currentRankProgress: real("current_rank_progress").default(0),
  nextRank: text("next_rank"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const htbActivity = sqliteTable("htb_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityType: text("activity_type").notNull(),
  objectType: text("object_type"),
  name: text("name"),
  date: text("date"),
});

// --- Root-me Data ---

export const rootmeProfile = sqliteTable("rootme_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
  score: integer("score").default(0),
  position: integer("position"),
  challengesSolved: integer("challenges_solved").default(0),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const rootmeChallenges = sqliteTable("rootme_challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  challengeId: integer("challenge_id").notNull(),
  title: text("title").notNull(),
  category: text("category"),
  score: integer("score").default(0),
  solvedAt: text("solved_at"),
});

// --- Maldev Data ---

export const maldevProfile = sqliteTable("maldev_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  overallProgress: real("overall_progress").default(0),
  modulesCompleted: integer("modules_completed").default(0),
  totalModules: integer("total_modules").default(0),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const maldevModules = sqliteTable("maldev_modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moduleId: text("module_id").notNull(),
  name: text("name").notNull(),
  progress: real("progress").default(0),
  exercisesCompleted: integer("exercises_completed").default(0),
  totalExercises: integer("total_exercises").default(0),
});

export const maldevExercises = sqliteTable("maldev_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exerciseId: text("exercise_id").notNull(),
  moduleId: text("module_id").notNull(),
  name: text("name").notNull(),
  status: text("status").default("pending"),
  completedAt: text("completed_at"),
});

// --- App Data ---

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").default("general"),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  isAutoGenerated: integer("is_auto_generated", { mode: "boolean" }).default(
    false
  ),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  recurrencePattern: text("recurrence_pattern"),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  targetValue: real("target_value"),
  currentValue: real("current_value").default(0),
  metricSource: text("metric_source"),
  deadline: text("deadline"),
  status: text("status").default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const goalMilestones = sqliteTable("goal_milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: integer("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetValue: real("target_value"),
  reachedAt: text("reached_at"),
});

export const activityFeed = sqliteTable("activity_feed", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  details: text("details"),
  timestamp: text("timestamp")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const guidanceCache = sqliteTable("guidance_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

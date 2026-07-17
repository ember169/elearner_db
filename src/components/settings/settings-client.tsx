"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRelative } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  Shield,
  Terminal,
  Bug,
  Flag,
  Brain,
  RefreshCw,
  Save,
  Download,
  History,
  ArrowRight,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import { assertOk } from "@/lib/utils";

interface Config {
  id: number;
  ftClientId: string | null;
  ftClientSecret: string | null;
  ftUserId: string | null;
  ftAccessToken: string | null;
  ftTokenExpiresAt: number | null;
  thmUsername: string | null;
  htbApiToken: string | null;
  htbUserId: string | null;
  rootmeApiKey: string | null;
  rootmeCookie: string | null;
  rootmeUserId: string | null;
  maldevDbPath: string | null;
  llmProvider: string | null;
  llmApiKey: string | null;
  llmModel: string | null;
  llmBaseUrl: string | null;
  objective: string | null;
  theme: string | null;
  syncIntervalMinutes: number | null;
}

interface SyncLogEntry {
  id: number;
  platform: string;
  status: string;
  error: string | null;
  itemsSynced: number | null;
  startedAt: string;
  completedAt: string | null;
}

export function SettingsClient({
  config,
  recentSyncs,
  platformSyncs = {},
}: {
  config: Config;
  recentSyncs: SyncLogEntry[];
  platformSyncs?: Record<string, string | null>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedSyncId, setExpandedSyncId] = useState<number | null>(null);

  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  async function testConnection(platform: string) {
    setTesting(platform);
    setTestResult((prev) => ({ ...prev, [platform]: undefined! }));
    try {
      const payload: Record<string, string> = { platform };
      if (platform === "llm") {
        payload.provider = llmProvider;
        if (llmBaseUrl) payload.baseUrl = llmBaseUrl;
        if (llmApiKey) payload.apiKey = llmApiKey;
        if (llmModel) payload.model = llmModel;
      }
      const res = await fetch("/api/sync/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [platform]: { ok: res.ok, msg: data.message ?? (res.ok ? "Connected" : data.error ?? "Failed") },
      }));
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [platform]: { ok: false, msg: "Network error" },
      }));
    } finally {
      setTesting(null);
    }
  }

  const [ftClientId, setFtClientId] = useState(config.ftClientId ?? "");
  const [ftClientSecret, setFtClientSecret] = useState(config.ftClientSecret ?? "");
  const [ftUserId, setFtUserId] = useState(config.ftUserId ?? "");
  const [thmUsername, setThmUsername] = useState(config.thmUsername ?? "");
  const [htbApiToken, setHtbApiToken] = useState(config.htbApiToken ?? "");
  const [htbUserId, setHtbUserId] = useState(config.htbUserId ?? "");
  const [maldevDbPath, setMaldevDbPath] = useState(config.maldevDbPath ?? "");
  const [rootmeApiKey, setRootmeApiKey] = useState(config.rootmeApiKey ?? "");
  const [rootmeCookie, setRootmeCookie] = useState(config.rootmeCookie ?? "");
  const [rootmeUserId, setRootmeUserId] = useState(config.rootmeUserId ?? "");
  const [llmProvider, setLlmProvider] = useState(config.llmProvider ?? "anthropic");
  const [llmApiKey, setLlmApiKey] = useState(config.llmApiKey ?? "");
  const [llmModel, setLlmModel] = useState(config.llmModel ?? "claude-sonnet-5");
  const [llmBaseUrl, setLlmBaseUrl] = useState(config.llmBaseUrl ?? "");
  const [objective, setObjective] = useState(config.objective ?? "");

  // Deadline state
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineBudget, setDeadlineBudget] = useState("15");
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [deadlineResult, setDeadlineResult] = useState<{
    plan?: { weeklyHoursNeeded: number; totalHoursRemaining: number; weeksAvailable: number; warnings: string[]; feasible: boolean; circlePlans: { circle: number; totalHours: number; dueBy: string }[] };
    deadline?: { id: number; targetDate: string };
  } | null>(null);

  async function loadDeadlines() {
    try {
      const res = await fetch("/api/deadlines");
      const data = await res.json();
      if (data.deadlines?.length > 0) {
        const main = data.deadlines.find((d: { type: string }) => d.type === "common_core");
        if (main) {
          setDeadlineDate(main.targetDate);
          if (main.weeklyBudget != null) setDeadlineBudget(String(main.weeklyBudget));
          setDeadlineResult({ deadline: main, plan: data.backwardPlan });
        }
      }
    } catch {}
  }

  async function saveDeadline() {
    if (!deadlineDate) return;
    setDeadlineSaving(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate: deadlineDate, weeklyBudget42: parseInt(deadlineBudget) || 15 }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setDeadlineResult(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save deadline.");
    } finally {
      setDeadlineSaving(false);
    }
  }

  async function deleteDeadlineAction() {
    if (!deadlineResult?.deadline?.id) return;
    try {
      await fetch(`/api/deadlines?id=${deadlineResult.deadline.id}`, { method: "DELETE" });
      setDeadlineResult(null);
      setDeadlineDate("");
    } catch {}
  }

  useEffect(() => { loadDeadlines(); }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ftClientId: ftClientId || null,
          ftClientSecret: ftClientSecret || null,
          ftUserId: ftUserId || null,
          thmUsername: thmUsername || null,
          htbApiToken: htbApiToken || null,
          htbUserId: htbUserId || null,
          rootmeApiKey: rootmeApiKey || null,
          rootmeCookie: rootmeCookie || null,
          rootmeUserId: rootmeUserId || null,
          maldevDbPath: maldevDbPath || null,
          llmProvider: llmProvider || "anthropic",
          llmApiKey: llmApiKey || null,
          llmModel: llmModel || null,
          llmBaseUrl: llmBaseUrl || null,
          objective: objective || null,
        }),
      });
      await assertOk(res);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save settings.");
      setSaving(false);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      await assertOk(res);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sync failed.");
      setSyncing(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings");
      await assertOk(res);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learner-db-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  const statusVariant: Record<string, "success" | "danger" | "warning" | "outline"> = {
    success: "success",
    error: "danger",
    running: "warning",
    skipped: "outline",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle mt-1">
            Configure your platform connections and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportData} disabled={exporting}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button size="sm" onClick={saveSettings} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving..." : "Save"}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      <PlatformSection
        icon={<Brain className="h-4 w-4" />}
        name="AI Mentor"
        configured={llmProvider === "local" ? !!llmBaseUrl : !!llmApiKey}
        hint="Powers the personalized mentor plan on the home page. The objective drives all recommendations."
        onTest={() => testConnection("llm")}
        testingNow={testing === "llm"}
        testResult={testResult["llm"]}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[15px]">Learning objective</Label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Red team / malware development, with solid generalist foundations (networking, web, Linux)."
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-[14px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-[14px] text-muted-foreground">
              Describe your long-term goal. The mentor will tailor every recommendation to this.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[15px]">Provider</Label>
            <div className="flex gap-1">
              {(["anthropic", "local"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setLlmProvider(p)}
                  className={`px-3 py-1.5 text-[15px] rounded-sm border transition-colors ${
                    llmProvider === p
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "anthropic" ? "Anthropic" : "Local LLM"}
                </button>
              ))}
            </div>
          </div>
          {llmProvider === "anthropic" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="API Key" value={llmApiKey} onChange={setLlmApiKey} placeholder="sk-ant-..." type="password" />
              <Field label="Model" value={llmModel} onChange={setLlmModel} placeholder="claude-sonnet-5" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Base URL" value={llmBaseUrl} onChange={setLlmBaseUrl} placeholder="http://fedora-server:8000" />
              <Field label="Model" value={llmModel} onChange={setLlmModel} placeholder="gemma-4-E2B-it-GGUF" />
              <Field label="API Key (if required)" value={llmApiKey} onChange={setLlmApiKey} placeholder="Bearer token" type="password" />
            </div>
          )}
        </div>
      </PlatformSection>

      {/* Deadline Planning */}
      <Card>
        <CardContent className="pt-4 pb-4 px-4 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-[15px] font-semibold tracking-tight">42 Deadline Planner</span>
            {deadlineResult?.deadline && (
              <Badge variant="success">Active</Badge>
            )}
          </div>
          <p className="text-[14px] text-muted-foreground">
            Set your target date for completing the 42 common core. The system will backward-plan circle and project deadlines,
            compute required weekly hours, and warn you when the pace is unsustainable.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[15px]">Common core target date</Label>
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[15px]">Weekly 42 budget (hours)</Label>
              <Input
                type="number"
                value={deadlineBudget}
                onChange={(e) => setDeadlineBudget(e.target.value)}
                min="5"
                max="40"
                placeholder="15"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={saveDeadline} disabled={deadlineSaving || !deadlineDate} size="sm">
                {deadlineSaving ? "Computing..." : deadlineResult?.deadline ? "Update deadline" : "Set deadline"}
              </Button>
              {deadlineResult?.deadline && (
                <Button onClick={deleteDeadlineAction} variant="ghost" size="sm" className="text-destructive">
                  Remove
                </Button>
              )}
            </div>
          </div>

          {deadlineResult?.plan && (
            <div className="space-y-3 mt-2">
              <Separator />
              <div className="flex items-center gap-6 text-[15px]">
                <div>
                  <span className="text-muted-foreground">Hours remaining: </span>
                  <span className="font-medium">{deadlineResult.plan.totalHoursRemaining}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weeks available: </span>
                  <span className="font-medium">{deadlineResult.plan.weeksAvailable}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Required pace: </span>
                  <span className={`font-medium ${deadlineResult.plan.feasible ? "text-success" : "text-destructive"}`}>
                    {deadlineResult.plan.weeklyHoursNeeded}h/week
                  </span>
                </div>
              </div>

              {deadlineResult.plan.circlePlans.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[14px] font-semibold text-muted-foreground uppercase tracking-wider">Circle deadlines</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {deadlineResult.plan.circlePlans.map((cp) => (
                      <div key={cp.circle} className="px-3 py-2 rounded-sm border border-border text-[14px]">
                        <span className="font-medium">Circle {cp.circle}</span>
                        <span className="text-muted-foreground"> — {cp.totalHours}h</span>
                        <p className="text-muted-foreground">Due {cp.dueBy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deadlineResult.plan.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {deadlineResult.plan.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-[14px] text-warning">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform sections */}
      <PlatformSection
        icon={<GraduationCap className="h-4 w-4" />}
        name="42 Paris"
        configured={!!ftClientId}
        hint="Get your API credentials at profile.intra.42.fr/oauth/applications"
        lastSync={platformSyncs["42"]}
        onTest={() => testConnection("42")}
        testingNow={testing === "42"}
        testResult={testResult["42"]}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Client ID" value={ftClientId} onChange={setFtClientId} placeholder="Your 42 API client ID" />
          <Field label="Client Secret" value={ftClientSecret} onChange={setFtClientSecret} placeholder="Your 42 API client secret" type="password" />
          <Field label="User ID (login)" value={ftUserId} onChange={setFtUserId} placeholder="Your 42 login" />
        </div>
      </PlatformSection>

      <PlatformSection
        icon={<Shield className="h-4 w-4" />}
        name="TryHackMe"
        configured={!!thmUsername}
        hint="Your public TryHackMe username (profile must be public)"
        lastSync={platformSyncs["thm"]}
        onTest={() => testConnection("thm")}
        testingNow={testing === "thm"}
        testResult={testResult["thm"]}
      >
        <Field label="Username" value={thmUsername} onChange={setThmUsername} placeholder="Your TryHackMe username" />
      </PlatformSection>

      <PlatformSection
        icon={<Terminal className="h-4 w-4" />}
        name="HackTheBox"
        configured={!!htbApiToken}
        hint="Get your API token from HTB Settings > App Tokens"
        lastSync={platformSyncs["htb"]}
        onTest={() => testConnection("htb")}
        testingNow={testing === "htb"}
        testResult={testResult["htb"]}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="API Token" value={htbApiToken} onChange={setHtbApiToken} placeholder="Your HTB API token" type="password" />
          <Field label="User ID" value={htbUserId} onChange={setHtbUserId} placeholder="Your HTB user ID" />
        </div>
      </PlatformSection>

      <PlatformSection
        icon={<Flag className="h-4 w-4" />}
        name="Root-me"
        configured={!!rootmeUserId}
        hint="Provide either an API key or your spip_session cookie for authentication"
        lastSync={platformSyncs["rootme"]}
        onTest={() => testConnection("rootme")}
        testingNow={testing === "rootme"}
        testResult={testResult["rootme"]}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="User ID" value={rootmeUserId} onChange={setRootmeUserId} placeholder="Your Root-me user ID" />
          <Field label="API Key" value={rootmeApiKey} onChange={setRootmeApiKey} placeholder="Your Root-me API key" type="password" />
          <Field label="Session Cookie (alt)" value={rootmeCookie} onChange={setRootmeCookie} placeholder="spip_session value" type="password" />
        </div>
      </PlatformSection>

      <PlatformSection
        icon={<Bug className="h-4 w-4" />}
        name="Maldev Elearning"
        configured={!!maldevDbPath}
        hint="Absolute path to your maldev elearning SQLite database"
        lastSync={platformSyncs["maldev"]}
        onTest={() => testConnection("maldev")}
        testingNow={testing === "maldev"}
        testResult={testResult["maldev"]}
      >
        <Field label="Database Path" value={maldevDbPath} onChange={setMaldevDbPath} placeholder="/path/to/maldev/elearning.db" />
      </PlatformSection>

      {/* Sync */}
      <Card>
        <CardContent className="pt-4 pb-4 px-4 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <p className="section-label">Sync</p>
          </div>
          <Button onClick={triggerSync} disabled={syncing} size="sm">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing all platforms..." : "Sync now"}
          </Button>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="section-label">Sync history</p>
            </div>
            {recentSyncs.length === 0 ? (
              <p className="text-[14px] text-muted-foreground">
                No syncs yet. Configure your platforms above and hit Sync.
              </p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-1.5">
                  {recentSyncs.map((sync) => (
                    <div
                      key={sync.id}
                      className="px-3 py-2.5 rounded-sm border border-border text-[15px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Badge variant={statusVariant[sync.status] ?? "secondary"}>
                          {sync.status}
                        </Badge>
                        <span className="font-medium">{sync.platform}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {sync.itemsSynced ?? 0} items
                        </span>
                        {sync.error && (
                          <button
                            onClick={() =>
                              setExpandedSyncId(
                                expandedSyncId === sync.id ? null : sync.id
                              )
                            }
                            title={expandedSyncId === sync.id ? "Collapse" : "Show full error"}
                            className="text-destructive truncate max-w-[180px] text-[14px] text-left cursor-pointer hover:underline"
                          >
                            {sync.error}
                          </button>
                        )}
                        <span className="ml-auto text-[14px] text-muted-foreground tabular-nums shrink-0">
                          {new Date(sync.startedAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </span>
                      </div>
                      {sync.error && expandedSyncId === sync.id && (
                        <p className="mt-1.5 text-[14px] text-destructive leading-relaxed whitespace-pre-wrap break-words select-text">
                          {sync.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlatformSection({
  icon,
  name,
  configured,
  hint,
  children,
  lastSync,
  onTest,
  testingNow,
  testResult: tr,
}: {
  icon: React.ReactNode;
  name: string;
  configured: boolean;
  hint: string;
  children: React.ReactNode;
  lastSync?: string | null;
  onTest?: () => void;
  testingNow?: boolean;
  testResult?: { ok: boolean; msg: string };
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-[15px] font-semibold tracking-tight">{name}</span>
          <Badge variant={configured ? "success" : "outline"}>
            {configured ? "Configured" : "Not set"}
          </Badge>
          {lastSync && (
            <span className="text-[15px] text-muted-foreground ml-auto tabular-nums">
              Last sync: {formatRelative(lastSync)}
            </span>
          )}
        </div>
        {children}
        <div className="flex items-center gap-3">
          <p className="text-[14px] text-muted-foreground flex-1">{hint}</p>
          {onTest && (
            <Button variant="ghost" size="xs" onClick={onTest} disabled={testingNow}>
              <RefreshCw className={`h-3 w-3 mr-1 ${testingNow ? "animate-spin" : ""}`} />
              {testingNow ? "Testing..." : "Test connection"}
            </Button>
          )}
        </div>
        {tr && (
          <p className={`text-[14px] ${tr.ok ? "text-success" : "text-destructive"}`}>
            {tr.msg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[15px]">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

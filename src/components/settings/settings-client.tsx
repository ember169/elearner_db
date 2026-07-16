"use client";

import { useState } from "react";
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
  llmApiKey: string | null;
  llmModel: string | null;
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
}: {
  config: Config;
  recentSyncs: SyncLogEntry[];
}) {
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedSyncId, setExpandedSyncId] = useState<number | null>(null);

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
  const [llmApiKey, setLlmApiKey] = useState(config.llmApiKey ?? "");
  const [llmModel, setLlmModel] = useState(config.llmModel ?? "claude-sonnet-5");

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
          llmApiKey: llmApiKey || null,
          llmModel: llmModel || null,
        }),
      });
      await assertOk(res);
      window.location.reload();
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
      window.location.reload();
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

      {/* Platform sections */}
      <PlatformSection
        icon={<GraduationCap className="h-4 w-4" />}
        name="42 Paris"
        configured={!!ftClientId}
        hint="Get your API credentials at profile.intra.42.fr/oauth/applications"
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
      >
        <Field label="Username" value={thmUsername} onChange={setThmUsername} placeholder="Your TryHackMe username" />
      </PlatformSection>

      <PlatformSection
        icon={<Terminal className="h-4 w-4" />}
        name="HackTheBox"
        configured={!!htbApiToken}
        hint="Get your API token from HTB Settings > App Tokens"
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
      >
        <Field label="Database Path" value={maldevDbPath} onChange={setMaldevDbPath} placeholder="/path/to/maldev/elearning.db" />
      </PlatformSection>

      <PlatformSection
        icon={<Brain className="h-4 w-4" />}
        name="AI Guidance"
        configured={!!llmApiKey}
        hint="Powers the personalized learning path recommendations on the Path page"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Anthropic API Key" value={llmApiKey} onChange={setLlmApiKey} placeholder="sk-ant-..." type="password" />
          <Field label="Model" value={llmModel} onChange={setLlmModel} placeholder="claude-sonnet-5" />
        </div>
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
                      className="px-3 py-2.5 rounded-sm border border-border text-[13px]"
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
                            className="text-destructive truncate max-w-[180px] text-[12px] text-left cursor-pointer hover:underline"
                          >
                            {sync.error}
                          </button>
                        )}
                        <span className="ml-auto text-[12px] text-muted-foreground tabular-nums shrink-0">
                          {new Date(sync.startedAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </span>
                      </div>
                      {sync.error && expandedSyncId === sync.id && (
                        <p className="mt-1.5 text-[12px] text-destructive leading-relaxed whitespace-pre-wrap break-words select-text">
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
}: {
  icon: React.ReactNode;
  name: string;
  configured: boolean;
  hint: string;
  children: React.ReactNode;
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
        </div>
        {children}
        <p className="text-[12px] text-muted-foreground">{hint}</p>
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
      <Label className="text-[13px]">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

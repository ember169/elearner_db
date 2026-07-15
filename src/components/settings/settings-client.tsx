"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
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
} from "lucide-react";

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

  const [ftClientId, setFtClientId] = useState(config.ftClientId ?? "");
  const [ftClientSecret, setFtClientSecret] = useState(
    config.ftClientSecret ?? ""
  );
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
      await fetch("/api/settings", {
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
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learner-db-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const statusColor: Record<string, string> = {
    success: "bg-green-500/10 text-green-500",
    error: "bg-red-500/10 text-red-500",
    running: "bg-yellow-500/10 text-yellow-500",
    skipped: "bg-gray-500/10 text-gray-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your platform connections and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={saveSettings} size="sm" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* 42 Config */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            42 Paris
            <Badge
              variant="secondary"
              className={ftClientId ? "bg-green-500/10 text-green-500" : ""}
            >
              {ftClientId ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input
                value={ftClientId}
                onChange={(e) => setFtClientId(e.target.value)}
                placeholder="Your 42 API client ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input
                type="password"
                value={ftClientSecret}
                onChange={(e) => setFtClientSecret(e.target.value)}
                placeholder="Your 42 API client secret"
              />
            </div>
            <div className="space-y-2">
              <Label>User ID (login)</Label>
              <Input
                value={ftUserId}
                onChange={(e) => setFtUserId(e.target.value)}
                placeholder="Your 42 login"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API credentials at{" "}
            <span className="font-mono">
              profile.intra.42.fr/oauth/applications
            </span>
          </p>
        </CardContent>
      </Card>

      {/* TryHackMe Config */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            TryHackMe
            <Badge
              variant="secondary"
              className={thmUsername ? "bg-green-500/10 text-green-500" : ""}
            >
              {thmUsername ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={thmUsername}
              onChange={(e) => setThmUsername(e.target.value)}
              placeholder="Your TryHackMe username"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your public TryHackMe username (profile must be public)
          </p>
        </CardContent>
      </Card>

      {/* HackTheBox Config */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            HackTheBox
            <Badge
              variant="secondary"
              className={htbApiToken ? "bg-green-500/10 text-green-500" : ""}
            >
              {htbApiToken ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                type="password"
                value={htbApiToken}
                onChange={(e) => setHtbApiToken(e.target.value)}
                placeholder="Your HTB API token"
              />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                value={htbUserId}
                onChange={(e) => setHtbUserId(e.target.value)}
                placeholder="Your HTB user ID"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API token from HTB Settings &gt; App Tokens
          </p>
        </CardContent>
      </Card>

      {/* Root-me Config */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Root-me
            <Badge
              variant="secondary"
              className={rootmeUserId ? "bg-green-500/10 text-green-500" : ""}
            >
              {rootmeUserId ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                value={rootmeUserId}
                onChange={(e) => setRootmeUserId(e.target.value)}
                placeholder="Your Root-me user ID"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={rootmeApiKey}
                onChange={(e) => setRootmeApiKey(e.target.value)}
                placeholder="Your Root-me API key"
              />
            </div>
            <div className="space-y-2">
              <Label>Session Cookie (alt)</Label>
              <Input
                type="password"
                value={rootmeCookie}
                onChange={(e) => setRootmeCookie(e.target.value)}
                placeholder="spip_session value"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Provide either an API key or your spip_session cookie for authentication
          </p>
        </CardContent>
      </Card>

      {/* Maldev Config */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Maldev Elearning
            <Badge
              variant="secondary"
              className={maldevDbPath ? "bg-green-500/10 text-green-500" : ""}
            >
              {maldevDbPath ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Database Path</Label>
            <Input
              value={maldevDbPath}
              onChange={(e) => setMaldevDbPath(e.target.value)}
              placeholder="/path/to/maldev/elearning.db"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Absolute path to your maldev elearning SQLite database
          </p>
        </CardContent>
      </Card>

      {/* LLM Config */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Guidance
            <Badge
              variant="secondary"
              className={llmApiKey ? "bg-green-500/10 text-green-500" : ""}
            >
              {llmApiKey ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Anthropic API Key</Label>
              <Input
                type="password"
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
                placeholder="sk-ant-..."
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                placeholder="claude-sonnet-5"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Powers the personalized learning path recommendations on the Path page
          </p>
        </CardContent>
      </Card>

      {/* Sync Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={triggerSync} disabled={syncing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing all platforms..." : "Sync Now"}
          </Button>

          <Separator />

          {/* Sync History */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Sync History
            </h3>
            {recentSyncs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No syncs yet. Configure your platforms above and hit Sync.
              </p>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {recentSyncs.map((sync) => (
                    <div
                      key={sync.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border text-sm"
                    >
                      <Badge
                        variant="secondary"
                        className={statusColor[sync.status] ?? ""}
                      >
                        {sync.status}
                      </Badge>
                      <span className="font-medium">{sync.platform}</span>
                      <span className="text-muted-foreground">
                        {sync.itemsSynced ?? 0} items
                      </span>
                      {sync.error && (
                        <span className="text-xs text-destructive truncate max-w-[200px]">
                          {sync.error}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(sync.startedAt).toLocaleString()}
                      </span>
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

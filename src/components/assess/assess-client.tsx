"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardCheck,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  X,
} from "lucide-react";
import { assertOk } from "@/lib/utils";

type ValidationData = {
  validatedLevel: number;
  validatedAt: string;
  assessmentId: number | null;
  persistentGapsJson: string | null;
};

type AssessmentRow = {
  id: number;
  competencyId: string;
  status: string;
  activityLevel: number;
  validatedLevel: number | null;
  overallScore: number | null;
  attemptNumber: number | null;
  questionCount: number | null;
  gapsJson: string | null;
  completedAt: string | null;
  createdAt: string;
};

type CompetencyData = {
  id: string;
  label: string;
  area: string;
  description: string;
  activityLevel: number;
  validation: ValidationData | null;
  assessmentCount: number;
  latestAssessment: AssessmentRow | null;
};

type QuestionRow = {
  id: number;
  assessmentId: number;
  questionType: string;
  difficulty: number;
  questionText: string;
  rubricJson: string;
  studentAnswer: string | null;
  scoreJson: string | null;
  score: number | null;
  difficultyFlag: string | null;
  sortOrder: number;
};

type View = "grid" | "session" | "results";

export function AssessClient({
  competencies,
  areas,
}: {
  competencies: CompetencyData[];
  areas: string[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("grid");
  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [difficultyFlag, setDifficultyFlag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [grading, setGrading] = useState<string | null>(null);
  const [gradingDone, setGradingDone] = useState<{ competencyId: string; assessmentId: number; status: "completed" | "grading_failed" } | null>(null);
  const [showRaw, setShowRaw] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentRow | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);
  const [history, setHistory] = useState<AssessmentRow[]>([]);

  const pollAssessment = useCallback(async (id: number) => {
    const res = await fetch(`/api/assess/${id}`);
    const data = await res.json();
    if (data.assessment.status === "ready") {
      setQuestions(data.questions);
      setAssessmentData(data.assessment);
      setCurrentQ(0);
      setAnswer("");
      setView("session");
      setGenerating(null);
    } else if (data.assessment.status === "generating") {
      setTimeout(() => pollAssessment(id), 2000);
    } else {
      setGenerating(null);
    }
  }, []);

  const pollGrading = useCallback(async (id: number, competencyId: string) => {
    const res = await fetch(`/api/assess/${id}`);
    const data = await res.json();
    const st = data.assessment.status;
    if (st === "completed" || st === "grading_failed") {
      setGrading(null);
      setGradingDone({ competencyId, assessmentId: id, status: st });
      router.refresh();
    } else {
      setTimeout(() => pollGrading(id, competencyId), 5000);
    }
  }, [router]);

  // Auto-resume polling for any assessment that's currently grading
  useEffect(() => {
    for (const c of competencies) {
      if (c.latestAssessment?.status === "grading") {
        setGrading(c.id);
        pollGrading(c.latestAssessment.id, c.id);
        break;
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startAssessment(competencyId: string) {
    const comp = competencies.find((c) => c.id === competencyId);
    const latest = comp?.latestAssessment;

    // Resume existing ready or in-progress assessment instead of creating a duplicate
    if (latest && (latest.status === "ready" || latest.status === "in_progress")) {
      try {
        const res = await fetch(`/api/assess/${latest.id}`);
        const data = await res.json();
        setQuestions(data.questions);
        setAssessmentData(data.assessment);
        setActiveAssessmentId(latest.id);
        // For in-progress, find the first unanswered question
        const firstUnanswered = (data.questions as QuestionRow[]).findIndex((q) => !q.studentAnswer);
        setCurrentQ(firstUnanswered >= 0 ? firstUnanswered : 0);
        setAnswer("");
        setView("session");
      } catch (e) {
        console.error(e);
      }
      return;
    }

    // Resume generating assessment (user navigated away and came back)
    if (latest && latest.status === "generating") {
      setGenerating(competencyId);
      setActiveAssessmentId(latest.id);
      pollAssessment(latest.id);
      return;
    }

    // Already grading — just resume polling
    if (latest && latest.status === "grading") {
      setGrading(competencyId);
      pollGrading(latest.id, competencyId);
      return;
    }

    setGenerating(competencyId);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competencyId }),
      });
      await assertOk(res);
      const data = await res.json();
      setActiveAssessmentId(data.assessmentId);
      pollAssessment(data.assessmentId);
    } catch (e) {
      console.error(e);
      setGenerating(null);
    }
  }

  async function submitAnswer() {
    if (!activeAssessmentId || !questions[currentQ]) return;
    setSubmitting(true);
    try {
      await fetch(`/api/assess/${activeAssessmentId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questions[currentQ].id,
          answer,
          difficultyFlag,
        }),
      });
      questions[currentQ].studentAnswer = answer;
      questions[currentQ].difficultyFlag = difficultyFlag;

      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setAnswer("");
        setDifficultyFlag(null);
      } else {
        // All answered — trigger background grading
        const cId = assessmentData?.competencyId ?? "";
        await fetch(`/api/assess/${activeAssessmentId}/grade`, {
          method: "POST",
        });
        setGrading(cId);
        setView("grid");
        pollGrading(activeAssessmentId, cId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function loadHistory(competencyId: string) {
    const res = await fetch("/api/assess");
    const data = await res.json();
    const filtered = (data.assessments as AssessmentRow[]).filter(
      (a) => a.competencyId === competencyId && a.status === "completed"
    );
    setHistory(filtered);
    setSelectedCompetency(competencyId);
  }

  async function viewPastAssessment(id: number) {
    const res = await fetch(`/api/assess/${id}`);
    const data = await res.json();
    setAssessmentData(data.assessment);
    setQuestions(data.questions);
    setActiveAssessmentId(id);
    setView("results");
  }

  async function copyReport() {
    if (!assessmentData) return;
    const comp = competencies.find((c) => c.id === assessmentData.competencyId);
    const report = buildReport(assessmentData, questions, comp?.label ?? assessmentData.competencyId);
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      // Fallback for non-HTTPS contexts
      const ta = document.createElement("textarea");
      ta.value = report;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- Grid View ---
  if (view === "grid") {
    const grouped = areas.map((area) => ({
      area,
      items: competencies.filter((c) => c.area === area),
    })).filter((g) => g.items.length > 0);

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Assess</h1>
            <p className="page-subtitle mt-1">Validate your knowledge with structured assessments</p>
          </div>
        </div>

        {/* Grading done notification */}
        {gradingDone && (
          <Card className={gradingDone.status === "completed" ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}>
            <CardContent className="pt-3 pb-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {gradingDone.status === "completed" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
                <span className="text-[14px]">
                  {gradingDone.status === "completed"
                    ? `Grading complete for ${competencies.find((c) => c.id === gradingDone.competencyId)?.label ?? gradingDone.competencyId}`
                    : `Grading failed for ${competencies.find((c) => c.id === gradingDone.competencyId)?.label ?? gradingDone.competencyId} — check your AI configuration`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gradingDone.status === "completed" && (
                  <Button size="xs" onClick={() => {
                    viewPastAssessment(gradingDone.assessmentId);
                    setGradingDone(null);
                  }}>
                    View results
                  </Button>
                )}
                <Button size="xs" variant="ghost" onClick={() => setGradingDone(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail pane for selected competency */}
        {selectedCompetency && (
          <Card>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[15px] font-semibold">
                    {competencies.find((c) => c.id === selectedCompetency)?.label} — History
                  </span>
                </div>
                <Button variant="ghost" size="xs" onClick={() => setSelectedCompetency(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              {history.length === 0 ? (
                <p className="text-[14px] text-muted-foreground">No completed assessments yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => viewPastAssessment(a.id)}
                      className="w-full text-left px-3 py-2 rounded-sm border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-[14px]">
                        <span className="font-medium">Attempt #{a.attemptNumber}</span>
                        <Badge variant={a.overallScore != null && a.overallScore >= 60 ? "success" : "danger"}>
                          {a.overallScore != null ? `${Math.round(a.overallScore)}%` : "N/A"}
                        </Badge>
                        <span className="text-muted-foreground">
                          Level {a.validatedLevel ?? "?"}/{a.activityLevel}
                        </span>
                        <span className="text-muted-foreground ml-auto tabular-nums">
                          {a.completedAt ? new Date(a.completedAt).toLocaleDateString("fr-FR") : ""}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {grouped.map((group) => (
          <div key={group.area} className="space-y-2">
            <h2 className="section-label">{group.area}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {group.items.map((c) => (
                <CompetencyCard
                  key={c.id}
                  data={c}
                  generating={generating === c.id}
                  gradingId={grading === c.id}
                  onAssess={() => startAssessment(c.id)}
                  onHistory={() => loadHistory(c.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --- Session View ---
  if (view === "session") {
    const q = questions[currentQ];
    if (!q) return null;
    const comp = competencies.find((c) => c.id === assessmentData?.competencyId);

    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setView("grid"); router.refresh(); }}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-muted-foreground">
              {comp?.label}
            </span>
            <Badge variant="outline">
              {currentQ + 1} / {questions.length}
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4 px-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{q.questionType.replace(/_/g, "-")}</Badge>
              <Badge variant="outline">Difficulty {q.difficulty}/5</Badge>
            </div>

            <div className="prose prose-sm prose-invert max-w-none">
              <QuestionRenderer text={q.questionText} />
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-[14px] font-medium">Your answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const val = e.currentTarget.value;
                    setAnswer(val.substring(0, start) + "  " + val.substring(end));
                    setTimeout(() => {
                      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                    }, 0);
                  }
                }}
                rows={8}
                placeholder="Write your answer here. Use markdown code blocks for code snippets."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-[14px] font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground">Flag:</span>
                <button
                  onClick={() => setDifficultyFlag(difficultyFlag === "too_easy" ? null : "too_easy")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[13px] border transition-colors ${
                    difficultyFlag === "too_easy"
                      ? "border-green-600 bg-green-600/10 text-green-400"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" />
                  Too easy
                </button>
                <button
                  onClick={() => setDifficultyFlag(difficultyFlag === "too_hard" ? null : "too_hard")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[13px] border transition-colors ${
                    difficultyFlag === "too_hard"
                      ? "border-red-600 bg-red-600/10 text-red-400"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsDown className="h-3 w-3" />
                  Too hard
                </button>
              </div>

              <Button
                onClick={submitAnswer}
                disabled={!answer.trim() || submitting}
                size="sm"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                )}
                {currentQ < questions.length - 1 ? "Next" : "Finish"}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    );
  }

  // --- Results View ---
  if (view === "results" && assessmentData) {
    const comp = competencies.find((c) => c.id === assessmentData.competencyId);
    const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setView("grid"); router.refresh(); }}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyReport}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? "Copied" : "Copy Report"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startAssessment(assessmentData.competencyId)}
              disabled={!!generating}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Retake
            </Button>
          </div>
        </div>

        {/* Score summary */}
        <Card>
          <CardContent className="pt-4 pb-4 px-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-semibold">{comp?.label}</span>
              <Badge variant={assessmentData.overallScore != null && assessmentData.overallScore >= 60 ? "success" : "danger"}>
                {assessmentData.overallScore != null ? `${Math.round(assessmentData.overallScore)}%` : "N/A"}
              </Badge>
              <span className="text-[14px] text-muted-foreground">
                Attempt #{assessmentData.attemptNumber}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[14px]">
              <div>
                <span className="text-muted-foreground">Activity level: </span>
                <span className="font-medium">{assessmentData.activityLevel}/5</span>
              </div>
              <div>
                <span className="text-muted-foreground">Validated level: </span>
                <span className="font-medium">{assessmentData.validatedLevel ?? "?"}/5</span>
              </div>
            </div>
            {assessmentData.gapsJson && (() => {
              try {
                const gaps = JSON.parse(assessmentData.gapsJson) as string[];
                if (gaps.length > 0) return (
                  <div>
                    <span className="text-[13px] text-muted-foreground">Identified gaps: </span>
                    <span className="text-[13px]">{gaps.join(", ")}</span>
                  </div>
                );
              } catch {}
              return null;
            })()}
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        {sorted.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium">Q{i + 1}</span>
                <Badge variant="secondary">{q.questionType.replace(/_/g, "-")}</Badge>
                <Badge variant="outline">Diff {q.difficulty}</Badge>
                {q.score != null && (
                  <Badge variant={q.score >= 60 ? "success" : "danger"}>
                    {Math.round(q.score)}%
                  </Badge>
                )}
                {q.difficultyFlag && (
                  <Badge variant="warning">{q.difficultyFlag.replace(/_/g, " ")}</Badge>
                )}
              </div>

              <div className="text-[14px] whitespace-pre-wrap">
                <QuestionRenderer text={q.questionText} />
              </div>

              {q.studentAnswer && (
                <>
                  <Separator />
                  <div>
                    <span className="text-[13px] font-medium text-muted-foreground">Your answer:</span>
                    <div className="mt-1 text-[14px] whitespace-pre-wrap font-mono bg-muted/30 rounded-sm px-3 py-2">
                      {q.studentAnswer}
                    </div>
                  </div>
                </>
              )}

              {q.scoreJson ? (() => {
                try {
                  const grading = JSON.parse(q.scoreJson);
                  return (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <span className="text-[13px] font-medium text-muted-foreground">Grading:</span>
                        {grading.criteriaScores?.map((cs: { id: string; awarded: number; rationale: string }) => (
                          <div key={cs.id} className="flex items-start gap-2 text-[13px]">
                            <span className={cs.awarded > 0 ? "text-green-400" : "text-red-400"}>
                              {cs.awarded > 0 ? "✓" : "✗"}
                            </span>
                            <span className="font-mono">{cs.id}</span>
                            <span className="text-muted-foreground">({cs.awarded}pt)</span>
                            <span className="text-muted-foreground">— {cs.rationale}</span>
                          </div>
                        ))}
                        {grading.feedback && (
                          <p className="text-[13px] text-muted-foreground mt-2">{grading.feedback}</p>
                        )}
                      </div>
                    </>
                  );
                } catch { return null; }
              })() : q.studentAnswer && (
                <>
                  <Separator />
                  <p className="text-[13px] text-red-400">Grading failed for this question. Check your Assessment AI configuration in Settings.</p>
                </>
              )}

              {/* Raw data toggle */}
              <button
                onClick={() => setShowRaw((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showRaw[q.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showRaw[q.id] ? "Hide" : "Show"} raw data
              </button>
              {showRaw[q.id] && (
                <pre className="text-[11px] font-mono bg-muted/30 rounded-sm px-3 py-2 overflow-x-auto max-h-[200px] overflow-y-auto">
                  {q.scoreJson
                    ? JSON.stringify(JSON.parse(q.scoreJson), null, 2)
                    : JSON.stringify({ rubric: JSON.parse(q.rubricJson), note: "No grading data — LLM call failed" }, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return null;
}

function CompetencyCard({
  data,
  generating,
  gradingId,
  onAssess,
  onHistory,
}: {
  data: CompetencyData;
  generating: boolean;
  gradingId: boolean;
  onAssess: () => void;
  onHistory: () => void;
}) {
  const latestStatus = data.latestAssessment?.status;
  const isGrading = gradingId || latestStatus === "grading";
  const status = isGrading
    ? "Grading"
    : data.validation
      ? "Validated"
      : latestStatus === "generating"
        ? "Generating"
        : latestStatus === "ready" || latestStatus === "in_progress"
          ? "Ready"
          : latestStatus === "grading_failed"
            ? "Failed"
            : data.assessmentCount > 0
              ? "Stale"
              : "Never";

  const statusVariant: Record<string, "success" | "outline" | "warning" | "secondary" | "destructive"> = {
    Validated: "success",
    Grading: "warning",
    Generating: "warning",
    Ready: "warning",
    Failed: "destructive",
    Stale: "secondary",
    Never: "outline",
  };

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="pt-3 pb-3 px-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium truncate">{data.label}</span>
          <Badge variant={statusVariant[status] ?? "outline"}>{status}</Badge>
        </div>

        {/* Dual level bars */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-14">Activity</span>
            <LevelBar level={data.activityLevel} color="primary" />
            <span className="text-[11px] tabular-nums w-4">{data.activityLevel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-14">Validated</span>
            <LevelBar level={data.validation?.validatedLevel ?? 0} color="validated" />
            <span className="text-[11px] tabular-nums w-4">{data.validation?.validatedLevel ?? "-"}</span>
          </div>
        </div>

        {/* Assessment info */}
        {data.latestAssessment && (
          <div className="text-[12px] text-muted-foreground">
            Last: {data.latestAssessment.completedAt
              ? new Date(data.latestAssessment.completedAt).toLocaleDateString("fr-FR")
              : data.latestAssessment.status}
            {data.latestAssessment.overallScore != null && (
              <> — {Math.round(data.latestAssessment.overallScore)}%</>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          <Button
            size="xs"
            onClick={onAssess}
            disabled={generating || isGrading}
          >
            {generating || isGrading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : latestStatus === "ready" || latestStatus === "in_progress" ? (
              <Play className="h-3 w-3 mr-1" />
            ) : data.assessmentCount > 0 ? (
              <RotateCcw className="h-3 w-3 mr-1" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {isGrading ? "Grading..." : generating ? "Generating..." : latestStatus === "ready" ? "Start" : latestStatus === "in_progress" ? "Resume" : data.assessmentCount > 0 || latestStatus === "grading_failed" ? "Retake" : "Assess"}
          </Button>
          {data.assessmentCount > 0 && (
            <Button variant="ghost" size="xs" onClick={onHistory}>
              {data.assessmentCount} past
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LevelBar({ level, color }: { level: number; color: "primary" | "validated" }) {
  const colors = {
    primary: "bg-[oklch(0.82_0.055_80)]",
    validated: "bg-blue-500",
  };
  return (
    <div className="flex gap-0.5 flex-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < level ? colors[color] : "bg-muted/40"
          }`}
        />
      ))}
    </div>
  );
}

function QuestionRenderer({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const lang = match?.[1] ?? "";
          const code = match?.[2] ?? part.slice(3, -3);
          return (
            <pre key={i} className="bg-muted/40 rounded-sm px-3 py-2 overflow-x-auto text-[13px] font-mono my-2">
              {lang && <div className="text-[11px] text-muted-foreground mb-1">{lang}</div>}
              <code>{code}</code>
            </pre>
          );
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </>
  );
}

function buildReport(
  assessment: AssessmentRow,
  questions: QuestionRow[],
  label: string,
): string {
  const date = assessment.completedAt
    ? new Date(assessment.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "In progress";
  const pct = assessment.overallScore != null ? `${Math.round(assessment.overallScore)}%` : "N/A";
  const level = assessment.validatedLevel != null ? `${assessment.validatedLevel}/5` : "N/A";

  const lines: string[] = [
    `# Assessment Report: ${label} (${assessment.competencyId})`,
    `Date: ${date} | Score: ${pct} | Validated Level: ${level} | Attempt: #${assessment.attemptNumber}`,
    "",
  ];

  const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
  for (let i = 0; i < sorted.length; i++) {
    const q = sorted[i];
    lines.push(`## Question ${i + 1} — ${q.questionType.replace(/_/g, "-")} (Difficulty: ${q.difficulty})`);
    if (q.difficultyFlag) lines.push(`*Flagged as: ${q.difficultyFlag.replace(/_/g, " ")}*`);
    lines.push(q.questionText, "");
    lines.push("### My Answer");
    lines.push(q.studentAnswer ?? "*No answer*", "");

    if (q.scoreJson) {
      try {
        const g = JSON.parse(q.scoreJson);
        lines.push("### Grading");
        lines.push(`Score: ${g.totalScore}/${g.maxScore}`);
        for (const cs of g.criteriaScores ?? []) {
          lines.push(`- ${cs.awarded > 0 ? "✓" : "✗"} ${cs.id} (${cs.awarded}): "${cs.rationale}"`);
        }
        if (g.identifiedGaps?.length > 0) {
          lines.push("", "### Gaps");
          for (const gap of g.identifiedGaps) lines.push(`- ${gap}`);
        }
        if (g.feedback) lines.push("", `### Feedback`, g.feedback);
      } catch {}
    }
    lines.push("");
  }

  if (assessment.gapsJson) {
    try {
      const gaps = JSON.parse(assessment.gapsJson) as string[];
      if (gaps.length > 0) {
        lines.push("## Summary", `Overall: ${pct} | Gaps: ${gaps.join(", ")}`);
      }
    } catch {}
  }

  return lines.join("\n");
}

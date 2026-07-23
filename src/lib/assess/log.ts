type LogEntry = {
  timestamp: string;
  level: "info" | "error";
  message: string;
};

const MAX_ENTRIES = 200;
const entries: LogEntry[] = [];

export function assessLog(level: "info" | "error", message: string) {
  entries.push({
    timestamp: new Date().toISOString(),
    level,
    message,
  });
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
}

export function getAssessLogs(): LogEntry[] {
  return [...entries];
}

export function clearAssessLogs() {
  entries.length = 0;
}

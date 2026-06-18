import type { AnalyzeFrameResponse } from "@/entities/detection";
import type { FrameItem, SessionDetailResponse } from "@/entities/session";
import type { AlertEntry } from "@/features/alert-history";

export type LiveReportInput = {
  kind: "live";
  generatedAt: string;
  sessionId?: number | null;
  data: AnalyzeFrameResponse | null;
  latencyMs: number | null;
  alerts: AlertEntry[];
};

export type ArchiveReportInput = {
  kind: "archive";
  generatedAt: string;
  session: SessionDetailResponse;
  frames: FrameItem[];
  stats?: {
    maxCrowdDensity?: number;
    anomalies?: number;
    threat?: { safe: number; warn: number; danger: number };
  };
};

export type ReportInput = LiveReportInput | ArchiveReportInput;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAlerts(alerts: AlertEntry[]): string {
  if (alerts.length === 0) return "<p>No alerts recorded.</p>";
  return `<ul>${alerts
    .map(
      (a) =>
        `<li><strong>${escapeHtml(a.risk)}</strong> — ${escapeHtml(a.message)} <em>(${escapeHtml(a.timestamp.toISOString())})</em></li>`,
    )
    .join("")}</ul>`;
}

function renderLiveSection(input: LiveReportInput): string {
  const d = input.data;
  return `
    <h2>Live Session Snapshot</h2>
    <table>
      <tr><th>Session ID</th><td>${input.sessionId ?? "—"}</td></tr>
      <tr><th>People Count</th><td>${d?.persons?.length ?? 0}</td></tr>
      <tr><th>Crowd Density</th><td>${escapeHtml(d?.crowd_density ?? "—")}</td></tr>
      <tr><th>Max Proximity Risk</th><td>${escapeHtml(d?.max_proximity_risk ?? "—")}</td></tr>
      <tr><th>Recommendation</th><td>${escapeHtml(d?.recommendation ?? "—")}</td></tr>
      <tr><th>Latency</th><td>${input.latencyMs ?? "—"} ms</td></tr>
    </table>
    <h3>Recent Alerts</h3>
    ${renderAlerts(input.alerts)}
  `;
}

function renderArchiveSection(input: ArchiveReportInput): string {
  const s = input.session;
  const threat = input.stats?.threat ?? { safe: 100, warn: 0, danger: 0 };
  const frameRows = input.frames
    .map(
      (f) =>
        `<tr><td>${f.sequence_no}</td><td>${f.person_count}</td><td>${escapeHtml(f.crowd_density)}</td><td>${escapeHtml(f.max_proximity_risk)}</td></tr>`,
    )
    .join("");

  return `
    <h2>Archive Session Report</h2>
    <table>
      <tr><th>Session ID</th><td>${s.id}</td></tr>
      <tr><th>Source</th><td>${escapeHtml(s.source_type)}</td></tr>
      <tr><th>Started</th><td>${escapeHtml(s.started_at)}</td></tr>
      <tr><th>Ended</th><td>${escapeHtml(s.ended_at ?? "active")}</td></tr>
      <tr><th>Frames</th><td>${s.frame_count}</td></tr>
      <tr><th>Worst Risk</th><td>${escapeHtml(s.worst_risk ?? "—")}</td></tr>
      <tr><th>Max Density</th><td>${input.stats?.maxCrowdDensity ?? "—"}</td></tr>
      <tr><th>Anomalies</th><td>${input.stats?.anomalies ?? 0}</td></tr>
    </table>
    <h3>Threat Distribution</h3>
    <p>SAFE ${threat.safe}% · WARN ${threat.warn}% · DANGER ${threat.danger}%</p>
    <h3>Frame Trail (${input.frames.length})</h3>
    <table>
      <thead><tr><th>#</th><th>Persons</th><th>Density</th><th>Risk</th></tr></thead>
      <tbody>${frameRows || "<tr><td colspan='4'>No frames</td></tr>"}</tbody>
    </table>
  `;
}

export function buildHtmlReport(input: ReportInput): string {
  const title = input.kind === "live" ? "CrowdNav Live Report" : "CrowdNav Session Report";
  const body =
    input.kind === "live" ? renderLiveSection(input) : renderArchiveSection(input);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; }
    h1 { font-size: 1.5rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    th { background: #f4f4f4; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>Generated: ${escapeHtml(input.generatedAt)}</p>
  ${body}
</body>
</html>`;
}

export function downloadHtmlReport(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printHtmlReport(html: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

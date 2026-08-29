import type { ReportSummary, StoredReport } from "../types.js";

export function esc(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

export function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return iso;
  const s = Math.round(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const STYLE = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; margin: 0; }
  header { padding: 12px 20px; border-bottom: 1px solid #8883; display: flex; gap: 10px; align-items: baseline; }
  header b { font-weight: 700; }
  header a { color: inherit; }
  main { padding: 20px; max-width: 900px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #8882; vertical-align: top; }
  th { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; opacity: .7; }
  td.when { white-space: nowrap; opacity: .8; }
  td.route { font-family: ui-monospace, monospace; font-size: 12px; }
  a.report { color: inherit; text-decoration: none; }
  a.report:hover { text-decoration: underline; }
  img.thumb { height: 40px; border: 1px solid #8883; border-radius: 4px; }
  .bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
  .bar form { display: flex; gap: 6px; }
  input { font: inherit; padding: 5px 8px; border: 1px solid #8886; border-radius: 6px; background: transparent; color: inherit; }
  button { font: inherit; padding: 5px 12px; border: 1px solid #8886; border-radius: 6px; background: transparent; color: inherit; cursor: pointer; }
  button.danger { border-color: #e0503066; color: #e05030; }
  .more { display: inline-block; margin-top: 14px; }
  .detail img { max-width: 100%; border: 1px solid #8883; border-radius: 6px; }
  .kv { display: grid; grid-template-columns: 140px 1fr; gap: 4px 12px; margin: 10px 0; }
  .kv dt { opacity: .65; }
  .kv dd { margin: 0; font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; }
  pre { background: #8881; padding: 12px; border-radius: 6px; overflow: auto; font-size: 12px; }
  section { margin: 20px 0; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; opacity: .7; }
`;

export function layout(title: string, base: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>${STYLE}</style></head>
<body><header><b>Tracepoint</b><a href="${esc(base) || "/"}">reports</a></header>
<main>${body}</main></body></html>`;
}

interface ListCaps {
  search?: boolean;
  routeFilter?: boolean;
}

export function renderList(
  base: string,
  rows: ReportSummary[],
  limit: number,
  query: { q?: string; route?: string },
  caps: ListCaps,
): string {
  const filters: string[] = [];
  if (caps.search) {
    filters.push(`<input name="q" placeholder="Search description" value="${esc(query.q ?? "")}">`);
  }
  if (caps.routeFilter) {
    filters.push(`<input name="route" placeholder="Route" value="${esc(query.route ?? "")}">`);
  }
  const filterForm = filters.length
    ? `<form method="get">${filters.join("")}<button>Filter</button></form>`
    : "";

  const body = rows.length
    ? `<table><thead><tr><th>When</th><th>Route</th><th>Description</th><th></th></tr></thead><tbody>${rows
        .map(
          (r) => `<tr>
        <td class="when">${esc(relTime(r.createdAt))}</td>
        <td class="route">${esc(r.route ?? "—")}</td>
        <td><a class="report" href="${esc(base)}/reports/${esc(r.id)}">${esc(r.description || "(no description)")}</a></td>
        <td>${r.hasScreenshot ? `<img class="thumb" src="${esc(base)}/reports/${esc(r.id)}/screenshot" alt="">` : ""}</td>
      </tr>`,
        )
        .join("")}</tbody></table>`
    : "<p>No reports yet.</p>";

  const more =
    rows.length >= limit
      ? `<a class="more" href="${esc(base)}?limit=${limit + 50}${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}${query.route ? `&route=${encodeURIComponent(query.route)}` : ""}">Show 50 more</a>`
      : "";

  const clear = `<form method="post" action="${esc(base)}/clear" onsubmit="return confirm('Delete all reports?')"><button class="danger">Clear all</button></form>`;

  return layout(
    "Reports · Tracepoint",
    base,
    `<div class="bar">${filterForm}${clear}</div>${body}${more}`,
  );
}

export function renderDetail(base: string, report: StoredReport): string {
  const p = report.payload as Record<string, Record<string, unknown>>;
  const rep = p.report ?? {};
  const page = p.page ?? {};
  const target = p.target as Record<string, unknown> | null;
  const client = p.client ?? {};

  const kv = (obj: Record<string, unknown>) =>
    `<dl class="kv">${Object.entries(obj)
      .map(
        ([k, v]) =>
          `<dt>${esc(k)}</dt><dd>${esc(typeof v === "object" ? JSON.stringify(v) : v)}</dd>`,
      )
      .join("")}</dl>`;

  const shot = report.screenshot
    ? `<img src="${esc(base)}/reports/${esc(report.id)}/screenshot" alt="screenshot">`
    : "";

  const body = `<div class="detail">
    <p><a href="${esc(base)}">&larr; reports</a></p>
    <h1>${esc((rep.description as string) || "(no description)")}</h1>
    <p class="when">${esc(relTime(report.createdAt))} · <span class="route">${esc(page.route ?? "—")}</span> · ${esc(page.url)}</p>
    ${shot}
    <section><h2>Target</h2>${target ? kv(target) : "<p>—</p>"}</section>
    <section><h2>Client</h2>${kv(client)}</section>
    <section><h2>Context</h2>${kv((p.context as Record<string, unknown>) ?? {})}</section>
    <section><details><summary>Raw payload</summary><pre>${esc(JSON.stringify(report.payload, null, 2))}</pre></details></section>
    <form method="post" action="${esc(base)}/reports/${esc(report.id)}/delete" onsubmit="return confirm('Delete this report?')">
      <button class="danger">Delete</button>
    </form>
  </div>`;

  return layout(`${(rep.description as string) || "Report"} · Tracepoint`, base, body);
}

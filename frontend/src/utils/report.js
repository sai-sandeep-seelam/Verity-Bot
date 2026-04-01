/* ── frontend/src/utils/report.js ──
 *  Generates and downloads a self-contained HTML analysis report.
 *  No backend changes required — works entirely from the existing
 *  frontend result state.
 */

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );

const pct = (v) => `${Math.round(v * 100)}%`;

const pad = (n) => String(n).padStart(2, "0");

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

/**
 * Build sentence-level highlighted HTML from the backend response.
 * AI-like sentences (ai_probability >= 0.6) → orange highlight
 * Everything else → subtle / normal styling
 */
function buildHighlightedText(originalText, sentences) {
  if (!sentences || sentences.length === 0) return escapeHtml(originalText);

  const parts = [];
  let cursor = 0;

  for (const s of sentences) {
    const t = s.text || "";
    if (!t) continue;
    const idx = originalText.indexOf(t, cursor);
    if (idx === -1) continue;                       // graceful fallback
    if (idx > cursor) parts.push(escapeHtml(originalText.slice(cursor, idx)));

    const prob = s.ai_probability ?? 0;
    let cls = "";
    if (prob >= 0.8)      cls = "hl-red";
    else if (prob >= 0.6) cls = "hl-orange";
    else if (prob >= 0.4) cls = "hl-yellow";
    // else no highlight — normal text

    parts.push(cls ? `<span class="${cls}">${escapeHtml(t)}</span>` : escapeHtml(t));
    cursor = idx + t.length;
  }

  if (cursor < originalText.length) parts.push(escapeHtml(originalText.slice(cursor)));
  return parts.join("");
}

/**
 * downloadHtmlReport(result, originalText, sourceType, fileName)
 *
 * @param {object}  result       – full backend /analyze-text response
 * @param {string}  originalText – the raw text that was analyzed
 * @param {string}  sourceType   – "typed" | "file"
 * @param {string}  fileName     – uploaded filename (empty string if typed)
 */
export function downloadHtmlReport(result, originalText, sourceType, fileName) {
  if (!result?.overall) return;

  const now           = new Date().toLocaleString();
  const overall       = result.overall;
  const label         = overall.label === "AI" ? "Likely AI-Generated" : "Likely Human-Written";
  const labelColor    = overall.label === "AI" ? "#f2994a" : "#63d471";
  const highlighted   = buildHighlightedText(originalText, result.sentences);
  const source        = sourceType === "file" ? `File upload — ${escapeHtml(fileName || "unknown")}` : "Pasted text";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Analysis Report — Verity AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Inter", "Segoe UI", system-ui, sans-serif;
      background: #0d0e10;
      color: #e3e2e3;
      padding: 3rem 1.5rem;
      -webkit-font-smoothing: antialiased;
    }

    .report {
      max-width: 860px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .header {
      border-bottom: 1px solid rgba(68,70,87,.2);
      padding-bottom: 2rem;
      margin-bottom: 2rem;
    }
    .brand {
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: #fff;
      margin-bottom: .25rem;
    }
    .brand-accent { color: #0036ff; }
    .header-sub {
      font-size: .8rem;
      color: #8e8fa3;
      letter-spacing: .02em;
    }

    /* ── Metadata ── */
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .meta-item { font-size: .8125rem; color: #8e8fa3; }
    .meta-item strong { color: #c4c5da; font-weight: 600; }

    /* ── Summary Cards ── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .card {
      background: rgba(31,32,33,.8);
      border: 1px solid rgba(68,70,87,.15);
      border-radius: .75rem;
      padding: 1.25rem 1.5rem;
    }
    .card-label {
      font-size: .6875rem;
      text-transform: uppercase;
      letter-spacing: .12em;
      color: #8e8fa3;
      margin-bottom: .5rem;
    }
    .card-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
    }
    .card-value.verdict { color: ${labelColor}; }

    /* ── Highlighted Text ── */
    .text-section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 1rem;
    }
    .text-box {
      background: rgba(31,32,33,.6);
      border: 1px solid rgba(68,70,87,.12);
      border-radius: .75rem;
      padding: 1.75rem;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.8;
      font-size: .9375rem;
      color: #e3e2e3;
    }

    /* Highlight classes */
    .hl-red    { background: rgba(242,153,74,.45); border-radius: 4px; padding: 1px 3px; }
    .hl-orange { background: rgba(242,153,74,.30); border-radius: 4px; padding: 1px 3px; }
    .hl-yellow { background: rgba(255,255,255,.08); border-radius: 4px; padding: 1px 3px; }

    /* ── Legend ── */
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-top: 1.25rem;
      font-size: .75rem;
      color: #8e8fa3;
    }
    .legend-item { display: flex; align-items: center; gap: .4rem; }
    .legend-swatch {
      display: inline-block;
      width: 14px; height: 14px;
      border-radius: 3px;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(68,70,87,.15);
      text-align: center;
      font-size: .75rem;
      color: #5a5b6a;
    }

    @media print {
      body { background: #fff; color: #1a1a1a; padding: 1rem; }
      .card { background: #f5f5f5; border-color: #ddd; }
      .card-label { color: #666; }
      .card-value { color: #1a1a1a; }
      .text-box { background: #fafafa; border-color: #e0e0e0; color: #1a1a1a; }
      .hl-red    { background: rgba(242,153,74,.35); }
      .hl-orange { background: rgba(242,153,74,.25); }
      .hl-yellow { background: rgba(0,0,0,.06); }
      .header, .footer { border-color: #ddd; }
      .header-sub, .meta-item { color: #888; }
      .meta-item strong { color: #333; }
    }
  </style>
</head>
<body>
  <div class="report">

    <!-- Header -->
    <div class="header">
      <div class="brand">Verity <span class="brand-accent">AI</span> — Analysis Report</div>
      <div class="header-sub">AI text detection &amp; content verification</div>
    </div>

    <!-- Metadata -->
    <div class="meta-row">
      <div class="meta-item"><strong>Generated:</strong> ${escapeHtml(now)}</div>
      <div class="meta-item"><strong>Source:</strong> ${source}</div>
    </div>

    <!-- Summary -->
    <div class="summary-grid">
      <div class="card">
        <div class="card-label">Verdict</div>
        <div class="card-value verdict">${escapeHtml(label)}</div>
      </div>
      <div class="card">
        <div class="card-label">AI Probability</div>
        <div class="card-value">${pct(overall.ai_probability)}</div>
      </div>
      <div class="card">
        <div class="card-label">Human Probability</div>
        <div class="card-value">${pct(overall.human_probability)}</div>
      </div>
      <div class="card">
        <div class="card-label">Confidence</div>
        <div class="card-value">${pct(overall.confidence)}</div>
      </div>
    </div>

    <!-- Highlighted Text -->
    <div class="text-section-title">Analyzed Text</div>
    <div class="text-box">${highlighted}</div>
    <div class="legend">
      <div class="legend-item"><span class="legend-swatch" style="background:rgba(242,153,74,.45)"></span> High AI probability (≥ 80%)</div>
      <div class="legend-item"><span class="legend-swatch" style="background:rgba(242,153,74,.30)"></span> Moderate AI probability (60–79%)</div>
      <div class="legend-item"><span class="legend-swatch" style="background:rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15)"></span> Low AI probability (40–59%)</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Report generated by Verity AI &middot; verityai.com &middot; &copy; ${new Date().getFullYear()}
    </div>

  </div>
</body>
</html>`;

  // Trigger download
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `analysis-report-${timestamp()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

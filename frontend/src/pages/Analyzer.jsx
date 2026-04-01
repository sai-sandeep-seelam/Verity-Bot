import { useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { downloadHtmlReport } from "../utils/report";
import "./Analyzer.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const HISTORY_KEY = "analysisHistory";
const INVALID_FILE_MESSAGE =
  "Invalid file: encrypted, protected, unreadable, or unsupported. Please upload an accessible TXT, PDF, or DOCX file.";

const scoreClass = (aiProb) => {
  if (aiProb >= 0.8) return "score-red";
  if (aiProb >= 0.6) return "score-orange";
  if (aiProb >= 0.4) return "score-yellow";
  return "score-green";
};

const formatPercent = (value) => `${Math.round(value * 100)}%`;



const loadHistory = () => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveHistory = (items) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
};

const addHistoryItem = (item) => {
  const existing = loadHistory();
  const updated = [item, ...existing].slice(0, 10);
  saveHistory(updated);
  return updated;
};

function Analyzer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileName, setFileName] = useState("");
  const [history, setHistory] = useState(() => loadHistory());
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("paste");
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const sourceType = fileName ? "file" : "typed";

  /* ── Word / char count ── */
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  /* ── API calls (identical logic) ── */
  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Paste some text to analyze.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to analyze text.");
      }

      const data = await response.json();
      setResult(data);

      const historyItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceType,
        fileName: fileName || "",
        label: data.overall.label,
        aiProbability: data.overall.ai_probability,
        preview: text.trim().slice(0, 160),
      };
      setHistory(addHistoryItem(historyItem));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
      setFileError(INVALID_FILE_MESSAGE);
      return;
    }

    setExtracting(true);
    setFileError("");
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_URL}/extract-file-text`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        setFileError(payload.error || INVALID_FILE_MESSAGE);
        return;
      }

      setText(payload.text || "");
      setFileName(payload.filename || file.name);
      setActiveTab("paste");
    } catch {
      setFileError(INVALID_FILE_MESSAGE);
    } finally {
      setExtracting(false);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (event.dataTransfer?.types?.includes("Files")) {
      dragCounter.current += 1;
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const clearFile = () => {
    setFileName("");
    setFileError("");
  };

  /* ── Highlight segments ── */
  const highlightSegments = useMemo(() => {
    if (!text) return [];
    const sentences = result?.sentences;
    if (!sentences || sentences.length === 0) return [{ text, className: "" }];

    const segments = [];
    let cursor = 0;
    let failed = false;

    sentences.forEach((sentence) => {
      const sentenceText = sentence.text || "";
      if (!sentenceText) return;
      const index = text.indexOf(sentenceText, cursor);
      if (index === -1) { failed = true; return; }
      if (index > cursor) segments.push({ text: text.slice(cursor, index), className: "" });
      segments.push({ text: sentenceText, className: scoreClass(sentence.ai_probability) });
      cursor = index + sentenceText.length;
    });

    if (failed) return [{ text, className: "" }];
    if (cursor < text.length) segments.push({ text: text.slice(cursor), className: "" });
    return segments.length ? segments : [{ text, className: "" }];
  }, [result, text]);

  const syncScroll = () => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };



  const aiProb = result?.overall?.ai_probability ?? null;
  const overallLabel = result?.overall?.label === "AI" ? "Likely AI" : "Likely Human";
  const gaugeOffset = aiProb !== null ? 552.92 * (1 - aiProb) : 552.92;

  return (
    <div className="analyzer-page">
      <Navbar />

      <main className="scanner-main deep-space-gradient">
        {/* Background glow */}
        <div className="scanner-bg-glow" />

        <div className="scanner-layout">
          {/* ── Left Column ── */}
          <div className="scanner-left">


            {/* Input tabs + textarea */}
            <div className="scanner-input-panel glass-panel-scanner">
              <div className="scanner-tabs">
                <button
                  className={`scanner-tab ${activeTab === "paste" ? "active" : ""}`}
                  onClick={() => setActiveTab("paste")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit_note</span>
                  Paste Text
                </button>
                <button
                  className={`scanner-tab ${activeTab === "upload" ? "active" : ""}`}
                  onClick={() => { setActiveTab("upload"); fileInputRef.current?.click(); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
                  Upload PDF
                </button>
              </div>

              <div
                className={`scanner-textarea-area ${isDragging ? "dragging" : ""}`}
                onDrop={handleDrop}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="highlight-layer" ref={highlightRef} aria-hidden="true">
                  {highlightSegments.map((segment, i) => (
                    <span className={segment.className} key={`seg-${i}`}>{segment.text}</span>
                  ))}
                </div>
                <textarea
                  id="text-input"
                  ref={textareaRef}
                  placeholder="Paste your content here to verify its authenticity..."
                  value={text}
                  onScroll={syncScroll}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (result) setResult(null);
                    if (error) setError("");
                  }}
                />
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
                <div className="scanner-meta-bar">
                  <span className="scanner-meta-item">WORDS: {wordCount}</span>
                  <span className="scanner-meta-item">CHARS: {charCount}</span>
                </div>
              </div>
            </div>

            {extracting && <div className="scanner-hint">Extracting text from file...</div>}
            {fileName && <div className="scanner-file-badge">Loaded: {fileName}
              <button className="scanner-clear-file" onClick={clearFile}>✕</button>
            </div>}
            {fileError && <div className="scanner-error">{fileError}</div>}

            {/* Scan button */}
            <div className="scanner-action-wrapper">
              <span className="bracket bracket-tl" />
              <span className="bracket bracket-tr" />
              <span className="bracket bracket-bl" />
              <span className="bracket bracket-br" />
              <button
                className="scanner-action-btn scan-glow"
                onClick={handleAnalyze}
                disabled={loading || extracting}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                {loading ? "Analyzing..." : "Scan Now"}
              </button>
            </div>
            {error && <div className="scanner-error">{error}</div>}
          </div>

          {/* ── Right Column ── */}
          <div className="scanner-right">
            {/* Gauge card */}
            <div className="gauge-card glass-panel-scanner">
              <div className="gauge-decorative-rings">
                <div className="gauge-ring-outer" />
                <div className="gauge-ring-inner" />
              </div>
              <div className="gauge-content">
                <div className="gauge-svg-wrapper">
                  <svg className="gauge-svg-lg" viewBox="0 0 192 192">
                    <circle className="gauge-track-lg" cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="8" />
                    <circle
                      className="gauge-fill-lg"
                      cx="96" cy="96" r="88"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="552.92"
                      strokeDashoffset={gaugeOffset}
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                  </svg>
                  <div className="gauge-center-text">
                    <span className="gauge-center-value">
                      {aiProb !== null ? `${Math.round(aiProb * 100)}%` : "--"}
                    </span>
                    <span className="gauge-center-label">AI Probability</span>
                  </div>
                </div>
                <p className="gauge-status-text">
                  {result
                    ? `Verdict: ${overallLabel}`
                    : "Analysis pending. Please enter or upload text to begin verification."}
                </p>
              </div>
            </div>

            {/* Mini analysis cards */}
            {result && (
              <div className="mini-cards-grid">
                <div className="mini-card glass-panel-scanner">
                  <span className="material-symbols-outlined mini-card-icon">auto_graph</span>
                  <h4 className="mini-card-title">AI Sentences</h4>
                  <p className="mini-card-value">
                    {result.overall.ai_sentence_count} / {result.overall.total_sentences}
                  </p>
                </div>
                <div className="mini-card glass-panel-scanner">
                  <span className="material-symbols-outlined mini-card-icon">psychology</span>
                  <h4 className="mini-card-title">Confidence</h4>
                  <p className="mini-card-value">{formatPercent(result.overall.confidence)}</p>
                </div>
              </div>
            )}

            {/* Results summary cards */}
            {result && (
              <div className="results-detail glass-panel-scanner">
                <div className="results-detail-header">
                  <h3 className="results-detail-title">Analysis Report</h3>
                  <span className="results-badge">COMPLETE</span>
                </div>
                <div className="results-summary-grid">
                  <div className="results-summary-item">
                    <span className="results-summary-label">Overall Label</span>
                    <span className="results-summary-value">{overallLabel}</span>
                  </div>
                  <div className="results-summary-item">
                    <span className="results-summary-label">AI Probability</span>
                    <span className="results-summary-value">{formatPercent(result.overall.ai_probability)}</span>
                  </div>
                  <div className="results-summary-item">
                    <span className="results-summary-label">Human Probability</span>
                    <span className="results-summary-value">{formatPercent(result.overall.human_probability)}</span>
                  </div>
                  <div className="results-summary-item">
                    <span className="results-summary-label">AI Sentences</span>
                    <span className="results-summary-value">{formatPercent(result.overall.ai_sentence_percentage)}</span>
                  </div>
                </div>
                <button className="download-btn" onClick={() => downloadHtmlReport(result, text, sourceType, fileName)}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                  Download Report
                </button>
              </div>
            )}

            {/* Security report placeholder (pre-analysis) */}
            {!result && (
              <div className="security-card glass-panel-scanner">
                <div className="security-card-header">
                  <h3 className="security-card-title">Security Report</h3>
                  <span className="security-badge">VERIFIED</span>
                </div>
                <ul className="security-list">
                  <li className="security-item">
                    <span className="material-symbols-outlined security-icon">check_circle</span>
                    <div>
                      <p className="security-item-title">Structure Analysis</p>
                      <p className="security-item-desc">Checks for repetitive syntactic patterns.</p>
                    </div>
                  </li>
                  <li className="security-item dimmed">
                    <span className="material-symbols-outlined security-icon">radio_button_unchecked</span>
                    <div>
                      <p className="security-item-title">Semantic Fingerprint</p>
                      <p className="security-item-desc">Matching against known AI model outputs.</p>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Features strip ── */}
      <section className="scanner-features-strip">
        <div className="scanner-features-inner">
          <div className="scanner-feature">
            <div className="scanner-feature-icon-wrap">
              <span className="material-symbols-outlined">speed</span>
            </div>
            <h3 className="scanner-feature-title">Sub-second Latency</h3>
            <p className="scanner-feature-desc">
              Our infrastructure is optimized for instant feedback, processing up to 100,000 words in under 400ms.
            </p>
          </div>
          <div className="scanner-feature">
            <div className="scanner-feature-icon-wrap">
              <span className="material-symbols-outlined">shield_with_house</span>
            </div>
            <h3 className="scanner-feature-title">Privacy First</h3>
            <p className="scanner-feature-desc">
              Your data is processed in-memory and never stored. We adhere to the highest enterprise security standards.
            </p>
          </div>
          <div className="scanner-feature">
            <div className="scanner-feature-icon-wrap">
              <span className="material-symbols-outlined">science</span>
            </div>
            <h3 className="scanner-feature-title">LLM Agnostic</h3>
            <p className="scanner-feature-desc">
              Detecting outputs from GPT-4, Claude 3, Gemini, and fine-tuned open-source models with high precision.
            </p>
          </div>
        </div>
      </section>

      {/* ── History section ── */}
      <section className="analyzer-history">
        <div className="history-container">
          <div className="history-header">
            <h2 className="history-title">History</h2>
            {history.length > 0 && (
              <button className="history-clear-btn" onClick={() => { saveHistory([]); setHistory([]); }}>
                Clear history
              </button>
            )}
          </div>
          {history.length === 0 && <div className="scanner-hint">No analyses yet.</div>}
          <div className="history-list">
            {history.map((item) => (
              <div className="history-item glass-panel-scanner" key={item.id}>
                <div className="history-item-meta">
                  {new Date(item.timestamp).toLocaleString()} |{" "}
                  {item.sourceType === "file" ? `File: ${item.fileName || "Unknown"}` : "Typed text"}
                </div>
                <div className="history-item-label">
                  {item.label} | AI {formatPercent(item.aiProbability)}
                </div>
                <div className="history-item-preview">{item.preview}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="scanner-footer">
        <div className="scanner-footer-grid">
          <div className="scanner-footer-brand">
            <div className="footer-brand">Verity AI</div>
            <p className="scanner-footer-desc">
              Restoring trust to digital content through advanced AI identification and cryptographic verification.
            </p>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <ul className="footer-list">
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">API Docs</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-list">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Connect</h4>
            <ul className="footer-list">
              <li><a href="#">Twitter</a></li>
              <li><a href="#">GitHub</a></li>
              <li><a href="#">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="scanner-footer-bottom">
          <p>© 2024 Verity AI. All rights reserved.</p>
          <div className="scanner-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Analyzer;

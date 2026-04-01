import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Landing.css";

function Landing() {
  const mockupRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const card = mockupRef.current;
    const container = heroRef.current;
    if (!card || !container) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;

      card.classList.add("interacting");
      card.classList.remove("resetting");
      card.style.transform = `rotateX(${rotateX + 15}deg) rotateY(${rotateY - 10}deg) rotateZ(2deg) translateY(-20px)`;
    };

    const handleMouseLeave = () => {
      card.classList.remove("interacting");
      card.classList.add("resetting");
      card.style.transform = "";
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="hero hero-gradient" ref={heroRef}>
        <div className="hero-content">

          <h1 className="">
            Detect AI-Generated Content <br />
            <span className="hero-headline-accent">with Unmatched Precision.</span>
          </h1>

          <p className="hero-subtext">
            Secure your academic integrity and content authenticity. Our advanced neural engine
            separates human creativity from algorithmic output in milliseconds.
          </p>

          <div className="hero-cta-area">
            <Link to="/analyze" className="hero-cta-wrapper">
              <span className="bracket bracket-tl lg" />
              <span className="bracket bracket-tr lg" />
              <span className="bracket bracket-bl lg" />
              <span className="bracket bracket-br lg" />
              <button className="hero-cta btn-sweep btn-pulse">Get Started for Free</button>
            </Link>
          </div>

          {/* ── 3D Mockup Card ── */}
          <div className="perspective-container">
            <div className="floating-mockup glass-panel" ref={mockupRef}>
              <div className="mockup-topbar">
                <div className="mockup-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="mockup-url">verityai.com/scanner/new-document</div>
              </div>
              <div className="mockup-body">
                <div className="mockup-editor">
                  <div className="skeleton-line w100" />
                  <div className="skeleton-line w85" />
                  <div className="skeleton-line w92" />
                  <div className="skeleton-line w40 mb" />
                  <div className="skeleton-line w100" />
                  <div className="skeleton-line w78" />
                  <div className="skeleton-line w95" />
                  <div className="mockup-editor-footer">
                    <span className="mockup-word-count">WORDS: 432</span>
                    <div className="mockup-analyze-btn">ANALYZE CONTENT</div>
                  </div>
                </div>
                <div className="mockup-gauge">
                  <div className="gauge-ring">
                    <svg className="gauge-svg" viewBox="0 0 128 128">
                      <circle className="gauge-track" cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="12" />
                      <circle className="gauge-fill" cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="364.4" strokeDashoffset="40" />
                    </svg>
                    <span className="gauge-value">89%</span>
                  </div>
                  <div className="gauge-label-group">
                    <p className="gauge-label">AI PROBABILITY</p>
                    <p className="gauge-verdict">Likely AI-Generated</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-bg-glow" />
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="features-section" id="capabilities">
        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">Capabilities</span>
            <h2 className="section-title">The AI text detection stack.</h2>
          </div>
          <div className="bento-grid">
            {/* Card 1 — spans 2 cols */}
            <div className="bento-card bento-wide pop-out-card">
              <div className="bento-card-inner">
                <div className="bento-icon-wrap">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <h3 className="bento-card-title">Fine-Tuned Detection Model</h3>
                <p className="bento-card-desc">
                  Powered by a locally trained transformer model, our system classifies text as
                  AI-generated or human-written using a fine-tuned sequence classification pipeline
                  built with custom tokenizer and label mappings.
                </p>
              </div>
              <div className="bento-bg-glow" />
            </div>
            {/* Card 2 */}
            <div className="bento-card pop-out-card">
              <div className="bento-icon-wrap">
                <span className="material-symbols-outlined">segment</span>
              </div>
              <h3 className="bento-card-title">Context-Aware Tokenization</h3>
              <p className="bento-card-desc">
                Using a dedicated tokenizer configuration, the model processes text at a subword
                level, allowing it to capture contextual nuances, phrasing patterns, and subtle
                stylistic differences.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bento-card pop-out-card">
              <div className="bento-icon-wrap">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <h3 className="bento-card-title">Confidence Scoring</h3>
              <p className="bento-card-desc">
                Instead of simple classification, the model outputs probability scores for both AI
                and human labels, enabling more transparent and interpretable results.
              </p>
            </div>
            {/* Card 4 — spans 2 cols */}
            <div className="bento-card bento-wide pop-out-card">
              <div className="bento-card-inner">
                <div className="bento-icon-wrap">
                  <span className="material-symbols-outlined">memory</span>
                </div>
                <h3 className="bento-card-title">Self-Hosted Inference</h3>
                <p className="bento-card-desc">
                  The entire model pipeline runs locally using optimized model weights, ensuring
                  faster response times, full control over data, and no dependency on external APIs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-eyebrow dark">The Process</span>
            <h2 className="section-title dark">From paste to result in seconds.</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card pop-out-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Input Processing</h3>
              <p className="step-desc">
                User input is cleaned and tokenized using a pre-configured tokenizer, converting raw
                text into numerical representations suitable for model inference.
              </p>
            </div>
            <div className="step-card pop-out-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Transformer-Based Analysis</h3>
              <p className="step-desc">
                The tokenized input is passed through a fine-tuned transformer model, which analyzes
                contextual relationships and linguistic patterns to classify the text.
              </p>
            </div>
            <div className="step-card pop-out-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Probability &amp; Verdict</h3>
              <p className="step-desc">
                The model produces probability scores mapped through a custom label configuration,
                generating a final verdict along with confidence levels for AI vs human classification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-brand">Verity AI</div>
              <p className="footer-brand-desc">
                The world's most trusted AI detection and content verification platform.
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
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <ul className="footer-list">
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Social</h4>
              <ul className="footer-list">
                <li><a href="#">Twitter</a></li>
                <li><a href="#">GitHub</a></li>
                <li><a href="#">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Verity AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;

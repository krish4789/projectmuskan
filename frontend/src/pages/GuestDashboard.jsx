import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { guestUploadResume } from '../services/api';
import './GuestDashboard.css';

const GUEST_LIMIT = 2;

function ScoreArc({ score = 78, size = 130 }) {
  const r = 46, cx = size / 2, cy = size / 2 + 8;
  const toXY = (a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const filled = Math.PI * (score / 100);
  const start = toXY(Math.PI);
  const end   = toXY(Math.PI + filled);
  return (
    <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d={`M ${toXY(Math.PI).x} ${toXY(Math.PI).y} A ${r} ${r} 0 1 1 ${toXY(2*Math.PI).x} ${toXY(2*Math.PI).y}`}
        fill="none" stroke="#e8f5f0" strokeWidth="9" strokeLinecap="round" />
      <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
        fill="none" stroke="url(#arcGrad)" strokeWidth="9" strokeLinecap="round" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="20" fontWeight="800" fill="#111827" fontFamily="Inter,sans-serif">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="Inter,sans-serif">/100</text>
    </svg>
  );
}

function PreviewCard() {
  const cats = [
    { label: 'Tone & Style', score: 82, status: 'strong' },
    { label: 'Content',      score: 90, status: 'strong' },
    { label: 'Structure',    score: 64, status: 'good'   },
    { label: 'Skills',       score: 48, status: 'weak'   },
  ];
  const statusMap = {
    strong: { text: 'Strong',     color: '#059669', bg: '#d1fae5' },
    good:   { text: 'Good Start', color: '#d97706', bg: '#fef3c7' },
    weak:   { text: 'Needs Work', color: '#dc2626', bg: '#fee2e2' },
  };

  return (
    <motion.div className="pc-card"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}>

      {/* Card header */}
      <div className="pc-header">
        <span className="pc-logo">✦ Resumelyze</span>
        <span className="pc-live-badge">Live Preview</span>
      </div>

      {/* Score */}
      <div className="pc-score-wrap">
        <p className="pc-score-title">Resume Score</p>
        <ScoreArc score={78} />
        <p className="pc-issues">12 issues detected</p>
      </div>

      <div className="pc-divider" />

      {/* Categories */}
      <div className="pc-cats">
        {cats.map(c => {
          const s = statusMap[c.status];
          return (
            <div className="pc-cat-row" key={c.label}>
              <span className="pc-cat-label">{c.label}</span>
              <span className="pc-cat-badge" style={{ color: s.color, background: s.bg }}>{s.text}</span>
              <span className="pc-cat-score" style={{ color: s.color }}>{c.score}</span>
            </div>
          );
        })}
      </div>

      {/* ATS */}
      <div className="pc-ats">
        <div className="pc-ats-left">
          <div className="pc-ats-icon">✓</div>
          <div>
            <p className="pc-ats-label">ATS Compatible</p>
            <p className="pc-ats-sub">Passes 9 of 11 checks</p>
          </div>
        </div>
        <span className="pc-ats-score">81/100</span>
      </div>
    </motion.div>
  );
}

export default function GuestDashboard() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate  = useNavigate();
  const inputRef  = useRef();

  const uploadCount  = parseInt(localStorage.getItem('guestUploads') || '0', 10);
  const uploadsLeft  = GUEST_LIMIT - uploadCount;

  const handleUpload = async () => {
    if (!file) return setError('Please select a file');
    if (uploadsLeft <= 0) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await guestUploadResume(fd);
      localStorage.setItem('guestUploads', uploadCount + 1);
      navigate(`/guest/analysis/${res.data.resumeId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(''); }
  };

  return (
    <div className="gd-root">
      {/* Ambient blobs */}
      <div className="gd-blob gd-blob-tl" />
      <div className="gd-blob gd-blob-br" />

      {/* ── Navbar ── */}
      <nav className="gd-nav">
        <div className="gd-nav-logo">
          <span className="gd-logo-mark">✦</span>
          <span>Resumelyze</span>
        </div>
        <div className="gd-nav-actions">
          <Link to="/login"    className="gd-signin">Sign in</Link>
          <Link to="/register" className="gd-getstarted">Get Started →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="gd-hero">

        {/* Left */}
        <motion.div className="gd-left"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>

          <div className="gd-eyebrow-pill">
            <span className="gd-eyebrow-dot" />
            Resume Checker · Free &amp; Instant
          </div>

          <h1 className="gd-headline">
            Is your resume<br />
            <span className="gd-headline-accent">good enough?</span>
          </h1>

          <p className="gd-sub">
            Get AI-powered feedback on ATS compatibility, content quality,
            and structure — in under 30 seconds.
          </p>

          <div className="gd-trust-pills">
            {['✓ ATS Scoring', '✓ Section Analysis', '✓ Instant Feedback', '✓ 100% Private'].map(t => (
              <span key={t} className="gd-trust-pill">{t}</span>
            ))}
          </div>

          {uploadsLeft <= 0 ? (
            <div className="gd-limit-box">
              <p>You've used your 2 free uploads.</p>
              <p className="gd-limit-sub">Create a free account to continue with unlimited analyses.</p>
              <Link to="/register"><button className="gd-upload-btn">Create Free Account →</button></Link>
              <p className="gd-already">Have an account? <Link to="/login">Sign in</Link></p>
            </div>
          ) : (
            <div className="gd-upload-area">
              <motion.div
                className={`gd-dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !file && inputRef.current.click()}
                whileHover={!file ? { scale: 1.01 } : {}}
                transition={{ duration: 0.2 }}
              >
                <input ref={inputRef} type="file" accept=".pdf,.docx"
                  style={{ display: 'none' }}
                  onChange={e => { setFile(e.target.files[0]); setError(''); }} />

                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div key="file"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="gd-file-state">
                      <div className="gd-file-icon-wrap">📄</div>
                      <div>
                        <p className="gd-file-name">{file.name}</p>
                        <p className="gd-file-size">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button className="gd-remove-btn"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</button>
                    </motion.div>
                  ) : (
                    <motion.div key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="gd-empty-state">
                      <div className="gd-upload-icon">
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="gd-drop-main">Drop your resume here</p>
                      <p className="gd-drop-sub">or <span>click to browse</span> · PDF &amp; DOCX</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.p className="gd-error"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    ⚠ {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                className="gd-upload-btn"
                disabled={loading || !file}
                onClick={handleUpload}
                whileHover={file && !loading ? { scale: 1.02 } : {}}
                whileTap={file && !loading ? { scale: 0.98 } : {}}>
                {loading
                  ? <span className="gd-btn-inner"><span className="gd-spinner" /> Analyzing…</span>
                  : 'Analyze My Resume →'}
              </motion.button>

              <div className="gd-footer-row">
                <span className="gd-privacy">🔒 Private &amp; secure</span>
                {uploadsLeft < GUEST_LIMIT && (
                  <span className="gd-uploads-left">{uploadsLeft} free upload{uploadsLeft !== 1 ? 's' : ''} left</span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right */}
        <div className="gd-right">
          <PreviewCard />
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadResume, getUserResumes, checkCompatibility } from '../services/api';
import './Dashboard.css';

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

function ScoreBadge({ score }) {
  const color = score >= 75 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const bg   = score >= 75 ? '#dcfce7' : score >= 60 ? '#fef3c7' : '#fee2e2';
  return <span className="db-score-pill" style={{ color, background: bg }}>{score}/100</span>;
}

function StatCard({ icon, label, value }) {
  return (
    <motion.div className="db-stat-card" variants={fadeUp}>
      <div className="db-stat-icon">{icon}</div>
      <div>
        <p className="db-stat-value">{value}</p>
        <p className="db-stat-label">{label}</p>
      </div>
    </motion.div>
  );
}

function DropZone({ file, onFile, onClear, dragging, onDragOver, onDragLeave, onDrop, inputRef, icon, mainText }) {
  return (
    <div
      className={`db-dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !file && inputRef.current.click()}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }}
        onChange={e => onFile(e.target.files[0])} />
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="db-file-preview">
            <div className="db-file-icon">{icon}</div>
            <p className="db-file-name">{file.name}</p>
            <p className="db-file-size">{(file.size / 1024).toFixed(0)} KB</p>
            <button className="db-clear-btn" onClick={(e) => { e.stopPropagation(); onClear(); }}>Remove</button>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="db-drop-content">
            <div className="db-drop-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="db-drop-main">{mainText}</p>
            <p className="db-drop-sub">or <span>click to browse</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [history, setHistory]   = useState([]);
  const [activeTab, setActiveTab]       = useState('resume');
  const [jdFile, setJdFile]             = useState(null);
  const [jdResumeFile, setJdResumeFile] = useState(null);
  const [jdDragging, setJdDragging]     = useState(null);
  const [jdLoading, setJdLoading]       = useState(false);
  const [jdError, setJdError]           = useState('');
  const [jdResult, setJdResult]         = useState(null);

  const navigate = useNavigate();
  const inputRef = useRef();
  const jdRef    = useRef();
  const jdResRef = useRef();
  const name     = localStorage.getItem('name') || 'there';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    getUserResumes().then(res => setHistory(res.data)).catch(() => {});
  }, []);

  const handleUpload = async () => {
    if (!file) return setError('Please select a file');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await uploadResume(fd);
      navigate(`/analysis/${res.data.resumeId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setLoading(false);
    }
  };

  const handleCompatibilityCheck = async () => {
    if (!jdFile || !jdResumeFile) return setJdError('Please upload both JD and resume files');
    setJdLoading(true); setJdError(''); setJdResult(null);
    try {
      const fd = new FormData();
      fd.append('jd', jdFile);
      fd.append('resume', jdResumeFile);
      const res = await checkCompatibility(fd);
      setJdResult(res.data);
    } catch (err) {
      setJdError(err.response?.data?.message || 'Compatibility check failed');
    } finally {
      setJdLoading(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const avgScore = history.length
    ? Math.round(history.reduce((s, r) => s + r.score, 0) / history.length)
    : null;

  const verdictColor = (v) => v === 'strong fit' ? '#16a34a' : v === 'moderate fit' ? '#d97706' : '#dc2626';
  const verdictBg    = (v) => v === 'strong fit' ? '#dcfce7' : v === 'moderate fit' ? '#fef3c7' : '#fee2e2';

  return (
    <div className="db-root">
      <div className="db-blob db-blob-1" />
      <div className="db-blob db-blob-2" />

      <nav className="db-nav">
        <Link to="/" className="db-nav-logo">
          <span className="db-logo-mark">✦</span> Resumelyze
        </Link>
        <div className="db-nav-right">
          <div className="db-avatar">{initials}</div>
          <span className="db-nav-greeting">Hello, {name}</span>
          <button className="db-logout-btn" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="db-body">

        {/* Tab Switcher */}
        <div className="db-tab-switcher">
          <button className={`db-tab-btn ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => setActiveTab('resume')}>
            📄 Resume Analyzer
          </button>
          <button className={`db-tab-btn ${activeTab === 'jd' ? 'active' : ''}`} onClick={() => setActiveTab('jd')}>
            🎯 JD Compatibility
          </button>
        </div>

        {/* ── Resume Analyzer Tab ── */}
        {activeTab === 'resume' && (
          <>
            <motion.div className="db-hero" initial="hidden" animate="show" variants={stagger}>
              <motion.div className="db-hero-left" variants={fadeUp}>
                <div className="db-eyebrow-pill">
                  <span className="db-eyebrow-dot" /> AI-Powered Resume Analysis
                </div>
                <h1 className="db-headline">
                  Analyze Your Resume<br />
                  <span className="db-headline-green">with AI</span>
                </h1>
                <p className="db-sub">
                  Get instant ATS scoring, section-by-section feedback, and
                  actionable suggestions to land more interviews.
                </p>
                <div className="db-feature-pills">
                  {['✓ ATS Friendly', '✓ AI Suggestions', '✓ Instant Feedback', '✓ Privacy Guaranteed'].map(f => (
                    <span key={f} className="db-feature-pill">{f}</span>
                  ))}
                </div>
                {history.length > 0 && (
                  <motion.div className="db-stats" variants={stagger}>
                    <StatCard icon="📄" label="Resumes Analyzed" value={history.length} />
                    <StatCard icon="⭐" label="Avg ATS Score" value={`${avgScore}/100`} />
                    <StatCard icon="🏆" label="High Scorers" value={history.filter(r => r.score >= 75).length} />
                  </motion.div>
                )}
              </motion.div>

              <motion.div className="db-upload-card" variants={fadeUp}>
                <div className="db-upload-card-header">
                  <p className="db-upload-card-title">Upload Resume</p>
                  <p className="db-upload-card-sub">PDF or DOCX · Max 10MB</p>
                </div>
                <DropZone
                  file={file}
                  onFile={(f) => { setFile(f); setError(''); }}
                  onClear={() => setFile(null)}
                  dragging={dragging}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setError(''); } }}
                  inputRef={inputRef}
                  icon="📄"
                  mainText="Drop your resume here"
                />
                <AnimatePresence>
                  {error && (
                    <motion.p className="db-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      ⚠ {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.button
                  className="db-upload-btn"
                  disabled={loading || !file}
                  onClick={handleUpload}
                  whileHover={!loading && file ? { scale: 1.02 } : {}}
                  whileTap={!loading && file ? { scale: 0.98 } : {}}
                >
                  {loading ? <span className="db-btn-loading"><span className="db-spinner" /> Analyzing…</span> : 'Analyze Resume →'}
                </motion.button>
                <p className="db-privacy-note">🔒 Your data is private and never shared</p>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {history.length > 0 && (
                <motion.section className="db-history-section"
                  initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                  <div className="db-section-header">
                    <h2 className="db-section-title">Previous Analyses</h2>
                    <span className="db-section-count">{history.length} report{history.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="db-history-grid">
                    {history.map((r, i) => (
                      <motion.div key={r._id} className="db-history-card"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                        <div className="db-hc-top">
                          <div className="db-hc-file-icon">📄</div>
                          <ScoreBadge score={r.score} />
                        </div>
                        <p className="db-hc-name">{r.fileName}</p>
                        <p className="db-hc-date">{new Date(r.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <Link to={`/analysis/${r._id}`} className="db-hc-btn">View Report →</Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── JD Compatibility Tab ── */}
        {activeTab === 'jd' && (
          <motion.div className="db-jd-section"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

            <div className="db-jd-header">
              <h2 className="db-section-title">JD Compatibility Checker</h2>
              <p className="db-jd-desc">Upload a job description and your resume to see how well they match.</p>
            </div>

            <div className="db-jd-uploads">
              <div className="db-jd-upload-block">
                <p className="db-jd-upload-label">📋 Job Description <span>(only JD — no resumes)</span></p>
                <DropZone
                  file={jdFile}
                  onFile={(f) => { setJdFile(f); setJdError(''); }}
                  onClear={() => setJdFile(null)}
                  dragging={jdDragging === 'jd'}
                  onDragOver={(e) => { e.preventDefault(); setJdDragging('jd'); }}
                  onDragLeave={() => setJdDragging(null)}
                  onDrop={(e) => { e.preventDefault(); setJdDragging(null); const f = e.dataTransfer.files[0]; if (f) { setJdFile(f); setJdError(''); } }}
                  inputRef={jdRef}
                  icon="📋"
                  mainText="Drop job description here"
                />
              </div>

              <div className="db-jd-upload-block">
                <p className="db-jd-upload-label">📄 Your Resume <span>(only resume — no JDs)</span></p>
                <DropZone
                  file={jdResumeFile}
                  onFile={(f) => { setJdResumeFile(f); setJdError(''); }}
                  onClear={() => setJdResumeFile(null)}
                  dragging={jdDragging === 'resume'}
                  onDragOver={(e) => { e.preventDefault(); setJdDragging('resume'); }}
                  onDragLeave={() => setJdDragging(null)}
                  onDrop={(e) => { e.preventDefault(); setJdDragging(null); const f = e.dataTransfer.files[0]; if (f) { setJdResumeFile(f); setJdError(''); } }}
                  inputRef={jdResRef}
                  icon="📄"
                  mainText="Drop your resume here"
                />
              </div>
            </div>

            <AnimatePresence>
              {jdError && (
                <motion.p className="db-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  ⚠ {jdError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              className="db-upload-btn db-jd-check-btn"
              disabled={jdLoading || !jdFile || !jdResumeFile}
              onClick={handleCompatibilityCheck}
              whileHover={!jdLoading && jdFile && jdResumeFile ? { scale: 1.02 } : {}}
              whileTap={!jdLoading && jdFile && jdResumeFile ? { scale: 0.98 } : {}}
            >
              {jdLoading
                ? <span className="db-btn-loading"><span className="db-spinner" /> Checking Compatibility…</span>
                : 'Check Compatibility →'}
            </motion.button>

            <AnimatePresence>
              {jdResult && (
                <motion.div className="db-jd-result"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                  <div className="db-jd-result-top">
                    <div className="db-jd-score-circle" style={{ borderColor: verdictColor(jdResult.verdict) }}>
                      <span className="db-jd-score-num" style={{ color: verdictColor(jdResult.verdict) }}>{jdResult.compatibilityScore}</span>
                      <span className="db-jd-score-sub">/100</span>
                    </div>
                    <div>
                      <span className="db-jd-verdict" style={{ color: verdictColor(jdResult.verdict), background: verdictBg(jdResult.verdict) }}>
                        {jdResult.verdict?.charAt(0).toUpperCase() + jdResult.verdict?.slice(1)}
                      </span>
                      <p className="db-jd-summary">{jdResult.summary}</p>
                    </div>
                  </div>

                  <div className="db-jd-result-grid">
                    {(jdResult.matchedKeywords || []).length > 0 && (
                      <div className="db-jd-result-block">
                        <p className="db-jd-block-title">✅ Matched Keywords</p>
                        <div className="db-jd-tags">
                          {jdResult.matchedKeywords.map((k, i) => <span key={i} className="db-jd-tag matched">{k}</span>)}
                        </div>
                      </div>
                    )}
                    {(jdResult.missingKeywords || []).length > 0 && (
                      <div className="db-jd-result-block">
                        <p className="db-jd-block-title">❌ Missing Keywords</p>
                        <div className="db-jd-tags">
                          {jdResult.missingKeywords.map((k, i) => <span key={i} className="db-jd-tag missing">{k}</span>)}
                        </div>
                      </div>
                    )}
                    {(jdResult.matchedRequirements || []).length > 0 && (
                      <div className="db-jd-result-block">
                        <p className="db-jd-block-title">✅ Requirements Met</p>
                        {jdResult.matchedRequirements.map((r, i) => <p key={i} className="db-jd-req met">✓ {r}</p>)}
                      </div>
                    )}
                    {(jdResult.missingRequirements || []).length > 0 && (
                      <div className="db-jd-result-block">
                        <p className="db-jd-block-title">⚠ Requirements Missing</p>
                        {jdResult.missingRequirements.map((r, i) => <p key={i} className="db-jd-req missing">✗ {r}</p>)}
                      </div>
                    )}
                  </div>

                  {(jdResult.suggestions || []).length > 0 && (
                    <div className="db-jd-suggestions">
                      <p className="db-jd-block-title">💡 Suggestions to Improve Match</p>
                      {jdResult.suggestions.map((s, i) => (
                        <div key={i} className="db-jd-suggestion-item">
                          <span className="db-jd-suggestion-num">{i + 1}</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(jdResult.recommendedCertifications || []).length > 0 && (
                    <div className="db-cert-section">
                      <div className="db-cert-header">
                        <span className="db-cert-header-icon">🎓</span>
                        <div>
                          <p className="db-cert-title">Recommended Certifications</p>
                          <p className="db-cert-subtitle">Earn these to close your skill gaps and boost your chances at this company</p>
                        </div>
                      </div>
                      <div className="db-cert-grid">
                        {jdResult.recommendedCertifications.map((cert, i) => (
                          <div key={i} className="db-cert-card">
                            <div className="db-cert-card-top">
                              <div className="db-cert-icon">📜</div>
                              <span className="db-cert-provider">{cert.provider}</span>
                            </div>
                            <p className="db-cert-name">{cert.name}</p>
                            <span className="db-cert-skill-tag">{cert.skill}</span>
                            <div className="db-cert-links">
                              {cert.freeUrl && (
                                <a href={cert.freeUrl} target="_blank" rel="noopener noreferrer" className="db-cert-link free">
                                  🆓 Free
                                </a>
                              )}
                              {cert.paidUrl && (
                                <a href={cert.paidUrl} target="_blank" rel="noopener noreferrer" className="db-cert-link paid">
                                  💳 Paid
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
}

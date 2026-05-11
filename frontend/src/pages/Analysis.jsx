import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getResume, getGuestResume } from '../services/api';
import './Analysis.css';

const CATEGORY_LABELS = { toneAndStyle: 'Tone & Style', content: 'Content', structure: 'Structure', skills: 'Skills' };
const TABS = ['AI Suggestions', 'ATS Analysis', 'Skills', 'Strengths & Weaknesses', 'Grammar & Writing', 'Job Match', 'Projects', 'Rewrite'];

function getLabel(score) {
  if (score >= 75) return { text: 'Strong', color: '#38a169', bg: '#f0fff4' };
  if (score >= 60) return { text: 'Good Start', color: '#d97706', bg: '#fffbeb' };
  return { text: 'Needs Work', color: '#e53e3e', bg: '#fff5f5' };
}

function getProbColor(p) {
  if (p === 'high') return { color: '#38a169', bg: '#f0fff4', label: '✓ High chance of passing ATS' };
  if (p === 'moderate') return { color: '#d97706', bg: '#fffbeb', label: '~ Moderate chance of passing ATS' };
  return { color: '#e53e3e', bg: '#fff5f5', label: '✗ Low chance of passing ATS' };
}

function getCatColor(level) {
  const map = { strong: '#38a169', moderate: '#d97706', weak: '#e53e3e', missing: '#a0aec0' };
  return map[level] || '#a0aec0';
}

function MiniBar({ value, color }) {
  return (
    <div className="mini-bar-track">
      <div className="mini-bar-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function GaugeMeter({ score }) {
  const r = 70, cx = 90, cy = 90;
  const filled = Math.PI * (score / 100);
  const toXY = (a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const start = toXY(Math.PI);
  const end = toXY(Math.PI + filled);
  const largeArc = filled > Math.PI ? 1 : 0;
  const color = score >= 75 ? '#38a169' : score >= 60 ? '#d97706' : '#e53e3e';
  return (
    <svg width="180" height="115" viewBox="0 0 180 115">
      <path d={`M ${toXY(Math.PI).x} ${toXY(Math.PI).y} A ${r} ${r} 0 1 1 ${toXY(2 * Math.PI).x} ${toXY(2 * Math.PI).y}`}
        fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
      {score > 0 && (
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1a202c">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#718096">/100</text>
    </svg>
  );
}

function SubScoreCard({ label, value }) {
  const { color } = getLabel(value);
  return (
    <div className="sub-score-card">
      <div className="sub-score-val" style={{ color }}>{value}%</div>
      <MiniBar value={value} color={color} />
      <div className="sub-score-label">{label}</div>
    </div>
  );
}

function CategoryRow({ catKey, cat, expanded, onToggle }) {
  const label = getLabel(cat.score);
  return (
    <div className="cat-row">
      <div className="cat-header" onClick={() => onToggle(catKey)}>
        <span className="cat-title">{CATEGORY_LABELS[catKey]}</span>
        <div className="cat-right">
          <span className="cat-badge" style={{ color: label.color, background: label.bg }}>{label.text}</span>
          <span className="cat-score" style={{ color: label.color }}>{cat.score}/100</span>
          <span className="cat-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div className="cat-body">
          <div className="cat-items-grid">
            {cat.items.map((item, i) => (
              <div key={i} className={`cat-chip ${item.status}`}>
                <span className="chip-icon">{item.status === 'good' ? '✓' : '!'}</span>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
          {cat.items.map((item, i) => (
            <div key={i} className={`cat-detail ${item.status}`}>
              <div className="detail-title">
                <span>{item.status === 'good' ? '✓' : '!'}</span>
                <strong>{item.title}</strong>
              </div>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabAISuggestions({ data }) {
  return (
    <div className="tab-section">
      <div className="tab-section-title">AI Recommendations</div>
      <div className="suggestions-list">
        {(data.suggestions || []).map((s, i) => (
          <div key={i} className="suggestion-item">
            <span className="suggestion-num">{i + 1}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
      {data.feedback && (
        <div className="feedback-box">
          <div className="feedback-label">Overall Feedback</div>
          <p>{data.feedback}</p>
        </div>
      )}
    </div>
  );
}

function TabATS({ data }) {
  const prob = getProbColor(data.atsProbability);
  const allSections = ['education', 'experience', 'skills', 'projects', 'certifications', 'summary', 'contact'];
  return (
    <div className="tab-section">
      <div className="tab-section-title">ATS Analysis</div>
      <div className="ats-prob-badge" style={{ color: prob.color, background: prob.bg }}>{prob.label}</div>

      <div className="ats-grid">
        <div className="ats-block">
          <div className="ats-block-title">Keyword Match</div>
          <div className="ats-big-num" style={{ color: getLabel(data.keywordMatchPercent || 0).color }}>
            {data.keywordMatchPercent || 0}%
          </div>
          <MiniBar value={data.keywordMatchPercent || 0} color={getLabel(data.keywordMatchPercent || 0).color} />
        </div>
        <div className="ats-block">
          <div className="ats-block-title">ATS Score</div>
          <div className="ats-big-num" style={{ color: getLabel(data.atsScore || 0).color }}>
            {data.atsScore || 0}/100
          </div>
          <MiniBar value={data.atsScore || 0} color={getLabel(data.atsScore || 0).color} />
        </div>
      </div>

      {(data.missingKeywords || []).length > 0 && (
        <div className="ats-missing-block">
          <div className="ats-block-title">Missing Keywords</div>
          <div className="keyword-tags">
            {data.missingKeywords.map((k, i) => <span key={i} className="keyword-tag missing">{k}</span>)}
          </div>
        </div>
      )}

      <div className="ats-block-title" style={{ marginTop: '1rem' }}>Section Detection</div>
      <div className="section-detection-grid">
        {allSections.map(s => {
          const found = (data.detectedSections || []).includes(s);
          return (
            <div key={s} className={`section-detect-chip ${found ? 'found' : 'missing'}`}>
              {found ? '✓' : '⚠'} {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          );
        })}
      </div>

      {data.atsFeedback && <div className="feedback-box" style={{ marginTop: '1rem' }}><p>{data.atsFeedback}</p></div>}
    </div>
  );
}

function TabSkills({ data }) {
  const catLevels = data.skillCategories || {};
  return (
    <div className="tab-section">
      <div className="tab-section-title">Skills Intelligence</div>

      {(data.skillsFound || []).length > 0 && (
        <div className="skills-block">
          <div className="skills-block-label">✓ Technical Skills Found</div>
          <div className="keyword-tags">
            {data.skillsFound.map((s, i) => <span key={i} className="keyword-tag found">{s}</span>)}
          </div>
        </div>
      )}

      {(data.missingSkills || []).length > 0 && (
        <div className="skills-block">
          <div className="skills-block-label">⚠ Missing Industry Skills</div>
          <div className="keyword-tags">
            {data.missingSkills.map((s, i) => <span key={i} className="keyword-tag missing">{s}</span>)}
          </div>
        </div>
      )}

      <div className="skills-block">
        <div className="skills-block-label">Skill Category Breakdown</div>
        <div className="skill-cat-grid">
          {Object.entries(catLevels).map(([cat, level]) => (
            <div key={cat} className="skill-cat-row">
              <span className="skill-cat-name">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              <span className="skill-cat-badge" style={{ color: getCatColor(level), background: getCatColor(level) + '18' }}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabStrengths({ data }) {
  return (
    <div className="tab-section">
      <div className="tab-section-title">Strengths & Weaknesses</div>
      <div className="sw-grid">
        <div className="sw-col">
          <div className="sw-col-title strengths-title">✅ Strengths</div>
          {(data.strengths || []).map((s, i) => (
            <div key={i} className="sw-item strength">{s}</div>
          ))}
        </div>
        <div className="sw-col">
          <div className="sw-col-title weaknesses-title">⚠ Weaknesses</div>
          {(data.weaknesses || []).map((w, i) => (
            <div key={i} className="sw-item weakness">{w}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabGrammar({ data }) {
  return (
    <div className="tab-section">
      <div className="tab-section-title">Grammar & Writing Analysis</div>
      <div className="grammar-grid">
        <div className="grammar-stat">
          <div className="grammar-stat-val" style={{ color: getLabel(data.grammarScore || 0).color }}>{data.grammarScore || 0}</div>
          <div className="grammar-stat-label">Grammar Score</div>
        </div>
        <div className="grammar-stat">
          <div className="grammar-stat-val" style={{ color: getLabel(data.readabilityScore || 0).color }}>{data.readabilityScore || 0}</div>
          <div className="grammar-stat-label">Readability Score</div>
        </div>
        <div className="grammar-stat">
          <div className="grammar-stat-val" style={{ color: (data.grammarIssues || 0) > 3 ? '#e53e3e' : '#38a169' }}>{data.grammarIssues || 0}</div>
          <div className="grammar-stat-label">Grammar Issues</div>
        </div>
        <div className="grammar-stat">
          <div className="grammar-stat-val" style={{ color: (data.passiveVoiceCount || 0) > 3 ? '#d97706' : '#38a169' }}>{data.passiveVoiceCount || 0}</div>
          <div className="grammar-stat-label">Passive Voice</div>
        </div>
      </div>

      {(data.overusedWords || []).length > 0 && (
        <div className="grammar-overused">
          <div className="grammar-overused-label">Overused Words — replace with stronger verbs:</div>
          <div className="keyword-tags">
            {data.overusedWords.map((w, i) => <span key={i} className="keyword-tag warning">{w}</span>)}
          </div>
        </div>
      )}

      <div className="recruiter-scan-box">
        <div className="recruiter-scan-title">👁 Recruiter View Simulation</div>
        <div className="recruiter-scan-row">
          <span>Estimated scan time:</span><strong>{data.recruiterScanTime || 'N/A'}</strong>
        </div>
        <div className="recruiter-scan-row">
          <span>Shortlist likelihood:</span>
          <strong style={{ color: getProbColor(data.shortlistLikelihood).color }}>
            {(data.shortlistLikelihood || 'N/A').charAt(0).toUpperCase() + (data.shortlistLikelihood || '').slice(1)}
          </strong>
        </div>
        {(data.recruiterNoticesFirst || []).length > 0 && (
          <div className="recruiter-scan-row">
            <span>Notices first:</span>
            <strong>{data.recruiterNoticesFirst.join(', ')}</strong>
          </div>
        )}
        <div className="recruiter-scan-row">
          <span>Avg sentence length:</span><strong>{data.avgSentenceLength || 'N/A'} words</strong>
        </div>
      </div>
    </div>
  );
}

function TabJobMatch({ data }) {
  const jrm = data.jobRoleMatch || {};
  return (
    <div className="tab-section">
      <div className="tab-section-title">Job Role Match Analysis</div>
      {jrm.detectedRole && (
        <div className="job-match-card">
          <div className="job-match-role">{jrm.detectedRole}</div>
          <div className="job-match-pct" style={{ color: getLabel(jrm.matchPercent || 0).color }}>
            {jrm.matchPercent || 0}% Match
          </div>
          <MiniBar value={jrm.matchPercent || 0} color={getLabel(jrm.matchPercent || 0).color} />
          {(jrm.missingForRole || []).length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div className="ats-block-title">Missing for this role:</div>
              <div className="keyword-tags" style={{ marginTop: '0.5rem' }}>
                {jrm.missingForRole.map((k, i) => <span key={i} className="keyword-tag missing">{k}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabProjects({ data }) {
  const projects = data.projectAnalysis || [];
  if (!projects.length) return <div className="tab-section"><p className="empty-tab">No projects detected in resume.</p></div>;
  return (
    <div className="tab-section">
      <div className="tab-section-title">Project Quality Analysis</div>
      {projects.map((p, i) => (
        <div key={i} className="project-card">
          <div className="project-header">
            <span className="project-name">{p.name}</span>
            <span className="project-score" style={{ color: p.score >= 7 ? '#38a169' : p.score >= 5 ? '#d97706' : '#e53e3e' }}>
              {p.score}/10
            </span>
          </div>
          {(p.strengths || []).length > 0 && (
            <div className="project-section">
              <div className="project-section-label">Strengths</div>
              {p.strengths.map((s, j) => <div key={j} className="project-point strength">✓ {s}</div>)}
            </div>
          )}
          {(p.improvements || []).length > 0 && (
            <div className="project-section">
              <div className="project-section-label">Improvements</div>
              {p.improvements.map((s, j) => <div key={j} className="project-point improvement">→ {s}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TabRewrite({ data }) {
  const rewrites = data.rewriteSuggestions || [];
  if (!rewrites.length) return <div className="tab-section"><p className="empty-tab">No rewrite suggestions available.</p></div>;
  return (
    <div className="tab-section">
      <div className="tab-section-title">AI Resume Rewrite Suggestions</div>
      {rewrites.map((r, i) => (
        <div key={i} className="rewrite-card">
          <div className="rewrite-block original">
            <div className="rewrite-label">❌ Original</div>
            <p>"{r.original}"</p>
          </div>
          <div className="rewrite-arrow">↓</div>
          <div className="rewrite-block improved">
            <div className="rewrite-label">✅ Improved</div>
            <p>"{r.improved}"</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const isGuest = window.location.pathname.startsWith('/guest/');

  useEffect(() => {
    const fetchFn = isGuest ? getGuestResume : getResume;
    fetchFn(id).then(res => setData(res.data)).catch(() => setError('Could not load analysis'));
  }, [id]);

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  if (error) return (
    <div className="ar-root">
      <nav className="ar-nav"><Link to="/" className="ar-nav-logo">✦ Resumelyze</Link></nav>
      <div className="ar-error-state"><p>{error}</p></div>
    </div>
  );

  if (!data) return (
    <div className="ar-root">
      <nav className="ar-nav"><Link to="/" className="ar-nav-logo">✦ Resumelyze</Link></nav>
      <div className="ar-loading"><div className="ar-spinner" /><p>Analyzing your resume...</p></div>
    </div>
  );

  const cats = data.categories || {};

  const tabContent = [
    <TabAISuggestions data={data} />,
    <TabATS data={data} />,
    <TabSkills data={data} />,
    <TabStrengths data={data} />,
    <TabGrammar data={data} />,
    <TabJobMatch data={data} />,
    <TabProjects data={data} />,
    <TabRewrite data={data} />,
  ];

  return (
    <div className="ar-root">
      <nav className="ar-nav">
        <Link to="/" className="ar-nav-logo">✦ Resumelyze</Link>
        <button className="ar-back-btn" onClick={() => navigate(isGuest ? '/' : '/dashboard')}>
          ← Back to Dashboard
        </button>
      </nav>

      <div className="ar-body">
        <div className="ar-layout">
          {/* Left: Resume Preview */}
          <div className="ar-preview">
            <div className="ar-preview-label">Resume Preview</div>
            <div className="ar-resume-card">
              <div className="ar-resume-text">{data.parsedText}</div>
            </div>
          </div>

          {/* Right: Analysis */}
          <div className="ar-scores">
            {/* Score Card */}
            <div className="ar-score-card">
              <GaugeMeter score={data.score} />
              <div className="ar-score-info">
                <h2>Resume Score</h2>
                <p>AI-powered analysis across ATS, skills, readability & content.</p>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="sub-scores-grid">
              <SubScoreCard label="ATS Compatibility" value={data.atsCompatibility || data.atsScore || 0} />
              <SubScoreCard label="Recruiter Readability" value={data.recruiterReadability || 0} />
              <SubScoreCard label="Technical Depth" value={data.technicalDepth || 0} />
              <SubScoreCard label="Formatting Quality" value={data.formattingQuality || 0} />
            </div>

            {/* Category Summary */}
            <div className="ar-score-rows">
              {Object.entries(cats).map(([key, cat]) => {
                const label = getLabel(cat.score);
                return (
                  <div key={key} className="ar-score-row">
                    <span className="ar-sr-label">{CATEGORY_LABELS[key]}</span>
                    <span className="ar-sr-badge" style={{ color: label.color, background: label.bg }}>{label.text}</span>
                    <span className="ar-sr-score" style={{ color: label.color }}>{cat.score}/100</span>
                  </div>
                );
              })}
            </div>

            {/* Expandable Categories */}
            <div className="ar-cat-sections">
              {Object.entries(cats).map(([key, cat]) => (
                <CategoryRow key={key} catKey={key} cat={cat} expanded={!!expanded[key]} onToggle={toggle} />
              ))}
            </div>

            {/* Advanced Tabs */}
            <div className="adv-tabs-container">
              <div className="adv-tabs-bar">
                {TABS.map((t, i) => (
                  <button key={i} className={`adv-tab-btn ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="adv-tab-content">
                {tabContent[activeTab]}
              </div>
            </div>

            {isGuest && (
              <div className="ar-guest-cta">
                <p>Want to save your results and track progress?</p>
                <Link to="/register" className="ar-cta-btn">Create Free Account</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResume } from '../services/api';
import './Analysis.css';

const CATEGORY_LABELS = {
  toneAndStyle: 'Tone & Style',
  content: 'Content',
  structure: 'Structure',
  skills: 'Skills',
};

function getLabel(score) {
  if (score >= 75) return { text: 'Strong', color: '#38a169', bg: '#f0fff4' };
  if (score >= 60) return { text: 'Good Start', color: '#d97706', bg: '#fffbeb' };
  return { text: 'Needs Work', color: '#e53e3e', bg: '#fff5f5' };
}

function GaugeMeter({ score }) {
  const r = 70;
  const cx = 90, cy = 90;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const totalArc = endAngle - startAngle;
  const filled = totalArc * (score / 100);

  const toXY = (angle) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const start = toXY(startAngle);
  const end = toXY(startAngle + filled);
  const largeArc = filled > Math.PI ? 1 : 0;

  const bgEnd = toXY(endAngle);

  return (
    <svg width="180" height="115" viewBox="0 0 180 115">
      <path
        d={`M ${toXY(startAngle).x} ${toXY(startAngle).y} A ${r} ${r} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round"
      />
      {score > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />
      )}
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1a202c">
        {score}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#718096">/100</text>
    </svg>
  );
}

function CategoryRow({ catKey, cat, expanded, onToggle }) {
  const label = getLabel(cat.score);
  const icon = cat.score >= 75 ? '' : cat.score >= 60 ? '' : '';
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
                <span className="chip-icon">{item.status === 'good' ? '' : ''}</span>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
          {cat.items.map((item, i) => (
            <div key={i} className={`cat-detail ${item.status}`}>
              <div className="detail-title">
                <span>{item.status === 'good' ? '' : ''}</span>
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

export default function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getResume(id)
      .then(res => setData(res.data))
      .catch(() => setError('Could not load analysis'));
  }, [id]);

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  if (error) return <div className="ar-page"><p className="error">{error}</p></div>;
  if (!data) return <div className="ar-page"><p>Loading...</p></div>;

  const cats = data.categories || {};
  const atsLabel = getLabel(data.atsScore || 0);

  return (
    <div className="ar-page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
      <h1 className="ar-title">Resume Review</h1>

      <div className="ar-layout">
        {/* Left: Resume Preview */}
        <div className="ar-preview">
          <div className="resume-card">
            <div className="resume-text">{data.parsedText}</div>
          </div>
        </div>

        {/* Right: Scores */}
        <div className="ar-scores">
          {/* Overall Score Card */}
          <div className="score-card">
            <div className="score-gauge">
              <GaugeMeter score={data.score} />
            </div>
            <div className="score-info">
              <h2>Your Resume Score</h2>
              <p>This score is calculated based on the variables listed below.</p>
            </div>
          </div>

          {/* Category Rows */}
          <div className="score-rows">
            {Object.entries(cats).map(([key, cat]) => {
              const label = getLabel(cat.score);
              return (
                <div key={key} className="score-row">
                  <span className="sr-label">{CATEGORY_LABELS[key]}</span>
                  <span className="sr-badge" style={{ color: label.color, background: label.bg }}>{label.text}</span>
                  <span className="sr-score" style={{ color: label.color }}>{cat.score}/100</span>
                </div>
              );
            })}
          </div>

          {/* ATS Score */}
          {data.atsScore && (
            <div className="ats-card">
              <div className="ats-header">
                <span className="ats-icon"> </span>
                <strong>ATS Score – {data.atsScore}/100</strong>
              </div>
              <p>{data.atsFeedback}</p>
            </div>
          )}

          {/* Category Expandable Sections */}
          <div className="cat-sections">
            {Object.entries(cats).map(([key, cat]) => (
              <CategoryRow
                key={key}
                catKey={key}
                cat={cat}
                expanded={!!expanded[key]}
                onToggle={toggle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

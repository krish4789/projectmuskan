import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { uploadResume, getUserResumes } from '../services/api';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const name = localStorage.getItem('name');

  useEffect(() => {
    getUserResumes().then(res => setHistory(res.data)).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file');
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await uploadResume(formData);
      navigate(`/analysis/${res.data.resumeId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <span>👋 Hello, {name}</span>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="upload-card">
        <h1>Upload Resume</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleUpload}>
          <input
            className="file-input"
            type="file"
            accept=".pdf,.docx"
            onChange={e => setFile(e.target.files[0])}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="history">
          <h2>Previous Resumes</h2>
          {history.map(r => (
            <div className="history-item" key={r._id}>
              <span>{r.fileName}</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span className="badge">{r.score}/100</span>
                <Link to={`/analysis/${r._id}`}>View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

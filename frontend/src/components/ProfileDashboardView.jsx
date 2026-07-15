import React, { useState, useEffect } from 'react';
import { Calendar, Award, CheckCircle2, AlertCircle, Eye, Download, User, Mail, Award as Trophy, BookOpen, Clock, Activity } from 'lucide-react';
import { getTopicIcon } from '../utils';

const BACKEND_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function ProfileDashboardView({ user, token, onSelectRecord, onLogout }) {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessments();
  }, [token]);

  const fetchAssessments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assessments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve assessment records.');
      }
      const data = await res.json();
      setAssessments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Stats calculations
  const totalCompleted = assessments.length;
  const avgScore = totalCompleted > 0 
    ? Math.round(assessments.reduce((sum, item) => sum + (item.scorecard?.overall_score || 0), 0) / totalCompleted) 
    : 0;
  const highScore = totalCompleted > 0 
    ? Math.max(...assessments.map(item => item.scorecard?.overall_score || 0)) 
    : 0;

  // Helper to choose score text color
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="container">
      {/* Profile Header section */}
      <div className="glass-card" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)'
          }}>
            <User size={24} style={{ color: 'white' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{user?.name || 'Academic Learner'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              <Mail size={12} />
              <span>{user?.email || 'learner@vbcua.edu'}</span>
            </div>
          </div>
        </div>

        <div>
          <button 
            className="btn-premium btn-danger" 
            style={{ padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}
            onClick={onLogout}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Summary Stats Bento Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div className="glass-card border-primary-left glass-card-hover" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Oral Assessments</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.15rem', color: 'var(--primary)' }}>
                {totalCompleted}
              </div>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '0.4rem', borderRadius: '8px' }}>
              <BookOpen size={16} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Total unique topics assessed in current account.</p>
        </div>

        <div className="glass-card border-accent-left glass-card-hover" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Average Competency</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.15rem', color: 'var(--accent)' }}>
                {avgScore}<span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
            <div style={{ background: 'rgba(20, 184, 166, 0.08)', padding: '0.4rem', borderRadius: '8px' }}>
              <Activity size={16} style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Average rating across speaking & conceptual accuracy.</p>
        </div>

        <div className="glass-card border-secondary-left glass-card-hover" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Highest Score</span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.15rem', color: 'var(--secondary)' }}>
                {highScore}<span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
            <div style={{ background: 'rgba(217, 70, 239, 0.08)', padding: '0.4rem', borderRadius: '8px' }}>
              <Trophy size={16} style={{ color: 'var(--secondary)' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Peak speaking score recorded in history logs.</p>
        </div>
      </div>

      {/* Historical Table section */}
      <div className="glass-card" style={{ padding: '1.25rem 0 0 0', overflow: 'hidden' }}>
        <div style={{ padding: '0 1.25rem 0.85rem 1.25rem', borderBottom: '1px solid var(--border-card)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            Completed Concept Assessments
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
            Browse through your saved oral report histories. Review metrics or export official compiled PDF scorecards.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem' }}>
            <div className="spinner-ring" style={{ width: '40px', height: '40px' }}>
              <div></div><div></div><div></div><div></div>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading assessment logs from database...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <AlertCircle size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Failed to Fetch Logs</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</p>
            <button className="btn-premium btn-secondary" style={{ marginTop: '1.25rem' }} onClick={fetchAssessments}>
              Retry Fetch
            </button>
          </div>
        ) : assessments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <AlertCircle size={44} style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'block', margin: '0 auto' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '700' }}>No Assessments Recorded</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.6' }}>
              You haven't conducted any oral assessments under this account yet. Choose a concept on the Home page and begin your oral assessment to see records here.
            </p>
          </div>
        ) : (
          <>
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                    <th>Topic Name</th>
                    <th>Assessment Date</th>
                    <th>Overall Score</th>
                    <th>Grade</th>
                    <th>Proficiency Level</th>
                    <th style={{ width: '280px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((record, index) => {
                    const score = record.scorecard?.overall_score || 0;
                    const grade = record.scorecard?.grade || 'N/A';
                    const classification = record.scorecard?.classification || 'N/A';
                    const scoreColor = getScoreColor(score);

                    return (
                      <tr key={record._id || index}>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>{index + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1.05rem' }}>{getTopicIcon(record.topic_id, record.topic_name)}</span>
                            <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{record.topic_name}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <Calendar size={13} />
                            {record.date}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: scoreColor, fontWeight: '800', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: scoreColor }}></span>
                            {score}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                            Grade {grade}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem', fontWeight: '500' }}>
                            <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                            {classification}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn-premium btn-secondary"
                              style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              onClick={() => onSelectRecord(record)}
                            >
                              <Eye size={12} /> View Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="history-mobile-list">
              {assessments.map((record, index) => {
                const score = record.scorecard?.overall_score || 0;
                const grade = record.scorecard?.grade || 'N/A';
                const classification = record.scorecard?.classification || 'N/A';
                const scoreColor = getScoreColor(score);

                return (
                  <div key={record._id || index} className="history-mobile-card">
                    <div className="history-mobile-card-header">
                      <div className="history-mobile-card-topic">
                        <span style={{ fontSize: '1.2rem' }}>{getTopicIcon(record.topic_id, record.topic_name)}</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{record.topic_name}</strong>
                      </div>
                      <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                        Grade {grade}
                      </span>
                    </div>

                    <div className="history-mobile-card-details">
                      <div className="history-mobile-card-detail-item">
                        <span className="history-mobile-card-detail-label">Date</span>
                        <span className="history-mobile-card-detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <Calendar size={11} /> {record.date}
                        </span>
                      </div>
                      
                      <div className="history-mobile-card-detail-item">
                        <span className="history-mobile-card-detail-label">Overall Score</span>
                        <span className="history-mobile-card-detail-value" style={{ color: scoreColor, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: scoreColor }}></span>
                          {score}
                        </span>
                      </div>

                      <div className="history-mobile-card-detail-item" style={{ gridColumn: 'span 2' }}>
                        <span className="history-mobile-card-detail-label">Speaking Proficiency</span>
                        <span className="history-mobile-card-detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                          <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> {classification}
                        </span>
                      </div>
                    </div>

                    <div className="history-mobile-card-actions">
                      <button
                        className="btn-premium btn-secondary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        onClick={() => onSelectRecord(record)}
                      >
                        <Eye size={12} /> View Detailed Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

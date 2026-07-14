import React from 'react';
import { Calendar, Award, CheckCircle2, AlertCircle, Eye, Clipboard } from 'lucide-react';

export default function HistoryView({ history, onSelectRecord }) {
  if (!history || history.length === 0) {
    return (
      <div className="container">
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clipboard size={22} style={{ color: 'var(--primary)' }} />
          Assessment Records
        </h2>
        <div className="glass-card" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
          <AlertCircle size={44} style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'block', margin: '0 auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '700' }}>No Assessments Recorded</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.6' }}>
            You haven't conducted any oral assessments in this session yet. Choose a subject concept on the Home page and begin your oral assessment to see records here.
          </p>
        </div>
      </div>
    );
  }

  // Helper to choose score text color
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="container">
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clipboard size={22} style={{ color: 'var(--primary)' }} />
        Assessment Records
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Review your past speaking scores, conceptual coverage grades, and technical grades from your active session.
      </p>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
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
                <th style={{ width: '150px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => {
                const scoreColor = getScoreColor(record.score);

                return (
                  <tr key={index}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>{index + 1}</td>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{record.topic}</strong>
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
                        {record.score}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                        Grade {record.grade}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem', fontWeight: '500' }}>
                        <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                        {record.classification}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {record.results && (
                        <button
                          className="btn-premium btn-secondary"
                          style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', borderRadius: '8px' }}
                          onClick={() => onSelectRecord(record.results)}
                        >
                          <Eye size={12} /> View Report
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

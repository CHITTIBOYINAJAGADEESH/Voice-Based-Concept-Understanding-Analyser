import React from 'react';
import { Calendar, Award, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HistoryView({ history, onSelectRecord }) {
  if (!history || history.length === 0) {
    return (
      <div className="container">
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>📄 Historical Assessment Records</h2>
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Assessments Recorded</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto' }}>
            You haven't conducted any oral assessments in this session yet. Choose a subject concept on the Home page and begin your oral assessment to see records here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>📄 Historical Assessment Records</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Review your past speaking scores, conceptual coverage grades, and technical grades from your active session.
      </p>

      <div className="glass-card">
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Topic Name</th>
                <th>Assessment Date</th>
                <th>Overall Score</th>
                <th>Grade</th>
                <th>Proficiency Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => {
                let scoreColor = '#10b981'; // Green
                if (record.score < 60) scoreColor = '#ef4444'; // Red
                else if (record.score < 80) scoreColor = '#f59e0b'; // Amber

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{record.topic}</strong>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} />
                        {record.date}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: scoreColor, fontWeight: '700', fontSize: '1rem' }}>
                        {record.score}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        {record.grade}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                        {record.classification}
                      </span>
                    </td>
                    <td>
                      {record.results && (
                        <button
                          className="btn-premium btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => onSelectRecord(record.results)}
                        >
                          View Report
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

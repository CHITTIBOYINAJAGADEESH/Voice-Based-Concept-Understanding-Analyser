import React from 'react';
import { Phone, Mail, HelpCircle, FileText } from 'lucide-react';

export default function SupportView() {
  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Phone size={24} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>System Support & Contact</h2>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
          Need assistance setting up API keys, installing local Whisper models, or troubleshooting microphone inputs? Get in touch with our helpdesk resources below:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(100,116,139,0.03)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Mail size={16} style={{ color: 'var(--primary)' }} /> Academic Support
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              For queries related to assessment rubrics, subject topics database, and scoring weights:
            </p>
            <p style={{ fontSize: '0.88rem', fontWeight: '600', marginTop: '0.5rem' }}>
              rubric-support@vbcua-edu.org
            </p>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(100,116,139,0.03)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <HelpCircle size={16} style={{ color: 'var(--accent)' }} /> Developer Helpdesk
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              For software troubleshooting, Python dependency failures, or React styling issues:
            </p>
            <p style={{ fontSize: '0.88rem', fontWeight: '600', marginTop: '0.5rem' }}>
              dev-ops@vbcua-labs.net
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <FileText size={14} />
            <span>Voice-Based Concept Understanding Analyser v2.0.0 Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

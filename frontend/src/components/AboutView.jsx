import React from 'react';
import { Info, Cpu, Code, Shield, Network, Zap, BookOpen } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <Info size={24} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>Technical Architecture Specifications</h2>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <p style={{ lineHeight: '1.6', fontSize: '0.96rem', color: 'var(--text-muted)' }}>
          The <strong style={{ color: 'var(--text-main)' }}>Voice-Based Concept Understanding Analyser (VBCUA)</strong> is a specialized diagnostic platform that measures the alignment between verbal explanations of engineering subjects and academic reference concepts.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--primary)', fontWeight: '800' }}>
              <Cpu size={18} /> Signal Processing
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Utilizes <strong>Librosa</strong> signal analysis in Python for extracting audio length, silent pause distributions (RMS thresholding below -32dB), pitch (YIN F0 frequency trackers), and zero-crossing rate (clarity parameters).
            </p>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--accent)', fontWeight: '800' }}>
              <Code size={18} /> Semantic Embeddings
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Runs <strong>Sentence-BERT (all-MiniLM-L6-v2)</strong> locally to project spoken transcript sentences and academic reference sub-concepts into dense vector spaces, calculating cosine similarities to track conceptual coverage.
            </p>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--secondary)', fontWeight: '800' }}>
              <Shield size={18} /> Natural Language NLP
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Employs <strong>NLTK</strong> for text tokenization and Flesch readability indexing, matched with VADER (Valence Aware Dictionary and sEntiment Reasoner) to map emotional delivery sentiment parameters.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-card)', paddingTop: '2rem' }}>
          <h4 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={16} style={{ color: 'var(--primary)' }} />
            Core System Pipeline Architecture
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px', flexShrink: 0 }}></div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Frontend UI Layer</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>React.js dashboard styled with glassmorphism and modern Vanilla CSS.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', marginTop: '6px', flexShrink: 0 }}></div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Backend Gateway</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Python FastAPI web server executing analytical algorithms.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--secondary)', marginTop: '6px', flexShrink: 0 }}></div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Whisper Transcription</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OpenAI Whisper engines running locally or in the cloud.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', marginTop: '6px', flexShrink: 0 }}></div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Report Builder</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ReportLab flowable templates producing downloadable PDF scorecards.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

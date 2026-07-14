import React from 'react';
import { Info, Cpu, Code, Shield } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Info size={24} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Technical Architecture Specifications</h2>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
          The <strong>Voice-Based Concept Understanding Analyser (VBCUA)</strong> is a specialized diagnostic platform that measures the alignment between verbal explanations of engineering subjects and academic reference concepts.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(100,116,139,0.03)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
              <Cpu size={16} /> Signal Processing
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Utilizes <strong>Librosa</strong> signal analysis in Python for extracting audio length, silent pause distributions (RMS thresholding below -32dB), pitch (YIN F0 frequency trackers), and zero-crossing rate (clarity parameters).
            </p>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(100,116,139,0.03)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', color: 'var(--accent)' }}>
              <Code size={16} /> Semantic Embeddings
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Runs <strong>Sentence-BERT (all-MiniLM-L6-v2)</strong> locally to project spoken transcript sentences and academic reference sub-concepts into dense vector spaces, calculating cosine similarities to track conceptual coverage.
            </p>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(100,116,139,0.03)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', color: 'var(--secondary)' }}>
              <Shield size={16} /> Natural Language NLP
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Employs <strong>NLTK</strong> for text tokenization and Flesch readability indexing, matched with VADER (Valence Aware Dictionary and sEntiment Reasoner) to map emotional delivery sentiment parameters.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Core System Architecture</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            - <strong>Frontend:</strong> React.js Single Page Application built on Vite, styled with custom Vanilla CSS variables and glassmorphism styling layers.<br />
            - <strong>Backend:</strong> Python FastAPI web server running Uvicorn asynchronously.<br />
            - <strong>Transcription:</strong> OpenAI Whisper engine (running locally or through cloud Whisper API endpoints).<br />
            - <strong>Report Engine:</strong> ReportLab flowable page template generator compiling reports into PDF format.<br />
            - <strong>Generative AI Coach:</strong> Integrated Google Gemini-1.5-Flash or OpenAI GPT-4o-Mini structures.
          </p>
        </div>
      </div>
    </div>
  );
}

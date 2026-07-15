import React, { useState } from 'react';
import { ArrowRight, BookOpen, Layers, Award, Sparkles, Activity, FileText, CheckCircle2 } from 'lucide-react';
import { getTopicIcon } from '../utils';

export default function HomeView({ 
  concepts, 
  selectedTopicId, 
  setSelectedTopicId, 
  onBeginAssessment 
}) {
  const [createCustom, setCreateCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customExplanation, setCustomExplanation] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');

  // Find active topic details
  const activeTopic = concepts.find(c => c.id === selectedTopicId) || {
    name: 'Custom Concept',
    reference_explanation: '',
    keywords: [],
    sub_concepts: []
  };

  const handleBegin = () => {
    if (createCustom) {
      if (!customName.trim() || !customExplanation.trim()) {
        alert('Please fill out the Custom Topic Name and Explanation.');
        return;
      }
      onBeginAssessment({
        isCustom: true,
        name: customName,
        explanation: customExplanation,
        keywords: customKeywords
      });
    } else {
      onBeginAssessment({
        isCustom: false,
        id: selectedTopicId
      });
    }
  };

  return (
    <div className="container">
      {/* Hero Header */}
      <div className="hero-section">
        <div className="hero-badge">
          <Activity size={12} />
          <span>Speech Analytics v2.1 • Activated</span>
        </div>
        <h1 className="hero-title animate-float">
          Voice-Based Concept Understanding Analyser
        </h1>
        <p className="hero-subtitle">
          Evaluate conceptual understanding and spoken presentation proficiency with our advanced multi-layered speech analytical engine.
        </p>
      </div>

      {/* Bento Grid Metrics breakdown row */}
      <div className="bento-grid">
        <div className="glass-card bento-item border-primary-left glass-card-hover">
          <div>
            <div className="bento-icon-wrapper bento-primary">
              <Sparkles size={22} />
            </div>
            <div className="bento-value" style={{ color: 'var(--primary)' }}>40%</div>
            <div className="bento-label">Semantic Alignment</div>
          </div>
          <p className="bento-desc">
            Detailed Sentence-BERT semantic similarity analysis mapping spoken transcript to academic sub-concepts.
          </p>
        </div>

        <div className="glass-card bento-item border-secondary-left glass-card-hover">
          <div>
            <div className="bento-icon-wrapper bento-secondary">
              <Activity size={22} />
            </div>
            <div className="bento-value" style={{ color: 'var(--secondary)' }}>25%</div>
            <div className="bento-label">Fluency & Pacing</div>
          </div>
          <p className="bento-desc">
            Librosa signal extraction tracking silent pause distribution, filler words, and vocal pacing speed.
          </p>
        </div>

        <div className="glass-card bento-item border-accent-left glass-card-hover">
          <div>
            <div className="bento-icon-wrapper bento-accent">
              <FileText size={22} />
            </div>
            <div className="bento-value" style={{ color: 'var(--accent)' }}>35%</div>
            <div className="bento-label">NLP & Vocal Stability</div>
          </div>
          <p className="bento-desc">
            Evaluating focal keyword coverage, Flesch readability ease, emotional sentiment, and vocal stability.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="glass-card" style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>
          <BookOpen size={18} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Assessment Setup</h2>
        </div>

        <div className="home-grid">
          {/* Left configuration side */}
          <div>
            <div className="form-group">
              <label className="form-label">Choose Topic Reference</label>
              <select
                className="form-control"
                value={createCustom ? 'custom' : selectedTopicId}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setCreateCustom(true);
                  } else {
                    setCreateCustom(false);
                    setSelectedTopicId(e.target.value);
                  }
                }}
                disabled={concepts.length === 0}
              >
                {concepts.map((concept) => (
                  <option key={concept.id} value={concept.id}>
                    {getTopicIcon(concept.id)} {concept.name}
                  </option>
                ))}
                <option value="custom">💡 + Define Custom Concept...</option>
              </select>
            </div>

            {createCustom && (
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.01)', 
                border: '1px solid var(--border-card)',
                borderRadius: '12px', 
                marginTop: '0.75rem',
                animation: 'slideDown 0.3s ease'
              }}>
                <h3 style={{ fontSize: '1.0rem', marginBottom: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>Custom Concept Definition</h3>
                
                <div className="form-group">
                  <label className="form-label">Custom Topic Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Recursion in Programming"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reference Explanation Paragraph</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Write the correct definition or standard textbook explanation..."
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Target Keywords (comma-separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. base case, call stack, function, memory"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right cheat-sheet / guideline view */}
          <div className="concept-specifications-container">
            <h3 style={{ fontSize: '1.0rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <Layers size={16} style={{ color: 'var(--primary)' }} />
              Concept Specifications
            </h3>

            {createCustom ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Name</span>
                  <p style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>💡</span> {customName || 'Untitled Custom Concept'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Expected Content</span>
                  <p style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: '1.4' }}>
                    {customExplanation || 'Please type a reference definition on the left.'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Required Vocabulary</span>
                  <div className="badge-container" style={{ marginTop: '0.2rem' }}>
                    {customKeywords ? customKeywords.split(',').map((kw, i) => (
                      <span key={i} className="badge badge-success">
                        {kw.trim()}
                      </span>
                    )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No keywords added yet.</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Name</span>
                  <p style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>{getTopicIcon(activeTopic.id)}</span> {activeTopic.name}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Expected Content</span>
                  <p style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: '1.4' }}>
                    {activeTopic.reference_explanation}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Required Vocabulary</span>
                  <div className="badge-container" style={{ marginTop: '0.2rem' }}>
                    {activeTopic.keywords.map((kw, i) => (
                      <span key={i} className="badge badge-success">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className="btn-premium btn-primary"
          style={{ width: '100%', marginTop: '1.25rem', padding: '0.65rem' }}
          onClick={handleBegin}
        >
          Begin Oral Assessment <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

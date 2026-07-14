import React, { useState } from 'react';
import { ArrowRight, BookOpen, Layers, Award, Sparkles, CheckSquare } from 'lucide-react';

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
        <h1 className="hero-title animate-float">
          Voice-Based Concept Understanding Analyser
        </h1>
        <p className="hero-subtitle">
          Evaluate conceptual understanding and spoken presentation proficiency with our advanced multi-layered speech analytical engine.
        </p>
      </div>

      {/* Metrics breakdown row */}
      <div className="dashboard-overall-grid" style={{ marginTop: '2rem' }}>
        <div className="glass-card border-primary-left glass-card-hover">
          <div className="metric-widget-value" style={{ color: '#2563eb' }}>40%</div>
          <div className="metric-widget-label">Semantic Alignment</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
            Detailed Sentence-BERT semantic similarity analysis mapping spoken transcript to academic sub-concepts.
          </p>
        </div>

        <div className="glass-card border-secondary-left glass-card-hover">
          <div className="metric-widget-value" style={{ color: '#7c3aed' }}>25%</div>
          <div className="metric-widget-label">Fluency & Pacing</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
            Librosa signal extraction tracking silent pause distribution, filler words, and vocal pacing speed.
          </p>
        </div>

        <div className="glass-card border-accent-left glass-card-hover">
          <div className="metric-widget-value" style={{ color: '#06b6d4' }}>35%</div>
          <div className="metric-widget-label">NLP & Vocal Stability</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
            Evaluating focal keyword coverage, Flesch readability ease, emotional sentiment, and vocal stability.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="glass-card" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Assessment Workspace</h2>
        </div>

        <div className="home-grid">
          {/* Left configuration side */}
          <div>
            <div className="form-group">
              <label className="form-label">Select Predefined Topic</label>
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
                    {concept.name}
                  </option>
                ))}
                <option value="custom">💡 + Add Custom Concept...</option>
              </select>
            </div>

            {createCustom && (
              <div style={{ padding: '1rem', background: 'rgba(100,116,139,0.05)', borderRadius: '12px', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--primary)' }}>Custom Concept Definition</h3>
                
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
                    rows={4}
                    placeholder="Write the correct definition or standard textbook explanation..."
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                  />
                </div>

                <div className="form-group">
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
          <div style={{ borderLeft: '1px solid var(--border-card)', paddingLeft: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              Core Reference Guidelines
            </h3>

            {createCustom ? (
              <div>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Topic:</strong> <span style={{ color: 'var(--accent)' }}>{customName || 'Untitled Custom Concept'}</span>
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>Expected Coverage Definition:</strong>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {customExplanation || 'No custom definition entered yet.'}
                  </p>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>Focus Keywords:</strong>
                  <div className="badge-container" style={{ marginTop: '0.25rem' }}>
                    {customKeywords ? customKeywords.split(',').map((kw, i) => (
                      <span key={i} className="badge badge-success">
                        {kw.trim()}
                      </span>
                    )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No keywords entered.</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Topic:</strong> <span style={{ color: 'var(--accent)' }}>{activeTopic.name}</span>
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>Target Reference Explanation:</strong>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    {activeTopic.reference_explanation}
                  </p>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>Key Focus Vocabulary:</strong>
                  <div className="badge-container" style={{ marginTop: '0.25rem' }}>
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
          style={{ width: '100%', marginTop: '2rem' }}
          onClick={handleBegin}
        >
          Begin Oral Assessment <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

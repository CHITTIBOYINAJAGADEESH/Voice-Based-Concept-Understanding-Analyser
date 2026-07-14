import React, { useState } from 'react';
import { 
  ArrowLeft, Mic, Upload, FileText, BarChart2, CheckCircle2, 
  HelpCircle, Download, FileUp, Sparkles, AlertTriangle, RefreshCw
} from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:8000' : '';

export default function DashboardView({ 
  topic, 
  results, 
  isAnalyzing, 
  onAudioSubmit, 
  onFileUpload, 
  onReEvaluate, 
  onBackToHome, 
  theme 
}) {
  const [activeInputTab, setActiveInputTab] = useState('record');
  const [activeDetailTab, setActiveDetailTab] = useState('transcript');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [isReEvaluating, setIsReEvaluating] = useState(false);

  // Initialize transcript when results change
  React.useEffect(() => {
    if (results && results.semantic_results) {
      setEditedTranscript(results.semantic_results.transcript || '');
    }
  }, [results]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleFileSubmit = () => {
    if (uploadedFile) {
      onFileUpload(uploadedFile);
    }
  };

  const handleReEvalSubmit = async () => {
    setIsReEvaluating(true);
    await onReEvaluate(editedTranscript);
    setIsReEvaluating(false);
  };

  // 1. Loading/Analyzing state
  if (isAnalyzing) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
        <div className="glass-card processing-overlay" style={{ maxWidth: '600px', width: '100%' }}>
          <div className="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🎙️ Executing Assessment Pipeline</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Preprocessing speech signals, transcribing audio, matching semantic embeddings, and generating performance scorecard charts...
          </p>
        </div>
      </div>
    );
  }

  // 2. Input/Workspace state (Before recording/uploading)
  if (!results) {
    return (
      <div className="container">
        {/* Back and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <button className="btn-premium btn-secondary" onClick={onBackToHome} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessment Dashboard</span>
            <h2 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>🎙️ Oral Topic: <span style={{ color: 'var(--accent)' }}>{topic.name}</span></h2>
          </div>
        </div>

        <div className="home-grid" style={{ alignItems: 'start' }}>
          {/* Left panel: Input options */}
          <div className="glass-card">
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-card)', marginBottom: '1.5rem' }}>
              <button
                className={`tab-btn ${activeInputTab === 'record' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('record')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Mic size={16} /> Record Live Speech
              </button>
              <button
                className={`tab-btn ${activeInputTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('upload')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Upload size={16} /> Upload Audio File
              </button>
            </div>

            {activeInputTab === 'record' ? (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                  Speak clearly into your microphone explaining the selected topic. Press stop and submit when finished.
                </p>
                <VoiceRecorder onAudioSubmit={onAudioSubmit} theme={theme} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                  Select or drop a pre-recorded speech file to analyze. Supported formats: WAV, MP3, OGG.
                </p>

                <div 
                  style={{ 
                    border: '2px dashed var(--border-card)', 
                    borderRadius: '12px', 
                    padding: '2.5rem', 
                    textAlign: 'center', 
                    width: '100%',
                    cursor: 'pointer',
                    background: 'rgba(100,116,139,0.02)'
                  }}
                  onClick={() => document.getElementById('audio-file-input').click()}
                >
                  <FileUp size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {uploadedFile ? uploadedFile.name : 'Click to select file'}
                  </span>
                  <input
                    id="audio-file-input"
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>

                {uploadedFile && (
                  <button
                    className="btn-premium btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleFileSubmit}
                  >
                    Submit Uploaded Speech Analysis 🚀
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Reference Checklist */}
          <div className="glass-card" style={{ height: '100%' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem' }}>
              🎯 Checklist Reference Targets
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
              To maximize your performance score, try covering all these sub-concepts and details in your spoken explanation:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topic.sub_concepts.map((sub, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--accent)', marginTop: '2px' }}>🧩</span>
                  <span>{sub}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 3. Results Dashboard state (After analysis finishes)
  const scorecard = results.scorecard;
  const metrics = scorecard.metrics;

  return (
    <div className="container">
      {/* Title & Back Row */}
      <div className="dashboard-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-premium btn-secondary" onClick={onBackToHome} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessment Dashboard</span>
            <h2 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>📊 Results: <span style={{ color: 'var(--accent)' }}>{results.topic_name}</span></h2>
          </div>
        </div>

        <a
          href={BACKEND_URL + results.pdf_report_url}
          target="_blank"
          rel="noreferrer"
          className="btn-premium btn-accent"
        >
          <Download size={16} /> Download PDF Report
        </a>
      </div>

      {/* 3 Metrics Grade Grid */}
      <div className="dashboard-overall-grid">
        <div className="glass-card border-secondary-left metric-widget">
          <div className="metric-widget-label">Overall Score</div>
          <div className="metric-widget-value" style={{ color: '#7c3aed' }}>
            {scorecard.overall_score} <span style={{ fontSize: '1.15rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ 100</span>
          </div>
        </div>

        <div className="glass-card border-accent-left metric-widget">
          <div className="metric-widget-label">Final Grade</div>
          <div className="metric-widget-value" style={{ color: '#06b6d4' }}>
            {scorecard.grade}
          </div>
        </div>

        <div className="glass-card border-success-left metric-widget">
          <div className="metric-widget-label">Proficiency Level</div>
          <div className="metric-widget-value" style={{ color: '#10b981', fontSize: '1.85rem', paddingTop: '0.3rem' }}>
            {scorecard.classification}
          </div>
        </div>
      </div>

      {/* 5 breakdown cards */}
      <div className="dashboard-breakdown-grid">
        {Object.entries(metrics).map(([key, val]) => {
          let scoreColor = '#10b981'; // Green
          if (val.score < 60) scoreColor = '#ef4444'; // Red
          else if (val.score < 80) scoreColor = '#f59e0b'; // Amber

          return (
            <div key={key} className="glass-card breakdown-card">
              <div className="breakdown-title">{val.name}</div>
              <div className="breakdown-value" style={{ color: scoreColor }}>{val.score}</div>
              <div className="breakdown-weight">Weight: {val.weight}%</div>
              <div className="breakdown-status" style={{ color: scoreColor }}>{val.status}</div>
            </div>
          );
        })}
      </div>

      {/* Detail Tabs Panel */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeDetailTab === 'transcript' ? 'active' : ''}`}
            onClick={() => setActiveDetailTab('transcript')}
          >
            <FileText size={16} /> Speech Transcript
          </button>
          <button
            className={`tab-btn ${activeDetailTab === 'acoustic' ? 'active' : ''}`}
            onClick={() => setActiveDetailTab('acoustic')}
          >
            <BarChart2 size={16} /> Acoustic Visualizations
          </button>
          <button
            className={`tab-btn ${activeDetailTab === 'semantic' ? 'active' : ''}`}
            onClick={() => setActiveDetailTab('semantic')}
          >
            <CheckCircle2 size={16} /> Concept Coverage & NLP
          </button>
          <button
            className={`tab-btn ${activeDetailTab === 'coaching' ? 'active' : ''}`}
            onClick={() => setActiveDetailTab('coaching')}
          >
            <Sparkles size={16} /> AI Coaching Feedback
          </button>
        </div>

        {/* Tab 1: Transcript */}
        {activeDetailTab === 'transcript' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Interactive Transcript Card</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Review the transcription. If Whisper misheard any technical term, edit the text below and re-evaluate to update the semantic similarity score.
            </p>

            <textarea
              className="form-control"
              rows={8}
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              style={{ fontSize: '1rem', fontStyle: 'italic', fontFamily: 'inherit', lineHeight: '1.6' }}
              disabled={isReEvaluating}
            />

            <button
              className="btn-premium btn-primary"
              style={{ marginTop: '1.25rem' }}
              onClick={handleReEvalSubmit}
              disabled={isReEvaluating || !editedTranscript.trim()}
            >
              {isReEvaluating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Re-evaluating...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Re-evaluate Transcript 🔄
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Acoustics */}
        {activeDetailTab === 'acoustic' && (
          <div className="tab-content-grid">
            {/* Visualizer images */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
                <img 
                  src={BACKEND_URL + results.wave_img_url} 
                  alt="Speech Waveform Plot" 
                  style={{ width: '100%', borderRadius: '8px', display: 'block' }} 
                />
              </div>
              <div className="glass-card" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
                <img 
                  src={BACKEND_URL + results.spec_img_url} 
                  alt="Acoustic Spectrogram Plot" 
                  style={{ width: '100%', borderRadius: '8px', display: 'block' }} 
                />
              </div>
              <div className="glass-card" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
                <img 
                  src={BACKEND_URL + results.pitch_img_url} 
                  alt="Pitch stability Contour Plot" 
                  style={{ width: '100%', borderRadius: '8px', display: 'block' }} 
                />
              </div>
            </div>

            {/* Right side stats list */}
            <div>
              <div className="glass-card" style={{ height: '100%', background: 'rgba(100,116,139,0.02)' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>
                  Speech Acoustic Parameters
                </h4>

                <audio 
                  src={BACKEND_URL + results.audio_play_url} 
                  controls 
                  style={{ width: '100%', marginBottom: '1.5rem', borderRadius: '8px' }} 
                />

                <div className="info-stat-row">
                  <span className="info-stat-label">⏱️ Total Audio Length</span>
                  <span className="info-stat-value">{results.audio_results.duration.toFixed(1)} seconds</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🛑 Silent Pause Count</span>
                  <span className="info-stat-value">{results.audio_results.pause_count} intervals</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📉 Pause Total Duration</span>
                  <span className="info-stat-value">{results.audio_results.pause_duration.toFixed(2)} seconds</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📊 Pause to Audio Ratio</span>
                  <span className="info-stat-value">{(results.audio_results.pause_ratio * 100).toFixed(1)}%</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🚀 Speaking Rate</span>
                  <span className="info-stat-value">{results.audio_results.speaking_speed_wpm.toFixed(1)} WPM</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎤 Zero-Crossing Rate</span>
                  <span className="info-stat-value">{results.audio_results.zcr_mean.toFixed(4)}</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎵 Vocal Pitch Mean</span>
                  <span className="info-stat-value">{results.audio_results.pitch_mean.toFixed(1)} Hz</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📉 Pitch Jitter (std)</span>
                  <span className="info-stat-value">±{results.audio_results.pitch_std.toFixed(2)} Hz</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Semantic Coverage & NLP */}
        {activeDetailTab === 'semantic' && (
          <div className="tab-content-grid">
            {/* Semantic alignment items */}
            <div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Sub-concept Alignment Coverage</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                Sentence-BERT matches of your explanation sentences against predefined academic sub-concepts.
              </p>

              <div>
                {results.semantic_results.concept_alignments.map((align, i) => {
                  const borderCol = align.covered ? '#10b981' : '#ef4444';
                  return (
                    <div 
                      key={i} 
                      className="concept-alignment-item"
                      style={{ borderLeftColor: borderCol }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.95rem' }}>
                          {align.covered ? '✅' : '❌'} {align.sub_concept}
                        </strong>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: align.covered ? '#10b981' : '#ef4444' }}>
                          {align.covered ? 'Covered' : 'Omitted'} ({(align.similarity * 100).toFixed(1)}% match)
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        Best matching sentence: "{align.best_match_sentence}"
                      </p>
                    </div>
                  );
                })}
              </div>

              {results.semantic_results.incorrect_statements.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} /> Flagged Off-Topic/Factual Deviations
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {results.semantic_results.incorrect_statements.map((stmt, i) => (
                      <li key={i}>
                        "{stmt.sentence}" <span style={{ fontStyle: 'italic' }}>({stmt.reason})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Keyword coverage checklist and NLP complexity */}
            <div>
              <div className="glass-card" style={{ background: 'rgba(100,116,139,0.02)', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Keyword Target Coverage</h4>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem' }}>
                  Target Vocabulary Score: <span style={{ color: 'var(--primary)' }}>{results.nlp_results.keyword_score.toFixed(1)}%</span>
                </div>

                <div className="badge-container">
                  {Object.entries(results.nlp_results.keyword_matches).map(([kw, match]) => (
                    <span 
                      key={kw} 
                      className={`badge ${match ? 'badge-success' : 'badge-danger'}`}
                    >
                      {match ? '✓' : '✗'} {kw}
                    </span>
                  ))}
                </div>

                <h4 style={{ fontSize: '1.05rem', marginTop: '1.5rem', marginBottom: '1rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.25rem' }}>
                  Readability & Delivery Complexity
                </h4>
                
                <div className="info-stat-row">
                  <span className="info-stat-label">📝 Reading Ease</span>
                  <span className="info-stat-value">{results.nlp_results.readability.flesch_score} / 100</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎓 Readability Grade</span>
                  <span className="info-stat-value">{results.nlp_results.readability.readability_label}</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📊 Avg Sentence Length</span>
                  <span className="info-stat-value">{results.nlp_results.readability.avg_sentence_length.toFixed(1)} words</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎭 Emotional Sentiment</span>
                  <span className="info-stat-value" style={{ textTransform: 'capitalize' }}>{results.nlp_results.sentiment}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Coaching */}
        {activeDetailTab === 'coaching' && (
          <div className="tab-content-grid" style={{ alignItems: 'start' }}>
            {/* Radar chart visualizer */}
            <div style={{ textAlign: 'center' }}>
              <div className="glass-card" style={{ padding: '1rem', display: 'inline-block', background: 'rgba(0,0,0,0.1)' }}>
                <img 
                  src={BACKEND_URL + results.radar_img_url} 
                  alt="Performance Radar Map" 
                  style={{ maxWidth: '380px', width: '100%', display: 'block', margin: '0 auto' }} 
                />
              </div>

              {results.ai_feedback.is_ai_simulated && (
                <div className="badge badge-success" style={{ marginTop: '1rem', display: 'inline-flex', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                  💡 Local Pedagogical Feedback Engine Active
                </div>
              )}
            </div>

            {/* AI Review Profile */}
            <div>
              <div className="glass-card" style={{ background: 'rgba(100,116,139,0.02)' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  Interview Readiness Profile
                </h4>
                <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-main)', marginBottom: '1.5rem', background: 'rgba(37,99,235,0.05)', padding: '0.85rem 1.15rem', borderRadius: '10px', borderLeft: '3px solid var(--primary)' }}>
                  {results.ai_feedback.interview_readiness}
                </p>

                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>💪 Key Speaking Strengths</h4>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {results.ai_feedback.strengths.map((str, i) => (
                    <li key={i}>
                      <strong style={{ color: 'var(--text-main)' }}>{str.split(':')[0]}</strong>{str.split(':')[1] ? ':' + str.split(':')[1] : ''}
                    </li>
                  ))}
                </ul>

                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>⚠️ Speaking Gaps & Flaws</h4>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {results.ai_feedback.weaknesses.map((weak, i) => (
                    <li key={i}>
                      <strong style={{ color: 'var(--text-main)' }}>{weak.split(':')[0]}</strong>{weak.split(':')[1] ? ':' + weak.split(':')[1] : ''}
                    </li>
                  ))}
                </ul>

                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>💡 Actionable Coach Recommendations</h4>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {results.ai_feedback.suggestions.map((sug, i) => (
                    <li key={i}>
                      <strong style={{ color: 'var(--text-main)' }}>{sug.split(':')[0]}</strong>{sug.split(':')[1] ? ':' + sug.split(':')[1] : ''}
                    </li>
                  ))}
                </ul>

                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.25rem' }}>
                  🔗 Recommended Reading & Training Paths
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {results.ai_feedback.resources.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline', fontWeight: '500' }}
                    >
                      {res.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

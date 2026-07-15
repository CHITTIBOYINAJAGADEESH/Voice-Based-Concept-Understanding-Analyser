import React, { useState } from 'react';
import {
  ArrowLeft, Mic, Upload, FileText, BarChart2, CheckCircle2,
  HelpCircle, Download, FileUp, Sparkles, AlertTriangle, RefreshCw,
  Award, Play, Volume2, Bookmark, Check, ShieldAlert, BookOpen
} from 'lucide-react';
import { getTopicIcon } from '../utils';
import VoiceRecorder from './VoiceRecorder';

const BACKEND_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

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

  // Helper to choose progress bar color
  const getProgressColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  // 1. Loading/Analyzing state
  if (isAnalyzing) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', minHeight: '65vh', alignItems: 'center' }}>
        <div className="glass-card processing-overlay" style={{ maxWidth: '580px', width: '100%' }}>
          <div className="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: '800' }}>Processing Speech Assessment</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            Our speech pipelines are processing your voice audio signals.
          </p>

          <div className="stepper-container">
            <div className="stepper-step active">
              <div className="stepper-bubble">1</div>
              <div className="stepper-info">
                <span className="stepper-title">WAV Audio Preprocessing</span>
                <span className="stepper-desc">Normalizing loudness & resubmitting at 16kHz</span>
              </div>
            </div>
            <div className="stepper-step active animate-pulse-soft">
              <div className="stepper-bubble">2</div>
              <div className="stepper-info">
                <span className="stepper-title">Whisper Speech-to-Text</span>
                <span className="stepper-desc">Transcribing conceptual speech signals</span>
              </div>
            </div>
            <div className="stepper-step active">
              <div className="stepper-bubble">3</div>
              <div className="stepper-info">
                <span className="stepper-title">Librosa Acoustic Extraction</span>
                <span className="stepper-desc">Computing pitch curves & silent pauses</span>
              </div>
            </div>
            <div className="stepper-step active">
              <div className="stepper-bubble">4</div>
              <div className="stepper-info">
                <span className="stepper-title">Sentence-BERT Semantic Match</span>
                <span className="stepper-desc">Evaluating concept alignment and keyword counts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Input/Workspace state (Before recording/uploading)
  if (!results) {
    return (
      <div className="container">
        {/* Back and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.0rem' }}>
          <button className="btn-premium btn-secondary" onClick={onBackToHome} style={{ padding: '0.45rem', borderRadius: '10px' }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Oral Assessment Workspace</span>
            <h2 style={{ fontSize: '1.3rem', marginTop: '0.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span>{getTopicIcon(topic.id, topic.name)}</span>
              <span>Concept Topic:</span>
              <span style={{ color: 'var(--accent)' }}>{topic.name}</span>
            </h2>
          </div>
        </div>

        <div className="home-grid" style={{ alignItems: 'stretch' }}>
          {/* Left panel: Input options */}
          <div className="glass-card">
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-card)', marginBottom: '1rem' }}>
              <button
                className={`tab-btn ${activeInputTab === 'record' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('record')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Mic size={14} /> Record Live Speech
              </button>
              <button
                className={`tab-btn ${activeInputTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('upload')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Upload size={14} /> Upload Audio File
              </button>
            </div>

            {activeInputTab === 'record' ? (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem', textAlign: 'center', lineHeight: '1.4' }}>
                  Ensure you are in a quiet room and speak clearly. Press the microphone button to start explaining the concept.
                </p>
                <VoiceRecorder onAudioSubmit={onAudioSubmit} theme={theme} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', lineHeight: '1.4' }}>
                  Select or drop a pre-recorded speech file to analyze. Supported formats: WAV, MP3, OGG.
                </p>

                <div
                  className="file-upload-zone"
                  onClick={() => document.getElementById('audio-file-input').click()}
                  style={{ padding: '1.5rem 1rem' }}
                >
                  <FileUp size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem auto' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', color: 'var(--text-main)' }}>
                    {uploadedFile ? uploadedFile.name : 'Choose file or drag here'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    WAV, MP3 or OGG up to 24MB
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
                    style={{ width: '100%', padding: '0.6rem' }}
                    onClick={handleFileSubmit}
                  >
                    Submit Uploaded Speech Analysis 🚀
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Reference Checklist */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bookmark size={14} style={{ color: 'var(--primary)' }} />
              Coverage Reference Targets
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              To score high, ensure your explanation incorporates the following focal areas:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topic.sub_concepts.map((sub, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  background: 'rgba(255,255,255,0.01)',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px'
                }}>
                  <span style={{
                    color: 'var(--accent)',
                    background: 'rgba(20, 184, 166, 0.08)',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    marginTop: '1px'
                  }}>{i + 1}</span>
                  <span style={{ fontWeight: '500' }}>{sub}</span>
                </div>
              ))}
            </div>
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
          <button className="btn-premium btn-secondary" onClick={onBackToHome} style={{ padding: '0.45rem', borderRadius: '10px' }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Speech Analysis Results</span>
            <h2 style={{ fontSize: '1.25rem', marginTop: '0.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span>{getTopicIcon(results.topic_id, results.topic_name)}</span>
              <span>Dashboard:</span>
              <span style={{ color: 'var(--accent)' }}>{results.topic_name}</span>
            </h2>
          </div>
        </div>

        <a
          href={BACKEND_URL + results.pdf_report_url}
          target="_blank"
          rel="noreferrer"
          className="btn-premium btn-accent"
          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Download size={14} /> Download PDF Report
        </a>
      </div>

      {/* 3 Metrics Grade Grid */}
      <div className="dashboard-overall-grid">
        <div className="glass-card border-secondary-left metric-widget">
          <div className="metric-widget-label">Overall Competency Score</div>
          <div className="metric-widget-value" style={{ color: 'var(--secondary)' }}>
            {scorecard.overall_score}<span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: '500', marginLeft: '0.2rem' }}>/ 100</span>
          </div>
        </div>

        <div className="glass-card border-accent-left metric-widget">
          <div className="metric-widget-label">Qualitative Grade</div>
          <div className="metric-widget-value" style={{ color: 'var(--accent)' }}>
            {scorecard.grade}
          </div>
        </div>

        <div className="glass-card border-success-left metric-widget">
          <div className="metric-widget-label">Speaking Proficiency</div>
          <div className="metric-widget-value" style={{ color: 'var(--success)', fontSize: '1.5rem', marginTop: '0.5rem' }}>
            {scorecard.classification}
          </div>
        </div>
      </div>

      {/* 5 breakdown cards */}
      <div className="dashboard-breakdown-grid">
        {Object.entries(metrics).map(([key, val]) => {
          const scoreColor = getProgressColor(val.score);

          return (
            <div key={key} className="glass-card breakdown-card" style={{ borderBottom: `3px solid ${scoreColor}` }}>
              <div className="breakdown-title">{val.name}</div>
              <div className="breakdown-value" style={{ color: scoreColor }}>{val.score}</div>
              <div style={{ width: '100%', margin: '0.25rem 0' }}>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${val.score}%`, backgroundColor: scoreColor }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '0.25rem' }}>
                <span className="breakdown-weight">Weight: {val.weight}%</span>
                <span className="breakdown-status" style={{ color: scoreColor, fontSize: '0.65rem' }}>{val.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Tabs Panel */}
      <div className="glass-card">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeDetailTab === 'transcript' ? 'active' : ''}`}
            onClick={() => setActiveDetailTab('transcript')}
          >
            <FileText size={16} /> Spoken Transcript
          </button>
          <button
            className={`tab-btn ${activeDetailTab === 'acoustic' ? 'active' : ''}`}
            onClick={() => setActiveDetailTab('acoustic')}
          >
            <BarChart2 size={16} /> Signal Visualizations
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
          <div style={{ animation: 'slideDown 0.3s ease' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '800' }}>Review & Edit Transcript</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              If any specialized terminology was misheard during transcription, you can modify the text below and re-evaluate to update your alignment scores.
            </p>

            <div className="code-editor-card">
              <div className="code-editor-header">
                <div className="code-editor-dots">
                  <span className="code-editor-dot"></span>
                  <span className="code-editor-dot"></span>
                  <span className="code-editor-dot"></span>
                </div>
                <span className="code-editor-title">interactive-editor.md</span>
              </div>
              <textarea
                className="form-control"
                rows={9}
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                style={{
                  fontSize: '0.98rem',
                  fontFamily: 'monospace',
                  lineHeight: '1.7',
                  border: 'none',
                  background: 'transparent',
                  padding: '1.5rem',
                  resize: 'vertical',
                  boxShadow: 'none',
                  borderRadius: 0
                }}
                disabled={isReEvaluating}
              />
            </div>

            <button
              className="btn-premium btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.85rem 1.8rem' }}
              onClick={handleReEvalSubmit}
              disabled={isReEvaluating || !editedTranscript.trim()}
            >
              {isReEvaluating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Recalculating Metrics...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Re-evaluate Speech Signal
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Acoustics */}
        {activeDetailTab === 'acoustic' && (
          <div className="tab-content-grid" style={{ animation: 'slideDown 0.3s ease' }}>
            {/* Visualizer images */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>1. Speech Waveform (Librosa amplitude profile)</span>
                <img
                  src={BACKEND_URL + results.wave_img_url}
                  alt="Speech Waveform Plot"
                  style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                />
              </div>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>2. Auditory Spectrogram (Frequency distribution over time)</span>
                <img
                  src={BACKEND_URL + results.spec_img_url}
                  alt="Acoustic Spectrogram Plot"
                  style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                />
              </div>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>3. Fundamental Pitch F0 Contour (Vocal pitch stability)</span>
                <img
                  src={BACKEND_URL + results.pitch_img_url}
                  alt="Pitch stability Contour Plot"
                  style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                />
              </div>
            </div>

            {/* Right side stats list */}
            <div>
              <div className="glass-card" style={{ height: '100%', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Volume2 size={18} style={{ color: 'var(--accent)' }} />
                  Acoustic Vector Analysis
                </h4>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-card)', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Playback Audio Recording</span>
                  <audio
                    src={BACKEND_URL + results.audio_play_url}
                    controls
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                </div>

                <div className="info-stat-row">
                  <span className="info-stat-label">⏱️ Verbal Duration</span>
                  <span className="info-stat-value">{results.audio_results.duration.toFixed(1)} seconds</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🛑 Silent Pause Counts</span>
                  <span className="info-stat-value">{results.audio_results.pause_count} intervals</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📉 Accumulated Pause Time</span>
                  <span className="info-stat-value">{results.audio_results.pause_duration.toFixed(2)} seconds</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📊 Pause to Speech Ratio</span>
                  <span className="info-stat-value">{(results.audio_results.pause_ratio * 100).toFixed(1)}%</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🚀 Speaking Velocity</span>
                  <span className="info-stat-value">{results.audio_results.speaking_speed_wpm.toFixed(1)} WPM</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎤 Spectral Zero-Crossing</span>
                  <span className="info-stat-value">{results.audio_results.zcr_mean.toFixed(4)}</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎵 Average Vocal Pitch</span>
                  <span className="info-stat-value">{results.audio_results.pitch_mean.toFixed(1)} Hz</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📉 Pitch Deviation (Jitter)</span>
                  <span className="info-stat-value">±{results.audio_results.pitch_std.toFixed(2)} Hz</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Semantic Coverage & NLP */}
        {activeDetailTab === 'semantic' && (
          <div className="tab-content-grid" style={{ animation: 'slideDown 0.3s ease' }}>
            {/* Semantic alignment items */}
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '800' }}>Sub-concept Coverage Mapping</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Sentence-BERT matches of your explanation sentences against predefined academic sub-concepts.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {results.semantic_results.concept_alignments.map((align, i) => {
                  const borderCol = align.covered ? 'var(--success)' : 'var(--danger)';
                  return (
                    <div
                      key={i}
                      className="concept-alignment-item"
                      style={{ borderLeftColor: borderCol }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {align.covered ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> : <ShieldAlert size={16} style={{ color: 'var(--danger)' }} />}
                          {align.sub_concept}
                        </strong>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', color: align.covered ? 'var(--success)' : 'var(--danger)' }}>
                          {align.covered ? 'Covered' : 'Not Addressed'} ({(align.similarity * 100).toFixed(0)}% match)
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.4' }}>
                        Best speech match: "{align.best_match_sentence || 'N/A'}"
                      </p>
                    </div>
                  );
                })}
              </div>

              {results.semantic_results.incorrect_statements.length > 0 && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.25rem',
                  background: 'rgba(239, 68, 68, 0.04)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.15)'
                }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '800' }}>
                    <AlertTriangle size={16} /> Flagged Conceptual Deviations / Deviant Sentences
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: '1.5' }}>
                    {results.semantic_results.incorrect_statements.map((stmt, i) => (
                      <li key={i}>
                        "<span style={{ color: 'var(--text-main)' }}>{stmt.sentence}</span>" <span style={{ fontStyle: 'italic', opacity: 0.85 }}>({stmt.reason})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Keyword coverage checklist and NLP complexity */}
            <div>
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', fontWeight: '800' }}>Keyword Coverage Vocabulary</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Target Vocabulary Rating: <strong style={{ color: 'var(--primary)' }}>{results.nlp_results.keyword_score.toFixed(0)}%</strong>
                </div>

                <div className="badge-container">
                  {Object.entries(results.nlp_results.keyword_matches).map(([kw, match]) => (
                    <span
                      key={kw}
                      className={`badge ${match ? 'badge-success' : 'badge-danger'}`}
                    >
                      {match ? <Check size={10} /> : '✗'} {kw}
                    </span>
                  ))}
                </div>

                <h4 style={{ fontSize: '1.05rem', marginTop: '2rem', marginBottom: '1.25rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem', fontWeight: '800' }}>
                  Text Lexical Statistics
                </h4>

                <div className="info-stat-row">
                  <span className="info-stat-label">📝 Flesch Reading Ease</span>
                  <span className="info-stat-value">{results.nlp_results.readability.flesch_score} / 100</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎓 Readability Profile</span>
                  <span className="info-stat-value">{results.nlp_results.readability.readability_label}</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">📊 Average Sentence Weight</span>
                  <span className="info-stat-value">{results.nlp_results.readability.avg_sentence_length.toFixed(1)} words</span>
                </div>
                <div className="info-stat-row">
                  <span className="info-stat-label">🎭 Emotional Sentiment Tone</span>
                  <span className="info-stat-value" style={{ textTransform: 'capitalize' }}>{results.nlp_results.sentiment}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Coaching */}
        {activeDetailTab === 'coaching' && (
          <div className="tab-content-grid" style={{ alignItems: 'start', animation: 'slideDown 0.3s ease' }}>
            {/* Radar chart visualizer */}
            <div style={{ textAlign: 'center' }}>
              <div className="glass-card" style={{ padding: '1.25rem', display: 'inline-block', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Oral Competency Profile</span>
                <img
                  src={BACKEND_URL + results.radar_img_url}
                  alt="Performance Radar Map"
                  style={{ maxWidth: '360px', width: '100%', display: 'block', margin: '0 auto' }}
                />
              </div>

              {results.ai_feedback.is_ai_simulated && (
                <div className="badge badge-warning" style={{ marginTop: '1rem', display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                  💡 Local Simulated Scoring Rulebook Active
                </div>
              )}
            </div>

            {/* AI Review Profile */}
            <div>
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: '800' }}>
                  Interview Preparedness Profile
                </h4>
                <p style={{
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  marginBottom: '2rem',
                  background: 'rgba(99,102,241,0.05)',
                  padding: '1.1rem 1.4rem',
                  borderRadius: '12px',
                  borderLeft: '4px solid var(--primary)'
                }}>
                  {results.ai_feedback.interview_readiness}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)' }}>
                      <CheckCircle2 size={16} /> Key Speaking Strengths
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {results.ai_feedback.strengths.map((str, i) => (
                        <li key={i}>
                          <strong style={{ color: 'var(--text-main)' }}>{str.split(':')[0]}</strong>{str.split(':')[1] ? ':' + str.split(':')[1] : ''}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)' }}>
                      <ShieldAlert size={16} /> Critical Conceptual Gaps & Flaws
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {results.ai_feedback.weaknesses.map((weak, i) => (
                        <li key={i}>
                          <strong style={{ color: 'var(--text-main)' }}>{weak.split(':')[0]}</strong>{weak.split(':')[1] ? ':' + weak.split(':')[1] : ''}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)' }}>
                      <Sparkles size={16} /> Actionable Coach Recommendations
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {results.ai_feedback.suggestions.map((sug, i) => (
                        <li key={i}>
                          <strong style={{ color: 'var(--text-main)' }}>{sug.split(':')[0]}</strong>{sug.split(':')[1] ? ':' + sug.split(':')[1] : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} style={{ color: 'var(--primary)' }} />
                    Recommended Reference Links & Training Paths
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {results.ai_feedback.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="badge btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderRadius: '8px' }}
                      >
                        {res.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

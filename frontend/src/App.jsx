import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import FaqView from './components/FaqView';
import AboutView from './components/AboutView';
import SupportView from './components/SupportView';
import { Settings, Key, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import './App.css';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:8000' : '';

export default function App() {
  const [page, setPage] = useState('home');
  const [theme, setTheme] = useState(() => localStorage.getItem('vbcua_theme') || 'dark');
  const [concepts, setConcepts] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  
  // Custom topic details if user inputs custom definitions
  const [customTopicData, setCustomTopicData] = useState(null);

  // Assessment execution state
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);

  // Collapsible configuration panel
  const [showSettings, setShowSettings] = useState(false);
  const [apiConfig, setApiConfig] = useState(() => {
    const saved = localStorage.getItem('vbcua_config');
    return saved ? JSON.parse(saved) : {
      apiProvider: 'Gemini',
      geminiApiKey: '',
      openaiApiKey: '',
      whisperMode: 'Local'
    };
  });

  // Fetch predefined concepts from backend
  useEffect(() => {
    fetchConcepts();
    // Load historical records from localStorage
    const savedHistory = localStorage.getItem('vbcua_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  // Update theme class on HTML document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('vbcua_theme', theme);
  }, [theme]);

  // Sync API configurations to localStorage
  useEffect(() => {
    localStorage.setItem('vbcua_config', JSON.stringify(apiConfig));
  }, [apiConfig]);

  const fetchConcepts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/concepts`);
      if (res.ok) {
        const data = await res.json();
        setConcepts(data);
        if (data.length > 0) {
          setSelectedTopicId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve academic concepts list:', err);
    }
  };

  const handleConfigChange = (key, val) => {
    setApiConfig(prev => ({ ...prev, [key]: val }));
  };

  const handleBeginAssessment = (topicDetails) => {
    if (topicDetails.isCustom) {
      setCustomTopicData({
        name: topicDetails.name,
        explanation: topicDetails.explanation,
        keywords: topicDetails.keywords
      });
      setSelectedTopicId('custom');
    } else {
      setCustomTopicData(null);
      setSelectedTopicId(topicDetails.id);
    }
    setResults(null); // Clear previous results
    setPage('assessment'); // Switch to assessment workspace
  };

  // Perform assessment pipeline post request
  const runAssessment = async (audioBlobOrFile, isFile = false) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      if (isFile) {
        formData.append('file', audioBlobOrFile);
      } else {
        formData.append('file', audioBlobOrFile, 'speech.wav');
      }

      formData.append('topic_id', selectedTopicId);
      formData.append('api_provider', apiConfig.apiProvider);
      formData.append('gemini_api_key', apiConfig.geminiApiKey);
      formData.append('openai_api_key', apiConfig.openaiApiKey);
      formData.append('whisper_mode', apiConfig.whisperMode);
      formData.append('theme', theme);

      if (selectedTopicId === 'custom' && customTopicData) {
        formData.append('custom_topic_name', customTopicData.name);
        formData.append('custom_explanation', customTopicData.explanation);
        formData.append('custom_keywords', customTopicData.keywords);
      }

      const response = await fetch(`${BACKEND_URL}/api/assess`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed executing oral assessment.');
      }

      const data = await response.json();
      setResults(data);

      // Create history record
      const newRecord = {
        topic: data.topic_name,
        date: new Date().toLocaleString(),
        score: data.scorecard.overall_score,
        grade: data.scorecard.grade,
        classification: data.scorecard.classification,
        results: data
      };

      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('vbcua_history', JSON.stringify(updatedHistory));
      
      setPage('dashboard'); // Redirect to dashboard view
    } catch (err) {
      alert(`Assessment Pipeline Error: ${err.message}`);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Perform re-evaluation post request
  const handleReEvaluate = async (newTranscript) => {
    try {
      const payload = {
        transcript: newTranscript,
        topic_id: results.topic_id,
        audio_results: results.audio_results,
        api_provider: apiConfig.apiProvider,
        gemini_api_key: apiConfig.geminiApiKey,
        openai_api_key: apiConfig.openaiApiKey,
        theme: theme,
        wave_img_path: results.wave_img_path,
        spec_img_path: results.spec_img_path,
        pitch_img_path: results.pitch_img_path,
        radar_img_path: results.radar_img_path,
        pdf_report_path: results.pdf_report_path
      };

      const response = await fetch(`${BACKEND_URL}/api/re-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Re-evaluation failed.');
      }

      const data = await response.json();
      
      // Merge updated fields back into results
      const updatedResults = {
        ...results,
        scorecard: data.scorecard,
        semantic_results: data.semantic_results,
        nlp_results: data.nlp_results,
        ai_feedback: data.ai_feedback,
        radar_img_url: data.radar_img_url,
        pdf_report_url: data.pdf_report_url,
        radar_img_path: data.radar_img_path,
        pdf_report_path: data.pdf_report_path
      };
      
      setResults(updatedResults);

      // Update in history records list
      const updatedHistory = history.map(item => {
        if (item.results && item.results.pdf_report_url === results.pdf_report_url) {
          return {
            ...item,
            score: data.scorecard.overall_score,
            grade: data.scorecard.grade,
            classification: data.scorecard.classification,
            results: updatedResults
          };
        }
        return item;
      });
      setHistory(updatedHistory);
      localStorage.setItem('vbcua_history', JSON.stringify(updatedHistory));
    } catch (err) {
      alert(`Re-evaluation Error: ${err.message}`);
      console.error(err);
    }
  };

  const handleSelectRecord = (recordResults) => {
    setResults(recordResults);
    // Find active topic key
    setSelectedTopicId(recordResults.topic_id);
    setPage('dashboard');
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Get active topic data
  const getActiveTopicObj = () => {
    if (selectedTopicId === 'custom' && customTopicData) {
      return {
        name: customTopicData.name,
        reference_explanation: customTopicData.explanation,
        sub_concepts: [customTopicData.name],
        keywords: [customTopicData.name]
      };
    }
    return concepts.find(c => c.id === selectedTopicId) || {
      name: 'Unselected Topic',
      reference_explanation: '',
      sub_concepts: [],
      keywords: []
    };
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme} />

      {/* Global Config Settings Bar (Home & Assessment views) */}
      {(page === 'home' || page === 'assessment') && (
        <div className="container" style={{ paddingBottom: 0 }}>
          <div className="glass-card" style={{ padding: '0.85rem 1.25rem', borderRadius: '12px' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowSettings(!showSettings)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                <Settings size={16} className={showSettings ? 'animate-spin' : ''} />
                <span>AI Models & Keys Configuration</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Provider: {apiConfig.apiProvider} | Whisper: {apiConfig.whisperMode}</span>
                {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {showSettings && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-card)', paddingTop: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Feedback AI Provider</label>
                  <select 
                    className="form-control" 
                    value={apiConfig.apiProvider}
                    onChange={(e) => handleConfigChange('apiProvider', e.target.value)}
                  >
                    <option value="Gemini">Google Gemini-1.5</option>
                    <option value="OpenAI">OpenAI GPT-4o</option>
                    <option value="Local">Local Simulated Feedback</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Speech Whisper Mode</label>
                  <select 
                    className="form-control" 
                    value={apiConfig.whisperMode}
                    onChange={(e) => handleConfigChange('whisperMode', e.target.value)}
                  >
                    <option value="Local">Local CPU (Whisper Base)</option>
                    <option value="OpenAI">OpenAI API Whisper (Cloud)</option>
                  </select>
                </div>

                {apiConfig.apiProvider === 'Gemini' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Key size={12} /> Gemini API Key
                    </label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="AI_KEY_..."
                      value={apiConfig.geminiApiKey}
                      onChange={(e) => handleConfigChange('geminiApiKey', e.target.value)}
                    />
                  </div>
                )}

                {(apiConfig.apiProvider === 'OpenAI' || apiConfig.whisperMode === 'OpenAI') && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Key size={12} /> OpenAI API Key
                    </label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="sk-..."
                      value={apiConfig.openaiApiKey}
                      onChange={(e) => handleConfigChange('openaiApiKey', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {page === 'home' && (
          <HomeView
            concepts={concepts}
            selectedTopicId={selectedTopicId}
            setSelectedTopicId={setSelectedTopicId}
            onBeginAssessment={handleBeginAssessment}
          />
        )}

        {(page === 'assessment' || page === 'dashboard') && (
          <DashboardView
            topic={getActiveTopicObj()}
            results={results}
            isAnalyzing={isAnalyzing}
            onAudioSubmit={(blob) => runAssessment(blob, false)}
            onFileUpload={(file) => runAssessment(file, true)}
            onReEvaluate={handleReEvaluate}
            onBackToHome={() => {
              setResults(null);
              setPage('home');
            }}
            theme={theme}
          />
        )}

        {page === 'history' && (
          <HistoryView
            history={history}
            onSelectRecord={handleSelectRecord}
          />
        )}

        {page === 'faq' && <FaqView />}

        {page === 'about' && <AboutView />}

        {page === 'support' && <SupportView />}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-card)', padding: '1rem 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>&copy; {new Date().getFullYear()} Voice-Based Concept Understanding Analyser. All rights reserved.</p>
      </footer>
    </div>
  );
}

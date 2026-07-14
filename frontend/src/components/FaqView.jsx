import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FaqView() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: "How is the Overall Score calculated?",
      a: "The overall score uses a weighted scorecard mapping five assessment vectors: Semantic similarity with the topic explanation (40%), Speech Fluency (25%), Keyword Coverage (15%), Vocal Confidence (10%), and Sentiment/Emotional Delivery (10%)."
    },
    {
      q: "What Whisper model is used for local transcription?",
      a: "By default, the application runs the local 'base' OpenAI Whisper model. It provides excellent accuracy for standard English speech while executing fast on standard CPUs."
    },
    {
      q: "How does the Sentence-BERT semantic similarity model evaluate sub-concepts?",
      a: "We use SBERT (all-MiniLM-L6-v2) to extract embeddings for both the user's transcript sentences and the target sub-concepts. It calculates the pairwise cosine similarity and marks a sub-concept as covered if it exceeds a 50% semantic match threshold, allowing users to explain things in their own words."
    },
    {
      q: "What counts as a pause or hesitation?",
      a: "A pause is defined as an interval where the signal RMS energy drops below -32dB relative to peak vocal loudness, and lasts longer than 0.3 seconds. Short silences represent normal breathing, while long or frequent silences represent hesitation."
    },
    {
      q: "Can I use my own API keys?",
      a: "Yes! You can configure your own Gemini API Key or OpenAI API Key in the settings panel (located at the top configuration bar). The app will immediately use these models to generate customized, high-quality coaching reviews."
    }
  ];

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="container" style={{ maxWidth: '840px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
        <HelpCircle size={24} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>Frequently Asked Questions</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '2.5rem', lineHeight: '1.5' }}>
        Learn more about the scoring mechanisms, local models, and configurations of the Voice-Based Concept Understanding Analyser.
      </p>

      <div className="faq-accordion">
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div key={index} className="faq-item" style={{ 
              borderColor: isOpen ? 'var(--border-card-hover)' : 'var(--border-card)',
              boxShadow: isOpen ? '0 8px 30px -10px var(--shadow-card), 0 0 16px -4px var(--glow-color)' : 'none',
              transform: isOpen ? 'translateY(-1px)' : 'none'
            }}>
              <button 
                className="faq-trigger" 
                onClick={() => toggleFaq(index)}
                style={{
                  color: isOpen ? 'var(--primary)' : 'var(--text-main)',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <span style={{ fontWeight: '700' }}>{faq.q}</span>
                {isOpen ? <ChevronUp size={18} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={18} />}
              </button>
              {isOpen && (
                <div className="faq-panel" style={{
                  borderTop: '1px solid var(--border-card)',
                  paddingTop: '1.25rem',
                  marginTop: '0px',
                  backgroundColor: 'rgba(255, 255, 255, 0.005)'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

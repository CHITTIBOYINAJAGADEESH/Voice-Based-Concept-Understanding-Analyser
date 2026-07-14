# Voice-Based Concept Understanding Analyser (VBCUA)

Voice-Based Concept Understanding Analyser (VBCUA) is an advanced web diagnostic platform that evaluates technical explanations of engineering and academic concepts. By combining real-time speech signal processing, semantic representation matching, and natural language scoring, VBCUA provides immediate feedback, acoustic analysis, and customized coaching.

---

## 🌟 Key Features

1. **Acoustic Speech Analysis (Librosa)**
   - Extracts pitch contours (F0 using YIN algorithm) and Zero-Crossing Rates (ZCR).
   - Detects silence profiles and hesitations using RMS energy thresholding.
   - Calculates verbal pacing (Words Per Minute) and filters standard speech fillers (e.g., "um", "like", "ah").

2. **Semantic Concept Mapping (Sentence-BERT)**
   - Utilizes local Sentence-BERT (`all-MiniLM-L6-v2`) embeddings to calculate cosine similarity between transcripts and reference academic guidelines.
   - Automatically tracks coverage of critical engineering sub-concepts, allowing users to explain concepts in their own words.

3. **NLP & Sentiment Evaluation (NLTK)**
   - Computes Flesch-Kincaid readability indices.
   - Measures speech sentiment scores (VADER sentiment analysis) to track confidence and tone.

4. **Premium React Interface**
   - Built on Vite + React with custom glassmorphism styling.
   - Features a real-time HTML5 audio waveform visualizer.
   - High-fidelity dashboard displaying numeric scorecards, acoustic spectrogram charts, interactive transcript re-evaluation, and historical records.
   - **One-click PDF Report**: Generates technical summaries via ReportLab.

5. **Optimized Offline Capabilities**
   - Utilizes local Whisper `"tiny"` model for fast, CPU-efficient offline speech-to-text.
   - Bypasses system `ffmpeg` dependencies using native `soundfile` vector loaders.
   - Supports Gemini-1.5-Flash or GPT-4o-Mini cloud APIs when API keys are configured.

---

## ⚙️ Project Architecture

```
├── backend/                   # FastAPI Backend
│   ├── app.py                 # FastAPI application entrypoint & static routing
│   ├── reference_concepts.json # Predefined subject concepts database
│   ├── requirements.txt       # Python backend dependencies
│   ├── scripts/               # Migration scripts
│   └── utils/                 # Backend processing modules
│       ├── ai_feedback.py     # Gemini/OpenAI API & offline feedback rule engines
│       ├── audio_processor.py # Librosa DSP audio features & noise suppression
│       ├── auth.py            # User authentication helpers
│       ├── db.py              # MongoDB & GridFS handlers
│       ├── mail.py            # SMTP OTP mail helper
│       ├── nlp_analyzer.py    # NLTK tokenization & VADER sentiment analysis
│       ├── pdf_generator.py   # ReportLab PDF compile-and-layout engine
│       ├── scoring_engine.py  # Scorecard weights calculation
│       ├── semantic_analyzer.py # Sentence-Transformers cosine similarity
│       ├── transcriber.py     # Whisper Local & OpenAI transcription
│       └── visualizer.py      # Matplotlib chart generations
├── frontend/                  # React SPA (Vite + CSS + Lucide Icons)
│   ├── src/
│   │   ├── components/        # View dashboards, navbar, and voice recorders
│   │   ├── App.jsx            # State controller & API calls
│   │   └── index.css          # Design system tokens & global styling
│   └── dist/                  # Compiled production assets
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js v18 or higher
- npm

### 1. Backend Setup
Clone the repository and install the Python dependencies:
```bash
# Install packages
pip install -r requirements.txt

# Run the backend server
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Development (Optional)
If you wish to run the frontend in development mode with hot-reloading:
```bash
cd frontend
npm install
npm run dev
```

### 3. Production Build
To rebuild the frontend static distribution served by FastAPI:
```bash
cd frontend
npm run build
```
Once built, the production assets are automatically served from the FastAPI backend at `http://127.0.0.1:8000/`.

---

## 🔒 Configuration & API Settings
Expand the **AI Models & Keys Configuration** panel at the top of the workspace:
- **Local Simulated Mode**: Leave the API keys blank and set the provider to "Local". The system runs offline using local CPU models without external API calls.
- **Cloud Enhanced Mode**: Select **Gemini** or **OpenAI** and input your API key to generate premium technical speaking coaching reviews.

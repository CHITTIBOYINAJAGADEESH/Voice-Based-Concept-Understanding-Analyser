import os
import shutil
import uuid
import json
import tempfile
import datetime
import traceback
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Import custom pipelines
from utils.audio_processor import load_and_preprocess_audio, analyze_speech_signals
from utils.semantic_analyzer import analyze_concept_understanding
from utils.nlp_analyzer import analyze_nlp_text
from utils.scoring_engine import compile_scorecard
from utils.ai_feedback import generate_ai_coaching_feedback, generate_local_feedback
from utils.transcriber import transcribe_speech
from utils.visualizer import (
    generate_waveform_plot,
    generate_spectrogram_plot,
    generate_pitch_stability_plot,
    generate_radar_chart
)
from utils.pdf_generator import build_assessment_pdf

app = FastAPI(title="Voice-Based Concept Understanding Analyser (VBCUA) API")

# Configure CORS for frontend access (Vite development server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reference concept database path
DATABASE_PATH = "reference_concepts.json"

# In-memory concept database cache
concepts_db = {}

def load_concepts_db():
    global concepts_db
    if os.path.exists(DATABASE_PATH):
        try:
            with open(DATABASE_PATH, "r") as f:
                concepts_db = json.load(f)
        except Exception as e:
            print(f"Error loading reference database: {e}")
            concepts_db = {}
    return concepts_db

# Initialize database
load_concepts_db()

# Create temp directories for visualizer charts and reports
TEMP_OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "temp_outputs")
os.makedirs(TEMP_OUTPUTS_DIR, exist_ok=True)

# Mount static outputs folder
app.mount("/temp_outputs", StaticFiles(directory=TEMP_OUTPUTS_DIR), name="temp_outputs")

@app.get("/api/concepts")
def get_concepts():
    """
    Returns the pre-defined subject topics database.
    """
    load_concepts_db()
    # Format database into a clean list of options
    return [{"id": k, "name": v["name"], "sub_concepts": v.get("sub_concepts", []), "keywords": v.get("keywords", []), "reference_explanation": v.get("reference_explanation", "")} for k, v in concepts_db.items()]

@app.post("/api/assess")
async def assess_speech(
    file: UploadFile = File(...),
    topic_id: str = Form(...),
    api_provider: str = Form("Gemini"),
    gemini_api_key: Optional[str] = Form(""),
    openai_api_key: Optional[str] = Form(""),
    whisper_mode: str = Form("Local"),
    custom_topic_name: Optional[str] = Form(""),
    custom_explanation: Optional[str] = Form(""),
    custom_keywords: Optional[str] = Form(""),
    theme: str = Form("dark")
):
    """
    Core voice assessment pipeline:
    - Preprocesses speech audio.
    - Transcribes with Whisper (Local or API).
    - Extracts acoustic signal contours.
    - Evaluates semantic SBERT similarity.
    - Performs NLP and readability analyses.
    - Calculates the scorecard.
    - Queries AI feedback.
    - Generates plots and compiled PDF reports.
    """
    temp_audio_path = None
    try:
        # Create a unique run ID for static asset isolation
        run_uuid = uuid.uuid4().hex[:10]
        timestamp = int(datetime.datetime.now().timestamp())
        
        # 1. Save uploaded file to temp file
        file_suffix = os.path.splitext(file.filename)[1] if file.filename else ".wav"
        if not file_suffix:
            file_suffix = ".wav"
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix) as temp_audio:
            shutil.copyfileobj(file.file, temp_audio)
            temp_audio_path = temp_audio.name

        # 2. Check and handle Custom Topic creation
        global concepts_db
        if topic_id == "custom" and custom_topic_name and custom_explanation:
            # Sync key name
            custom_key = "custom_" + custom_topic_name.lower().replace(" ", "_")
            keywords_list = [k.strip() for k in custom_keywords.split(",") if k.strip()] if custom_keywords else []
            
            # Sync database
            concepts_db[custom_key] = {
                "name": custom_topic_name,
                "reference_explanation": custom_explanation,
                "sub_concepts": [custom_topic_name],
                "keywords": keywords_list
            }
            topic_id = custom_key
            
            # Persist custom topic to reference file
            try:
                with open(DATABASE_PATH, "w") as f:
                    json.dump(concepts_db, f, indent=4)
            except Exception as pe:
                print(f"Failed to persist custom topic: {pe}")

        # Retrieve selected concept reference details
        if topic_id not in concepts_db:
            raise HTTPException(status_code=400, detail=f"Invalid topic ID: {topic_id}")
            
        ref_data = concepts_db[topic_id]
        topic_name = ref_data["name"]

        # 3. Audio Preprocessing
        y_proc, sr_proc = load_and_preprocess_audio(temp_audio_path, target_sr=16000)
        if len(y_proc) == 0:
            raise HTTPException(status_code=400, detail="The uploaded audio file is empty or unreadable.")

        # Save preprocessed audio to static folder for playback
        audio_filename = f"audio_{timestamp}_{run_uuid}.wav"
        audio_save_path = os.path.join(TEMP_OUTPUTS_DIR, audio_filename)
        import soundfile as sf
        sf.write(audio_save_path, y_proc, sr_proc)

        # 4. Speech to Text Transcription
        active_api_key = openai_api_key if whisper_mode == "OpenAI" else ""
        try:
            transcript = transcribe_speech(temp_audio_path, provider=whisper_mode, api_key=active_api_key)
        except Exception as tr_err:
            print(f"Transcription failed: {tr_err}. Attempting Local Whisper fallback.")
            transcript = transcribe_speech(temp_audio_path, provider="Local")

        # 5. Acoustic Evaluation
        audio_results = analyze_speech_signals(y_proc, sr_proc, transcript=transcript)

        # 6. SBERT Concept Similarity
        semantic_results = analyze_concept_understanding(transcript, ref_data)
        semantic_results["transcript"] = transcript

        # 7. NLP & Lexical statistics
        nlp_results = analyze_nlp_text(transcript, ref_data["keywords"])

        # 8. Scorecard compilation
        scorecard = compile_scorecard(semantic_results, audio_results, nlp_results)

        # 9. AI Feedback Coach
        coach_api_key = gemini_api_key if api_provider == "Gemini" else openai_api_key
        ai_feedback = generate_ai_coaching_feedback(
            topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results,
            provider=api_provider, api_key=coach_api_key
        )

        # 10. Generate chart images in static outputs directory
        wave_filename = f"wave_{timestamp}_{run_uuid}.png"
        spec_filename = f"spec_{timestamp}_{run_uuid}.png"
        pitch_filename = f"pitch_{timestamp}_{run_uuid}.png"
        radar_filename = f"radar_{timestamp}_{run_uuid}.png"
        pdf_filename = f"report_{timestamp}_{run_uuid}.pdf"

        wave_path = os.path.join(TEMP_OUTPUTS_DIR, wave_filename)
        spec_path = os.path.join(TEMP_OUTPUTS_DIR, spec_filename)
        pitch_path = os.path.join(TEMP_OUTPUTS_DIR, pitch_filename)
        radar_path = os.path.join(TEMP_OUTPUTS_DIR, radar_filename)
        pdf_path = os.path.join(TEMP_OUTPUTS_DIR, pdf_filename)

        generate_waveform_plot(y_proc, sr_proc, audio_results["pauses"], wave_path, theme=theme)
        generate_spectrogram_plot(y_proc, sr_proc, spec_path, theme=theme)
        generate_pitch_stability_plot(audio_results["times"], audio_results["pitch_contour"], pitch_path, theme=theme)
        generate_radar_chart(scorecard["metrics"], radar_path, theme=theme)

        # 11. Build PDF report
        build_assessment_pdf(
            scorecard, semantic_results, audio_results, nlp_results, ai_feedback,
            topic_name, wave_path, radar_path, pdf_path
        )

        # Return relative API resource paths
        return {
            "success": True,
            "topic_id": topic_id,
            "topic_name": topic_name,
            "scorecard": scorecard,
            "semantic_results": semantic_results,
            "audio_results": {k: v for k, v in audio_results.items() if k not in ["pitch_contour", "rms_contour", "times"]},
            "nlp_results": nlp_results,
            "ai_feedback": ai_feedback,
            "wave_img_url": f"/temp_outputs/{wave_filename}",
            "spec_img_url": f"/temp_outputs/{spec_filename}",
            "pitch_img_url": f"/temp_outputs/{pitch_filename}",
            "radar_img_url": f"/temp_outputs/{radar_filename}",
            "pdf_report_url": f"/temp_outputs/{pdf_filename}",
            "audio_play_url": f"/temp_outputs/{audio_filename}",
            # Keep absolute paths for re-evaluation
            "wave_img_path": wave_path,
            "spec_img_path": spec_path,
            "pitch_img_path": pitch_path,
            "audio_play_path": audio_save_path
        }

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "detail": str(e), "traceback": traceback.format_exc()}
        )
    finally:
        # Clean up temporary uploaded file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception:
                pass

@app.post("/api/re-evaluate")
async def re_evaluate_transcript(payload: dict):
    """
    Re-runs SBERT, NLP and AI coaching feedback with modified transcript text.
    Regenerates the Radar spider plot and PDF report.
    """
    try:
        transcript = payload.get("transcript", "")
        topic_id = payload.get("topic_id", "")
        audio_results = payload.get("audio_results", {})
        api_provider = payload.get("api_provider", "Gemini")
        gemini_api_key = payload.get("gemini_api_key", "")
        openai_api_key = payload.get("openai_api_key", "")
        theme = payload.get("theme", "dark")

        # Visual paths for PDF compilation
        wave_path = payload.get("wave_img_path", "")
        radar_path = payload.get("radar_img_path", "")
        
        # Load database to verify topic
        global concepts_db
        load_concepts_db()
        if topic_id not in concepts_db:
            raise HTTPException(status_code=400, detail=f"Invalid topic ID: {topic_id}")
            
        ref_data = concepts_db[topic_id]
        topic_name = ref_data["name"]

        # 1. Re-analyze Semantic Coverage
        semantic_results = analyze_concept_understanding(transcript, ref_data)
        semantic_results["transcript"] = transcript

        # 2. Re-analyze NLP coverage
        nlp_results = analyze_nlp_text(transcript, ref_data["keywords"])

        # 3. Compile Scorecard
        scorecard = compile_scorecard(semantic_results, audio_results, nlp_results)

        # 4. Generate AI feedback coach
        coach_api_key = gemini_api_key if api_provider == "Gemini" else openai_api_key
        ai_feedback = generate_ai_coaching_feedback(
            topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results,
            provider=api_provider, api_key=coach_api_key
        )

        # 5. Regenerate Radar Plot
        run_uuid = uuid.uuid4().hex[:10]
        timestamp = int(datetime.datetime.now().timestamp())
        radar_filename = f"radar_{timestamp}_{run_uuid}.png"
        new_radar_path = os.path.join(TEMP_OUTPUTS_DIR, radar_filename)
        generate_radar_chart(scorecard["metrics"], new_radar_path, theme=theme)

        # Remove old radar image if it exists
        if radar_path and os.path.exists(radar_path):
            try:
                os.remove(radar_path)
            except Exception:
                pass

        # 6. Regenerate PDF Report
        pdf_filename = f"report_{timestamp}_{run_uuid}.pdf"
        new_pdf_path = os.path.join(TEMP_OUTPUTS_DIR, pdf_filename)
        build_assessment_pdf(
            scorecard, semantic_results, audio_results, nlp_results, ai_feedback,
            topic_name, wave_path, new_radar_path, new_pdf_path
        )

        # Clean up old PDF report
        old_pdf_path = payload.get("pdf_report_path", "")
        if old_pdf_path and os.path.exists(old_pdf_path):
            try:
                os.remove(old_pdf_path)
            except Exception:
                pass

        return {
            "success": True,
            "scorecard": scorecard,
            "semantic_results": semantic_results,
            "nlp_results": nlp_results,
            "ai_feedback": ai_feedback,
            "radar_img_url": f"/temp_outputs/{radar_filename}",
            "pdf_report_url": f"/temp_outputs/{pdf_filename}",
            "radar_img_path": new_radar_path,
            "pdf_report_path": new_pdf_path
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "detail": str(e), "traceback": traceback.format_exc()}
        )

# Mount React static files build if it exists
frontend_dist_path = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")
else:
    @app.get("/")
    def read_root():
        return {
            "message": "VBCUA API is online.",
            "frontend_status": "Development Mode. Please launch React dev server in the 'frontend' directory."
        }

# Catch-all handler for React Routing in production
@app.get("/{catchall:path}")
def serve_index(catchall: str):
    if catchall.startswith("api") or catchall.startswith("temp_outputs"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    index_file = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return JSONResponse(
        status_code=200,
        content={
            "message": f"API is online. Route '{catchall}' matched fallback.",
            "instructions": "Run Vite dev server for frontend dashboard UI."
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

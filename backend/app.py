import os
import shutil
import uuid
import json
import tempfile
import datetime
import traceback
import random
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from utils.db import db, save_file_to_db, download_file_from_db, get_file_from_db, delete_file_from_db
from utils.auth import hash_password, verify_password, create_access_token, get_current_user
from utils.mail import send_otp_email

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

# Configure CORS for frontend access
cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    parsed_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    if "*" in parsed_origins:
        cors_origins = ["*"]
    else:
        cors_origins.extend(parsed_origins)

# If wildcard '*' is in allowed origins, we must set allow_credentials to False to prevent Starlette from crashing.
# Since the frontend uses custom Authorization headers for tokens and not cookies, this is safe and functional.
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not allow_all,
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

# Pydantic Schemas for Authentication
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str

class UserVerify(BaseModel):
    email: str
    otp: str

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    password: str
    confirm_password: str

@app.post("/api/auth/register")
async def register(payload: UserRegister):
    email = payload.email.strip().lower()
    name = payload.name.strip()
    
    if not name or not email or not payload.password or not payload.confirm_password:
        raise HTTPException(status_code=400, detail="All fields are required")
        
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address format")
        
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    if db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    otp = f"{random.randint(100000, 999999)}"
    otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    pwd_hash = hash_password(payload.password)
    
    db.pending_users.update_one(
        {"email": email},
        {
            "$set": {
                "name": name,
                "password_hash": pwd_hash,
                "otp": otp,
                "otp_expiry": otp_expiry
            }
        },
        upsert=True
    )
    
    email_sent = send_otp_email(email, otp, purpose="registration")
    if not email_sent:
        print(f"\n[SMTP Fallback Alert] Failed to send verification email to {email}. OTP: {otp}\n")
        return {
            "success": True,
            "message": "OTP generated. (SMTP delivery failed; code displayed for convenience)",
            "otp_fallback": otp
        }
        
    return {"success": True, "message": "Verification OTP sent to email"}

@app.post("/api/auth/verify")
async def verify_otp(payload: UserVerify):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()
    
    pending = db.pending_users.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=404, detail="Registration session not found or expired")
        
    if pending["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    if datetime.datetime.utcnow() > pending["otp_expiry"]:
        raise HTTPException(status_code=400, detail="OTP code has expired")
        
    db.users.update_one(
        {"email": email},
        {
            "$set": {
                "name": pending["name"],
                "password_hash": pending["password_hash"],
                "created_at": datetime.datetime.utcnow()
            }
        },
        upsert=True
    )
    
    db.pending_users.delete_one({"email": email})
    
    return {"success": True, "message": "Email verified successfully. You can now login."}

@app.post("/api/auth/login")
async def login(payload: UserLogin):
    email = payload.email.strip().lower()
    password = payload.password
    
    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    token = create_access_token({"email": email, "name": user["name"]})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "name": user["name"],
            "email": email
        }
    }

@app.post("/api/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    email = payload.email.strip().lower()
    
    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Email is not registered")
        
    otp = f"{random.randint(100000, 999999)}"
    otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    db.users.update_one(
        {"email": email},
        {
            "$set": {
                "reset_otp": otp,
                "reset_otp_expiry": otp_expiry
            }
        }
    )
    
    email_sent = send_otp_email(email, otp, purpose="reset")
    if not email_sent:
        print(f"\n[SMTP Fallback Alert] Failed to send password reset email to {email}. OTP: {otp}\n")
        return {
            "success": True,
            "message": "Reset OTP generated. (SMTP delivery failed; code displayed for convenience)",
            "otp_fallback": otp
        }
        
    return {"success": True, "message": "Password reset OTP sent to email"}

@app.post("/api/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()
    
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    user = db.users.find_one({"email": email})
    if not user or "reset_otp" not in user or user["reset_otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid reset OTP or email")
        
    if datetime.datetime.utcnow() > user["reset_otp_expiry"]:
        raise HTTPException(status_code=400, detail="Reset OTP has expired")
        
    pwd_hash = hash_password(payload.password)
    
    db.users.update_one(
        {"email": email},
        {
            "$set": {
                "password_hash": pwd_hash
            },
            "$unset": {
                "reset_otp": "",
                "reset_otp_expiry": ""
            }
        }
    )
    
    return {"success": True, "message": "Password reset successfully"}

@app.get("/temp_outputs/{filename}")
async def serve_temp_output(filename: str):
    try:
        grid_out = get_file_from_db(filename)
        if not grid_out:
            raise HTTPException(status_code=404, detail="File not found in database")
        
        if filename.endswith(".png"):
            media_type = "image/png"
        elif filename.endswith(".wav"):
            media_type = "audio/wav"
        elif filename.endswith(".pdf"):
            media_type = "application/pdf"
        elif filename.endswith(".json"):
            media_type = "application/json"
        else:
            media_type = "application/octet-stream"
            
        return Response(content=grid_out.read(), media_type=media_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/concepts")
def get_concepts(current_user: dict = Depends(get_current_user)):
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
    theme: str = Form("dark"),
    current_user: dict = Depends(get_current_user)
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

        audio_filename = f"audio_{timestamp}_{run_uuid}.wav"
        wave_filename = f"wave_{timestamp}_{run_uuid}.png"
        spec_filename = f"spec_{timestamp}_{run_uuid}.png"
        pitch_filename = f"pitch_{timestamp}_{run_uuid}.png"
        radar_filename = f"radar_{timestamp}_{run_uuid}.png"
        pdf_filename = f"report_{timestamp}_{run_uuid}.pdf"

        with tempfile.TemporaryDirectory() as tmpdir:
            audio_save_path = os.path.join(tmpdir, audio_filename)
            import soundfile as sf
            sf.write(audio_save_path, y_proc, sr_proc)

            # 4. Speech to Text Transcription
            if whisper_mode == "OpenAI":
                active_api_key = openai_api_key
            elif whisper_mode == "Gemini":
                active_api_key = gemini_api_key
            else:
                active_api_key = ""

            try:
                transcript = transcribe_speech(temp_audio_path, provider=whisper_mode, api_key=active_api_key)
            except Exception as tr_err:
                print(f"Transcription failed: {tr_err}. Attempting Local Whisper fallback.")
                transcript = transcribe_speech(temp_audio_path, provider="Local")

            # 5. Acoustic Evaluation
            audio_results = analyze_speech_signals(y_proc, sr_proc, transcript=transcript)

            # Determine API Key for coach and semantic evaluation
            coach_api_key = gemini_api_key if api_provider == "Gemini" else openai_api_key

            # 6. SBERT / API Concept Similarity
            semantic_results = analyze_concept_understanding(transcript, ref_data, api_key=coach_api_key, provider=api_provider)
            semantic_results["transcript"] = transcript

            # 7. NLP & Lexical statistics
            nlp_results = analyze_nlp_text(transcript, ref_data["keywords"])

            # 8. Scorecard compilation
            scorecard = compile_scorecard(semantic_results, audio_results, nlp_results)

            # 9. AI Feedback Coach
            ai_feedback = generate_ai_coaching_feedback(
                topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results,
                provider=api_provider, api_key=coach_api_key
            )

            # 10. Generate chart images in temp directory
            wave_path = os.path.join(tmpdir, wave_filename)
            spec_path = os.path.join(tmpdir, spec_filename)
            pitch_path = os.path.join(tmpdir, pitch_filename)
            radar_path = os.path.join(tmpdir, radar_filename)
            pdf_path = os.path.join(tmpdir, pdf_filename)

            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                futures = [
                    executor.submit(generate_waveform_plot, y_proc, sr_proc, audio_results["pauses"], wave_path, theme=theme),
                    executor.submit(generate_spectrogram_plot, y_proc, sr_proc, spec_path, theme=theme),
                    executor.submit(generate_pitch_stability_plot, audio_results["times"], audio_results["pitch_contour"], pitch_path, theme=theme),
                    executor.submit(generate_radar_chart, scorecard["metrics"], radar_path, theme=theme)
                ]
                concurrent.futures.wait(futures)

            # 11. Build PDF report
            build_assessment_pdf(
                scorecard, semantic_results, audio_results, nlp_results, ai_feedback,
                topic_name, wave_path, radar_path, pdf_path
            )

            # Save all files to MongoDB GridFS
            save_file_to_db(audio_filename, audio_save_path, "audio/wav")
            save_file_to_db(wave_filename, wave_path, "image/png")
            save_file_to_db(spec_filename, spec_path, "image/png")
            save_file_to_db(pitch_filename, pitch_path, "image/png")
            save_file_to_db(radar_filename, radar_path, "image/png")
            save_file_to_db(pdf_filename, pdf_path, "application/pdf")

        # Save assessment results to MongoDB collection linked to user
        assessment_record = {
            "user_email": current_user["email"],
            "topic_id": topic_id,
            "topic_name": topic_name,
            "date": datetime.datetime.now().strftime("%Y-%m-%d %I:%M:%S %p"),
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
            "wave_img_path": wave_filename,
            "spec_img_path": spec_filename,
            "pitch_img_path": pitch_filename,
            "audio_play_path": audio_filename,
            "pdf_report_path": pdf_filename,
            "created_at": datetime.datetime.utcnow()
        }
        db.assessments.insert_one(assessment_record)

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
            "wave_img_path": wave_filename,
            "spec_img_path": spec_filename,
            "pitch_img_path": pitch_filename,
            "audio_play_path": audio_filename,
            "pdf_report_path": pdf_filename
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
async def re_evaluate_transcript(payload: dict, current_user: dict = Depends(get_current_user)):
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

        # Filenames instead of local absolute paths
        wave_filename = payload.get("wave_img_path", "")
        radar_filename = payload.get("radar_img_path", "")
        
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
        new_radar_filename = f"radar_{timestamp}_{run_uuid}.png"
        new_pdf_filename = f"report_{timestamp}_{run_uuid}.pdf"

        with tempfile.TemporaryDirectory() as tmpdir:
            # Download old waveform image from GridFS to a temp file
            temp_wave_path = os.path.join(tmpdir, "wave.png")
            try:
                download_file_from_db(wave_filename, temp_wave_path)
            except Exception as e:
                print(f"Could not download waveform image {wave_filename}: {e}")
                temp_wave_path = ""

            temp_radar_path = os.path.join(tmpdir, new_radar_filename)
            generate_radar_chart(scorecard["metrics"], temp_radar_path, theme=theme)

            temp_pdf_path = os.path.join(tmpdir, new_pdf_filename)
            build_assessment_pdf(
                scorecard, semantic_results, audio_results, nlp_results, ai_feedback,
                topic_name, temp_wave_path, temp_radar_path, temp_pdf_path
            )

            # Save the new files to MongoDB GridFS
            save_file_to_db(new_radar_filename, temp_radar_path, "image/png")
            save_file_to_db(new_pdf_filename, temp_pdf_path, "application/pdf")

        # Delete old radar image from DB if it exists
        if radar_filename:
            try:
                delete_file_from_db(radar_filename)
            except Exception:
                pass

        # Delete old PDF report from DB if it exists
        old_pdf_filename = payload.get("pdf_report_path", "")
        if old_pdf_filename:
            try:
                delete_file_from_db(old_pdf_filename)
            except Exception:
                pass

        # Update matching assessment record in MongoDB
        if old_pdf_filename:
            db.assessments.update_one(
                {"pdf_report_path": old_pdf_filename, "user_email": current_user["email"]},
                {
                    "$set": {
                        "scorecard": scorecard,
                        "semantic_results": semantic_results,
                        "nlp_results": nlp_results,
                        "ai_feedback": ai_feedback,
                        "radar_img_url": f"/temp_outputs/{new_radar_filename}",
                        "pdf_report_url": f"/temp_outputs/{new_pdf_filename}",
                        "radar_img_path": new_radar_filename,
                        "pdf_report_path": new_pdf_filename
                    }
                }
            )

        return {
            "success": True,
            "scorecard": scorecard,
            "semantic_results": semantic_results,
            "nlp_results": nlp_results,
            "ai_feedback": ai_feedback,
            "radar_img_url": f"/temp_outputs/{new_radar_filename}",
            "pdf_report_url": f"/temp_outputs/{new_pdf_filename}",
            "radar_img_path": new_radar_filename,
            "pdf_report_path": new_pdf_filename
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "detail": str(e), "traceback": traceback.format_exc()}
        )

@app.get("/api/assessments")
def get_user_assessments(current_user: dict = Depends(get_current_user)):
    """
    Retrieves all historical assessment records completed by the current logged-in user.
    """
    records = list(db.assessments.find({"user_email": current_user["email"]}).sort("created_at", -1))
    
    # Convert ObjectIds to strings
    for r in records:
        r["_id"] = str(r["_id"])
        if "created_at" in r:
            # Delete or convert datetime objects to string
            r["created_at"] = r["created_at"].isoformat()
            
    return records

class FAQCreate(BaseModel):
    q: str
    a: str

@app.get("/api/faqs")
def get_faqs():
    """
    Retrieves all user-submitted FAQs from MongoDB.
    """
    try:
        custom_faqs = list(db.faqs.find({}, {"_id": 0}))
        # Sort by creation date or keep natural insertion order
        return {"success": True, "faqs": custom_faqs}
    except Exception as e:
        return {"success": False, "detail": str(e)}

@app.post("/api/faqs")
def create_faq(payload: FAQCreate, current_user: dict = Depends(get_current_user)):
    """
    Submits a new user FAQ, persisting it in MongoDB.
    """
    q = payload.q.strip()
    a = payload.a.strip()
    if not q or not a:
        raise HTTPException(status_code=400, detail="Question and Answer cannot be empty")
    
    faq_doc = {
        "q": q,
        "a": a,
        "created_by": current_user["email"],
        "created_at": datetime.datetime.utcnow()
    }
    try:
        db.faqs.insert_one(faq_doc)
        return {"success": True, "message": "FAQ submitted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Unhandled exception handler to return clean JSON errors and prevent React JSON parser crashes
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Unhandled error: {exc}")
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": "Internal Server Error",
            "error": str(exc)
        }
    )

@app.get("/api/health")
def health_check():
    mongo_status = "Unknown"
    mongo_error = None
    
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    censored_uri = uri
    try:
        from urllib.parse import urlparse
        parsed = urlparse(uri)
        if parsed.password:
            censored_uri = uri.replace(parsed.password, "******")
    except Exception:
        pass

    try:
        from utils.db import client
        # Force a quick query to test connection
        client.admin.command('ping')
        mongo_status = "Connected"
    except Exception as e:
        mongo_status = "Error"
        mongo_error = str(e)
        
    return {
        "status": "online",
        "mongodb": {
            "status": mongo_status,
            "uri": censored_uri,
            "error": mongo_error
        }
    }


# Mount React static files build if it exists
frontend_dist_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
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

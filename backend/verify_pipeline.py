import os
import json
import numpy as np
import soundfile as sf
from utils.audio_processor import load_and_preprocess_audio, analyze_speech_signals
from utils.semantic_analyzer import analyze_concept_understanding
from utils.nlp_analyzer import analyze_nlp_text
from utils.scoring_engine import compile_scorecard
from utils.ai_feedback import generate_local_feedback
from utils.visualizer import (
    generate_waveform_plot,
    generate_spectrogram_plot,
    generate_pitch_stability_plot,
    generate_radar_chart
)
from utils.pdf_generator import build_assessment_pdf

def generate_synthetic_audio(filename, duration=5.0, sr=16000):
    """
    Generates a synthetic audio file (a clean sine wave with a simulated pause in the middle)
    to test the audio processing pipeline.
    """
    t = np.linspace(0, duration, int(sr * duration))
    # Create 2 seconds of sound, 1 second of silence, 2 seconds of sound
    mask = np.ones_like(t)
    mask[int(sr * 2.0):int(sr * 3.0)] = 0.0 # silence/pause block
    
    # 440Hz sine wave modulated by the pause mask
    y = 0.5 * np.sin(2 * np.pi * 440 * t) * mask
    sf.write(filename, y, sr)
    print(f"Generated synthetic test audio: {filename}")

def run_pipeline_test():
    print("="*60)
    print("STARTING VBCUA PIPELINE INTEGRATION TEST")
    print("="*60)
    
    test_audio = "temp_test_audio.wav"
    test_pdf = "verify_report.pdf"
    
    # Clean up old files
    for f in [test_audio, test_pdf, "test_wave.png", "test_spec.png", "test_pitch.png", "test_radar.png"]:
        if os.path.exists(f):
            os.remove(f)
            
    try:
        # 1. Generate Audio
        generate_synthetic_audio(test_audio, duration=5.0, sr=16000)
        
        # 2. Load and Preprocess Audio
        print("1. Loading and preprocessing audio...")
        y, sr = load_and_preprocess_audio(test_audio, target_sr=16000)
        assert len(y) > 0, "Preprocessed audio signal is empty!"
        
        # 3. Analyze Speech Signals
        mock_transcript = "Machine learning is a subset of artificial intelligence. It focuses on algorithms that learn from data and improve over time without explicit programming. It includes supervised and unsupervised learning models."
        print("2. Running speech signal analysis...")
        audio_results = analyze_speech_signals(y, sr, transcript=mock_transcript)
        
        print(f"   - Duration: {audio_results['duration']}s")
        print(f"   - Pauses found: {audio_results['pause_count']}")
        print(f"   - Speaking Speed: {audio_results['speaking_speed_wpm']} WPM")
        print(f"   - Fluency Score: {audio_results['fluency_score']}")
        print(f"   - Confidence Score: {audio_results['confidence_score']}")
        
        # 4. Load Predefined Concepts & Run Semantic Analysis
        print("3. Performing semantic concept matching...")
        with open("reference_concepts.json", "r") as f:
            concepts = json.load(f)
        ml_ref = concepts["machine_learning"]
        
        semantic_results = analyze_concept_understanding(mock_transcript, ml_ref)
        semantic_results["transcript"] = mock_transcript # attach transcript for visualizer/pdf
        print(f"   - Semantic Similarity Score: {semantic_results['semantic_score']}")
        print(f"   - Covered sub-concepts: {len(semantic_results['covered_concepts'])} / {len(ml_ref['sub_concepts'])}")
        
        # 5. Run NLP Analysis
        print("4. Executing NLP word counting and Sentiment Analysis...")
        nlp_results = analyze_nlp_text(mock_transcript, ml_ref["keywords"])
        print(f"   - Sentiment: {nlp_results['sentiment']} (Compound: {nlp_results['sentiment_details']['compound']})")
        print(f"   - Keyword Score: {nlp_results['keyword_score']}%")
        print(f"   - Readability: {nlp_results['readability']['readability_label']}")
        
        # 6. Compile Scorecard
        print("5. Compiling scorecard...")
        scorecard = compile_scorecard(semantic_results, audio_results, nlp_results)
        print(f"   - Overall Grade: {scorecard['grade']} ({scorecard['classification']} - Score: {scorecard['overall_score']})")
        
        # 7. Generate local fallback coaching feedback
        print("6. Creating localized AI coaching feedback...")
        ai_feedback = generate_local_feedback("Machine Learning", mock_transcript, scorecard, semantic_results, audio_results, nlp_results)
        print(f"   - Strengths: {len(ai_feedback['strengths'])} items")
        print(f"   - Suggestions: {len(ai_feedback['suggestions'])} items")
        
        # 8. Generate visualizer plots
        print("7. Plotting visualizations...")
        generate_waveform_plot(y, sr, audio_results["pauses"], "test_wave.png", theme="dark")
        generate_spectrogram_plot(y, sr, "test_spec.png", theme="dark")
        generate_pitch_stability_plot(audio_results["times"], audio_results["pitch_contour"], "test_pitch.png", theme="dark")
        generate_radar_chart(scorecard["metrics"], "test_radar.png", theme="dark")
        
        assert os.path.exists("test_wave.png"), "Waveform plot not created!"
        assert os.path.exists("test_spec.png"), "Spectrogram plot not created!"
        assert os.path.exists("test_pitch.png"), "Pitch plot not created!"
        assert os.path.exists("test_radar.png"), "Radar plot not created!"
        print("   - All charts generated successfully.")
        
        # 9. Build ReportLab PDF
        print("8. Compiling ReportLab PDF report...")
        build_assessment_pdf(
            scorecard,
            semantic_results,
            audio_results,
            nlp_results,
            ai_feedback,
            "Machine Learning",
            "test_wave.png",
            "test_radar.png",
            test_pdf
        )
        
        assert os.path.exists(test_pdf), "PDF report not created!"
        assert os.path.getsize(test_pdf) > 0, "PDF report is empty!"
        print(f"   - PDF report successfully generated: {test_pdf} ({round(os.path.getsize(test_pdf)/1024, 1)} KB)")
        
        print("="*60)
        print("E2E PIPELINE INTEGRATION TEST PASSED SUCCESSFULLY!")
        print("="*60)
        
    except Exception as e:
        print("="*60)
        print(f"FATAL ERROR DURING INTEGRATION TEST: {e}")
        import traceback
        traceback.print_exc()
        print("="*60)
    finally:
        # Clean up files
        for f in [test_audio, "test_wave.png", "test_spec.png", "test_pitch.png", "test_radar.png"]:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception:
                    pass

if __name__ == "__main__":
    run_pipeline_test()

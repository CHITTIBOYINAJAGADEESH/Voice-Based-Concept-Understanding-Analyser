import os
import re
import numpy as np
import librosa
import soundfile as sf

def load_and_preprocess_audio(audio_path, target_sr=16000):
    """
    Loads audio file and downsamples it to target sample rate.
    Handles noise reduction by basic spectral subtraction and normalizes volume.
    """
    try:
        y, sr = librosa.load(audio_path, sr=target_sr)
    except Exception as e:
        # Fallback using soundfile if librosa fail
        data, file_sr = sf.read(audio_path)
        if len(data.shape) > 1:
            data = np.mean(data, axis=1) # convert to mono
        y = librosa.resample(data, orig_sr=file_sr, target_sr=target_sr)
        sr = target_sr
        
    if len(y) == 0:
        return y, sr

    # 1. Volume Normalization (Peak normalization to -1dB)
    max_val = np.max(np.abs(y))
    if max_val > 0:
        y = y / max_val * 0.9

    # 2. Simple Spectral Gating / Noise Suppression
    # Estimate noise from the quietest 10% frames of the signal
    stft = librosa.stft(y)
    stft_db = librosa.amplitude_to_db(np.abs(stft), ref=np.max)
    # Threshold for noise (quietest frames)
    mean_db = np.mean(stft_db, axis=0)
    noise_thresh = np.percentile(mean_db, 15)
    noise_frames = np.where(mean_db <= noise_thresh)[0]
    
    if len(noise_frames) > 0:
        noise_profile = np.mean(np.abs(stft[:, noise_frames]), axis=1, keepdims=True)
        # Spectral subtraction
        stft_clean = np.maximum(np.abs(stft) - 1.2 * noise_profile, 0.0) * np.exp(1j * np.angle(stft))
        y_clean = librosa.istft(stft_clean)
        # Ensure lengths match
        if len(y_clean) > len(y):
            y_clean = y_clean[:len(y)]
        elif len(y_clean) < len(y):
            y_clean = np.pad(y_clean, (0, len(y) - len(y_clean)))
        y = y_clean

    return y, sr

def analyze_speech_signals(y, sr, transcript=""):
    """
    Performs speech analysis using librosa features.
    Extracts RMS, Pitch (YIN), ZCR, pauses, speaking rate, and filler words.
    """
    duration = librosa.get_duration(y=y, sr=sr)
    if duration == 0:
        return {
            "duration": 0, "pause_count": 0, "pause_duration": 0, "pause_ratio": 0,
            "speaking_speed_wpm": 0, "pitch_mean": 0, "pitch_std": 0, "rms_mean": 0,
            "zcr_mean": 0, "filler_count": 0, "fluency_score": 0, "confidence_score": 0,
            "clarity_score": 0, "pauses": [], "pitch_contour": [], "rms_contour": []
        }

    # 1. RMS Energy Contour
    hop_length = 512
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    times = librosa.times_like(rms, sr=sr, hop_length=hop_length)

    # 2. Pause & Silence Detection
    # Frame duration is hop_length / sr (approx 32ms at 16kHz)
    frame_dur = hop_length / sr
    rms_db = librosa.amplitude_to_db(rms, ref=np.max)
    # Threshold for silence: -32dB relative to peak energy
    silence_threshold_db = -32.0
    
    is_silent = rms_db < silence_threshold_db
    
    # Identify contiguous blocks of silence that are longer than 0.3 seconds
    pauses = []
    in_pause = False
    pause_start = 0
    
    for idx, silent in enumerate(is_silent):
        current_time = times[idx]
        if silent and not in_pause:
            in_pause = True
            pause_start = current_time
        elif not silent and in_pause:
            in_pause = False
            pause_dur = current_time - pause_start
            if pause_dur >= 0.3: # Min 300ms to count as hesitation pause
                pauses.append({"start": pause_start, "end": current_time, "duration": pause_dur})
    
    # Check if we ended in a pause
    if in_pause:
        pause_dur = duration - pause_start
        if pause_dur >= 0.3:
            pauses.append({"start": pause_start, "end": duration, "duration": pause_dur})

    pause_count = len(pauses)
    total_pause_duration = sum(p["duration"] for p in pauses)
    pause_ratio = total_pause_duration / duration if duration > 0 else 0

    # 3. Speaking Speed (WPM)
    word_count = len(transcript.split()) if transcript else 0
    speaking_duration_mins = (duration - total_pause_duration) / 60.0
    if speaking_duration_mins > 0:
        speaking_speed_wpm = word_count / speaking_duration_mins
    else:
        speaking_speed_wpm = 0

    # 4. Pitch Contour (YIN)
    # Pitch bounds for speech (50Hz to 400Hz)
    try:
        f0 = librosa.yin(y=y, sr=sr, fmin=50, fmax=400, hop_length=hop_length)
        # Zero out pitch in silent frames
        f0[is_silent] = 0.0
    except Exception:
        f0 = np.zeros_like(rms)

    valid_pitches = f0[f0 > 0]
    pitch_mean = float(np.mean(valid_pitches)) if len(valid_pitches) > 0 else 0.0
    pitch_std = float(np.std(valid_pitches)) if len(valid_pitches) > 0 else 0.0

    # 5. Zero-Crossing Rate (Clarity metric)
    zcr = librosa.feature.zero_crossing_rate(y=y, hop_length=hop_length)[0]
    zcr_mean = float(np.mean(zcr))

    # 6. Filler Words Counting (Regex based check)
    fillers = ["um", "uh", "like", "actually", "basically", "you know", "sort of", "literally"]
    filler_count = 0
    if transcript:
        # Lowercase and clean punctuation
        cleaned_text = re.sub(r'[^\w\s]', '', transcript.lower())
        words = cleaned_text.split()
        for word in words:
            if word in fillers:
                filler_count += 1
        # Also catch two-word fillers like "you know", "sort of"
        full_text = " " + cleaned_text + " "
        if " you know " in full_text:
            filler_count += full_text.count(" you know ") - full_text.count(" you know ") * 0.5 # balance counts
        if " sort of " in full_text:
            filler_count += full_text.count(" sort of ") - full_text.count(" sort of ") * 0.5

    # 7. Fluency Score (0 - 100)
    # Deduct points for excessive pause ratio and bad speaking speed
    # Optimal pause ratio is 10%-25%. Optimal WPM is 120-160.
    fluency_score = 100.0
    
    # Deductions for pause ratio
    if pause_ratio > 0.35:
        fluency_score -= (pause_ratio - 0.35) * 100.0 # heavy penalty for long pauses
    elif pause_ratio < 0.05 and word_count > 5:
        fluency_score -= 10.0 # penalty for speaking like a robot without breathing

    # Deductions for speaking speed
    if word_count > 0:
        if speaking_speed_wpm < 90:
            fluency_score -= (90 - speaking_speed_wpm) * 0.6
        elif speaking_speed_wpm > 170:
            fluency_score -= (speaking_speed_wpm - 170) * 0.4
            
    # Deductions for filler words
    if word_count > 0:
        filler_ratio = filler_count / word_count
        if filler_ratio > 0.03:
            fluency_score -= (filler_ratio - 0.03) * 300.0 # penalty for lots of fillers

    fluency_score = max(10, min(100, fluency_score))

    # 8. Confidence Score (0 - 100)
    # Higher confidence: low pitch standard deviation (flat/monotone represents boredom, but excessive jitter shows nerves)
    # Jitter represents rapid pitch change. Pitch stability: low std is good, but too low is monotone.
    confidence_score = 100.0
    
    # Average speech pitch stability (nerves cause pitch fluctuations)
    if pitch_std > 50:
        confidence_score -= (pitch_std - 50) * 0.3
    elif pitch_std < 10 and pitch_std > 0:
        confidence_score -= 15.0 # penalty for completely monotone voice
        
    # Penalty for pause count (nerves lead to frequent hesitation pauses)
    if duration > 0:
        pauses_per_min = pause_count / (duration / 60.0)
        if pauses_per_min > 12:
            confidence_score -= (pauses_per_min - 12) * 1.5
            
    # Volume dynamics (very quiet speech shows lower confidence)
    rms_mean = float(np.mean(rms))
    if rms_mean < 0.02:
        confidence_score -= 20.0
        
    # Deduct for filler words in confidence too
    if filler_count > 3:
        confidence_score -= (filler_count - 3) * 3.0

    confidence_score = max(10, min(100, confidence_score))

    # 9. Clarity Score (0 - 100)
    # Based on ZCR range and RMS levels (mumbling is quiet and has lower zero crossings)
    clarity_score = 100.0
    if zcr_mean < 0.03:
        clarity_score -= 15.0 # Mumbling detection
    elif zcr_mean > 0.25:
        clarity_score -= 10.0 # Excessive sibilance or background hiss
        
    if rms_mean < 0.015:
        clarity_score -= 20.0 # Too quiet to hear details clearly
        
    clarity_score = max(10, min(100, clarity_score))

    return {
        "duration": float(duration),
        "pause_count": int(pause_count),
        "pause_duration": float(total_pause_duration),
        "pause_ratio": float(pause_ratio),
        "speaking_speed_wpm": float(speaking_speed_wpm),
        "pitch_mean": float(pitch_mean),
        "pitch_std": float(pitch_std),
        "rms_mean": float(rms_mean),
        "zcr_mean": float(zcr_mean),
        "filler_count": int(filler_count),
        "fluency_score": float(fluency_score),
        "confidence_score": float(confidence_score),
        "clarity_score": float(clarity_score),
        "pauses": pauses,
        "pitch_contour": f0.tolist(),
        "rms_contour": rms.tolist(),
        "times": times.tolist()
    }

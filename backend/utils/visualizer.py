import os
import numpy as np
from matplotlib.figure import Figure
import librosa

def get_theme_colors(theme="dark"):
    if theme == "dark":
        return {
            "facecolor": '#1E293B',
            "axcolor": '#0F172A',
            "textcolor": '#F8FAFC',
            "labelcolor": '#94A3B8',
            "edgecolor": '#334155',
            "gridcolor": '#334155'
        }
    else:
        return {
            "facecolor": '#FFFFFF',
            "axcolor": '#F8FAFC',
            "textcolor": '#0F172A',
            "labelcolor": '#475569',
            "edgecolor": '#E2E8F0',
            "gridcolor": '#F1F5F9'
        }

def generate_waveform_plot(y, sr, pauses, save_path, theme="dark"):
    """
    Generates a wave plot highlighting silent/pause blocks in red.
    """
    c = get_theme_colors(theme)
    fig = Figure(figsize=(10, 3.5), dpi=90, facecolor=c["facecolor"])
    ax = fig.subplots()
    ax.set_facecolor(c["axcolor"])
    
    # Decimate audio for fast rendering (keep ~4000 points)
    decimate_factor = max(1, len(y) // 4000)
    y_plot = y[::decimate_factor]
    time_axis = np.linspace(0, len(y) / sr, num=len(y_plot))
    
    ax.plot(time_axis, y_plot, color='#06B6D4', alpha=0.8, linewidth=1, label="Vocal Waveform")
    
    # Highlight pauses
    for i, p in enumerate(pauses):
        label = "Hesitation Pause" if i == 0 else ""
        ax.axvspan(p["start"], p["end"], color='#EF4444', alpha=0.3, label=label)
        
    ax.set_title("Speech Waveform & Pause Distribution", fontsize=11, fontweight='bold', pad=12, color=c["textcolor"])
    ax.set_xlabel("Time (Seconds)", fontsize=9, color=c["labelcolor"])
    ax.set_ylabel("Amplitude", fontsize=9, color=c["labelcolor"])
    ax.tick_params(colors=c["labelcolor"], labelsize=8)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(c["edgecolor"])
    ax.spines['bottom'].set_color(c["edgecolor"])
    
    ax.grid(True, linestyle='--', alpha=0.4, color=c["gridcolor"])
    if pauses:
        ax.legend(loc="upper right", framealpha=0.3, fontsize=8, labelcolor=c["textcolor"])
        
    fig.savefig(save_path, transparent=True, bbox_inches='tight')

def generate_spectrogram_plot(y, sr, save_path, theme="dark"):
    """
    Generates a Short-time Fourier Transform (STFT) decibel spectrogram.
    Optimized with fast imshow rendering and larger hop size.
    """
    c = get_theme_colors(theme)
    hop_length = 1024
    stft = librosa.stft(y, hop_length=hop_length)
    stft_db = librosa.amplitude_to_db(np.abs(stft), ref=np.max)
    
    fig = Figure(figsize=(10, 3.5), dpi=90, facecolor=c["facecolor"])
    ax = fig.subplots()
    ax.set_facecolor(c["axcolor"])
    
    duration = len(y) / sr
    img = ax.imshow(stft_db, origin='lower', aspect='auto', cmap='magma' if theme=='dark' else 'viridis',
                    extent=[0, duration, 0, sr/2])
    
    ax.set_title("Spectrogram (Frequency Energy Distribution)", fontsize=11, fontweight='bold', pad=12, color=c["textcolor"])
    ax.set_xlabel("Time (Seconds)", fontsize=9, color=c["labelcolor"])
    ax.set_ylabel("Frequency (Hz)", fontsize=9, color=c["labelcolor"])
    ax.tick_params(colors=c["labelcolor"], labelsize=8)
    ax.set_ylim(0, 8000) # Show frequencies up to 8kHz (standard speech)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(c["edgecolor"])
    ax.spines['bottom'].set_color(c["edgecolor"])
    
    cbar = fig.colorbar(img, ax=ax, format="%+2.f dB")
    cbar.ax.tick_params(labelsize=8, colors=c["labelcolor"])
    cbar.outline.set_visible(False)
    
    fig.savefig(save_path, transparent=True, bbox_inches='tight')

def generate_pitch_stability_plot(times, pitch_contour, save_path, theme="dark"):
    """
    Plots the fundamental frequency F0 over time to track speech tone stability.
    """
    c = get_theme_colors(theme)
    fig = Figure(figsize=(10, 3.5), dpi=90, facecolor=c["facecolor"])
    ax = fig.subplots()
    ax.set_facecolor(c["axcolor"])
    
    times_arr = np.array(times)
    pitch_arr = np.array(pitch_contour)
    voiced_mask = pitch_arr > 0
    
    if np.sum(voiced_mask) > 0:
        # Decimate points if there are too many (e.g. > 2000 points) to speed up rendering
        decimate_factor = max(1, np.sum(voiced_mask) // 2000)
        t_plot = times_arr[voiced_mask][::decimate_factor]
        p_plot = pitch_arr[voiced_mask][::decimate_factor]
        
        ax.scatter(t_plot, p_plot, color='#7C3AED', s=4, alpha=0.75, label="Vocal Pitch (F0)")
        ax.plot(t_plot, p_plot, color='#7C3AED', alpha=0.3, linewidth=0.8)
    else:
        ax.text(0.5, 0.5, "No Voiced Pitch Detected", transform=ax.transAxes, ha='center', va='center', color=c["textcolor"])

    ax.set_title("Pitch (F0 Contour) & Vocal Stability", fontsize=11, fontweight='bold', pad=12, color=c["textcolor"])
    ax.set_xlabel("Time (Seconds)", fontsize=9, color=c["labelcolor"])
    ax.set_ylabel("Pitch Frequency (Hz)", fontsize=9, color=c["labelcolor"])
    ax.set_ylim(40, 350)
    ax.tick_params(colors=c["labelcolor"], labelsize=8)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(c["edgecolor"])
    ax.spines['bottom'].set_color(c["edgecolor"])
    ax.grid(True, linestyle='--', alpha=0.4, color=c["gridcolor"])
    
    fig.savefig(save_path, transparent=True, bbox_inches='tight')

def generate_radar_chart(metrics, save_path, theme="dark"):
    """
    Draws a 5-axis spider/radar chart displaying the composite score components.
    """
    c = get_theme_colors(theme)
    categories = ['Semantic', 'Fluency', 'Keywords', 'Confidence', 'Sentiment']
    scores = [
        metrics['semantic']['score'],
        metrics['fluency']['score'],
        metrics['keywords']['score'],
        metrics['confidence']['score'],
        metrics['sentiment']['score']
    ]
    
    N = len(categories)
    values = scores + [scores[0]]
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += [angles[0]]
    
    fig = Figure(figsize=(5, 5), dpi=90, facecolor='none')
    ax = fig.add_subplot(111, polar=True)
    
    # We set custom polar ticks and labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, color=c["textcolor"], size=9, fontweight='bold')
    
    ax.set_rlabel_position(0)
    ax.set_rticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(["20", "40", "60", "80", "100"], color='#64748B', size=7)
    ax.set_ylim(0, 100)
    
    ax.plot(angles, values, color='#7C3AED', linewidth=2, linestyle='solid', label="Current Profile")
    ax.fill(angles, values, color='#06B6D4', alpha=0.3)
    
    ax.spines['polar'].set_color(c["gridcolor"])
    ax.grid(color=c["gridcolor"], linestyle='--', linewidth=0.5)
    
    fig.savefig(save_path, transparent=True, bbox_inches='tight')

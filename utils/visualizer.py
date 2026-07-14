import os
import numpy as np
import matplotlib.pyplot as plt
import librosa
import librosa.display

def setup_matplotlib_theme(theme="dark"):
    """
    Configure modern, high-contrast matplotlib styles for premium dashboards.
    """
    if theme == "dark":
        plt.style.use('dark_background')
        params = {
            'text.color': '#F8FAFC',
            'axes.labelcolor': '#94A3B8',
            'axes.edgecolor': '#334155',
            'xtick.color': '#64748B',
            'ytick.color': '#64748B',
            'grid.color': '#334155',
            'figure.facecolor': '#1E293B',
            'axes.facecolor': '#0F172A',
            'font.family': 'sans-serif'
        }
    else: # Light theme
        plt.style.use('default')
        params = {
            'text.color': '#0F172A',
            'axes.labelcolor': '#475569',
            'axes.edgecolor': '#E2E8F0',
            'xtick.color': '#94A3B8',
            'ytick.color': '#94A3B8',
            'grid.color': '#F1F5F9',
            'figure.facecolor': '#FFFFFF',
            'axes.facecolor': '#F8FAFC',
            'font.family': 'sans-serif'
        }
    plt.rcParams.update(params)

def generate_waveform_plot(y, sr, pauses, save_path, theme="dark"):
    """
    Generates a wave plot highlighting silent/pause blocks in red.
    """
    setup_matplotlib_theme(theme)
    fig, ax = plt.subplots(figsize=(10, 3.5), dpi=150)
    
    # Draw waveform
    time_axis = np.linspace(0, len(y) / sr, num=len(y))
    ax.plot(time_axis, y, color='#06B6D4', alpha=0.8, linewidth=1, label="Vocal Waveform")
    
    # Highlight pauses
    for i, p in enumerate(pauses):
        label = "Hesitation Pause" if i == 0 else ""
        ax.axvspan(p["start"], p["end"], color='#EF4444', alpha=0.3, label=label)
        
    ax.set_title("Speech Waveform & Pause Distribution", fontsize=11, fontweight='bold', pad=12)
    ax.set_xlabel("Time (Seconds)", fontsize=9)
    ax.set_ylabel("Amplitude", fontsize=9)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(True, linestyle='--', alpha=0.4)
    if pauses:
        ax.legend(loc="upper right", framealpha=0.3, fontsize=8)
        
    plt.tight_layout()
    plt.savefig(save_path, transparent=True, bbox_inches='tight')
    plt.close()

def generate_spectrogram_plot(y, sr, save_path, theme="dark"):
    """
    Generates a Short-time Fourier Transform (STFT) decibel spectrogram.
    """
    setup_matplotlib_theme(theme)
    fig, ax = plt.subplots(figsize=(10, 3.5), dpi=150)
    
    # Calculate spectrogram
    stft = librosa.stft(y)
    stft_db = librosa.amplitude_to_db(np.abs(stft), ref=np.max)
    
    img = librosa.display.specshow(stft_db, sr=sr, x_axis='time', y_axis='linear', ax=ax, cmap='magma' if theme=='dark' else 'viridis')
    
    ax.set_title("Spectrogram (Frequency Energy Distribution)", fontsize=11, fontweight='bold', pad=12)
    ax.set_xlabel("Time (Seconds)", fontsize=9)
    ax.set_ylabel("Frequency (Hz)", fontsize=9)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Add colorbar
    cbar = fig.colorbar(img, ax=ax, format="%+2.f dB")
    cbar.ax.tick_params(labelsize=8)
    cbar.outline.set_visible(False)
    
    plt.tight_layout()
    plt.savefig(save_path, transparent=True, bbox_inches='tight')
    plt.close()

def generate_pitch_stability_plot(times, pitch_contour, save_path, theme="dark"):
    """
    Plots the fundamental frequency F0 over time to track speech tone stability.
    """
    setup_matplotlib_theme(theme)
    fig, ax = plt.subplots(figsize=(10, 3.5), dpi=150)
    
    times_arr = np.array(times)
    pitch_arr = np.array(pitch_contour)
    
    # Only plot positive pitches (skip unvoiced segments)
    voiced_mask = pitch_arr > 0
    
    if np.sum(voiced_mask) > 0:
        ax.scatter(times_arr[voiced_mask], pitch_arr[voiced_mask], color='#7C3AED', s=4, alpha=0.75, label="Vocal Pitch (F0)")
        # Smooth line
        ax.plot(times_arr[voiced_mask], pitch_arr[voiced_mask], color='#7C3AED', alpha=0.3, linewidth=0.8)
    else:
        ax.text(0.5, 0.5, "No Voiced Pitch Detected", transform=ax.transAxes, ha='center', va='center')

    ax.set_title("Pitch (F0 Contour) & Vocal Stability", fontsize=11, fontweight='bold', pad=12)
    ax.set_xlabel("Time (Seconds)", fontsize=9)
    ax.set_ylabel("Pitch Frequency (Hz)", fontsize=9)
    ax.set_ylim(40, 350)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(True, linestyle='--', alpha=0.4)
    
    plt.tight_layout()
    plt.savefig(save_path, transparent=True, bbox_inches='tight')
    plt.close()

def generate_radar_chart(metrics, save_path, theme="dark"):
    """
    Draws a 5-axis spider/radar chart displaying the composite score components.
    """
    setup_matplotlib_theme(theme)
    
    # Extract values
    categories = ['Semantic', 'Fluency', 'Keywords', 'Confidence', 'Sentiment']
    scores = [
        metrics['semantic']['score'],
        metrics['fluency']['score'],
        metrics['keywords']['score'],
        metrics['confidence']['score'],
        metrics['sentiment']['score']
    ]
    
    # Number of variables
    N = len(categories)
    
    # We need to repeat the first value at the end to close the circular loop
    values = scores + [scores[0]]
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += [angles[0]]
    
    fig = plt.figure(figsize=(5, 5), dpi=150, facecolor='none')
    # Polar coordinate system for spider plots
    ax = fig.add_subplot(111, polar=True)
    
    # Grid color based on theme
    grid_color = '#334155' if theme == 'dark' else '#CBD5E1'
    text_color = '#F8FAFC' if theme == 'dark' else '#0F172A'
    
    # Draw one axis per variable + add labels
    plt.xticks(angles[:-1], categories, color=text_color, size=9, fontweight='bold')
    
    # Draw ylabels
    ax.set_rlabel_position(0)
    plt.yticks([20, 40, 60, 80, 100], ["20", "40", "60", "80", "100"], color='#64748B', size=7)
    plt.ylim(0, 100)
    
    # Plot data
    ax.plot(angles, values, color='#7C3AED', linewidth=2, linestyle='solid', label="Current Profile")
    # Fill area
    ax.fill(angles, values, color='#06B6D4', alpha=0.3)
    
    # Customize grid appearance
    ax.spines['polar'].set_color(grid_color)
    ax.grid(color=grid_color, linestyle='--', linewidth=0.5)
    
    plt.tight_layout()
    plt.savefig(save_path, transparent=True, bbox_inches='tight')
    plt.close()

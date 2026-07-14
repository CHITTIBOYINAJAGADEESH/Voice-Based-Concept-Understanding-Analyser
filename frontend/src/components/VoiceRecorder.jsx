import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, RotateCcw, Trash2, Send, Mic } from 'lucide-react';

export default function VoiceRecorder({ onAudioSubmit, theme }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [status, setStatus] = useState('Ready to record');

  // Refs for Web Audio API nodes
  const audioContextRef = useRef(null);
  const processorNodeRef = useRef(null);
  const inputSourceRef = useRef(null);
  const micStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Refs for accumulation
  const audioBuffersRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const savedWavBlobRef = useRef(null);
  const isPausedRef = useRef(false);

  // Constants
  const RECORD_SAMPLE_RATE = 16000;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Resize canvas when ref changes
  useEffect(() => {
    drawFlatline();
  }, [canvasRef.current, theme]);

  const drawFlatline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = theme === 'dark' ? '#1e293b' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const cleanupAudio = () => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    processorNodeRef.current = null;
    inputSourceRef.current = null;
    audioContextRef.current = null;
    micStreamRef.current = null;
  };

  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const startRecording = async () => {
    try {
      cleanupAudio();
      setAudioUrl(null);
      savedWavBlobRef.current = null;
      audioBuffersRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      inputSourceRef.current = audioContext.createMediaStreamSource(stream);
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      inputSourceRef.current.connect(analyser);

      // Create processor node for capturing raw audio chunks
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;
      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        audioBuffersRef.current.push(new Float32Array(inputData));
      };

      inputSourceRef.current.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setIsPaused(false);
      isPausedRef.current = false;
      setStatus('🎙️ Live Recording Active...');
      startTimer();
      visualize();
    } catch (err) {
      console.error('Mic access denied:', err);
      setStatus('⚠️ Microphone access denied! Please enable permissions.');
    }
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
      setStatus('🎙️ Live Recording Active...');
      timerIntervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      setStatus('⏸️ Recording paused');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setStatus('⚡ Compiling speech signal...');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const mergedSamples = mergeBuffers(audioBuffersRef.current);
    const nativeSampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
    cleanupAudio();
    drawFlatline();

    if (mergedSamples.length === 0) {
      setStatus('⚠️ No audio captured.');
      return;
    }

    // Downsample and encode WAV
    setTimeout(() => {
      const downsampled = downsampleBuffer(mergedSamples, nativeSampleRate, RECORD_SAMPLE_RATE);
      const wavView = encodeWAV(downsampled, RECORD_SAMPLE_RATE);
      const wavBlob = new Blob([wavView], { type: 'audio/wav' });
      savedWavBlobRef.current = wavBlob;

      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      setStatus('✨ Speech recording compiled successfully!');
    }, 100);
  };

  const restartRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    drawFlatline();
    startRecording();
  };

  const deleteAudio = () => {
    setAudioUrl(null);
    savedWavBlobRef.current = null;
    audioBuffersRef.current = [];
    setSeconds(0);
    setStatus('Ready to record');
    drawFlatline();
  };

  const submitAudio = () => {
    if (savedWavBlobRef.current) {
      setStatus('📤 Sending speech signal to assessment pipeline...');
      onAudioSubmit(savedWavBlobRef.current, seconds);
    }
  };

  // Visualizer loop
  const visualize = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Recheck states
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      if (isPausedRef.current) return;

      analyser.getByteTimeDomainData(dataArray);
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      
      // Beautiful linear gradient for waves
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#14b8a6');
      grad.addColorStop(0.5, '#6366f1');
      grad.addColorStop(1, '#d946ef');
      ctx.strokeStyle = grad;

      ctx.beginPath();
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    };

    draw();
  };

  // Helper functions for downsampling & WAV encoding
  const mergeBuffers = (buffers) => {
    let totalLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      totalLength += buffers[i].length;
    }
    let result = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      result.set(buffers[i], offset);
      offset += buffers[i].length;
    }
    return result;
  };

  const downsampleBuffer = (buffer, inputSampleRate, outputSampleRate) => {
    if (inputSampleRate === outputSampleRate) return buffer;
    const ratio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);
    return view;
  };

  const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const formatTime = (secs) => {
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const rSecs = String(secs % 60).padStart(2, '0');
    return `${mins}:${rSecs}`;
  };

  return (
    <div className="recorder-card">
      <div className={`recorder-timer ${isRecording && !isPaused ? 'recording' : ''}`}>
        {formatTime(seconds)}
      </div>

      <div className="recorder-visualizer-container">
        <canvas ref={canvasRef} className="recorder-canvas"></canvas>
      </div>

      <div className={`recorder-status ${isRecording && !isPaused ? 'recording' : ''} ${audioUrl ? 'success' : ''}`}>
        {status}
      </div>

      <div className="recorder-controls">
        <button
          className="recorder-btn recorder-btn-restart"
          onClick={restartRecording}
          disabled={!isRecording}
          title="Restart Recording"
        >
          <RotateCcw size={18} />
        </button>

        {!isRecording && !audioUrl ? (
          <button
            className="recorder-btn recorder-btn-record"
            onClick={startRecording}
            title="Start Recording"
          >
            <Mic size={24} />
          </button>
        ) : isRecording ? (
          <button
            className={`recorder-btn recorder-btn-record ${!isPaused ? 'recording' : ''}`}
            disabled
          >
            <Mic size={24} />
          </button>
        ) : null}

        <button
          className="recorder-btn recorder-btn-pause"
          onClick={togglePause}
          disabled={!isRecording}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>

        <button
          className="recorder-btn recorder-btn-stop"
          onClick={stopRecording}
          disabled={!isRecording}
          title="Stop & Save"
        >
          <Square size={18} />
        </button>
      </div>

      {audioUrl && (
        <div className="recorder-playback-container">
          <audio src={audioUrl} controls className="recorder-audio" />
          <div className="recorder-playback-actions">
            <button
              className="btn-premium btn-secondary"
              onClick={deleteAudio}
              style={{ flex: 1 }}
            >
              <Trash2 size={16} /> Delete
            </button>
            <button
              className="btn-premium btn-primary"
              onClick={submitAudio}
              style={{ flex: 1 }}
            >
              <Send size={16} /> Submit Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

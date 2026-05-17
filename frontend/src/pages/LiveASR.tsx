import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Activity, 
  Languages, 
  User as UserIcon,
  HelpCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { getPOIs, createClaim, analyzeClaim } from '../services/api';
import type { POI } from '../services/api';
import { cn } from '../utils/cn';

export function LiveASR() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-NG');
  const [selectedPOI, setSelectedPOI] = useState<number | ''>('');
  const [pois, setPois] = useState<POI[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Audio references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const languages = [
    { code: 'en-NG', name: 'English (Nigeria)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'ha-NG', name: 'Hausa (Nigeria)' },
    { code: 'yo-NG', name: 'Yoruba (Nigeria)' },
    { code: 'ig-NG', name: 'Igbo (Nigeria)' },
    { code: 'pcm-NG', name: 'Nigerian Pidgin' },
  ];

  // Check browser SpeechRecognition support and load POIs
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    const fetchPOIs = async () => {
      try {
        const data = await getPOIs();
        setPois(data);
        if (data.length > 0) {
          setSelectedPOI(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load POIs:", err);
      }
    };
    fetchPOIs();

    // Draw baseline
    drawStandbyBaseline();

    return () => {
      stopVisualizer();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const drawStandbyBaseline = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvas.parentElement?.clientWidth || 600;
        canvas.height = 100;
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
    }
  };

  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; // Smaller fft for smooth cyber wave bars
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = 100;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const draw = () => {
        if (!analyserRef.current) return;
        animationFrameRef.current = requestAnimationFrame(draw);
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = '#020617'; // Slate 950 dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 0.8;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const rawHeight = dataArray[i];
          // Scale it beautifully
          const barHeight = (rawHeight / 255) * canvas.height * 0.85 + 2;
          
          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, 'rgba(99, 102, 241, 0.1)'); // Indigo base
          grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.8)'); // Indigo pulsing center
          grad.addColorStop(1, 'rgba(139, 92, 246, 1)'); // Violet glowing tip
          
          ctx.fillStyle = grad;
          
          // Center the bars vertically
          const yPos = (canvas.height - barHeight) / 2;
          
          // Draw smooth rounded bars
          ctx.beginPath();
          ctx.roundRect(x, yPos, barWidth, barHeight, 4);
          ctx.fill();
          
          x += barWidth + 6;
        }
      };
      
      draw();
    } catch (e) {
      console.error("Failed to start AudioContext visualizer:", e);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    analyserRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    drawStandbyBaseline();
  };

  const startRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setTranscript('');
    setInterimTranscript('');
    setAnalysisResult(null);

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = selectedLanguage;

    rec.onstart = () => {
      setIsRecording(true);
      startVisualizer();
    };

    rec.onresult = (e: any) => {
      let finalStr = '';
      let interimStr = '';
      
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalStr += e.results[i][0].transcript;
        } else {
          interimStr += e.results[i][0].transcript;
        }
      }
      
      if (finalStr) {
        setTranscript(prev => (prev + ' ' + finalStr).trim());
      }
      setInterimTranscript(interimStr);
    };

    rec.onerror = (err: any) => {
      console.error("ASR engine error:", err);
      if (err.error === 'not-allowed') {
        alert("Microphone permission denied. Please grant browser access to your mic.");
      }
    };

    rec.onend = () => {
      setIsRecording(false);
      stopVisualizer();
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleRegisterClaim = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) {
      alert("Capture queue is empty. Speak into the microphone to transcribe first.");
      return null;
    }
    if (!selectedPOI) {
      alert("Please select a Persona Subject to file this claim under.");
      return null;
    }

    setIsSubmitting(true);
    try {
      const claim = await createClaim({
        poi_id: Number(selectedPOI),
        description: fullText,
        status: 'ongoing',
        confidence: 0.5,
      });
      return claim;
    } catch (e) {
      console.error("Claim creation error:", e);
      alert("Failed to submit claim. Ensure backend connection.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIAnalysisScan = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) {
      alert("ASR transcript is empty. Record some audio first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // 1. Submit claim to DB first
      const claim = await handleRegisterClaim();
      if (!claim) return;

      // 2. Call OpenAI analyzer on claim
      const analysis = await analyzeClaim(fullText, claim.id);
      setAnalysisResult(analysis);
    } catch (e) {
      console.error("AI deep analysis failed:", e);
      alert("OpenAI validation engine failed to scan this transcript.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetConsole = () => {
    setTranscript('');
    setInterimTranscript('');
    setAnalysisResult(null);
  };

  const getCombinedText = () => {
    return (transcript + ' ' + interimTranscript).trim();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider border-l-4 border-indigo-500 pl-4 py-1">
            Live Ingestion & ASR Console
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium">
            Real-time election intelligence capturing and live audio translation signals.
          </p>
        </div>
      </div>

      {!isSupported && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6 text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Browser Speech API Unsupported</h4>
            <p className="text-xs font-medium mt-1 leading-relaxed">
              Your current web browser does not support native HTML5 Speech Recognition APIs. For the best real-time ASR experience (supporting Hausa, Yoruba, Igbo, Pidgin), please load Fact Checker AI inside **Google Chrome, Microsoft Edge, or Safari**.
            </p>
          </div>
        </div>
      )}

      {/* Main Console Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls and Soundwave */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium relative overflow-hidden bg-[#020617] border-slate-800 text-white p-6 sm:p-8">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[60px] pointer-events-none" />

            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
              Capture Core Configurations
            </h3>

            <div className="space-y-6 relative z-10">
              {/* Spoken Language Dropdown */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <Languages className="h-3.5 w-3.5 text-indigo-400" />
                  Spoken Dialect & Language
                </label>
                <select
                  disabled={isRecording}
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 px-4 py-3 text-xs font-bold text-slate-300 transition-all focus:outline-none focus:border-indigo-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-300">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target POI Dropdown */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                  Target Monitored Subject (POI)
                </label>
                {pois.length > 0 ? (
                  <select
                    value={selectedPOI}
                    onChange={(e) => setSelectedPOI(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 px-4 py-3 text-xs font-bold text-slate-300 transition-all focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" className="bg-slate-950 text-slate-300">-- Select Persona --</option>
                    {pois.map((poi) => (
                      <option key={poi.id} value={poi.id} className="bg-slate-950 text-slate-300">
                        {poi.name} {poi.location ? `(${poi.location})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 italic py-2">
                    No active POIs found. Please add a subject in Subjects tab first.
                  </div>
                )}
              </div>

              {/* Glowing Soundwave canvas */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Microphone Ingestion Frequency
                  </label>
                  {isRecording && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Capturing
                    </span>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-inner">
                  <canvas ref={canvasRef} className="w-full h-[100px] block" />
                </div>
              </div>

              {/* Capture Control Button */}
              {isSupported && (
                <button
                  type="button"
                  onClick={isRecording ? stopRecognition : startRecognition}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-black uppercase tracking-widest text-xs shadow-lg transition-all duration-300 active:scale-[0.98]",
                    isRecording 
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white border border-rose-500/30 animate-pulse"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 text-white border border-indigo-400/20"
                  )}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4.5 w-4.5" />
                      Deactivate Capture
                    </>
                  ) : (
                    <>
                      <Mic className="h-4.5 w-4.5" />
                      Activate Capture
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live ASR Output and Downstream actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Transcript box */}
          <div className="card-premium flex flex-col justify-between min-h-[450px] relative overflow-hidden bg-white dark:bg-zinc-900">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  ASR Real-Time Transcript Queue
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    Words: {getCombinedText() ? getCombinedText().split(/\s+/).length : 0} | Chars: {getCombinedText().length}
                  </span>
                  <button 
                    onClick={handleResetConsole}
                    disabled={isRecording || !getCombinedText()}
                    className="text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Text Output display */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950 p-6 min-h-[260px] max-h-[300px] overflow-y-auto font-medium text-slate-700 dark:text-slate-200 leading-relaxed scrollbar-custom text-sm">
                {getCombinedText() ? (
                  <p>
                    {transcript}
                    {interimTranscript && (
                      <span className="text-indigo-500 dark:text-indigo-400 italic bg-indigo-500/5 px-1 rounded animate-pulse">
                        {interimTranscript}
                      </span>
                    )}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                    <Mic className="h-12 w-12 text-slate-400 mb-4 animate-bounce" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Mic standby. Press Activate Capture to stream.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                type="button"
                disabled={isRecording || !getCombinedText() || isSubmitting || isAnalyzing}
                onClick={handleRegisterClaim}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Database className="h-3.5 w-3.5" />
                )}
                Register Claim
              </button>

              <button
                type="button"
                disabled={isRecording || !getCombinedText() || isSubmitting || isAnalyzing}
                onClick={handleAIAnalysisScan}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                AI Verification Scan
              </button>
            </div>
          </div>

          {/* AI In-console verification results */}
          {analysisResult && (
            <div className="card-premium border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5 p-6 sm:p-8 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4 mb-4">
                <div className="rounded-xl p-2 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
                    Live Claim AI Verification Signal Complete
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    Analyzed in sync with GPT Factual Abstraction Core
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="md:col-span-1 text-center border-b md:border-b-0 md:border-r border-emerald-500/10 pb-6 md:pb-0 pr-0 md:pr-6">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Status Verdict</p>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    analysisResult.status === 'fulfilled' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                    analysisResult.status === 'partial' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    analysisResult.status === 'unfulfilled' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {analysisResult.status}
                  </span>
                  
                  <div className="mt-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence Rating</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {(analysisResult.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Fact-Check Insight</p>
                  <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                    {analysisResult.ai_insight}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

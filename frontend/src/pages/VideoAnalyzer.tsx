import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, ScanLine, FastForward, Film, Lock, Activity } from 'lucide-react';
import { analyzeDeepfakeVideo, getDeepfakeStatus } from '../services/api';
import { cn } from '../utils/cn';

export function VideoAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaId, setMediaId] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Polling for status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'processing' && mediaId) {
      interval = setInterval(async () => {
        try {
          const res = await getDeepfakeStatus(mediaId);
          if (res.deepfake_status === 'completed') {
            setConfidence(res.deepfake_confidence);
            setStatus('completed');
          } else if (res.deepfake_status === 'error') {
            setStatus('error');
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, mediaId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      const res = await analyzeDeepfakeVideo(file);
      setMediaId(res.id);
      setStatus('processing');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = confidence !== null ? circumference - (confidence / 100) * circumference : circumference;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-[#020617] rounded-3xl p-8 border border-slate-800/60 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-indigo-500/10 rotate-12 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-50%] left-[-10%] w-[40%] h-[150%] bg-blue-500/10 rotate-12 blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div>
             <h1 className="text-3xl font-black text-white tracking-tight uppercase border-l-4 border-indigo-500 pl-4 py-1">AI Video Analyzer</h1>
             <p className="mt-2 text-slate-400 font-medium pl-5 max-w-2xl text-sm">
                Utilize advanced neural networks to verify digital authenticity. Upload suspect media to detect adversarial generative artifacts.
             </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Upload Area */}
            <div className={cn(
              "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all duration-300 relative bg-slate-900/40 backdrop-blur-sm",
              dragActive ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]" : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40",
              (status === 'uploading' || status === 'processing') && "opacity-50 pointer-events-none"
            )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="video/*,image/*"
                onChange={handleChange}
                disabled={status === 'uploading' || status === 'processing'}
              />
              
              <div className="h-20 w-20 rounded-full bg-slate-800/80 flex items-center justify-center mb-6 shadow-xl border border-slate-700/50 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-10 w-10 text-indigo-400" />
              </div>

              {file ? (
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-white flex items-center justify-center gap-2">
                    <Film className="h-5 w-5 text-indigo-400" />
                    {file.name}
                  </p>
                  <p className="text-sm text-slate-400 font-medium">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for inspection
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-bold text-white">Drag & drop compromised media here</p>
                  <p className="text-sm text-slate-400 font-medium mt-2">or click to browse secure local files</p>
                </div>
              )}

              {file && status === 'idle' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                  className="mt-8 relative overflow-hidden rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center gap-3 z-20 group"
                >
                   <ScanLine className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" /> 
                   Initiate Scan
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </button>
              )}
            </div>

            {/* Analysis Results / Status Area */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800/60 shadow-xl relative min-h-[400px]">
              
              {status === 'idle' && (
                <div className="text-center opacity-40">
                  <Lock className="h-16 w-16 mx-auto text-slate-500 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Awaiting Signal</p>
                </div>
              )}

              {(status === 'uploading' || status === 'processing') && (
                <div className="text-center px-4">
                  <div className="relative h-40 w-40 mx-auto mb-8">
                     <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
                     <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                     <div className="absolute inset-4 rounded-full border-4 border-blue-500/20" />
                     <div className="absolute inset-4 rounded-full border-4 border-blue-500 border-t-transparent animate-spin direction-reverse" style={{ animationDirection: 'reverse' }} />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="h-10 w-10 text-indigo-400 animate-pulse" />
                     </div>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
                    {status === 'uploading' ? 'Uplinking Media' : 'Analyzing Signatures'}
                  </h3>
                  <p className="text-sm text-slate-400 font-bold mt-3 max-w-xs mx-auto">
                    Scanning for generative artifacts, anomalous frame blending, and facial topology distortions utilizing external Sightengine intelligence.
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center">
                  <div className="h-24 w-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] border border-red-500/30">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest text-red-400">Analysis Failed</h3>
                  <p className="text-slate-400 font-medium mt-2 text-sm max-w-xs mx-auto">
                    The intelligence pipeline encountered an error processing this request. Please try again or verify Sightengine configuration.
                  </p>
                  <button 
                    onClick={() => { setStatus('idle'); setFile(null); setConfidence(null); }}
                    className="mt-6 text-sm font-bold text-indigo-400 hover:text-indigo-300 tracking-wider uppercase"
                  >
                    RESET MODULE
                  </button>
                </div>
              )}

              {status === 'completed' && confidence !== null && (
                <div className="text-center w-full animate-in fade-in zoom-in duration-500">
                  <div className="relative h-56 w-56 mx-auto mb-8 flex items-center justify-center">
                    <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-slate-800 stroke-current"
                        strokeWidth="8"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                      ></circle>
                      <circle
                        className={cn(
                          "stroke-current transition-all duration-1500 ease-out",
                          confidence > 80 ? "text-red-500" : confidence > 50 ? "text-amber-500" : "text-emerald-500"
                        )}
                        strokeWidth="8"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      ></circle>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={cn(
                        "text-5xl font-black tracking-tighter drop-shadow-lg",
                        confidence > 80 ? "text-white" : confidence > 50 ? "text-white" : "text-white"
                      )}>
                        {confidence.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Deepfake Confidence</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 inline-block w-full max-w-sm">
                     <p className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-slate-700/50 pb-2">Verdict</p>
                     {confidence > 80 ? (
                       <p className="text-red-400 font-bold text-sm">Critical Alert. High probability of generative manipulation detected. This media is severely compromised.</p>
                     ) : confidence > 50 ? (
                       <p className="text-amber-400 font-bold text-sm">Warning. Proceed with caution. Intermediate probability of manipulation or heavy editing.</p>
                     ) : (
                       <p className="text-emerald-400 font-bold text-sm">Clear. Negligible signs of generative manipulation. Authentic media probable.</p>
                     )}
                  </div>
                  
                  <div className="mt-8">
                     <button 
                        onClick={() => { setStatus('idle'); setFile(null); setConfidence(null); }}
                        className="text-xs font-black text-indigo-400 hover:text-indigo-300 tracking-[0.1em] uppercase flex items-center justify-center gap-2 mx-auto"
                      >
                        <FastForward className="h-4 w-4" /> Process Next Target
                      </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

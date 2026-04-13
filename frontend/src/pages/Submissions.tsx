import { useState } from 'react';
import { useMedia, useClaims } from '../hooks/useQueries';
import { 
  Plus, 
  FileText, 
  Play, 
  Image as ImageIcon, 
  File as FileIcon,
  Loader2,
  Search,
  History,
  CheckCircle2,
  AlertCircle,
  Database,
  Activity,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AddToPOIModal } from '../components/ui/AddToPOIModal';
import { cn } from '../utils/cn';
import { getMediaUrl } from '../utils/url';
import { analyzeMedia } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function Submissions() {
  const { data: mediaItems, isLoading } = useMedia();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddClaimModal, setShowAddClaimModal] = useState(false);
  const [selectedClaimText, setSelectedClaimText] = useState('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: (mediaId: number) => analyzeMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setAnalyzingId(null);
    },
    onError: (err: any) => {
      setAnalyzingId(null);
      const detail = err?.response?.data?.detail || 'AI extraction failed. Check OpenAI key or file path.';
      setAnalyzeError(detail);
      setTimeout(() => setAnalyzeError(null), 6000);
    }
  });

  const filteredMedia = mediaItems?.filter((m: any) => 
    m.file_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.transcription_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-6 animate-pulse">
        <Activity className="h-16 w-16 text-indigo-500 animate-spin" />
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Scanning Signal Feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Error Toast */}
      {analyzeError && (
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up bg-rose-900/90 border border-rose-500/40 text-rose-200 text-sm font-bold px-6 py-4 rounded-2xl shadow-xl max-w-md backdrop-blur-sm">
          <AlertCircle className="inline h-4 w-4 mr-2 text-rose-400" />
          {analyzeError}
        </div>
      )}

      {/* Header Intel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Layers className="h-4 w-4 text-indigo-500" />
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Material Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Signal Processor</h1>
          <p className="mt-4 text-sm font-medium text-slate-500 max-w-xl leading-relaxed">
            Raw media ingest from mobile and desktop endpoints. Automated AI transcription and claim extraction protocols are active.
          </p>
        </div>
        
        <div className="flex-shrink-0 w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search Signal Archive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-12 pr-6 text-sm font-medium transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50"
            />
          </div>
        </div>
      </div>

      {!filteredMedia?.length ? (
        <div className="rounded-[40px] border-2 border-dashed border-slate-800 bg-slate-900/40 p-24 text-center">
          <Database className="h-16 w-16 mx-auto mb-6 text-slate-700 opacity-50" />
          <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider">Feed Empty</h3>
          <p className="mt-4 text-xs font-black uppercase text-slate-600 tracking-[0.2em]">Upload signals via investigating investigators or mobile app.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredMedia.map((media: any) => (
            <div key={media.id} className="card-intel !p-0 glass-surface overflow-hidden group">
              <div className="flex flex-col lg:flex-row min-h-[220px]">
                
                {/* Visual Signal */}
                <div className="w-full lg:w-72 bg-slate-100 dark:bg-slate-950/50 relative overflow-hidden flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800">
                  {media.type === 'image' ? (
                    <img 
                      src={getMediaUrl(media.file_url)} 
                      alt="" 
                      className="h-full w-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" 
                    />
                  ) : media.type === 'video' ? (
                    <div className="flex flex-col items-center gap-4 text-slate-500">
                      <Play className="h-12 w-12 opacity-40 group-hover:text-indigo-400 group-hover:opacity-100 transition-all duration-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white">Active Signal</span>
                    </div>
                  ) : (
                    <FileIcon className="h-12 w-12 text-slate-700" />
                  )}
                  <div className="absolute top-4 left-4">
                     <span className="badge-hud badge-hud-ongoing !bg-[#020617] !border-slate-800">
                        {media.type}
                     </span>
                  </div>
                </div>

                {/* Content Analysis */}
                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-6">
                          <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Source Index</p>
                             <p className="text-xs font-black text-indigo-400 truncate max-w-[200px]">{media.file_url}</p>
                          </div>
                          <div className="h-8 w-px bg-slate-800/60" />
                          <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Timestamp</p>
                             <p className="text-xs font-black text-slate-300">{new Date(media.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                          <span className={cn(
                            "badge-hud",
                            media.transcription_status === 'completed' ? 'badge-hud-fulfilled' : 'badge-hud-ongoing'
                          )}>
                            {media.transcription_status || 'analyzing'}
                          </span>
                          
                          {(media.transcription_status === 'processing' || analyzingId === media.id) ? (
                            <span className="h-10 px-4 flex items-center gap-2 rounded-xl bg-indigo-600/50 text-white text-[10px] font-black uppercase tracking-widest">
                              <Loader2 className="h-3 w-3 animate-spin" /> Analyzing...
                            </span>
                          ) : (!media.transcription_text || !media.transcription_text.includes('EXTRACTED CLAIMS:')) && (
                            <button
                              onClick={() => { setAnalyzingId(media.id); analyzeMutation.mutate(media.id); }}
                              disabled={analyzingId !== null}
                              className="h-10 px-4 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10"
                            >
                              <Sparkles className="h-3 w-3" />
                              AI Extract
                            </button>
                          )}
                       </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                         <History className="h-3 w-3" /> Processed Text Analysis
                      </p>
                      <div className="max-h-32 overflow-y-auto scrollbar-custom text-slate-200 text-sm font-medium leading-[1.8] bg-[#020617] p-6 rounded-2xl border border-slate-800/60 relative italic opacity-80 group-hover:opacity-100 transition-opacity">
                        {media.transcription_text || 'Transcription signal pending extraction...'}
                      </div>
                    </div>
                  </div>

                  {media.transcription_text?.includes('EXTRACTED CLAIMS:') && (
                    <div className="mt-8 pt-8 border-t border-slate-800/40">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                         <ArrowRight className="h-3 w-3" /> Promote Extracted Claims
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {media.transcription_text
                          .split('EXTRACTED CLAIMS:')[1]
                          .split('\n')
                          .filter((line: string) => /^\d+\./.test(line.trim()))
                          .map((claim: string, idx: number) => {
                            const claimText = claim.replace(/^\d+\.\s*/, '');
                            return (
                              <button 
                                key={idx} 
                                onClick={() => {
                                  setSelectedClaimText(claimText);
                                  setSelectedMediaUrl(media.file_url);
                                  setShowAddClaimModal(true);
                                }}
                                className="group/btn flex items-center gap-3 p-2.5 pr-4 rounded-xl bg-[#020617] border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-600/5 transition-all text-left max-w-xs"
                              >
                                <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all">
                                   <Plus className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 line-clamp-1 group-hover/btn:text-slate-100 uppercase tracking-wide">{claimText}</span>
                              </button>
                            );
                          })
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddToPOIModal 
        isOpen={showAddClaimModal}
        onClose={() => setShowAddClaimModal(false)}
        initialDescription={selectedClaimText}
        sourceUrl={selectedMediaUrl}
      />
    </div>
  );
}

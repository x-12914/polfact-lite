import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Share2, 
  Upload, 
  FileText, 
  Play, 
  Loader2, 
  Link as LinkIcon,
  Trash2,
  Edit,
  Save,
  X,
  ShieldCheck,
  Globe,
  Wand2,
  Clock,
  History,
  Activity,
  FileSearch,
  MessageSquareQuote,
  Database,
  User as UserIcon,
  PenTool
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClaim, uploadMedia, deleteClaim, updateClaim, deleteMedia, deleteSource, analyzeClaim, clearClaimEvidence, type Media } from '../services/api';
import { cn } from '../utils/cn';
import { Modal } from '../components/ui/Modal';
import { SourceForm } from '../components/SourceForm';
import { useAuth } from '../contexts/AuthContext';
import { getMediaUrl } from '../utils/url';

export function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showScraper, setShowScraper] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isResearching, setIsResearching] = useState<string | null>(null);
  const [showManualSource, setShowManualSource] = useState(false);

  const isAdmin = userRole === 'admin';
  const canEdit = isAdmin;

  const { data: claim, isLoading, error } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => getClaim(Number(id)),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const type = file.type.includes('image') ? 'image' : 
                   file.type.includes('video') ? 'video' : 
                   file.type.includes('audio') ? 'audio' : 'pdf';
      return uploadMedia(file, type, Number(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      setIsUploading(false);
    }
  });

  const deleteClaimMutation = useMutation({
    mutationFn: () => deleteClaim(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      navigate(-1);
    },
    onError: (error: any) => {
      if (error.response?.status === 404) {
        // If it's already gone, just go back
        navigate(-1);
      } else {
        alert("Failed to delete claim. Ensure you have admin permissions.");
      }
    }
  });

  const updateClaimMutation = useMutation({
    mutationFn: (data: any) => updateClaim(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      setShowEditModal(false);
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeClaim(claim?.description || '', Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    }
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: number) => deleteMedia(mediaId),
    onMutate: async (mediaId) => {
      await queryClient.cancelQueries({ queryKey: ['claim', id] });
      const previousClaim = queryClient.getQueryData(['claim', id]);
      queryClient.setQueryData(['claim', id], (old: any) => ({
        ...old,
        media: old.media?.filter((m: any) => m.id !== mediaId)
      }));
      return { previousClaim };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    },
    onError: (err, mediaId, context: any) => {
      // If 404, the item is already gone, so we KEEP the optimistic state (item hidden)
      // and DO NOT invalidate, preventing a bounce from a stale server response.
      if ((err as any).response?.status === 404) {
        console.log("Media already deleted (404). Keeping local state.");
        return; 
      }
      
      // For other errors, rollback and notify
      queryClient.setQueryData(['claim', id], context.previousClaim);
      alert("Failed to remove evidence. Please try again.");
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (sourceId: number) => deleteSource(sourceId),
    onMutate: async (sourceId) => {
      await queryClient.cancelQueries({ queryKey: ['claim', id] });
      const previousClaim = queryClient.getQueryData(['claim', id]);
      queryClient.setQueryData(['claim', id], (old: any) => ({
        ...old,
        sources: old.sources?.filter((s: any) => s.id !== sourceId)
      }));
      return { previousClaim };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    },
    onError: (err, sourceId, context: any) => {
      if ((err as any).response?.status === 404) {
        return;
      }
      queryClient.setQueryData(['claim', id], context.previousClaim);
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    }
  });

  const clearEvidenceMutation = useMutation({
    mutationFn: () => clearClaimEvidence(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate({ file });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { searchWeb } = await import('../services/api');
      const results = await searchWeb(searchQuery);
      setSearchResults(results);
    } catch (err) {
      alert("Search signal failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResearch = async (url: string) => {
    setIsResearching(url);
    try {
      const { performResearch } = await import('../services/api');
      await performResearch(url, claim?.poi?.name);
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      setShowScraper(false);
    } catch (err) {
      alert("Research extraction failed.");
    } finally {
      setIsResearching(null);
    }
  };

  const handleDeleteMedia = (mediaId: number) => {
    if (window.confirm('Are you sure you want to remove this piece of evidence?')) {
      deleteMediaMutation.mutate(mediaId);
    }
  };

  const handleDeleteSource = (sourceId: number) => {
    if (window.confirm('Remove this verified source from the claim?')) {
      deleteSourceMutation.mutate(sourceId);
    }
  };

  const handleDeleteAllEvidence = async () => {
    if (!claim?.media?.length && !claim?.sources?.length) return;
    
    if (window.confirm('CRITICAL: This will permanently remove ALL media files and verified sources for this investigation. Proceed?')) {
      clearEvidenceMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="rounded-3xl bg-rose-500/10 p-12 text-rose-400 border border-rose-500/20 max-w-2xl mx-auto text-center animate-fade-in-up">
        <AlertCircle className="h-16 w-16 mx-auto mb-6 opacity-80" />
        <h2 className="text-2xl font-black uppercase tracking-tight">Signal Lost</h2>
        <p className="mt-4 text-sm font-medium opacity-70">The investigation record with ID {id} was not found or has been purged.</p>
        <button onClick={() => navigate('/claims')} className="mt-8 btn-intel bg-rose-600 hover:bg-rose-500">Back to Console</button>
      </div>
    );
  }

  const getVerdictIcon = () => {
    switch (claim.status) {
      case 'fulfilled':
        return <CheckCircle className="h-10 w-10 text-emerald-500" />;
      case 'unfulfilled':
        return <AlertCircle className="h-10 w-10 text-rose-500" />;
      case 'partial':
        return <AlertCircle className="h-10 w-10 text-amber-500" />;
      case 'ongoing':
        return <Activity className="h-10 w-10 text-indigo-500 animate-pulse" />;
      default:
        return <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />;
    }
  };

  const getVerdictColor = () => {
    switch (claim.status) {
      case 'fulfilled': return 'badge-hud-fulfilled';
      case 'unfulfilled': return 'badge-hud-unfulfilled';
      case 'partial': return 'badge-hud-partial';
      default: return 'badge-hud-ongoing';
    }
  };

  return (
    <div className="space-y-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all hover:translate-x-[-4px]">
            <ArrowLeft className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Live Investigation</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{new Date(claim.created_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Claim #{claim.id}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          {canEdit && (
            <>
              <button 
                onClick={() => {
                  if (window.confirm('Delete this entire claim? This cannot be undone.')) {
                    deleteClaimMutation.mutate();
                  }
                }}
                className="h-14 w-14 flex items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5 group"
                title="Purge Investigation"
              >
                <Trash2 className="h-6 w-6" />
              </button>
              <button 
                onClick={() => setShowEditModal(true)}
                className="btn-intel btn-intel-primary !bg-indigo-600 h-14"
              >
                <Edit className="h-5 w-5" />
                Edit Record
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Main Intelligence Card */}
          <div className="card-intel glass-surface relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[4] rotate-12 pointer-events-none">
              <ShieldCheck className="h-64 w-64" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
              <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-inner">
                <div className="transform scale-110">{getVerdictIcon()}</div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic opacity-60">Verified Signal</div>
                  <span className={cn("badge-hud", getVerdictColor())}>
                    {claim.status}
                  </span>
                </div>
              </div>

              {canEdit && (
                <button 
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                  className="btn-intel !bg-[#020617] h-12 hover:shadow-indigo-500/20 border border-slate-800"
                >
                  {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-indigo-400" />}
                  AI Intel Refresh
                </button>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <MessageSquareQuote className="h-3 w-3" /> Foundational Statement
              </h3>
              <div className="relative pl-12 pr-6">
                <div className="absolute left-0 top-0 h-full w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-transparent opacity-50" />
                <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-[1.2] italic">
                  "{claim.description}"
                </p>
              </div>
            </div>

            {claim.ai_insight && (
              <div className="mt-12 pt-12 border-t border-slate-800/30">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Activity className="h-3 w-3" /> AI Reasoning Analysis
                </h3>
                <div className="text-slate-200 text-sm font-medium leading-relaxed bg-[#020617] p-8 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40 shadow-[0_0_20px_0_rgba(99,102,241,0.5)]" />
                  <div className="whitespace-pre-wrap">{claim.ai_insight}</div>
                </div>
              </div>
            )}
          </div>

          {/* Evidence Grid */}
          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                    <Database className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Evidence Repository</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Primary Signals & Verification Sources</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                      onClick={() => {
                        setSearchQuery(claim.description);
                        setShowScraper(true);
                      }}
                      className="btn-intel !bg-indigo-600/10 !text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white h-10"
                   >
                      <Globe className="h-4 w-4" />
                      OSINT Scan
                   </button>
                   {canEdit && (
                      <div className="flex gap-2">
                         <button onClick={() => setShowManualSource(true)} className="btn-intel bg-slate-800 hover:bg-slate-700 text-slate-300 h-10">
                            <PenTool className="h-4 w-4" />
                            Type Intel
                         </button>
                         <button 
                            onClick={handleDeleteAllEvidence}
                            className="h-10 w-10 flex items-center justify-center rounded-xl border border-rose-500/30 text-rose-500/60 hover:bg-rose-500 hover:text-white transition-all transition-all"
                            title="Purge Evidence Only"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                         <label className="btn-intel btn-intel-primary !py-2.5 !px-4 cursor-pointer">
                           <Upload className="h-4 w-4" />
                           Capture Material
                           <input type="file" className="hidden" onChange={handleFileUpload} />
                         </label>
                      </div>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Media Items */}
               {claim.media?.map((m) => (
                 <div 
                   key={m.id} 
                   onClick={() => setSelectedMedia(m)}
                   className="group card-intel p-4 !rounded-2xl flex items-center gap-5 glass-surface cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-500/30"
                 >
                   <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-700">
                     {m.type === 'image' ? (
                       <img src={getMediaUrl(m.file_url)} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     ) : m.type === 'video' ? (
                        <div className="relative flex items-center justify-center">
                           <Play className="h-6 w-6 text-indigo-400 group-hover:scale-125 transition-transform" />
                        </div>
                     ) : (
                        <FileSearch className="h-6 w-6 text-slate-500" />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{m.type}</p>
                     <p className="text-xs font-bold text-slate-300 truncate opacity-80 group-hover:opacity-100">{m.file_url.split('-').pop()}</p>
                   </div>
                   {canEdit && (
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDeleteMedia(m.id);
                       }} 
                       className="h-10 w-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-rose-500 transition-all"
                     >
                       <X className="h-4 w-4" />
                     </button>
                   )}
                 </div>
               ))}

               {/* Source Items */}
               {claim.sources?.map((s) => (
                 <div key={s.id} className="group card-intel p-4 !rounded-2xl flex items-center gap-5 glass-surface">
                   <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                     <Globe className="h-6 w-6 text-indigo-400" />
                   </div>
                   <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                         <Globe className="h-3 w-3" />
                         {s.type === 'manual' ? 'Direct Evidence' : 'Authenticated Source'}
                       </p>
                       <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-400 transition-colors">{s.title || 'Verified Intel'}</p>
                       {s.content && (
                         <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap italic line-clamp-3 group-hover:line-clamp-none transition-all">
                           "{s.content}"
                         </div>
                       )}
                       {s.link && (
                         <p className="text-[9px] text-slate-500 mt-2 font-bold truncate opacity-60 flex items-center gap-1">
                           <LinkIcon className="h-2 w-2" />
                           {s.link}
                         </p>
                       )}
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     {canEdit && (
                       <button onClick={() => handleDeleteSource(s.id)} className="h-8 w-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-rose-500 transition-all">
                         <X className="h-4 w-4" />
                       </button>
                     )}
                     <a 
                        href={s.link ? getMediaUrl(s.link) : '#'} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 hover:text-indigo-400 transition-all shadow-inner"
                     >
                        <LinkIcon className="h-3 w-3" />
                     </a>
                   </div>
                 </div>
               ))}

               {!claim.media?.length && !claim.sources?.length && (
                 <div className="col-span-full py-16 text-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/20">
                   <Upload className="h-10 w-10 mx-auto mb-4 text-slate-700" />
                   <p className="text-sm font-bold text-slate-600">No Intelligence Indexed</p>
                   <p className="text-[10px] uppercase font-black text-slate-800 mt-2 tracking-widest">Awaiting Primary Verification Uploads</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Sidebar Intel */}
        <div className="space-y-8">
           <div className="card-intel !p-8 bg-[#020617] border-slate-800">
             <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
               <History className="h-4 w-4 text-indigo-500" /> Investigation Log
             </h3>
             <div className="space-y-8 relative">
               <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-800" />
               
               <div className="flex gap-6 relative">
                 <div className="h-8 w-8 rounded-full bg-[#020617] border-2 border-indigo-500/50 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Entity Initialized</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 tracking-widest">{new Date(claim.created_at).toLocaleString()}</p>
                 </div>
               </div>

               <div className="flex gap-6 relative">
                 <div className="h-8 w-8 rounded-full bg-[#020617] border-2 border-slate-700 flex items-center justify-center z-10 shadow-inner">
                   <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Awaiting Analysis</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5 tracking-widest">Protocol Staged</p>
                 </div>
               </div>
             </div>
             
             <button className="w-full mt-12 btn-intel btn-intel-secondary !py-4 opacity-50 cursor-not-allowed">
                View Detailed Event Chronology
             </button>
           </div>

           <div className="card-intel !p-8 glass-surface">
              <h3 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                 <ShieldCheck className="h-4 w-4 text-indigo-600" /> Network Context
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 overflow-hidden">
                       <UserIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Subject Zero</p>
                       <Link to={`/poi/${claim.poi?.id}`} className="text-xs font-black text-slate-900 dark:text-white hover:text-indigo-400 transition-colors uppercase tracking-wider">{claim.poi?.name || 'Unidentified'}</Link>
                    </div>
                 </div>
                 <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-4" />
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">Confidence</p>
                       <p className="text-sm font-black text-indigo-500">{claim.confidence}%</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">Status</p>
                       <p className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">{claim.status}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Update Intelligence Record">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            updateClaimMutation.mutate({
              description: formData.get('description'),
              status: formData.get('status')
            });
          }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Claim Statement</label>
            <textarea 
              name="description" 
              defaultValue={claim.description}
              className="input-intel min-h-[120px]"
              required
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Current Protocol Status</label>
            <select name="status" defaultValue={claim.status} className="input-intel h-14">
              <option value="ongoing">Ongoing (Active Investigation)</option>
              <option value="fulfilled">Fulfilled (Verified True)</option>
              <option value="partial">Mostly True (Partial Signal)</option>
              <option value="unfulfilled">Unfulfilled (Disproven/False)</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 btn-intel btn-intel-secondary h-14">Cancel</button>
            <button type="submit" disabled={updateClaimMutation.isPending} className="flex-[2] btn-intel btn-intel-primary h-14">
              {updateClaimMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Modifications'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showScraper} onClose={() => setShowScraper(false)} title="Signal Interceptor (OSINT)">
        <div className="space-y-8 pt-4">
          <form onSubmit={handleSearch} className="flex gap-3">
             <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-intel flex-1"
                placeholder="Search the global web..."
             />
             <button type="submit" disabled={isSearching} className="btn-intel btn-intel-primary px-8">
               {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
               Search
             </button>
          </form>

          <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2 scrollbar-custom">
             {searchResults.map((res, idx) => (
               <div key={idx} className="p-6 rounded-2xl bg-[#020617] border border-slate-800 hover:border-indigo-500/30 transition-all">
                  <h4 className="text-sm font-black text-white leading-snug">{res.title}</h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{res.snippet}</p>
                  <div className="mt-6 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">{res.link}</span>
                     <button 
                        onClick={() => handleResearch(res.link)}
                        disabled={!!isResearching}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"
                     >
                        {isResearching === res.link ? <Loader2 className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
                        Scrape Intel
                     </button>
                  </div>
               </div>
             ))}
             {!searchResults.length && !isSearching && (
               <div className="py-12 text-center text-slate-500 italic text-sm">
                 Awaiting signal input...
               </div>
             )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showManualSource} onClose={() => setShowManualSource(false)} title="Log Evidence Intel">
         <div className="pt-4">
            <SourceForm 
               claims={[claim]} 
               initialData={{ claim_id: claim.id }} 
               onCancel={() => setShowManualSource(false)} 
            />
         </div>
      </Modal>

      <Modal isOpen={!!selectedMedia} onClose={() => setSelectedMedia(null)} title="Intelligence Viewer" className="max-w-5xl">
         <div className="flex flex-col items-center justify-center bg-black/90 rounded-[32px] overflow-hidden min-h-[400px]">
           {selectedMedia?.type === 'video' ? (
             <video 
                src={getMediaUrl(selectedMedia.file_url)} 
                controls 
                autoPlay
                className="max-h-[70vh] w-full"
             />
           ) : selectedMedia?.type === 'image' ? (
             <img 
                src={getMediaUrl(selectedMedia.file_url)} 
                className="max-h-[70vh] object-contain"
             />
           ) : (
             <div className="p-20 text-center">
                <FileSearch className="h-16 w-16 mx-auto mb-4 text-slate-700" />
                <p className="text-slate-400">PDF or Document Signal. Download to view.</p>
                <a href={getMediaUrl(selectedMedia?.file_url || '')} target="_blank" className="mt-6 inline-block btn-intel btn-intel-primary">Download File</a>
             </div>
           )}
         </div>
      </Modal>

      {isUploading && (
        <div className="fixed bottom-10 right-10 z-[100] animate-fade-in-up">
           <div className="glass-surface p-6 rounded-2xl flex items-center gap-4 border-indigo-500/20 shadow-indigo-500/10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <div>
                 <p className="text-xs font-black text-white uppercase tracking-widest">Injesting Material...</p>
                 <p className="text-[9px] text-slate-500 font-bold tracking-widest mt-0.5">Encrypting & Processing Signal</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

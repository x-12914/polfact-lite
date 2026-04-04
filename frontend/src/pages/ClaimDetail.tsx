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
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClaim, uploadMedia, deleteClaim, updateClaim, deleteMedia, deleteSource, analyzeClaim, clearClaimEvidence } from '../services/api';
import { cn } from '../utils/cn';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { getMediaUrl } from '../utils/url';

export function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (sourceId: number) => deleteSource(sourceId),
    onSuccess: () => {
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="rounded-lg bg-rose-50 p-6 text-rose-700">
        <h2 className="text-lg font-bold">Error loading claim</h2>
        <p>The claim might have been deleted or doesn't exist.</p>
        <button onClick={() => navigate('/claims')} className="mt-4 font-bold underline">Back to Claims</button>
      </div>
    );
  }

  const getVerdictIcon = () => {
    switch (claim.status) {
      case 'fulfilled':
        return <CheckCircle className="h-8 w-8 text-emerald-600" />;
      case 'unfulfilled':
        return <AlertCircle className="h-8 w-8 text-rose-600" />;
      case 'partial':
        return <AlertCircle className="h-8 w-8 text-amber-600" />;
      case 'ongoing':
        return <Clock className="h-8 w-8 text-blue-600 animate-pulse-slow" />;
      default:
        return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
    }
  };

  const getVerdictColor = () => {
    switch (claim.status) {
      case 'fulfilled':
        return 'bg-emerald-100 text-emerald-800';
      case 'unfulfilled':
        return 'bg-rose-100 text-rose-800';
      case 'partial':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Claim Details</h1>
            <p className="mt-2 text-slate-600 font-bold uppercase text-[10px] tracking-widest">ID: {claim.id} • {new Date(claim.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <button 
                onClick={() => {
                  if (window.confirm('Delete this entire claim? This cannot be undone.')) {
                    deleteClaimMutation.mutate();
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Claim
              </button>
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="btn-premium btn-primary"
                >
                  <Edit className="h-4 w-4" />
                  Edit Claim
                </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Verdict & AI Intelligence</h2>
              {canEdit && (
                <button 
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                  className="btn-premium !bg-slate-900 !py-2 !px-4 hover:!bg-slate-800"
                >
                  {analyzeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  AI Analyze
                </button>
              )}
            </div>
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
              <div className="transform scale-125">{getVerdictIcon()}</div>
              <div>
                <span className={cn("inline-block rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em]", getVerdictColor())}>
                  {claim.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest italic opacity-60">Verified by Hub AI Engine</p>
              </div>
            </div>
            {claim.ai_insight && (
              <div className="mt-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">AI Reasoning Analysis</h3>
                <div className="text-slate-100 text-sm font-medium leading-relaxed bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  {claim.ai_insight}
                </div>
              </div>
            )}
          </div>

          <div className="card-premium !p-8">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Original Statement</h2>
            <blockquote className="border-l-4 border-blue-600 pl-8 text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight">
              "{claim.description}"
            </blockquote>
          </div>

          <div className="card-premium !p-0 overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">Evidence Repository</h2>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Foundational Intelligence</p>
              </div>
              <div className="flex items-center gap-3">
                {((claim.media?.length ?? 0) > 0 || (claim.sources?.length ?? 0) > 0) && (
                  <button 
                    onClick={handleDeleteAllEvidence}
                    className="btn-premium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 !text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 !py-2 !px-4"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </button>
                )}
                <div className="relative">
                  <input 
                    type="file" 
                    id="claim-media-upload" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="claim-media-upload"
                    className="btn-premium btn-primary !py-2 !px-4 cursor-pointer"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Add Evidence
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               {claim.media?.length === 0 && claim.sources?.length === 0 && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40 italic font-medium text-sm">
                   Wait! No media or source evidence attached yet.
                </div>
              )}
              {claim.media?.map((m: any) => (
                <div key={`media-${m.id}`} className="group rounded-2xl border border-slate-100 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner",
                        m.type === 'video' ? "bg-purple-50 text-purple-600" :
                        m.type === 'image' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                      )}>
                        {m.type === 'video' ? <Play className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{m.type}</div>
                        <a 
                          href={getMediaUrl(m.file_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-bold text-slate-900 hover:text-blue-600 truncate max-w-[300px] block transition-colors"
                        >
                          {m.file_url.split('/').pop()}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold uppercase",
                        m.transcription_status === 'completed' ? "bg-emerald-100 text-emerald-800" : 
                        m.transcription_status?.includes('error') ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {m.transcription_status}
                      </div>
                      {canEdit && (
                        <button 
                          onClick={() => handleDeleteMedia(m.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {m.transcription_text && (
                    <div className="mt-5 rounded-2xl bg-slate-900 p-6 text-xs text-slate-300 max-h-64 overflow-y-auto whitespace-pre-wrap border border-slate-800 shadow-2xl leading-relaxed">
                      <div className="mb-3 font-bold text-[9px] uppercase text-slate-500 tracking-[0.2em] border-b border-slate-800 pb-2">Transcription & Automated Analysis</div>
                      {m.transcription_text}
                    </div>
                  )}
                </div>
              ))}

              {claim.sources?.map((s: any) => (
                <div key={`source-${s.id}`} className="group rounded-2xl border border-slate-100 bg-white p-5 hover:border-emerald-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{s.type}</div>
                        <h4 className="font-bold text-slate-900">{s.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase text-emerald-800">
                        {Math.round(s.credibility_score * 100)}% Trusted
                      </div>
                      {canEdit && (
                        <button 
                          onClick={() => handleDeleteSource(s.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {s.link && (
                    <a 
                      href={s.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" /> View Source Document
                    </a>
                  )}

                  {s.content && (
                    <div className="mt-5 relative">
                      <div className="absolute -left-2 top-0 bottom-0 w-1 bg-emerald-400 rounded-full" />
                      <blockquote className="pl-4 text-sm text-slate-600 italic leading-relaxed">
                        "{s.content}"
                      </blockquote>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-widest flex items-center gap-2">
               <LinkIcon className="h-4 w-4 text-blue-600" /> Evidence Index
            </h3>
            <div className="space-y-3">
              {/* Media Files as Sources */}
              {claim.media?.map((m: any) => (
                <div key={`idx-${m.id}`} className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <a 
                      href={getMediaUrl(m.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 flex-1 truncate"
                    >
                       {m.type === 'video' ? <Play className="h-4 w-4 text-purple-600" /> : <FileText className="h-4 w-4 text-blue-600" />}
                       <div className="flex-1 truncate">
                          <div className="text-[11px] font-bold text-slate-900 truncate">{m.file_url.split('/').pop()}</div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider capitalize">{m.type}</div>
                       </div>
                    </a>
                    {canEdit && (
                      <button onClick={() => handleDeleteMedia(m.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all p-1">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                </div>
              ))}
              
              {/* External Sources as Evidence */}
              {claim.sources?.map((s: any) => (
                <div key={`src-idx-${s.id}`} className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3 flex-1 truncate">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        <div className="flex-1 truncate">
                          <div className="text-[11px] font-bold text-slate-900 truncate">{s.title}</div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{s.type}</div>
                        </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteSource(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all p-1">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                </div>
              ))}
              
              {(!claim.media || claim.media.length === 0) && (!claim.sources || claim.sources.length === 0) && (
                <div className="text-xs text-slate-400 text-center py-8 italic">No evidence indexed.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Edit Claim Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Investigation">
        <form onSubmit={(e) => {
          e.preventDefault();
          const targetEvent = e.target as any;
          updateClaimMutation.mutate({
            description: targetEvent.description.value,
            status: targetEvent.status.value
          });
        }} className="space-y-6 pt-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">Factual Statement</label>
            <textarea 
              name="description"
              defaultValue={claim.description}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[160px]" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">Verdict Status</label>
            <select 
              name="status"
              defaultValue={claim.status}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="ongoing">Ongoing Portfolio</option>
              <option value="fulfilled">Fulfilled (Accurate)</option>
              <option value="partial">Partial / Context Missing</option>
              <option value="unfulfilled">Unfulfilled (Inaccurate)</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 rounded-2xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-500 hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={updateClaimMutation.isPending} className="flex-[2] rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-black/20 hover:bg-blue-700 flex items-center justify-center gap-2">
              {updateClaimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Improvements
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

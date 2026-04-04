import { useState } from 'react';
import { Upload, FileText, CheckCircle2, Loader2, Play, Plus, Clock, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useClaims } from '../hooks/useQueries';
import { uploadMedia, getRecentMedia } from '../services/api';
import { AddToPOIModal } from '../components/ui/AddToPOIModal';
import { cn } from '../utils/cn';

export function Submissions() {
  const [file, setFile] = useState<File | null>(null);
  const [claimId, setClaimId] = useState<number | undefined>(undefined);
  const [showAddClaimModal, setShowAddClaimModal] = useState(false);
  const [selectedClaimText, setSelectedClaimText] = useState('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const queryClient = useQueryClient();
  const { data: claimsList } = useClaims(undefined);

  const { data: mediaList, isLoading: loadingMedia } = useQuery({
    queryKey: ['media'],
    queryFn: () => getRecentMedia(20),
    refetchInterval: 5000, // Poll for transcription status
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, claimId }: { file: File, claimId?: number }) => {
      const type = file.type.includes('image') ? 'image' : 
                   file.type.includes('video') ? 'video' : 
                   file.type.includes('audio') ? 'audio' : 'pdf';
      return uploadMedia(file, type, claimId);
    },
    onSuccess: () => {
      setFile(null);
      setClaimId(undefined);
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['claim'] });
    }
  });

  const handleUpload = () => {
    if (file) uploadMutation.mutate({ file, claimId });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Media Submissions</h1>
          <p className="mt-1 text-slate-500">Upload evidence for automated transcription and AI analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upload Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" /> New Submission
          </h2>
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center transition-colors hover:bg-slate-50">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <p className="mt-4 text-lg font-bold text-slate-900">
                {file ? file.name : 'Click to select or drag and drop'}
              </p>
              <p className="text-sm text-slate-500">Video, Audio, or Images accepted</p>
            </label>

            {file && (
              <div className="mt-8 space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Link to Existing Claim (Optional)</label>
                  <select 
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    value={claimId || ''}
                    onChange={(e) => setClaimId(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">No specific claim (General Evidence)</option>
                    {claimsList?.map((c: any) => (
                      <option key={c.id} value={c.id}>ID {c.id}: {c.description.substring(0, 50)}...</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setFile(null)}
                    className="rounded-xl bg-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {uploadMutation.isPending ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<CheckCircle2 className="h-4 w-4" />)}
                    Submit Evidence
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" /> Recent Uploads
          </h2>
          
          {loadingMedia ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {(mediaList as any)?.length === 0 && (
                <div className="p-12 text-center text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white">
                  No submissions yet.
                </div>
              )}
              {(mediaList as any)?.map((media: any) => (
                <div key={media.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        media.type === 'video' ? "bg-purple-50 text-purple-600" :
                        media.type === 'image' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                      )}>
                        {media.type === 'video' ? <Play className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 truncate max-w-[200px]">
                          {media.file_url.split('/').pop()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-tight">
                          <span>{media.type}</span>
                          <span className={cn(
                            "flex items-center gap-1 font-bold",
                            media.transcription_status === 'completed' ? "text-emerald-600" :
                            media.transcription_status === 'failed' ? "text-rose-600" : "text-amber-600"
                          )}>
                            {media.transcription_status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                            {media.transcription_status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a 
                      href={media.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      View Original
                    </a>
                  </div>
                  
                  {media.transcription_text && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="mb-2 font-bold text-xs uppercase text-slate-400">Transcription & Analysis</div>
                      <div className="max-h-32 overflow-y-auto whitespace-pre-wrap mb-4">
                        {media.transcription_text}
                      </div>
                      
                      {media.transcription_text.includes('EXTRACTED CLAIMS:') && (
                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Actions: Promote Claims</div>
                          {media.transcription_text
                            .split('EXTRACTED CLAIMS:')[1]
                            .split('\n')
                            .filter((line: string) => /^\d+\./.test(line.trim()))
                            .map((claim: string, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white border border-slate-100 group">
                                <span className="text-xs text-slate-600 line-clamp-1">{claim.replace(/^\d+\.\s*/, '')}</span>
                                <button 
                                  onClick={() => {
                                    setSelectedClaimText(claim.replace(/^\d+\.\s*/, ''));
                                    setSelectedMediaUrl(media.file_url);
                                    setShowAddClaimModal(true);
                                  }}
                                  className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap"
                                >
                                  <Plus className="h-3 w-3" /> Add
                                </button>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddToPOIModal 
        isOpen={showAddClaimModal}
        onClose={() => setShowAddClaimModal(false)}
        initialDescription={selectedClaimText}
        sourceUrl={selectedMediaUrl}
      />
    </div>
  );
}

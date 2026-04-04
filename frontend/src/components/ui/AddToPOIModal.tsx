import { useState } from 'react';
import { usePOIs, useClaims } from '../../hooks/useQueries';
import { createClaim, createSource } from '../../services/api';
import { Modal } from './Modal';
import { Loader2, User, FileText, CheckCircle2, Link2, PlusCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../utils/cn';

interface AddToPOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDescription: string;
  sourceUrl?: string;
  quote?: string;
}

export function AddToPOIModal({ isOpen, onClose, initialDescription, sourceUrl, quote }: AddToPOIModalProps) {
  const [mode, setMode] = useState<'new' | 'evidence'>('new');
  const { data: pois, isLoading: loadingPOIs } = usePOIs();
  const [selectedPoiId, setSelectedPoiId] = useState<string>('');
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: poiClaims, isLoading: loadingClaims } = useClaims(selectedPoiId ? parseInt(selectedPoiId) : undefined);

  const claimMutation = useMutation({
    mutationFn: (data: { poi_id: number, description: string }) => createClaim({
      ...data,
      status: 'ongoing',
      confidence: 50
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      onClose();
    }
  });

  const evidenceMutation = useMutation({
    mutationFn: (data: { claim_id: number, content: string, link?: string }) => createSource({
      claim_id: data.claim_id,
      title: 'AI Extracted Evidence',
      type: 'osint',
      content: data.content,
      link: data.link,
      credibility_score: 0.7
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoiId) return;

    const finalDescription = quote ? `${description}\n\nEvidence: "${quote}"` : description;

    const userRefinement = description.trim();
    const finalContent = userRefinement && userRefinement !== initialDescription
      ? `REFINEMENT: ${userRefinement}\n\nORIGINAL AI EXTRACTION:\n${initialDescription}`
      : initialDescription;

    if (mode === 'new') {
      let submitDescription = finalContent;
      if (sourceUrl) {
        submitDescription += `\n\nSource: ${sourceUrl}`;
      }
      claimMutation.mutate({
        poi_id: parseInt(selectedPoiId),
        description: submitDescription
      });
    } else {
      if (!selectedClaimId) return;
      evidenceMutation.mutate({
        claim_id: parseInt(selectedClaimId),
        content: finalContent,
        link: sourceUrl
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promote to AI Evidence">
      <div className="flex p-1 gap-1 mb-6 rounded-xl bg-slate-100/80 border border-slate-100">
        <button
          onClick={() => setMode('new')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all",
            mode === 'new' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <PlusCircle className="h-3.5 w-3.5" /> Create New Claim
        </button>
        <button
          onClick={() => setMode('evidence')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all",
            mode === 'evidence' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Link2 className="h-3.5 w-3.5" /> Add as Evidence
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Persona Information</label>
          {loadingPOIs ? (
            <div className="flex h-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                required
                value={selectedPoiId}
                onChange={(e) => {
                  setSelectedPoiId(e.target.value);
                  setSelectedClaimId('');
                }}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none font-medium"
              >
                <option value="">Select Target Personality...</option>
                {pois?.map((poi: any) => (
                  <option key={poi.id} value={poi.id}>{poi.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {mode === 'evidence' && selectedPoiId && (
          <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Connect to Existing Claim</label>
            {loadingClaims ? (
              <div className="flex h-11 items-center justify-center rounded-xl bg-slate-50">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  required={mode === 'evidence'}
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none font-medium"
                >
                  <option value="">Select a Claim to Strengthen...</option>
                  {poiClaims?.map((claim: any) => (
                    <option key={claim.id} value={claim.id}>{claim.description.substring(0, 60)}...</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Original AI Extraction</label>
            <div className="rounded-xl bg-slate-100/50 p-4 border border-slate-200/50 text-sm text-slate-600 italic font-medium leading-relaxed">
              "{initialDescription}"
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Refinement / Context (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[80px] font-medium"
                placeholder={mode === 'new' ? "Refine the claim statement..." : "Add notes to this piece of evidence (optional)..."}
              />
            </div>
          </div>
        </div>

        {sourceUrl && (
          <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-100/50">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-3 w-3 text-emerald-600" />
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Source Authenticated</p>
            </div>
            <p className="text-xs text-emerald-900 truncate font-bold">{sourceUrl}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={claimMutation.isPending || evidenceMutation.isPending || !selectedPoiId || (mode === 'evidence' && !selectedClaimId)}
            className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-black/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {claimMutation.isPending || evidenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {mode === 'new' ? 'Launch New Claim' : 'Promote Evidence'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

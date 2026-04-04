import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  PlayCircle,
  Pencil,
  Trash2,
  ExternalLink
} from 'lucide-react';
import type { Claim } from '../types/index';
import { StatusBadge } from './StatusBadge';
import { cn } from '../utils/cn';
import { getMediaUrl } from '../utils/url';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeClaim, deleteClaim, updateClaim } from '../services/api';
import { Link } from 'react-router-dom';
import { Modal } from './ui/Modal';

interface ClaimsTableProps {
  claims: Claim[];
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const queryClient = useQueryClient();

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const analysisMutation = useMutation({
    mutationFn: ({ text, id }: { text: string, id: number }) => analyzeClaim(text, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Claim> }) => updateClaim(id, data),
    onSuccess: () => {
      setEditingClaim(null);
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    }
  });

  const handleTriggerAnalysis = (e: React.MouseEvent, claim: Claim) => {
    e.stopPropagation();
    analysisMutation.mutate({ text: claim.description, id: claim.id });
  };

  const handleDelete = (e: React.MouseEvent, claimId: number) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this claim?')) {
      deleteMutation.mutate(claimId);
    }
  };

  const handleEdit = (e: React.MouseEvent, claim: Claim) => {
    e.stopPropagation();
    setEditingClaim(claim);
  };

  return (
    <div className="card-premium !p-0 overflow-hidden shadow-xl shadow-black/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Intel Fragment</th>
              <th className="px-8 py-5">Current Status</th>
              <th className="px-8 py-5">Recorded On</th>
              <th className="px-8 py-5 text-right">Ops Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claims.map((claim) => {
              const isExpanded = expandedId === claim.id;
              const date = claim.date_reported || claim.created_at;
              
              return (
                <React.Fragment key={claim.id}>
                  <tr 
                    className={cn(
                      "group cursor-pointer transition-all duration-300 hover:bg-slate-50/80",
                      isExpanded && "bg-slate-50/80 shadow-inner"
                    )}
                    onClick={() => toggleExpand(claim.id)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300",
                            isExpanded && "rotate-90 text-blue-600"
                          )} 
                        />
                        <span className="font-medium text-slate-900 line-clamp-1">{claim.description}</span>
                        {claim.poi && (
                          <div className="flex items-center gap-2 shrink-0">
                            <img 
                              src={getMediaUrl((claim.poi as any).profile_image)} 
                              alt={(claim.poi as any).name}
                              className="h-6 w-6 rounded-md object-cover border border-slate-100"
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{(claim.poi as any).name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {date ? new Date(date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/claim/${claim.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={(e) => handleEdit(e, claim)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Edit Claim"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, claim.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Claim"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleTriggerAnalysis(e, claim)}
                          disabled={analysisMutation.isPending}
                          className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          {analysisMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5" />
                          )}
                          AI
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} className="bg-slate-900 border-t border-slate-800 px-12 py-10">
                        <div className="grid grid-cols-1 gap-8 relative">
                           <div className="absolute -left-6 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
                           <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Hub Intelligence Briefing</span>
                              </div>
                              <p className="text-base font-medium leading-relaxed text-slate-200">
                                {claim.ai_insight || "Awaiting advanced analysis engine input for this fragment."}
                              </p>
                            </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingClaim && (
        <Modal 
          isOpen={!!editingClaim} 
          onClose={() => setEditingClaim(null)}
          title="Edit Claim"
        >
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
              <textarea 
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                rows={4}
                value={editingClaim.description}
                onChange={(e) => setEditingClaim({...editingClaim, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
              <select 
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={editingClaim.status}
                onChange={(e) => setEditingClaim({...editingClaim, status: e.target.value as any})}
              >
                <option value="ongoing">Ongoing</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="partial">Partial</option>
                <option value="unfulfilled">Unfulfilled</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setEditingClaim(null)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => updateMutation.mutate({ id: editingClaim.id, data: { description: editingClaim.description, status: editingClaim.status }})}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

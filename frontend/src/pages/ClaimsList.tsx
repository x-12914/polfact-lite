import { useState } from 'react';
import { Search, Filter, Loader2, AlertCircle, Clock, ChevronRight, Plus } from 'lucide-react';
import { useClaims, usePOIs } from '../hooks/useQueries';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClaim } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { cn } from '../utils/cn';

export function ClaimsList() {
  const { data: claims, isLoading, error } = useClaims(undefined);
  const { data: pois } = usePOIs();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClaim, setNewClaim] = useState({ description: '', poi_id: '', status: 'ongoing' });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => createClaim({
      ...data,
      poi_id: Number(data.poi_id),
      confidence: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setIsModalOpen(false);
      setNewClaim({ description: '', poi_id: '', status: 'ongoing' });
    }
  });

  const filteredClaims = claims?.filter((claim) => {
    const matchesSearch = claim.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newClaim);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-rose-50 p-6 text-rose-700">
        <h2 className="text-lg font-bold">Error loading claims</h2>
        <p>Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="control-bar">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Claims Engine</h1>
          <p className="mt-1 text-slate-500 font-medium tracking-tight">Track and verify factual statements across all personas.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-premium btn-primary"
        >
          <Plus className="h-5 w-5" />
          Add New Claim
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all focus-within:shadow-md">
        <div className="relative flex-1 min-w-[280px] group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search claims by content..."
            className="input-premium input-with-icon !bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative group">
          <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
          <select 
            className="input-premium input-with-icon pr-10 appearance-none cursor-pointer !bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="fulfilled">Fulfilled Only</option>
            <option value="unfulfilled">Unfulfilled Only</option>
            <option value="ongoing">Ongoing Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredClaims?.map((claim) => (
          <div 
            key={claim.id} 
            onClick={() => navigate(`/claim/${claim.id}`)}
            className="card-premium group flex items-center justify-between gap-6 !p-6"
          >
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <span className={cn(
                  "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest leading-none",
                  claim.status === 'fulfilled' ? "bg-emerald-100 text-emerald-800" :
                  claim.status === 'unfulfilled' ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                )}>
                  {claim.status}
                </span>
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  REF NO: {claim.id}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                {claim.description}
              </h3>
              <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span>Filed: {new Date(claim.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-blue-600 text-slate-300 group-hover:text-white transition-all transform group-hover:rotate-45 shadow-inner group-hover:shadow-lg group-hover:shadow-blue-500/20">
              <ChevronRight className="h-6 w-6" />
            </div>
          </div>
        ))}
        {filteredClaims?.length === 0 && (
          <div className="py-24 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
             <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
             <p className="text-xl font-bold text-slate-400">No claims found</p>
             <p className="text-slate-400">Try creating one or adjusting your filters.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Claim"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Person of Interest</label>
            <select 
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              value={newClaim.poi_id}
              onChange={(e) => setNewClaim({ ...newClaim, poi_id: e.target.value })}
            >
              <option value="">Select a person...</option>
              {pois?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Claim Description</label>
            <textarea 
              required
              placeholder="What specifically is being claimed?"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[120px]"
              value={newClaim.description}
              onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Initial Status</label>
            <select 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              value={newClaim.status}
              onChange={(e) => setNewClaim({ ...newClaim, status: e.target.value })}
            >
              <option value="ongoing">Ongoing</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="unfulfilled">Unfulfilled</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending}
              className="flex-3 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Claim'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

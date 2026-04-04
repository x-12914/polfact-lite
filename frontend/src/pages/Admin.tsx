import { useState } from 'react';
import { 
  Users, 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { usePOIs, useClaims, useSources } from '../hooks/useQueries';
import { cn } from '../utils/cn';
import { getMediaUrl } from '../utils/url';
import { Modal } from '../components/ui/Modal';
import { POIForm } from '../components/POIForm';
import { ClaimForm } from '../components/ClaimForm';
import { SourceForm } from '../components/SourceForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePOI, deleteClaim, deleteSource } from '../services/api';

type AdminSection = 'pois' | 'claims' | 'sources';

export function Admin() {
  const [activeSection, setActiveSection] = useState<AdminSection>('pois');
  const [showPOIForm, setShowPOIForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { data: pois, isLoading: isLoadingPOIs } = usePOIs();
  const { data: claims, isLoading: isLoadingClaims } = useClaims(undefined);
  const { data: sources, isLoading: isLoadingSources } = useSources();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: AdminSection }) => {
      if (type === 'pois') return deletePOI(id);
      if (type === 'claims') return deleteClaim(id);
      if (type === 'sources') return deleteSource(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type] });
    },
    onError: (error: any) => {
      console.error('Delete failed:', error);
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate({ id, type: activeSection });
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeSection === 'pois') setShowPOIForm(true);
    else if (activeSection === 'claims') setShowClaimForm(true);
    else if (activeSection === 'sources') setShowSourceForm(true);
  };

  const handleCloseForm = () => {
    setShowPOIForm(false);
    setShowClaimForm(false);
    setShowSourceForm(false);
    setEditingItem(null);
  };

  const isLoading = activeSection === 'pois' ? isLoadingPOIs : activeSection === 'claims' ? isLoadingClaims : isLoadingSources;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-slate-500">Manage analysis, persons of interest, and system tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPOIForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add POI
          </button>
          <button 
            onClick={() => setShowClaimForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Claim
          </button>
          <button 
            onClick={() => setShowSourceForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-amber-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Source
          </button>
        </div>
      </div>

      {showPOIForm && (
        <POIForm 
          onClose={handleCloseForm} 
          initialData={editingItem} 
        />
      )}

      {showClaimForm && (
        <Modal isOpen={showClaimForm} onClose={handleCloseForm} title={editingItem ? "Edit Claim" : "Add New Claim"}>
          <ClaimForm 
            pois={pois || []} 
            initialData={editingItem}
            onCancel={handleCloseForm} 
          />
        </Modal>
      )}

      {showSourceForm && (
        <Modal isOpen={showSourceForm} onClose={handleCloseForm} title={editingItem ? "Edit Source" : "Add New Source"}>
          <SourceForm 
            claims={claims || []}
            initialData={editingItem}
            onCancel={handleCloseForm} 
          />
        </Modal>
      )}

      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5 w-fit border border-slate-200/50 shadow-inner">
        {[
          { id: 'pois', label: 'Manage POIs', icon: Users },
          { id: 'claims', label: 'Claims Engine', icon: CheckCircle2 },
          { id: 'sources', label: 'Sources Bank', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as AdminSection)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300",
              activeSection === tab.id 
                ? "bg-white text-blue-600 shadow-md shadow-blue-500/5 ring-1 ring-slate-200/50" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeSection === tab.id ? "text-blue-600" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card-premium !p-0 overflow-hidden shadow-xl shadow-black/5">
        <div className="border-b border-slate-800 bg-slate-900 px-8 py-5 flex items-center justify-between">
          <div className="relative w-80 group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={`Search across ${activeSection}...`}
              className="input-premium input-with-icon !bg-slate-950 !border-slate-800 !text-slate-100 placeholder:text-slate-600 shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">{activeSection === 'sources' ? 'Title' : 'Identification'}</th>
                <th className="px-8 py-5">Current Status</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : (
                <>
                  {activeSection === 'pois' && pois?.map((poi) => (
                    <tr key={poi.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={getMediaUrl(poi.profile_image)} className="h-10 w-10 rounded-xl object-cover ring-2 ring-white shadow-md group-hover:ring-blue-100 transition-all" alt="" />
                          <div>
                            <div className="font-black text-slate-900 text-base tracking-tight">{poi.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{poi.location || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest leading-none">
                          {poi.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[11px] font-bold text-slate-500 tracking-tight">{new Date(poi.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(poi)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(poi.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

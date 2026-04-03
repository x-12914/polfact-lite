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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add POI
          </button>
          <button 
            onClick={() => setShowClaimForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Claim
          </button>
          <button 
            onClick={() => setShowSourceForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95"
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

      <div className="flex gap-1 rounded-xl bg-slate-200/50 p-1 w-fit">
        {[
          { id: 'pois', label: 'Manage POIs', icon: Users },
          { id: 'claims', label: 'Claims Engine', icon: CheckCircle2 },
          { id: 'sources', label: 'Sources Bank', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as AdminSection)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
              activeSection === tab.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search ${activeSection}...`}
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">{activeSection === 'sources' ? 'Title' : 'Name'}</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
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
                    <tr key={poi.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={getMediaUrl(poi.profile_image)} className="h-8 w-8 rounded-full object-cover" alt="" />
                          <div>
                            <div className="font-bold text-slate-900">{poi.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">{poi.status}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(poi.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(poi)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(poi.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
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

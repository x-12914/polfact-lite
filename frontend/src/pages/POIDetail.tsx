import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Briefcase, 
  PieChart as PieChartIcon,
  AlertCircle,
  Loader2,
  Edit,
  Plus,
  Camera,
  Trash2
} from 'lucide-react';
import { useClaims, usePOI } from '../hooks/useQueries';
import { updatePOI, createClaim, deletePOI, uploadPOIImage } from '../services/api';
import { ClaimsTable } from '../components/ClaimsTable';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Modal } from '../components/ui/Modal';
import { cn } from '../utils/cn';
import { getMediaUrl } from '../utils/url';

export function POIDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const { data: poi, isLoading: isLoadingPOI, error: poiError } = usePOI(id);
  const { data: claims, isLoading: isLoadingClaims, error: claimsError } = useClaims(id);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState<'ongoing' | 'completed'>('ongoing');
  
  const [isAddingClaim, setIsAddingClaim] = useState(false);
  const [newClaimDescription, setNewClaimDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = userRole === 'admin';
  const canEdit = isAdmin;

  const updateMutation = useMutation({
    mutationFn: (data: any) => updatePOI(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poi', id] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      setShowEditModal(false);
    }
  });

  const deletePoiMutation = useMutation({
    mutationFn: () => deletePOI(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      navigate('/pois');
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => uploadPOIImage(Number(id), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poi', id] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    }
  });

  const claimMutation = useMutation({
    mutationFn: (description: string) => createClaim({
      poi_id: Number(id),
      description,
      status: 'ongoing'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', id] });
      setIsAddingClaim(false);
      setNewClaimDescription('');
    }
  });
  
  const filteredAndSortedClaims = useMemo(() => {
    if (!claims) return [];
    let result = [...claims];
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    return result;
  }, [claims]);

  const handleImageClick = () => {
    if (canEdit && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  if (isLoadingPOI || isLoadingClaims) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (poiError || claimsError || !poi) {
    return (
      <div className="rounded-lg bg-rose-50 p-6 text-rose-700">
        <h2 className="text-lg font-bold">Error loading POI details</h2>
        <Link to="/pois" className="mt-4 inline-flex items-center gap-2 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/pois" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Persons of Interest
        </Link>
        <div className="flex gap-3">
          {canEdit && (
            <>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this person of interest? This will hide all their claims too.')) {
                    deletePoiMutation.mutate();
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button 
                onClick={() => {
                  setEditName(poi.name);
                  setEditDescription(poi.description || '');
                  setEditLocation(poi.location || '');
                  setEditStatus(poi.status);
                  setShowEditModal(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full lg:w-1/3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-8 flex flex-col items-center">
            <div 
              className={cn(
                "relative group cursor-pointer h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl",
                canEdit && "hover:ring-4 hover:ring-blue-500/20"
              )}
              onClick={handleImageClick}
            >
              <img 
                src={getMediaUrl(poi.profile_image)} 
                alt={poi.name} 
                className="h-full w-full object-cover transition-transform group-hover:scale-110" 
              />
              {canEdit && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadImageMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            
            <h1 className="mt-6 text-2xl font-bold text-slate-900">{poi.name}</h1>
            <p className="text-sm text-slate-500 font-medium">{poi.location || 'Unknown Location'}</p>
            <div className="mt-4">
              <StatusBadge status={poi.status} className="px-4 py-1 text-sm font-bold" />
            </div>
            
            <p className="mt-6 text-sm text-slate-600 leading-relaxed text-center italic">
              {poi.description || "No biography available."}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Analysis Log</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{filteredAndSortedClaims.length} Claims Tracked</p>
              </div>
              <button 
                onClick={() => setIsAddingClaim(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" /> Add Claim
              </button>
            </div>
            
            {filteredAndSortedClaims.length > 0 ? (
              <ClaimsTable claims={filteredAndSortedClaims} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-20" />
                No claims found for this persona.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit POI Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile">
        <form onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate({ 
            name: editName, 
            description: editDescription,
            location: editLocation,
            status: editStatus
          });
        }} className="space-y-4 pt-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              required 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Location / Office</label>
            <input 
              type="text" 
              value={editLocation} 
              onChange={(e) => setEditLocation(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Investigation Status</label>
            <select 
              value={editStatus} 
              onChange={(e) => setEditStatus(e.target.value as any)} 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="ongoing">Ongoing Portfolio</option>
              <option value="completed">Archive (Completed)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Biography / Context</label>
            <textarea 
              value={editDescription} 
              onChange={(e) => setEditDescription(e.target.value)} 
              required 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[100px]" 
            />
          </div>
          <div className="flex gap-3 pt-6">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="flex-[2] rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Update Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Claim Modal */}
      <Modal isOpen={isAddingClaim} onClose={() => setIsAddingClaim(false)} title="Create New Claim">
        <form onSubmit={(e) => {
          e.preventDefault();
          claimMutation.mutate(newClaimDescription);
        }} className="space-y-4 pt-4">
          <textarea 
            required
            autoFocus
            placeholder="e.g. Claimed that infrastructure spending would double by 2027."
            value={newClaimDescription}
            onChange={(e) => setNewClaimDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[160px]" 
          />
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsAddingClaim(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={claimMutation.isPending} className="flex-[2] rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
              {claimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Claim'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

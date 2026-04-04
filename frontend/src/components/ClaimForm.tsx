import { useState } from 'react';
import { Save, Loader2, Calendar, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClaim, updateClaim, analyzeClaim, type POI } from '../services/api';
import { cn } from '../utils/cn';

interface ClaimFormProps {
  pois: POI[];
  initialData?: any;
  onSubmit?: (data: any) => void;
  onCancel: () => void;
}

export function ClaimForm({ pois, initialData, onSubmit, onCancel }: ClaimFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    poi_id: initialData?.poi_id || '',
    description: initialData?.description || '',
    status: initialData?.status || 'ongoing',
    confidence: initialData?.confidence || 50,
    date_reported: initialData?.date_reported || (initialData?.created_at ? new Date(initialData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
  });
  const [autoVerify, setAutoVerify] = useState(!initialData?.id);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      let claim;
      if (initialData?.id) {
        claim = await updateClaim(initialData.id, data);
      } else {
        claim = await createClaim(data);
      }

      if (autoVerify && claim?.id) {
        try {
          await analyzeClaim(claim.description, claim.id);
        } catch (err) {
          console.error('Auto-verification failed:', err);
        }
      }
      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      if (onSubmit) onSubmit(formData);
      onCancel();
    },
    onError: (error: any) => {
      console.error('Claim operation failed:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poi_id) {
      alert('Please select a Person of Interest');
      return;
    }
    mutation.mutate({
      ...formData,
      poi_id: parseInt(formData.poi_id.toString()),
      confidence: parseInt(formData.confidence.toString())
    });
  };

  const isLoading = mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Person of Interest</label>
          <div className="relative">
            <select
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
              value={formData.poi_id}
              onChange={(e) => setFormData({ ...formData, poi_id: e.target.value })}
            >
              <option value="">Select a POI...</option>
              {pois.map((poi) => (
                <option key={poi.id} value={poi.id}>{poi.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Claim Description</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <textarea
              required
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              placeholder="Detailed description of the claim being analyzed..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Status</label>
            <div className="relative">
              <CheckCircle2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="ongoing">Ongoing</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="partial">Partial</option>
                <option value="unfulfilled">Unfulfilled</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Report Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                value={formData.date_reported}
                onChange={(e) => setFormData({ ...formData, date_reported: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Confidence</label>
            <span className="text-sm font-bold text-blue-600">{formData.confidence}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            value={formData.confidence}
            onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) })}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Auto-Verify with AI</p>
              <p className="text-[10px] text-blue-600">Instantly analyze this claim using the AI engine</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoVerify(!autoVerify)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
              autoVerify ? "bg-blue-600" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                autoVerify ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initialData?.id ? 'Update Claim' : 'Save Claim'}
        </button>
      </div>
    </form>
  );
}

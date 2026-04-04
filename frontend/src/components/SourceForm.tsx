import { useState } from 'react';
import { Save, Loader2, FileText, Calendar, Link as LinkIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSource, updateSource, type Claim } from '../services/api';

interface SourceFormProps {
  claims: Claim[];
  initialData?: any;
  onSubmit?: (data: any) => void;
  onCancel: () => void;
}

export function SourceForm({ claims, initialData, onSubmit, onCancel }: SourceFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    claim_id: initialData?.claim_id || '',
    title: initialData?.title || '',
    type: initialData?.type || 'manifesto',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    link: initialData?.link || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (initialData?.id) {
        return updateSource(initialData.id, data);
      }
      return createSource(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      if (onSubmit) onSubmit(formData);
      onCancel();
    },
    onError: (error: any) => {
      console.error('Source operation failed:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.claim_id) {
      alert('Please select a Claim to link this source to');
      return;
    }
    mutation.mutate({
      ...formData,
      claim_id: parseInt(formData.claim_id.toString())
    });
  };

  const isLoading = mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Related Claim</label>
          <div className="relative">
            <select
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
              value={formData.claim_id}
              onChange={(e) => setFormData({ ...formData, claim_id: e.target.value })}
            >
              <option value="">Select a Claim...</option>
              {claims.map((claim) => (
                <option key={claim.id} value={claim.id}>{claim.description.substring(0, 60)}...</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Title</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              placeholder="e.g. 2023 Economic Policy Manifesto"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Type</label>
            <div className="relative">
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="manifesto">Manifesto</option>
                <option value="interview">Interview</option>
                <option value="osint">OSINT</option>
                <option value="media">Media</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Publication Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Source URL</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              placeholder="https://example.com/source"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>
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
          {initialData?.id ? 'Update Source' : 'Save Source'}
        </button>
      </div>
    </form>
  );
}

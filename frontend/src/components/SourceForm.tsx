import { useState } from 'react';
import { Save, Loader2, FileText, Link as LinkIcon, PenTool, Tag, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSource, updateSource, type Claim } from '../services/api';
import { cn } from '../utils/cn';

interface SourceFormProps {
  claims: Claim[];
  initialData?: any;
  onSubmit?: (data: any) => void;
  onCancel: () => void;
}

const EVIDENCE_TYPES = [
  { value: 'manual',    label: 'Direct Statement',  desc: 'Typed evidence or testimony' },
  { value: 'interview', label: 'Interview',          desc: 'Quote from an interview' },
  { value: 'manifesto', label: 'Document / Manifesto', desc: 'From a written document' },
  { value: 'osint',     label: 'OSINT',              desc: 'Open-source intelligence' },
  { value: 'media',     label: 'Media',              desc: 'Broadcast or publication' },
];

export function SourceForm({ claims, initialData, onSubmit, onCancel }: SourceFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    claim_id:  initialData?.claim_id  || '',
    title:     initialData?.title     || '',
    type:      initialData?.type      || 'manual',
    content:   initialData?.content   || '',
    link:      initialData?.link      || '',
    date:      initialData?.date      || new Date().toISOString().split('T')[0],
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (initialData?.id) return updateSource(initialData.id, data);
      return createSource(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', String(formData.claim_id)] });
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
      alert('Please select a claim to attach this evidence to.');
      return;
    }
    if (!formData.content.trim() && !formData.link.trim()) {
      alert('Please provide either evidence content or a source URL.');
      return;
    }
    mutation.mutate({
      ...formData,
      claim_id: parseInt(formData.claim_id.toString()),
      // send null for empty strings so backend accepts them as optional
      content: formData.content.trim() || null,
      link:    formData.link.trim()    || null,
    });
  };

  const selected = EVIDENCE_TYPES.find(t => t.value === formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Claim selector — only shown if multiple claims could exist */}
      {claims.length > 1 && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Linked Claim
          </label>
          <select
            required
            className="input-intel h-12"
            value={formData.claim_id}
            onChange={(e) => setFormData({ ...formData, claim_id: e.target.value })}
          >
            <option value="">Select a claim...</option>
            {claims.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} — {c.description.substring(0, 55)}…
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Evidence type pills */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          Evidence Type
        </label>
        <div className="flex flex-wrap gap-2">
          {EVIDENCE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFormData({ ...formData, type: t.value })}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                formData.type === t.value
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500/40 hover:text-slate-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {selected && (
          <p className="text-[10px] text-slate-600 italic ml-1">{selected.desc}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          Evidence Title <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            required
            className="input-intel pl-12"
            placeholder='e.g. "Stated in press conference, 12 Apr 2026"'
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
      </div>

      {/* Content — THE main field */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <PenTool className="h-3 w-3" />
          Evidence Content
          <span className="text-slate-600 font-bold normal-case tracking-normal text-[9px]">— type the actual evidence here</span>
        </label>
        <textarea
          className="input-intel min-h-[160px] leading-relaxed resize-y"
          placeholder={
            formData.type === 'interview'
              ? '"Quote the exact statement here, including context about when and where it was said."'
              : formData.type === 'manual'
              ? 'Type the evidence directly. Be specific — include dates, figures, and direct quotes where possible.'
              : 'Paste or type the relevant excerpt from the source document...'
          }
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
        <p className="text-[9px] text-slate-600 ml-1">
          {formData.content.length} chars{formData.content.length > 0 && formData.content.length < 20 ? ' — add more detail for stronger evidence' : ''}
        </p>
      </div>

      {/* Optional URL */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          Source URL <span className="text-slate-700 font-bold normal-case tracking-normal text-[9px]">— optional</span>
        </label>
        <div className="relative">
          <LinkIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="url"
            className="input-intel pl-12"
            placeholder="https://... (leave blank if evidence is typed above)"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-intel btn-intel-secondary h-12"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-[2] btn-intel btn-intel-primary h-12"
        >
          {mutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ShieldCheck className="h-4 w-4" />
          }
          {mutation.isPending ? 'Logging Intel...' : (initialData?.id ? 'Update Evidence' : 'Log Evidence')}
        </button>
      </div>
    </form>
  );
}

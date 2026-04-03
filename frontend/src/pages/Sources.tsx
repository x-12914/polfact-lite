import { useState } from 'react';
import { Search, Filter, Loader2, ExternalLink, FileText, Mic, Globe, Share2 } from 'lucide-react';
import { useSources } from '../hooks/useQueries';
import { cn } from '../utils/cn';

const typeIcons: any = {
  manifesto: FileText,
  interview: Mic,
  osint: Globe,
  media: Share2,
};

const typeColors: any = {
  manifesto: 'text-indigo-600 bg-indigo-50',
  interview: 'text-rose-600 bg-rose-50',
  osint: 'text-emerald-600 bg-emerald-50',
  media: 'text-blue-600 bg-blue-50',
};

export function Sources() {
  const { data: sources, isLoading, error } = useSources();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'manifesto' | 'interview' | 'osint' | 'media'>('all');

  const filteredSources = sources?.filter((source) => {
    const matchesSearch = source.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || source.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
        <h2 className="text-lg font-bold">Error loading sources</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sources Repository</h1>
          <p className="mt-1 text-slate-500">View and browse evidence sources.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sources..."
              className="rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSources?.map((source) => {
          const Icon = typeIcons[source.type] || FileText;
          return (
            <div key={source.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className={cn("rounded-lg p-2.5", typeColors[source.type] || 'text-slate-600 bg-slate-50')}>
                  <Icon className="h-5 w-5" />
                </div>
                {source.link && (
                  <a href={source.link} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {source.title || 'Untitled Source'}
                </h3>
                <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className={cn("px-2 py-0.5 rounded-full", typeColors[source.type] || 'text-slate-600 bg-slate-50')}>
                    {source.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

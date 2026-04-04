import { useState } from 'react';
import { Search, Loader2, Globe, ExternalLink, CheckCircle, FileText, Activity, X, Plus, User, Filter } from 'lucide-react';
import { searchWeb, performResearch } from '../services/api';
import type { SearchResult, ResearchResult } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { AddToPOIModal } from '../components/ui/AddToPOIModal';
import { cn } from '../utils/cn';

export function WebScraper() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [numResults, setNumResults] = useState(10);
  const [researchingUrl, setResearchingUrl] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showAddClaimModal, setShowAddClaimModal] = useState(false);
  const [selectedClaimText, setSelectedClaimText] = useState('');
  const [selectedQuote, setSelectedQuote] = useState('');
  const [focusEntity, setFocusEntity] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [visibleEvidence, setVisibleEvidence] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResults(null);
      const data = await searchWeb(query, numResults);
      setResults(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleResearch = async (url: string) => {
    try {
      setResearchingUrl(url);
      setResearchResult(null);
      setFocusEntity('');
      setVisibleEvidence({});
      setError(null);
      const data = await performResearch(url);
      setResearchResult(data);
      setShowResearchModal(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to analyze article');
    } finally {
      setResearchingUrl(null);
    }
  };

  const handleRefineResearch = async () => {
    if (!researchResult || !focusEntity.trim()) return;

    try {
      setIsRefining(true);
      const data = await performResearch(researchResult.url, focusEntity);
      setResearchResult(data);
      setVisibleEvidence({});
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to refine analysis');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="control-bar">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Web Scraper</h1>
          <p className="mt-1 text-slate-500 font-medium tracking-tight">Search and instantly analyze articles for deep fact-checking.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] shadow-inner shadow-blue-600/5">
           <Activity className="h-4 w-4" strokeWidth={3} /> Live OSINT Engine
        </div>
      </div>

      <div className="card-premium !p-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Enter a name, claim, or topic to search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-premium input-with-icon py-4"
              disabled={loading}
            />
          </div>
          <div className="flex flex-wrap gap-4 min-w-fit">
            <div className="relative group min-w-[160px]">
              <select 
                value={numResults}
                onChange={(e) => setNumResults(Number(e.target.value))}
                disabled={loading}
                className="input-premium px-6 py-4 appearance-none cursor-pointer pr-12 w-full !bg-slate-50 border-slate-200"
              >
                <option value={10}>10 Results</option>
                <option value={20}>20 Results</option>
                <option value={50}>50 Results</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Filter className="h-4 w-4" />
              </div>
            </div>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="btn-premium btn-primary flex-1 sm:flex-none !px-10 shadow-blue-500/20 whitespace-nowrap"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
              Execute Search
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-100 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            {error}
          </div>
        )}

        {results !== null && !loading && (
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest border-t border-slate-50 pt-6">
            <CheckCircle className="h-4 w-4" />
            Success: Found {results.length} Indexed Results
          </div>
        )}
      </div>

      {results && results.length > 0 && (
        <div className="card-premium !p-0 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6">
            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Discovery Engine: Managed Intelligence Results</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {results.map((result, index) => (
              <div key={index} className="group p-8 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                       <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                          {result.title || "Untitled Source"}
                       </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 truncate uppercase tracking-wider">
                       <Globe className="h-3 w-3" /> {new URL(result.link).hostname}
                    </div>
                    {result.snippet && (
                      <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleResearch(result.link)}
                      disabled={researchingUrl !== null}
                      className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {researchingUrl === result.link ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      Research & Analyze
                    </button>
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Source
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400 font-medium">
          No matches found. Try refining your search parameters.
        </div>
      )}

      {/* Research Analysis Modal */}
      <Modal 
        isOpen={showResearchModal} 
        onClose={() => {
          setShowResearchModal(false);
          setResearchResult(null);
        }}
        title={researchResult ? `Intelligence Report: ${new URL(researchResult.url).hostname}` : "AI Intelligence Report"}
      >
        {researchResult && (
          <div className="space-y-8 pt-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
                     <Activity className="h-5 w-5" />
                  </div>
                  <div>
                     <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Analysis Mode</div>
                     <div className="text-sm font-bold text-blue-900 capitalize">{researchResult.tone} Perspective</div>
                  </div>
               </div>
               <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-widest">
                  Verified Scrape
               </div>
            </div>

            {/* Targeted Analysis Input */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Targeted Discovery</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Focus the AI on a specific person or name to extract hidden claims.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Enter a name (e.g. John Doe)..."
                    value={focusEntity}
                    onChange={(e) => setFocusEntity(e.target.value)}
                    className="w-full rounded-xl border border-white bg-white/80 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleRefineResearch}
                  disabled={isRefining || !focusEntity.trim()}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  Refocus
                </button>
              </div>
              {focusEntity && researchResult && !isRefining && (
                <button 
                  onClick={() => handleResearch(researchResult.url)}
                  className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                >
                  ← Reset to Overall Analysis
                </button>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Intelligence Summary</h3>
              <div className="rounded-2xl bg-slate-900 p-6 text-slate-100 text-sm leading-relaxed shadow-xl border border-slate-800">
                {researchResult.summary}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Extracted Claims</h3>
              <div className="space-y-3">
                {researchResult.claims.map((claim, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-colors group">
                      <div className="flex gap-4 flex-1">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">
                            {typeof claim === 'string' ? claim : (claim as any).text}
                          </p>
                          <button 
                            onClick={() => setVisibleEvidence(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1"
                          >
                            <Activity className="h-3 w-3" /> {visibleEvidence[idx] ? 'Hide Evidence' : 'Show Evidence'}
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedClaimText(claim.text);
                          setSelectedQuote(claim.quote);
                          setShowAddClaimModal(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap shadow-sm active:scale-95"
                      >
                        <Plus className="h-3 w-3" /> Add to POI
                      </button>
                    </div>
                    
                    {visibleEvidence[idx] && (
                      <div className="mx-4 p-4 rounded-xl bg-slate-50 border-l-4 border-blue-400 text-xs text-slate-600 italic animate-in slide-in-from-top-2 duration-200">
                        "{typeof claim === 'string' ? 'No direct quote extracted.' : (claim as any).quote || 'No direct quote extracted.'}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <button 
                onClick={() => {
                  setShowResearchModal(false);
                  setResearchResult(null);
                }}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Close Report
              </button>
              <a
                href={researchResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-black/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                <ExternalLink className="h-4 w-4" />
                Read Full Source
              </a>
            </div>
          </div>
        )}
      </Modal>

      <AddToPOIModal 
        isOpen={showAddClaimModal}
        onClose={() => setShowAddClaimModal(false)}
        initialDescription={selectedClaimText}
        quote={selectedQuote}
        sourceUrl={researchResult?.url}
      />
    </div>
  );
}

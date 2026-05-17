import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Globe, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  HelpCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface MonitoredSite {
  id: number;
  site_name: string;
  site_url: string;
  is_active: boolean;
  last_scraped: string | null;
  created_at: string;
}

interface AuditedClaim {
  text: string;
  quote: string;
  status: 'fulfilled' | 'partial' | 'unfulfilled' | 'ongoing';
  confidence: number;
  ai_insight: string;
}

interface AuditedArticle {
  id: number;
  site_id: number;
  url: string;
  title: string;
  extracted_claims: AuditedClaim[];
  last_checked: string;
  created_at: string;
}

export function MonitoringConsole() {
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [articles, setArticles] = useState<AuditedArticle[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  
  // Whitelist form inputs
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [addingSite, setAddingSite] = useState(false);

  // Scan states
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // Expanded articles tracker
  const [expandedArticles, setExpandedArticles] = useState<Record<number, boolean>>({});

  const fetchData = async () => {
    setLoadingSites(true);
    setLoadingArticles(true);
    try {
      const sitesResp = await api.get('/monitoring/sites');
      setSites(sitesResp.data.data);

      const articlesResp = await api.get('/monitoring/articles');
      setArticles(articlesResp.data.data);
    } catch (e) {
      console.error("Failed to load monitoring logs:", e);
    } finally {
      setLoadingSites(false);
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteUrl) return;

    setAddingSite(true);
    try {
      const resp = await api.post('/monitoring/sites', {
        name: newSiteName,
        url: newSiteUrl
      });
      setSites(prev => [...prev, resp.data.data]);
      setNewSiteName('');
      setNewSiteUrl('');
    } catch (err) {
      console.error(err);
      alert("Failed to register monitored site domain. Check if already added.");
    } finally {
      setAddingSite(false);
    }
  };

  const handleDeleteSite = async (id: number) => {
    if (!confirm("Are you sure you want to remove this domain from autonomous audits?")) return;

    try {
      await api.delete(`/monitoring/sites/${id}`);
      setSites(prev => prev.filter(site => site.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to remove site.");
    }
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    setScanMessage("Spinning up background crawler threads...");
    try {
      await api.post('/monitoring/scan');
      setScanMessage("Autonomous cycle triggered. Scrapers active. Auditing claims in background...");
      
      // Auto-refresh logs after 12 seconds to show scraped updates
      setTimeout(async () => {
        try {
          const resp = await api.get('/monitoring/articles');
          setArticles(resp.data.data);
        } catch (e) {
          console.error("Delayed refresh failed:", e);
        }
        setIsScanning(false);
        setScanMessage("");
      }, 12000);

    } catch (e) {
      console.error(e);
      alert("Failed to trigger autonomous verification scan.");
      setIsScanning(false);
      setScanMessage("");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedArticles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider border-l-4 border-indigo-500 pl-4 py-1">
            Autonomous Monitoring & Verification
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium">
            Pillars 1, 3, and 5: Automated site ingestion, NLP claim extraction, and serp verification grids.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Whitelist Manager & Trigger */}
        <div className="lg:col-span-1 space-y-6">
          {/* Autonomous control deck */}
          <div className="card-premium relative overflow-hidden bg-[#020617] border-slate-800 text-white p-6 sm:p-8">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[60px] pointer-events-none" />

            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400 animate-pulse" />
              Autonomous Audit Control
            </h3>

            {isScanning ? (
              <div className="space-y-4 text-center py-6 relative z-10">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                  <Activity className="h-8 w-8 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-indigo-400">Autonomous scan active</h5>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    {scanMessage}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Trigger the autonomous crawler agent. It will site-scrape all whitelisted news portals via Google indices, isolate factual election claims using OpenAI, cross-reference them on the live web, and persist audit logs.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerScan}
                  disabled={sites.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 py-4 font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  <RefreshCw className="h-4 w-4" />
                  Start Audit Cycle
                </button>
              </div>
            )}
          </div>

          {/* Add Whitelist form */}
          <div className="card-premium">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-500" />
              Whitelist News Portal
            </h3>

            <form onSubmit={handleAddSite} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Site Portal Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Politics Nigeria"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Domain URL Address
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. politicsnigeria.com"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={addingSite}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] py-3 shadow-md transition-colors"
              >
                {addingSite ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Register Domain
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Domains Whitelist list */}
          <div className="card-premium">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-500" />
              Active Whitelisted Portals ({sites.length})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800/40 max-h-[250px] overflow-y-auto pr-2 scrollbar-custom">
              {sites.length > 0 ? (
                sites.map((site) => (
                  <div key={site.id} className="py-3 flex items-center justify-between group">
                    <div className="truncate pr-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{site.site_name}</p>
                      <a 
                        href={site.site_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] text-slate-400 hover:text-indigo-500 dark:text-slate-500 transition-colors font-medium flex items-center gap-1 mt-0.5"
                      >
                        {site.site_url.replace("https://", "").replace("http://", "")}
                        <ExternalLink className="h-2 w-2" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="text-slate-300 dark:text-zinc-700 hover:text-rose-500 dark:hover:text-rose-500 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                  No domains registered.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audited Articles Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium flex flex-col justify-between min-h-[500px] bg-white dark:bg-zinc-900">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Autonomous Verification Audit Feed
                </h3>
                <button 
                  onClick={fetchData}
                  disabled={loadingArticles}
                  className="text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={cn("h-3 w-3", loadingArticles && "animate-spin")} />
                  Refresh Feed
                </button>
              </div>

              {/* Feed logs list */}
              <div className="space-y-4">
                {articles.length > 0 ? (
                  articles.map((article) => {
                    const isExpanded = expandedArticles[article.id] || false;
                    const site = sites.find(s => s.id === article.site_id);
                    return (
                      <div 
                        key={article.id} 
                        className="rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950 p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              {site ? site.site_name : "Whitelisted News"}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-3">
                              Audited {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-relaxed">
                              {article.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 dark:text-zinc-600 hover:text-indigo-500 p-1 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => toggleExpand(article.id)}
                              className="text-slate-400 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-slate-200 p-1 transition-all"
                            >
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Claims Sub-Feed */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-indigo-500" />
                              Extracted & Verified Claims ({article.extracted_claims.length})
                            </h5>

                            {article.extracted_claims.length > 0 ? (
                              <div className="space-y-4">
                                {article.extracted_claims.map((claim, cIdx) => (
                                  <div 
                                    key={cIdx} 
                                    className="rounded-xl border border-slate-200/80 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 p-4 relative overflow-hidden"
                                  >
                                    {/* Mirrored indicator */}
                                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500" />

                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pl-3">
                                      <div className="flex-1 space-y-2">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                          "{claim.text}"
                                        </p>
                                        {claim.quote && (
                                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-zinc-950 p-2 rounded border-l-2 border-indigo-400/40">
                                            Evidence Quote: "{claim.quote}"
                                          </p>
                                        )}
                                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                                          <span className="font-bold text-indigo-500">AI Insight:</span> {claim.ai_insight}
                                        </p>
                                      </div>

                                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 md:border-l md:border-slate-100 md:dark:border-zinc-800 md:pl-4">
                                        <div>
                                          <span className={cn(
                                            "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                            claim.status === 'fulfilled' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                                            claim.status === 'partial' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                            claim.status === 'unfulfilled' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                          )}>
                                            {claim.status}
                                          </span>
                                        </div>

                                        <div className="text-right">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Confidence</p>
                                          <p className="text-sm font-black text-slate-900 dark:text-white font-mono mt-1">
                                            {(claim.confidence * 100).toFixed(0)}%
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                                No claims extracted from this article.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-28 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                    No articles audited yet. Add whitelisted domains and trigger a scan cycle!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

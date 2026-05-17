import { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity,
  ArrowUpRight,
  Radio,
  Mic,
  Brain,
  Scan,
  Database,
  LayoutDashboard,
  Bell,
  Languages,
  ShieldCheck,
  Network,
  ExternalLink,
  Globe
} from 'lucide-react';
import { usePOIs, useStats, useActivity } from '../hooks/useQueries';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../utils/url';
import api from '../services/api';

export function Dashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const { data: pois } = usePOIs();
  const { data: globalStats } = useStats();
  const { data: recentActivity } = useActivity();

  const [activeTab, setActiveTab] = useState<'manual' | 'autonomous'>('manual');
  const [auditedArticles, setAuditedArticles] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  useEffect(() => {
    const fetchAudits = async () => {
      setLoadingAudits(true);
      try {
        const resp = await api.get('/monitoring/articles');
        setAuditedArticles(resp.data.data);
      } catch (e) {
        console.error("Dashboard failed to load autonomous audits:", e);
      } finally {
        setLoadingAudits(false);
      }
    };
    fetchAudits();
  }, []);

  const stats = [
    { label: 'Total POIs', value: pois?.length || 0, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Fulfilled', value: globalStats?.fulfilled || 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Partial', value: globalStats?.partial || 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Unfulfilled', value: globalStats?.unfulfilled || 0, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  const ecosystemLayers = [
    {
      id: 1,
      name: "Data Ingestion Layer",
      status: "Active",
      desc: "Ingests real-time feeds from TV broadcasts, radio streams, social platforms, and campaign events.",
      metric: "14 feeds live",
      icon: Radio,
      color: "text-indigo-400 bg-indigo-500/10",
    },
    {
      id: 2,
      name: "ASR Processing Engine",
      status: "Processing",
      desc: "ASR system converting speech to text with speaker diarization and noise cancellation.",
      metric: "0.2s latency",
      icon: Mic,
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      id: 3,
      name: "NLP Intelligence Engine",
      status: "Online",
      desc: "Named Entity Recognition (NER), semantic similarity grouping, and narrative trend detection.",
      metric: "98.7% accuracy",
      icon: Brain,
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      id: 4,
      name: "Deepfake Forensic Layer",
      status: "Ready",
      desc: "Advanced neural networks for video frame analysis, voice biometrics, and pixel forensic checking.",
      metric: "Sightengine Linked",
      icon: Scan,
      color: "text-rose-400 bg-rose-500/10",
    },
    {
      id: 5,
      name: "Multi-Source Verification",
      status: "Connected",
      desc: "Cross-references claims against public records, historic election logs, and trusted databases.",
      metric: "2.4M records indexed",
      icon: Database,
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      id: 6,
      name: "AI + Human Workflow",
      status: "Monitoring",
      desc: "Collaborative portal for journalists, analysts, and moderators to verify, override, or escalate claims.",
      metric: "3 active queues",
      icon: Users,
      color: "text-cyan-400 bg-cyan-500/10",
    },
    {
      id: 7,
      name: "Election Intelligence Hub",
      status: "Operational",
      desc: "Real-time geographic tracking of viral election claims, alerts, and verification metrics.",
      metric: "Active Map Feed",
      icon: LayoutDashboard,
      color: "text-teal-400 bg-teal-500/10",
    },
    {
      id: 8,
      name: "Real-Time Alerts Dispatch",
      status: "Operational",
      desc: "Instant warning dispatch via SMS, email, and API webhooks for high-probability deepfake detections.",
      metric: "SMS gateway OK",
      icon: Bell,
      color: "text-amber-400 bg-amber-500/10",
    },
    {
      id: 9,
      name: "Multilingual Processing",
      status: "Active",
      desc: "Dedicated context translation supporting English, Hausa, Yoruba, Igbo, and Nigerian Pidgin.",
      metric: "5 languages active",
      icon: Languages,
      color: "text-orange-400 bg-orange-500/10",
    },
    {
      id: 10,
      name: "Security & Trust Layer",
      status: "Secure",
      desc: "Role-Based Access Control, end-to-end data encryption, and tamper-proof server audit logs.",
      metric: "RBAC + TLS Active",
      icon: ShieldCheck,
      color: "text-pink-400 bg-pink-500/10",
    },
    {
      id: 11,
      name: "Integration Gateway",
      status: "Connected",
      desc: "Standard APIs syncing with television broadcast systems, newsrooms, and external databases.",
      metric: "REST & Webhook live",
      icon: Network,
      color: "text-violet-400 bg-violet-500/10",
    }
  ];

  return (
    <div className="space-y-8">
      {/* Rebranded Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider border-l-4 border-indigo-500 pl-4 py-1">Fact Checker AI Command</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium">Real-time Election Intelligence & Media Verification Platform.</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("rounded-2xl p-4 shadow-inner", stat.bg)}>
                <stat.icon className={cn("h-7 w-7 transition-transform group-hover:scale-110 duration-300", stat.color)} />
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-300 dark:text-zinc-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">{stat.label}</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Feed & Info */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-premium !p-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-8 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 gap-4">
            <h3 className="flex items-center gap-2 text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">
              <Activity className="h-4 w-4 text-indigo-500" />
              Real-time Analytics & Audit Feed
            </h3>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('manual')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                  activeTab === 'manual' 
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Manual Feed
              </button>
              <button
                onClick={() => setActiveTab('autonomous')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                  activeTab === 'autonomous' 
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous Audits ({auditedArticles.length})
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/40 p-4 max-h-[480px] overflow-y-auto scrollbar-custom">
            {activeTab === 'manual' ? (
              recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((item, idx) => (
                  <div key={item.id || idx} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-all border border-transparent hover:border-slate-100 dark:hover:border-zinc-800 animate-fade-in-up">
                    <div className="relative shrink-0">
                      <img 
                        src={getMediaUrl(item.poi_image)} 
                        alt={item.poi}
                        className="h-10 w-10 rounded-xl object-cover border border-slate-100 dark:border-zinc-800 shadow-sm"
                      />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900",
                        item.status === 'fulfilled' ? "bg-emerald-500" : 
                        item.status === 'ongoing' ? "bg-indigo-500" : 
                        item.status === 'partial' ? "bg-amber-500" : "bg-rose-500"
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.poi}</p>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          {item.time ? formatDistanceToNow(new Date(item.time), { addSuffix: true }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.action}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                  No recent activity recorded yet.
                </div>
              )
            ) : (
              auditedArticles && auditedArticles.length > 0 ? (
                auditedArticles.slice(0, 8).map((article, idx) => (
                  <div key={article.id || idx} className="p-4 rounded-xl border border-slate-200/40 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800/20 bg-slate-50/20 dark:bg-zinc-950/20 transition-all mb-4 last:mb-0 animate-fade-in-up animate-in duration-300 slide-in-from-top-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            News Crawler
                          </span>
                          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                            Scraped {article.created_at ? formatDistanceToNow(new Date(article.created_at), { addSuffix: true }) : 'Recently'}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1.5 leading-relaxed">
                          {article.title}
                        </h4>
                      </div>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-500 hover:text-indigo-400 p-1 flex items-center shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    {/* Claims mini preview */}
                    <div className="mt-3 pl-3 border-l-2 border-indigo-500 space-y-2">
                      {article.extracted_claims?.slice(0, 2).map((claim: any, cIdx: number) => (
                        <div key={cIdx} className="text-[11px] leading-relaxed">
                          <div className="flex items-start justify-between gap-4 font-semibold text-slate-600 dark:text-slate-300">
                            <span className="line-clamp-2">"{claim.text}"</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ml-2 shrink-0",
                              claim.status === 'fulfilled' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                              claim.status === 'partial' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            )}>
                              {claim.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                  No autonomous audits crawled yet. Go to **Site Monitor** to start a scan cycle!
                </div>
              )
            )}
          </div>
        </div>

        {/* Global Info */}
        <div className="space-y-6">
          <div className="card-premium text-center">
             <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
               <Activity className="h-8 w-8 text-indigo-500 opacity-60" />
             </div>
             <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Enterprise Environment</h3>
             <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium px-4">
               Fact Checker AI is running synchronously with high-performance SQLite storage. Background asynchronous handlers manage multi-source ingestion and Sightengine verification feeds.
             </p>
          </div>
        </div>
      </div>

      {/* 11 Pillars Core Grid */}
      <div className="space-y-6 pt-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest border-l-4 border-indigo-500 pl-4 py-0.5">
            Ecosystem Core Infrastructure & AI Pipelines
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium pl-5">
            National-grade information defense grid mapping the 11 pillars of independent election verification.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ecosystemLayers.map((layer) => (
            <div 
              key={layer.id} 
              className="card-premium flex flex-col justify-between hover:scale-[1.02] hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Background gradient trace */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-indigo-500/10 transition-all duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`rounded-xl p-3 shadow-inner ${layer.color}`}>
                    <layer.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {layer.status}
                  </div>
                </div>
                
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 truncate">
                  {layer.name}
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium line-clamp-3">
                  {layer.desc}
                </p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
                <span className="text-[9px] font-mono py-0.5 px-2 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-500/10 dark:border-indigo-500/20 font-semibold tracking-wide">
                  {layer.metric}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Pillar 0{layer.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

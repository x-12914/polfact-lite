import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { usePOIs, useStats, useActivity } from '../hooks/useQueries';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../utils/url';

export function Dashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const { data: pois } = usePOIs();
  const { data: globalStats } = useStats();
  const { data: recentActivity } = useActivity();

  const stats = [
    { label: 'Total POIs', value: pois?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Fulfilled', value: globalStats?.fulfilled || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Partial', value: globalStats?.partial || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Unfulfilled', value: globalStats?.unfulfilled || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-slate-500">Real-time tracking of political accountability and fact-checking metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("rounded-2xl p-4 shadow-inner", stat.bg)}>
                <stat.icon className={cn("h-7 w-7 transition-transform group-hover:scale-110 duration-300", stat.color)} />
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</h3>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-premium !p-0 overflow-hidden">
           <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="flex items-center gap-2 text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">
              <Activity className="h-4 w-4 text-blue-600" />
              Real-time Analytics Feed
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((item, idx) => (
                <div key={item.id || idx} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="relative shrink-0">
                    <img 
                      src={getMediaUrl(item.poi_image)} 
                      alt={item.poi}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                    />
                    <div className={cn(
                      "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white",
                      item.status === 'fulfilled' ? "bg-emerald-500" : 
                      item.status === 'ongoing' ? "bg-blue-500" : 
                      item.status === 'partial' ? "bg-amber-500" : "bg-rose-500"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">{item.poi}</p>
                      <span className="text-[10px] font-medium text-slate-400">
                        {item.time ? formatDistanceToNow(new Date(item.time), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.action}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center text-slate-400 italic text-sm">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Global Info */}
        <div className="space-y-6">
          <div className="card-premium text-center">
             <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Activity className="h-8 w-8 text-blue-600 opacity-40" />
             </div>
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Lite Environment</h3>
             <p className="text-sm text-slate-600 leading-relaxed font-medium px-4">
               The PolFact Lite engine is running synchronously with SQLite. Background tasks handle media processing and AI analysis.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

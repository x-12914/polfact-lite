import { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Loader2,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { useClaims } from '../hooks/useQueries';
import { StatusBadge } from '../components/StatusBadge';
import { cn } from '../utils/cn';
import { getMediaUrl } from '../utils/url';

export function JournalistDashboard() {
  const { data: claims, isLoading } = useClaims(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  
  const stats = useMemo(() => {
    if (!claims) return { total: 0, pending: 0, verified: 0 };
    return {
      total: claims.length,
      pending: claims.filter(c => c.status === 'ongoing').length,
      verified: claims.filter(c => c.status !== 'ongoing').length,
    };
  }, [claims]);

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Journalist Portal</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
           <p className="text-sm font-medium text-slate-500">Total Assignments</p>
           <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
           <p className="text-sm font-medium text-slate-500">Pending Review</p>
           <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
           <p className="text-sm font-medium text-slate-500">Completed</p>
           <p className="text-3xl font-bold text-emerald-600">{stats.verified}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b">
           <h2 className="font-bold">Active Investigations</h2>
        </div>
        <div className="p-6">
           {claims?.map(claim => (
              <div key={claim.id} className="group mb-4 p-4 border rounded-xl flex items-center justify-between hover:border-blue-200 hover:bg-slate-50 transition-all">
                 <div className="flex items-center gap-4">
                    {claim.poi && (
                      <img 
                        src={getMediaUrl((claim.poi as any).profile_image)} 
                        alt={(claim.poi as any).name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                       <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{claim.description}</p>
                          <StatusBadge status={claim.status} />
                       </div>
                       {claim.poi && (
                         <p className="text-xs text-slate-500 font-medium">Assigned to: {(claim.poi as any).name}</p>
                       )}
                    </div>
                 </div>
                 <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}

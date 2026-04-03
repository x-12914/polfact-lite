import { Link } from 'react-router-dom';
import type { POI } from '../types/index';
import { cn } from '../utils/cn';
import { getMediaUrl } from '../utils/url';

interface POICardProps {
  poi: POI & { stats?: any };
}

export function POICard({ poi }: POICardProps) {
  const stats = poi.stats || { fulfilled: 0, partial: 0, unfulfilled: 0, ongoing: 0 };
  const totalClaims = stats.fulfilled + stats.partial + stats.unfulfilled + stats.ongoing;

  return (
    <Link 
      to={`/poi/${poi.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-400 hover:shadow-lg"
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={getMediaUrl(poi.profile_image)}
          alt={poi.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className={cn(
          "absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm",
          poi.status === 'ongoing' ? 'bg-amber-500' : 'bg-emerald-500'
        )}>
          {poi.status}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {poi.name}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {poi.location}
        </p>
        
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          <div className="text-center">
            <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Fulfilled</span>
            <span className="text-sm font-bold text-emerald-600">{stats.fulfilled || 0}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Partial</span>
            <span className="text-sm font-bold text-amber-600">{stats.partial || 0}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Unfulfilled</span>
            <span className="text-sm font-bold text-rose-600">{stats.unfulfilled || 0}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{totalClaims} total claims</span>
          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

import { useState } from 'react';
import { Search, Filter, Loader2, Plus } from 'lucide-react';
import { usePOIs } from '../hooks/useQueries';
import { POICard } from '../components/POICard';
import { useAuth } from '../contexts/AuthContext';
import { POIForm } from '../components/POIForm';

export function POIList() {
  const { data: pois, isLoading, error } = usePOIs();
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPOIs = pois?.filter((poi) => {
    const matchesSearch = poi.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || poi.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        <h2 className="text-lg font-bold">Error loading POIs</h2>
        <p>Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Persons of Interest</h1>
          <p className="mt-1 text-slate-500">Monitor and analyze political figures and their claims.</p>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Person
          </button>
        )}
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search POIs..."
              className="rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm text-slate-900 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPOIs?.map((poi) => (
          <POICard key={poi.id} poi={poi} />
        ))}
        {filteredPOIs?.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No persons of interest found matching your criteria.
          </div>
        )}
      </div>

      {showAddModal && (
        <POIForm onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

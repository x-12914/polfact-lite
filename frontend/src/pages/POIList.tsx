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
      <div className="control-bar">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Persons of Interest</h1>
          <p className="mt-1 text-slate-500 font-medium">Monitor and analyze political figures and their claims.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name..."
              className="input-premium input-with-icon w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative group">
            <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <select 
              className="input-premium input-with-icon pr-10 appearance-none cursor-pointer shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all" className="dark:bg-slate-900">All Statuses</option>
              <option value="ongoing" className="dark:bg-slate-900">Ongoing Only</option>
              <option value="completed" className="dark:bg-slate-900">Completed Only</option>
            </select>
          </div>

          {userRole === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-premium btn-primary"
            >
              <Plus className="h-4 w-4" /> Add Person
            </button>
          )}
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

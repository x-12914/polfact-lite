import { useState, useMemo } from 'react';
import { Search, Filter, Loader2, Maximize2 } from 'lucide-react';
import { usePOIs, useClaims } from '../hooks/useQueries';

export function Pictures() {
  const { data: pois, isLoading: loadingPOIs } = usePOIs();
  const [selectedPOI, setSelectedPOI] = useState<string>('all');
  const { data: allClaims, isLoading: loadingClaims } = useClaims(selectedPOI === 'all' ? undefined : selectedPOI);
  
  const allImages = useMemo(() => 
    allClaims?.flatMap(claim => 
      (claim.media || []).filter(m => m.type === 'image').map(m => ({
        url: m.file_url,
        claimTitle: claim.description,
        date: claim.created_at,
        poiId: claim.poi_id
      }))
    ) || [],
    [allClaims]
  );

  if (loadingPOIs || loadingClaims) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Evidence Gallery</h1>
        <p className="mt-1 text-slate-500">Visual evidence collected across all analysis.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {allImages.map((img, idx) => (
          <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border bg-slate-100">
            <img src={img.url} className="h-full w-full object-cover transition-transform group-hover:scale-110" alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

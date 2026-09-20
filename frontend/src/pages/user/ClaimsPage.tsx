import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Claim, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.getMyClaims({ page: String(page), limit: '6' }) as PaginatedResponse<Claim>;
      setClaims(res.claims || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, [page]);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No claims yet</h3>
          <p className="text-gray-500 mt-1">You haven't submitted any claims.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {claims.map(claim => (
              <div key={claim.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start gap-3">
                  {claim.item?.imageUrl ? (
                    <img src={claim.item.imageUrl} alt="" className="h-14 w-14 rounded object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded bg-gray-100 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{claim.item?.name || 'Item'}</p>
                    <p className="text-sm text-gray-500">Submitted {new Date(claim.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={statusVariant(claim.status)}>{claim.status}</Badge>
                    </div>
                  </div>
                </div>
                {claim.reviewComment && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <span className="font-medium">Review: </span>{claim.reviewComment}
                  </div>
                )}
                <div className="mt-3">
                  <Link to={`/claims/${claim.id}`} className="text-sm text-primary-600 hover:underline">View Details →</Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

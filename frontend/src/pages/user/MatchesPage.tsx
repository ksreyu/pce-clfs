import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ArrowRight, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Match, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.getMatches({ page: String(page), limit: '6' }) as PaginatedResponse<Match>;
      setMatches(res.matches || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, [page]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateMatchStatus(id, status);
      toast.success(`Match ${status.toLowerCase()}`);
      fetchMatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No matches found</h3>
          <p className="text-gray-500 mt-1">Potential matches will appear here once items are compared.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {matches.map(match => (
              <div key={match.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {match.lostItem?.imageUrl ? (
                        <img src={match.lostItem.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">LOST</p>
                      <p className="font-medium text-gray-900 truncate">{match.lostItem?.name || 'Lost Item'}</p>
                      <p className="text-sm text-gray-500">{match.lostItem?.category} • {match.lostItem?.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`text-2xl font-bold ${getScoreColor(match.score)}`}>{Math.round(match.score)}%</div>
                    <ArrowRight className="h-5 w-5 text-gray-400 rotate-90 md:rotate-0" />
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <div className="min-w-0 text-right">
                      <p className="text-xs text-gray-400">FOUND</p>
                      <p className="font-medium text-gray-900 truncate">{match.foundItem?.name || 'Found Item'}</p>
                      <p className="text-sm text-gray-500">{match.foundItem?.category} • {match.foundItem?.location}</p>
                    </div>
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {match.foundItem?.imageUrl ? (
                        <img src={match.foundItem.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                      )}
                    </div>
                  </div>
                </div>

                {match.reason && (
                  <p className="text-sm text-gray-500 mt-3 pl-4 border-l-2 border-gray-200">{match.reason}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Badge variant={match.status === 'PENDING' ? 'warning' : match.status === 'ACCEPTED' ? 'success' : 'danger'}>
                    {match.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Link to={`/items/${match.lostItemId}`} className="text-sm text-primary-600 hover:underline">View Details</Link>
                    {match.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(match.id, 'ACCEPTED')}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Accept</button>
                        <button onClick={() => updateStatus(match.id, 'REJECTED')}
                          className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Reject</button>
                      </>
                    )}
                  </div>
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

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Zap, X, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Match, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.getAllMatches({ page: String(page), limit: '10' }) as PaginatedResponse<Match>;
      setMatches(res.matches || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, [page]);

  const handleAccept = async (matchId: string) => {
    try {
      await api.updateMatchStatus(matchId, 'ACCEPTED');
      toast.success('Match accepted');
      fetchMatches();
    } catch {
      toast.error('Failed to accept match');
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      await api.updateMatchStatus(matchId, 'REJECTED');
      toast.success('Match rejected');
      fetchMatches();
    } catch {
      toast.error('Failed to reject match');
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const scoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Matches Management</h1>
        <p className="text-gray-500 mt-1">Review and manage item matches.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No matches found</h3>
          <p className="text-gray-500 mt-1">No matches have been created yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Lost Item</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Found Item</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {matches.map(match => (
                    <tr key={match.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{match.lostItem?.name || 'Lost Item'}</p>
                        <p className="text-xs text-gray-500">{match.lostItem?.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{match.foundItem?.name || 'Found Item'}</p>
                        <p className="text-xs text-gray-500">{match.foundItem?.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${scoreColor(match.score)}`}
                                style={{ width: `${match.score}%` }} />
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${scoreTextColor(match.score)}`}>
                            {Math.round(match.score)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell max-w-[200px] truncate">
                        {match.reason}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          match.status === 'ACCEPTED' ? 'success' :
                          match.status === 'REJECTED' ? 'danger' : 'warning'
                        }>{match.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedMatch(match)}
                            className="p-1.5 rounded hover:bg-gray-100" title="View details">
                            <Search className="h-4 w-4 text-blue-600" />
                          </button>
                          {match.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleAccept(match.id)}
                                className="p-1.5 rounded hover:bg-gray-100" title="Accept match">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </button>
                              <button onClick={() => handleReject(match.id)}
                                className="p-1.5 rounded hover:bg-gray-100" title="Reject match">
                                <XCircle className="h-4 w-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Match Details</h3>
              <button onClick={() => setSelectedMatch(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-xs text-red-500 font-medium mb-2">LOST ITEM</p>
                  <p className="font-medium text-gray-900">{selectedMatch.lostItem?.name}</p>
                  <p className="text-sm text-gray-500">{selectedMatch.lostItem?.category}</p>
                  <p className="text-sm text-gray-500">{selectedMatch.lostItem?.location}</p>
                  {selectedMatch.lostItem?.description && (
                    <p className="text-xs text-gray-400 mt-2">{selectedMatch.lostItem.description}</p>
                  )}
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-green-500 font-medium mb-2">FOUND ITEM</p>
                  <p className="font-medium text-gray-900">{selectedMatch.foundItem?.name}</p>
                  <p className="text-sm text-gray-500">{selectedMatch.foundItem?.category}</p>
                  <p className="text-sm text-gray-500">{selectedMatch.foundItem?.location}</p>
                  {selectedMatch.foundItem?.description && (
                    <p className="text-xs text-gray-400 mt-2">{selectedMatch.foundItem.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Match Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${scoreColor(selectedMatch.score)}`}
                        style={{ width: `${selectedMatch.score}%` }} />
                    </div>
                    <span className={`text-lg font-bold ${scoreTextColor(selectedMatch.score)}`}>
                      {Math.round(selectedMatch.score)}%
                    </span>
                  </div>
                </div>
                <Badge variant={
                  selectedMatch.status === 'ACCEPTED' ? 'success' :
                  selectedMatch.status === 'REJECTED' ? 'danger' : 'warning'
                }>{selectedMatch.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Match Reason</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedMatch.reason}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Created: {new Date(selectedMatch.createdAt).toLocaleString()}</span>
                <span>Match ID: {selectedMatch.id}</span>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              {selectedMatch.status === 'PENDING' && (
                <>
                  <button onClick={() => { handleReject(selectedMatch.id); setSelectedMatch(null); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Reject</button>
                  <button onClick={() => { handleAccept(selectedMatch.id); setSelectedMatch(null); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Accept</button>
                </>
              )}
              <button onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

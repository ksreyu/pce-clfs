import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, X, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Claim, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

const STATUS_FILTERS = ['All', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'];

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [actionModal, setActionModal] = useState<{ claimId: string; action: string } | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await api.getAdminClaims(params) as PaginatedResponse<Claim>;
      setClaims(res.claims || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClaims();
  };

  const handleStatusUpdate = async (claimId: string, status: string, comment?: string) => {
    try {
      await api.updateClaimStatus(claimId, { status, reviewComment: comment || undefined });
      toast.success(`Claim ${status.toLowerCase()} successfully`);
      setActionModal(null);
      setReviewComment('');
      setSelectedClaim(null);
      fetchClaims();
    } catch {
      toast.error('Failed to update claim');
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'PENDING': return 'warning';
      case 'UNDER_REVIEW': return 'info';
      case 'COMPLETED': return 'purple';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
        <p className="text-gray-500 mt-1">Review and manage all item claims.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search claims..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">Search</button>
          </form>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No claims found</h3>
          <p className="text-gray-500 mt-1">No claims match your current filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Claim ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Item Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Claimant</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Submitted</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {claims.map(claim => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{claim.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{claim.item?.name || 'Item'}</td>
                      <td className="px-4 py-3 text-gray-600">{claim.claimant?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{new Date(claim.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(claim.status)}>{claim.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedClaim(claim)} className="p-1.5 rounded hover:bg-gray-100" title="View details">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          {claim.status === 'PENDING' && (
                            <>
                              <button onClick={() => setActionModal({ claimId: claim.id, action: 'APPROVED' })}
                                className="p-1.5 rounded hover:bg-gray-100" title="Approve">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </button>
                              <button onClick={() => setActionModal({ claimId: claim.id, action: 'REJECTED' })}
                                className="p-1.5 rounded hover:bg-gray-100" title="Reject">
                                <XCircle className="h-4 w-4 text-red-600" />
                              </button>
                            </>
                          )}
                          {claim.status === 'PENDING' && (
                            <button onClick={() => setActionModal({ claimId: claim.id, action: 'UNDER_REVIEW' })}
                              className="p-1.5 rounded hover:bg-gray-100" title="Mark Under Review">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </button>
                          )}
                          {claim.status === 'APPROVED' && (
                            <button onClick={() => setActionModal({ claimId: claim.id, action: 'COMPLETED' })}
                              className="p-1.5 rounded hover:bg-gray-100" title="Mark Completed">
                              <AlertCircle className="h-4 w-4 text-purple-600" />
                            </button>
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

      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Claim Details</h3>
              <button onClick={() => setSelectedClaim(null)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Claim ID</p><p className="font-mono text-sm">{selectedClaim.id}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><Badge variant={statusVariant(selectedClaim.status)}>{selectedClaim.status.replace('_', ' ')}</Badge></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Claim Explanation</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedClaim.explanation}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Identifying Details</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedClaim.identifyingDetails}</p>
              </div>
              {selectedClaim.lostDate && <div><p className="text-xs text-gray-500">Date Lost</p><p className="text-sm">{new Date(selectedClaim.lostDate).toLocaleDateString()}</p></div>}
              {selectedClaim.lostLocation && <div><p className="text-xs text-gray-500">Location Lost</p><p className="text-sm">{selectedClaim.lostLocation}</p></div>}
              {selectedClaim.proofUrl && (
                <div><p className="text-xs text-gray-500 mb-1">Proof Image</p><a href={selectedClaim.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">View Proof</a></div>
              )}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">Item Information</p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><span className="font-medium">Name:</span> {selectedClaim.item?.name}</p>
                  <p><span className="font-medium">Category:</span> {selectedClaim.item?.category}</p>
                  <p><span className="font-medium">Type:</span> {selectedClaim.item?.type}</p>
                  <p><span className="font-medium">Location:</span> {selectedClaim.item?.location}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">Claimant Information</p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><span className="font-medium">Name:</span> {selectedClaim.claimant?.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedClaim.claimant?.email}</p>
                  <p><span className="font-medium">Student ID:</span> {selectedClaim.claimant?.studentId}</p>
                </div>
              </div>
              {selectedClaim.reviewComment && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-1">Review Comment</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedClaim.reviewComment}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => setSelectedClaim(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionModal.action === 'APPROVED' ? 'Approve Claim' :
                 actionModal.action === 'REJECTED' ? 'Reject Claim' :
                 actionModal.action === 'UNDER_REVIEW' ? 'Mark Under Review' : 'Complete Claim'}
              </h3>
              <button onClick={() => { setActionModal(null); setReviewComment(''); }} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-gray-600 mb-4">
              {actionModal.action === 'APPROVED' && 'Are you sure you want to approve this claim?'}
              {actionModal.action === 'REJECTED' && 'Are you sure you want to reject this claim? Please provide a reason.'}
              {actionModal.action === 'UNDER_REVIEW' && 'Mark this claim as under review?'}
              {actionModal.action === 'COMPLETED' && 'Mark this claim as completed?'}
            </p>
            {actionModal.action === 'REJECTED' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Provide reason for rejection..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={3}
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setActionModal(null); setReviewComment(''); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={() => handleStatusUpdate(actionModal.claimId, actionModal.action, reviewComment)}
                className={`px-4 py-2 text-white rounded-lg text-sm ${
                  actionModal.action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' :
                  actionModal.action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-primary-600 hover:bg-primary-700'
                }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

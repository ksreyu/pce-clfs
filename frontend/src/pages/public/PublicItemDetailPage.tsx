import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Item, Match } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Navbar from '../../components/layout/Navbar';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Calendar, Clock, Tag, Palette, Building2, Box, AlertCircle, Phone, Mail, User } from 'lucide-react';

function getStatusBadgeVariant(status: string): 'danger' | 'success' | 'info' | 'warning' | 'default' {
  switch (status) {
    case 'LOST': return 'danger';
    case 'FOUND': return 'success';
    case 'MATCHED': return 'info';
    case 'CLAIMED': return 'warning';
    case 'VERIFIED': return 'info';
    case 'RECOVERED': return 'success';
    case 'CLOSED': return 'default';
    default: return 'default';
  }
}

export default function PublicItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    explanation: '',
    lostDate: '',
    lostLocation: '',
    identifyingDetails: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.getItem(id)
      .then(async (data: any) => {
        setItem(data);
        if (user) {
          try {
            const matchData: any = await api.getMatches({ itemId: id });
            setMatches(matchData.matches || matchData || []);
          } catch {
            setMatches([]);
          }
        }
      })
      .catch(() => setError('Item not found'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!claimForm.explanation || !claimForm.lostDate || !claimForm.lostLocation || !claimForm.identifyingDetails) {
      toast.error('Please fill in all required fields');
      return;
    }

    setClaimLoading(true);
    try {
      const formData = new FormData();
      formData.append('itemId', item.id);
      formData.append('explanation', claimForm.explanation);
      formData.append('lostDate', claimForm.lostDate);
      formData.append('lostLocation', claimForm.lostLocation);
      formData.append('identifyingDetails', claimForm.identifyingDetails);
      if (proofFile) formData.append('proof', proofFile);

      await api.createClaim(formData);
      toast.success('Claim submitted successfully!');
      setShowClaimModal(false);
      setClaimForm({ explanation: '', lostDate: '', lostLocation: '', identifyingDetails: '' });
      setProofFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/2">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
              </div>
              <div className="lg:w-1/2 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
            <p className="text-gray-500 mb-6">The item you are looking for does not exist or has been removed.</p>
            <Link to="/items" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isReporter = user && item.reportedById === user.id;
  const showClaimButton = user && !isReporter && item.status === 'FOUND';
  const showFoundButton = user && !isReporter && item.status === 'LOST';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/items" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Items
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image */}
          <div className="lg:w-1/2">
            <div className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Box className="w-24 h-24 text-gray-300" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-gray-500">{item.itemCode}</span>
                <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{item.name}</h1>

              {item.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="w-4 h-4 text-gray-400" /> {item.category}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" /> {item.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" /> {new Date(item.date).toLocaleDateString()}
                </div>
                {item.time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" /> {item.time}
                  </div>
                )}
                {item.color && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Palette className="w-4 h-4 text-gray-400" /> {item.color}
                  </div>
                )}
                {item.brand && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Box className="w-4 h-4 text-gray-400" /> {item.brand}
                  </div>
                )}
                {item.model && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Box className="w-4 h-4 text-gray-400" /> {item.model}
                  </div>
                )}
                {item.identifyingFeatures && (
                  <div className="col-span-2 flex items-start gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" /> {item.identifyingFeatures}
                  </div>
                )}
              </div>

              {item.reportedBy && (
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Reported by</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400" /> {item.reportedBy.name}
                    {item.reportedBy.department && (
                      <span className="text-gray-400">· {item.reportedBy.department}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 mb-6">
                Reported {new Date(item.createdAt).toLocaleDateString()}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {showClaimButton && (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition"
                  >
                    Submit Claim
                  </button>
                )}
                {showFoundButton && (
                  <Link
                    to={`/report-found?lostItemId=${item.id}`}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition text-center"
                  >
                    I Found This
                  </Link>
                )}
                {!user && (
                  <Link
                    to="/login"
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-center"
                  >
                    Login to Take Action
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Potential Matches */}
        {user && matches.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Potential Matches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => {
                const matchedItem = match.lostItem?.id === item.id ? match.foundItem : match.lostItem;
                if (!matchedItem) return null;
                return (
                  <Link
                    key={match.id}
                    to={`/items/${matchedItem.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{matchedItem.name}</h3>
                      <Badge variant={getStatusBadgeVariant(matchedItem.status)}>{matchedItem.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      Match score: <span className="font-medium text-primary-600">{Math.round(match.score * 100)}%</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{match.reason}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Submit Claim</h2>
                <button onClick={() => setShowClaimModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation *</label>
                  <textarea
                    value={claimForm.explanation}
                    onChange={e => setClaimForm({ ...claimForm, explanation: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Explain why this item belongs to you..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approximate Date Lost *</label>
                    <input
                      type="date"
                      value={claimForm.lostDate}
                      onChange={e => setClaimForm({ ...claimForm, lostDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Lost *</label>
                    <input
                      type="text"
                      value={claimForm.lostLocation}
                      onChange={e => setClaimForm({ ...claimForm, lostLocation: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. Library 2nd floor"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identifying Details *</label>
                  <textarea
                    value={claimForm.identifyingDetails}
                    onChange={e => setClaimForm({ ...claimForm, identifyingDetails: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Provide details that prove ownership..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proof (optional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => setProofFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {claimLoading ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Claim } from '../../types';
import Badge from '../../components/ui/Badge';

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const data = await api.getClaim(id!) as Claim;
        setClaim(data);
      } catch {
        toast.error('Failed to load claim');
        navigate('/claims');
      } finally {
        setLoading(false);
      }
    };
    fetchClaim();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!claim) return null;

  const statusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/claims')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Claims
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Claim Details</h1>
          <Badge variant={statusVariant(claim.status)}>{claim.status}</Badge>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            {claim.item?.imageUrl ? (
              <img src={claim.item.imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">{claim.item?.itemCode}</p>
              <p className="font-semibold text-gray-900">{claim.item?.name || 'Item'}</p>
              <p className="text-sm text-gray-500">{claim.item?.category} • {claim.item?.location}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Explanation</h3>
            <p className="text-gray-600">{claim.explanation}</p>
          </div>

          {claim.lostDate && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Lost Date</h3>
              <p className="text-gray-600">{new Date(claim.lostDate).toLocaleDateString()}</p>
            </div>
          )}

          {claim.lostLocation && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Lost Location</h3>
              <p className="text-gray-600">{claim.lostLocation}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Identifying Details</h3>
            <p className="text-gray-600">{claim.identifyingDetails}</p>
          </div>

          {claim.proofUrl && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Proof</h3>
              <a href={claim.proofUrl} target="_blank" rel="noopener noreferrer"
                className="text-primary-600 hover:underline flex items-center gap-1">
                <FileText className="h-4 w-4" /> View Proof
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Submitted</h3>
              <p className="text-gray-600">{new Date(claim.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Last Updated</h3>
              <p className="text-gray-600">{new Date(claim.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {claim.reviewedBy && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Admin Review</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Reviewed by <span className="font-medium">{claim.reviewedBy.name}</span>
                </p>
                {claim.reviewComment && (
                  <p className="text-gray-600 mt-2">{claim.reviewComment}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

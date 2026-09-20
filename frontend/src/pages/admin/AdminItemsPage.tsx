import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Trash2, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Item, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

const CATEGORIES = ['All', 'Electronics', 'Books', 'Bags', 'Keys', 'Clothing', 'ID Cards', 'Other'];
const STATUSES = ['All', 'LOST', 'FOUND', 'MATCHED', 'CLAIMED', 'VERIFIED', 'RECOVERED', 'CLOSED', 'ARCHIVED'];

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '12' };
      if (search) params.search = search;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      const res = await api.getAdminItems(params) as PaginatedResponse<Item>;
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [page, typeFilter, statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await api.adminUpdateItemStatus(itemId, newStatus);
      toast.success('Item status updated');
      setStatusDropdown(null);
      fetchItems();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await api.adminDeleteItem(itemId);
      toast.success('Item deleted successfully');
      setDeleteModal(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'RECOVERED': return 'success';
      case 'MATCHED': return 'info';
      case 'CLAIMED': return 'purple';
      case 'VERIFIED': return 'info';
      case 'LOST': return 'danger';
      case 'FOUND': return 'success';
      case 'CLOSED': return 'default';
      case 'ARCHIVED': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Item Management</h1>
        <p className="text-gray-500 mt-1">Manage all lost and found items.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">Search</button>
          </form>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="ALL">All Types</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No items found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-7 w-7 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-mono">{item.itemCode}</p>
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.location}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.type === 'LOST' ? 'danger' : 'success'}>{item.type}</Badge>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedItem(item)} className="p-1.5 rounded hover:bg-gray-100" title="View details">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </button>
                    <div className="relative">
                      <button onClick={() => setStatusDropdown(statusDropdown === item.id ? null : item.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-xs" title="Change status">
                        <span className="text-gray-600">Status</span>
                      </button>
                      {statusDropdown === item.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 py-1 w-36">
                          {['LOST', 'FOUND', 'MATCHED', 'CLAIMED', 'VERIFIED', 'RECOVERED', 'CLOSED', 'ARCHIVED'].map(s => (
                            <button key={s} onClick={() => handleStatusChange(item.id, s)}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${item.status === s ? 'bg-primary-50 text-primary-700' : ''}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setDeleteModal(item.id)} className="p-1.5 rounded hover:bg-gray-100" title="Delete item">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Reported by {item.reportedBy?.name || 'Unknown'} &middot; {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
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

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedItem.imageUrl && (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Code</p><p className="font-mono text-sm">{selectedItem.itemCode}</p></div>
                <div><p className="text-xs text-gray-500">Type</p><Badge variant={selectedItem.type === 'LOST' ? 'danger' : 'success'}>{selectedItem.type}</Badge></div>
                <div><p className="text-xs text-gray-500">Name</p><p className="text-sm">{selectedItem.name}</p></div>
                <div><p className="text-xs text-gray-500">Category</p><p className="text-sm">{selectedItem.category}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><Badge variant={statusVariant(selectedItem.status)}>{selectedItem.status}</Badge></div>
                <div><p className="text-xs text-gray-500">Location</p><p className="text-sm">{selectedItem.location}</p></div>
                {selectedItem.color && <div><p className="text-xs text-gray-500">Color</p><p className="text-sm">{selectedItem.color}</p></div>}
                {selectedItem.brand && <div><p className="text-xs text-gray-500">Brand</p><p className="text-sm">{selectedItem.brand}</p></div>}
                {selectedItem.model && <div><p className="text-xs text-gray-500">Model</p><p className="text-sm">{selectedItem.model}</p></div>}
                <div className="col-span-2"><p className="text-xs text-gray-500">Date Lost/Found</p><p className="text-sm">{new Date(selectedItem.date).toLocaleDateString()}</p></div>
                {selectedItem.description && <div className="col-span-2"><p className="text-xs text-gray-500">Description</p><p className="text-sm">{selectedItem.description}</p></div>}
                {selectedItem.identifyingFeatures && <div className="col-span-2"><p className="text-xs text-gray-500">Identifying Features</p><p className="text-sm">{selectedItem.identifyingFeatures}</p></div>}
                <div><p className="text-xs text-gray-500">Reported By</p><p className="text-sm">{selectedItem.reportedBy?.name || 'Unknown'}</p></div>
                <div><p className="text-xs text-gray-500">Created</p><p className="text-sm">{new Date(selectedItem.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteModal)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

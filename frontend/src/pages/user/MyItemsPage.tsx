import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit2, Trash2, CheckCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Item, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

export default function MyItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', location: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { reportedById: user!.id, page: String(page), limit: '9' };
      if (tab !== 'ALL') params.type = tab;
      const res = await api.getItems(params) as PaginatedResponse<Item>;
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [tab, page]);

  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, description: item.description, location: item.location });
  };

  const saveEdit = async (id: string) => {
    try {
      await api.updateItem(id, editForm);
      toast.success('Item updated');
      setEditingId(null);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteItem(id);
      toast.success('Item deleted');
      setDeletingId(null);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const markRecovered = async (id: string) => {
    try {
      await api.updateItemStatus(id, 'RECOVERED');
      toast.success('Marked as recovered');
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {(['ALL', 'LOST', 'FOUND'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No items found</h3>
          <p className="text-gray-500 mt-1">You haven't reported any {tab !== 'ALL' ? tab.toLowerCase() : ''} items yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm" />
                      <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                      <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(item.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400 font-mono">{item.itemCode}</span>
                        <Badge variant={item.type === 'LOST' ? 'danger' : 'success'}>{item.type}</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category} • {item.location}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant={item.status === 'RECOVERED' ? 'success' : item.status === 'ACTIVE' ? 'info' : 'default'}>
                          {item.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Link to={`/items/${item.id}`} className="p-1.5 text-gray-400 hover:text-primary-600 rounded"><Eye className="h-4 w-4" /></Link>
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Edit2 className="h-4 w-4" /></button>
                          {deletingId === item.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(item.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Yes</button>
                              <button onClick={() => setDeletingId(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeletingId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="h-4 w-4" /></button>
                          )}
                          {item.status !== 'RECOVERED' && (
                            <button onClick={() => markRecovered(item.id)} className="p-1.5 text-gray-400 hover:text-green-600 rounded"><CheckCircle className="h-4 w-4" /></button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
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

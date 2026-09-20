import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Users, Shield, ShieldOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { User, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmModal, setConfirmModal] = useState<{ type: string; userId: string; current: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.getAdminUsers(params) as PaginatedResponse<User>;
      setUsers(res.users || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateUserStatus(userId, newStatus);
      toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
      setConfirmModal(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'USER' ? 'ADMIN' : 'USER';
    try {
      await api.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      setConfirmModal(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update user role');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">Manage all registered users.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or student ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">Search</button>
          </form>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No users found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Student ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Department</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Year</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-gray-600">{user.studentId}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{user.department || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{user.year || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'ADMIN' ? 'purple' : 'info'}>{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'danger' : 'warning'}>{user.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setConfirmModal({ type: 'status', userId: user.id, current: user.status })}
                            className="p-1.5 rounded hover:bg-gray-100" title="Toggle status">
                            {user.status === 'ACTIVE' ? (
                              <ShieldOff className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Shield className="h-4 w-4 text-green-600" />
                            )}
                          </button>
                          <button onClick={() => setConfirmModal({ type: 'role', userId: user.id, current: user.role })}
                            className="p-1.5 rounded hover:bg-gray-100" title="Toggle role">
                            <Shield className="h-4 w-4 text-purple-600" />
                          </button>
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

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmModal.type === 'status' ? 'Toggle User Status' : 'Change User Role'}
              </h3>
              <button onClick={() => setConfirmModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {confirmModal.type === 'status'
                ? `Are you sure you want to ${confirmModal.current === 'ACTIVE' ? 'deactivate' : 'activate'} this user?`
                : `Are you sure you want to change this user's role from ${confirmModal.current} to ${confirmModal.current === 'USER' ? 'ADMIN' : 'USER'}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button
                onClick={() => confirmModal.type === 'status'
                  ? handleStatusToggle(confirmModal.userId, confirmModal.current)
                  : handleRoleToggle(confirmModal.userId, confirmModal.current)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, FileText, CheckCircle, XCircle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Notification, PaginatedResponse } from '../../types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications({ page: String(page), limit: '10' }) as PaginatedResponse<Notification>;
      setNotifications(res.notifications || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [page]);

  const markRead = async (id: string) => {
    try {
      await api.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MATCH': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'CLAIM': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'APPROVED': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'INFO_REQUEST': return <HelpCircle className="h-5 w-5 text-purple-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead}
            className="text-sm text-primary-600 hover:underline font-medium">Mark All as Read</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
          <p className="text-gray-500 mt-1">You'll be notified when something happens.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow divide-y">
            {notifications.map(n => (
              <div key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`p-4 flex items-start gap-4 cursor-pointer transition hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'} text-gray-900`}>{n.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                  {!n.isRead && <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
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

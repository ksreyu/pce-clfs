import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, Package, Search, Eye, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { api } from '../../lib/api';
import { formatTimeAgo, getItemPlaceholder } from '../../lib/utils';
import { Item, Match, Claim, Notification, PaginatedResponse } from '../../types';
import Badge from '../../components/ui/Badge';

export default function DashboardPage() {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const [lostCount, setLostCount] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [activeClaims, setActiveClaims] = useState(0);
  const [recoveredCount, setRecoveredCount] = useState(0);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const itemsRes = await api.getItems({ reportedById: user!.id }) as PaginatedResponse<Item>;
        const items = itemsRes.items || [];
        setLostCount(items.filter(i => i.type === 'LOST' && i.status !== 'RECOVERED').length);
        setFoundCount(items.filter(i => i.type === 'FOUND' && i.status !== 'RECOVERED').length);
        setRecoveredCount(items.filter(i => i.status === 'RECOVERED').length);
        setRecentItems(items.slice(0, 6));

        const matchesRes = await api.getMatches() as PaginatedResponse<Match>;
        const matchList = matchesRes.matches || [];
        setMatches(matchList.sort((a, b) => b.score - a.score).slice(0, 5));

        const claimsRes = await api.getMyClaims() as PaginatedResponse<Claim>;
        const claimList = (claimsRes.claims || []) as Claim[];
        setActiveClaims(claimList.filter(c => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length);

        const notifRes = await api.getNotifications({ limit: '5' }) as PaginatedResponse<Notification>;
        setNotifications(notifRes.notifications || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Lost Reports', count: lostCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Found Reports', count: foundCount, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Active Claims', count: activeClaims, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Recovered', count: recoveredCount, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Here's what's happening with your lost & found items at PCE.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`rounded-xl p-6 hover-lift transition-colors ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-lg`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/report-lost" className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition active:scale-95">
          <AlertTriangle className="h-4 w-4" /> Report Lost Item
        </Link>
        <Link to="/report-found" className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition active:scale-95">
          <CheckCircle className="h-4 w-4" /> Report Found Item
        </Link>
        <Link to="/items" className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition active:scale-95">
          <Search className="h-4 w-4" /> Search Items
        </Link>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Items</h2>
            <Link to="/my-items" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map((item, i) => (
              <Link key={item.id} to={`/items/${item.id}`}
                className={`rounded-xl p-4 hover-lift transition animate-slide-up ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <img src={getItemPlaceholder(item.category)} alt={item.name} className="h-full w-full rounded-lg object-contain p-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={item.type === 'LOST' ? 'danger' : 'success'}>{item.type}</Badge>
                      <Badge variant={item.status === 'RECOVERED' ? 'success' : 'default'}>{item.status}</Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Potential Matches</h2>
            <Link to="/matches" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {matches.map(match => (
              <div key={match.id} className={`rounded-xl p-4 flex items-center justify-between ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{match.lostItem?.name || 'Lost Item'}</span>
                  <span className={`${darkMode ? 'text-gray-600' : 'text-gray-400'} flex-shrink-0`}>↔</span>
                  <span className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{match.foundItem?.name || 'Found Item'}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="w-24">
                    <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className={`h-2 rounded-full ${match.score >= 80 ? 'bg-green-500' : match.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${match.score}%` }} />
                    </div>
                    <p className={`text-xs mt-1 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{Math.round(match.score)}%</p>
                  </div>
                  <Badge variant={match.status === 'PENDING' ? 'warning' : match.status === 'ACCEPTED' ? 'success' : 'danger'}>
                    {match.status}
                  </Badge>
                  <Link to="/matches" className="text-primary-600 hover:underline text-sm">
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
            <Link to="/notifications" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          <div className={`rounded-xl divide-y ${darkMode ? 'bg-gray-900 border border-gray-800 divide-gray-800' : 'bg-white shadow-sm border border-gray-100 divide-gray-100'}`}>
            {notifications.map(n => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.isRead ? (darkMode ? 'bg-primary-900/10' : 'bg-blue-50') : ''}`}>
                <Bell className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'} ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                  <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{n.message}</p>
                </div>
                <span className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{formatTimeAgo(n.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentItems.length === 0 && matches.length === 0 && (
        <div className={`rounded-xl p-12 text-center ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
          <Package className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>No items yet</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Start by reporting a lost or found item.</p>
          <div className="flex justify-center gap-3 mt-4">
            <Link to="/report-lost" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Report Lost</Link>
            <Link to="/report-found" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Report Found</Link>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { BarChart3, FileText, Package, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.getAdminReports();
        setReports(data);
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const lostByCategory = reports?.lostByCategory || [
    { category: 'Electronics', count: 45 }, { category: 'Books', count: 32 },
    { category: 'Bags', count: 28 }, { category: 'Keys', count: 18 },
    { category: 'Clothing', count: 12 }, { category: 'Other', count: 8 },
  ];

  const foundByCategory = reports?.foundByCategory || [
    { category: 'Electronics', count: 38 }, { category: 'Books', count: 25 },
    { category: 'Bags', count: 22 }, { category: 'Keys', count: 15 },
    { category: 'Clothing', count: 10 }, { category: 'Other', count: 5 },
  ];

  const claimsByStatus = reports?.claimsByStatus || [
    { name: 'Pending', value: 12 }, { name: 'Approved', value: 25 },
    { name: 'Rejected', value: 8 }, { name: 'Completed', value: 18 },
  ];

  const topLocations = reports?.topLocations || [
    { location: 'Main Library', count: 35 }, { location: 'Student Center', count: 28 },
    { location: 'Science Building', count: 22 }, { location: 'Cafeteria', count: 18 },
    { location: 'Computer Lab', count: 15 }, { location: 'Sports Center', count: 10 },
  ];

  const monthlyTrends = reports?.monthlyTrends || [
    { month: 'Jun', lost: 12, found: 8 }, { month: 'Jul', lost: 18, found: 14 },
    { month: 'Aug', lost: 25, found: 20 }, { month: 'Sep', lost: 22, found: 18 },
    { month: 'Oct', lost: 30, found: 24 }, { month: 'Nov', lost: 28, found: 22 },
  ];

  const totalLost = reports?.totalLost || lostByCategory.reduce((s: number, c: any) => s + c.count, 0);
  const totalFound = reports?.totalFound || foundByCategory.reduce((s: number, c: any) => s + c.count, 0);
  const totalClaims = reports?.totalClaims || claimsByStatus.reduce((s: number, c: any) => s + c.value, 0);
  const recovered = reports?.recovered || claimsByStatus.find((c: any) => c.name === 'Completed')?.value || 18;
  const recoveryRate = totalLost > 0 ? ((recovered / totalLost) * 100).toFixed(1) : '0.0';

  const summaryCards = [
    { label: 'Total Lost', count: totalLost, icon: FileText, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Found', count: totalFound, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Claims', count: totalClaims, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Recovery Rate', count: `${recoveryRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Detailed analytics for the Lost & Found system.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className={`${card.bg} p-3 rounded-lg`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lost Items by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lostByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Lost Items" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Found Items by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={foundByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Found Items" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Claims by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={claimsByStatus} cx="50%" cy="50%" innerRadius={60}
                outerRadius={100} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {claimsByStatus.map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topLocations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="location" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Items" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends (Lost vs Found)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Lost Items" />
            <Line type="monotone" dataKey="found" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Found Items" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


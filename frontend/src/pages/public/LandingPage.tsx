import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, CheckCircle, Package, ArrowRight, MapPin, Calendar, Tag, ChevronRight, GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';
import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../context/AuthContext';
import { getItemEmoji, getItemPlaceholder } from '../../lib/utils';
import { Item } from '../../types';

const steps = [
  { icon: FileText, title: 'Report', description: 'Report your lost or found item with details and photos to help identify it.' },
  { icon: Search, title: 'Match', description: 'Our system automatically matches lost and found reports based on descriptions.' },
  { icon: CheckCircle, title: 'Verify', description: 'Verify ownership through our secure claim process with proof requirements.' },
  { icon: Package, title: 'Recover', description: 'Get your belongings back through our organized pickup process.' },
];

const features = [
  { icon: FileText, title: 'Lost Item Reporting', description: 'Quickly report lost items with photos, descriptions, and last known location on campus.' },
  { icon: FileText, title: 'Found Item Reporting', description: 'Help others by reporting items you find around the Pillai College campus.' },
  { icon: Search, title: 'Smart Matching', description: 'Advanced search and automatic matching between lost and found items across all departments.' },
  { icon: CheckCircle, title: 'Claim Verification', description: 'Secure verification process ensures items go to their rightful owners.' },
  { icon: Tag, title: 'Instant Notifications', description: 'Get notified immediately when a matching item is reported.' },
  { icon: Package, title: 'Admin Management', description: 'Dedicated admin panel for efficient system management and oversight.' },
];

const PILLAI_LOCATIONS = [
  'PCE Library', 'PCE Cafeteria', 'Lecture Halls', 'Computer Labs',
  'Electronics Lab', 'Mechanical Workshop', 'Sports Complex', 'PCE Parking Lot',
];

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}</span>;
}

export default function LandingPage() {
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, recovered: 0, users: 0, matches: 0 });
  const [loading, setLoading] = useState(true);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.getItems({ type: 'FOUND', limit: '4', sort: 'newest' }).catch(() => ({ items: [] })),
      api.getDashboardStats().catch(() => ({ totalItems: 0, recovered: 0, users: 0, matches: 0 })),
    ]).then(([itemsRes, statsRes]) => {
      setRecentItems((itemsRes as any).items || []);
      setStats(statsRes as any);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <GraduationCap className="w-6 h-6" />
              PCE CLFS
            </Link>
            <div className="flex items-center gap-3">
              <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                {darkMode ? '☀️' : '🌙'}
              </button>
              <Link to="/items" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition hidden sm:block">
                Browse Items
              </Link>
              {user ? (
                <Link to="/dashboard" className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition hidden sm:block">
                    Login
                  </Link>
                  <Link to="/register" className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <GraduationCap className="w-4 h-4" />
              Pillai College of Engineering
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Lost Something on Campus?</h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-2">Find it. Report it. Get it Back.</p>
            <p className="text-primary-200 mb-8 max-w-xl">A centralized platform for the Pillai College community to report, search, and recover lost belongings across all departments.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/report-lost" className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition active:scale-95">
                Report Lost Item <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/report-found" className="inline-flex items-center gap-2 bg-primary-500/30 text-white border border-white/30 px-6 py-3 rounded-lg font-medium hover:bg-primary-500/50 transition">
                Report Found Item
              </Link>
              <Link to="/items" className="inline-flex items-center gap-2 text-white/80 px-6 py-3 rounded-lg font-medium hover:text-white hover:bg-white/10 transition">
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Four simple steps to recover your lost belongings</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center hover-lift animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Step {i + 1}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Features</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Everything you need to report, find, and recover lost items at PCE</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover-lift animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Dynamic from API */}
      <section className="py-20 bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Items Reported', value: stats.totalItems },
              { label: 'Items Recovered', value: stats.recovered },
              { label: 'Active Users', value: stats.users },
              { label: 'Successful Matches', value: stats.matches },
            ].map((stat, i) => (
              <div key={i} className="text-center text-white animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  <AnimatedCounter target={stat.value} />
                </div>
                <div className="text-primary-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Locations */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Campus Locations</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Track lost and found items across all Pillai College campus locations</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PILLAI_LOCATIONS.map((loc, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700 hover-lift cursor-default">
                <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{loc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Found Items */}
      <section className="py-20 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Recently Found Items</h2>
              <p className="text-gray-600 dark:text-gray-400">Check if your lost item has been found</p>
            </div>
            <Link to="/items" className="hidden sm:inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 transition">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentItems.map((item, i) => (
                <Link key={item.id} to={`/items/${item.id}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover-lift animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src={getItemPlaceholder(item.category)} alt={item.name} className="w-full h-full object-contain p-2" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400">
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <Tag className="w-3.5 h-3.5" />
                      {item.category}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.location}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No recent found items</p>
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link to="/items" className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              View All Items <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to find your lost item?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">Join the Pillai College community and increase your chances of recovering your lost belongings.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition active:scale-95">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-primary-400" />
                <h3 className="text-lg font-bold">PCE CLFS</h3>
              </div>
              <p className="text-gray-400 text-sm">A centralized platform for the Pillai College of Engineering community to report, search, and recover lost belongings.</p>
              <p className="text-gray-500 text-xs mt-2">Dr. K. M. Vasudevan Pillai Campus,<br/>Sector 16, New Panvel, Navi Mumbai - 410206</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/" className="block text-sm text-gray-400 hover:text-white transition">Home</Link>
                <Link to="/items" className="block text-sm text-gray-400 hover:text-white transition">Browse Items</Link>
                <Link to="/report-lost" className="block text-sm text-gray-400 hover:text-white transition">Report Lost</Link>
                <Link to="/report-found" className="block text-sm text-gray-400 hover:text-white transition">Report Found</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <p className="text-sm text-gray-400">clfs@mes.ac.in</p>
              <p className="text-sm text-gray-400 mt-1">Pillai College of Engineering</p>
              <p className="text-sm text-gray-400">New Panvel, Navi Mumbai</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            &copy; 2026 Pillai College of Engineering - CLFS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

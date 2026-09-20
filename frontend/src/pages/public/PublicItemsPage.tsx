import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Tag, Package, ChevronLeft, ChevronRight, X, SlidersHorizontal, GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';
import { useDarkMode } from '../../context/DarkModeContext';
import { CATEGORIES, LOCATIONS, formatTimeAgo, getItemPlaceholder } from '../../lib/utils';
import { Item } from '../../types';

export default function PublicItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const { darkMode } = useDarkMode();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '12', sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      if (type) params.type = type;
      if (location) params.location = location;

      const data: any = await api.getItems(params);
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, type, location, sort, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, type, location, sort]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setType('');
    setLocation('');
    setSort('newest');
  };

  const hasFilters = debouncedSearch || category || type || location;

  const inputClass = `w-full pl-9 pr-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
    darkMode ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900'
  }`;

  const selectClass = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <GraduationCap className="w-6 h-6" />
              PCE CLFS
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className={`text-sm transition ${darkMode ? 'text-gray-400 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'}`}>Home</Link>
              <Link to="/login" className={`text-sm transition ${darkMode ? 'text-gray-400 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'}`}>Login</Link>
              <Link to="/register" className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">Register</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Browse Items</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Search through reported lost and found items at Pillai College</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className={`rounded-xl p-5 space-y-6 sticky top-24 transition-colors ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700">Clear All</button>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className={selectClass}>
                  <option value="">All Types</option>
                  <option value="LOST">Lost</option>
                  <option value="FOUND">Found</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)} className={selectClass}>
                  <option value="">All Locations</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort By</label>
                <select value={sort} onChange={e => setSort(e.target.value)} className={selectClass}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {showFilters && (
                <button onClick={() => setShowFilters(false)} className="lg:hidden w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  Close Filters
                </button>
              )}
            </div>
          </aside>

          {/* Items Grid */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className={`rounded-xl p-4 mb-6 transition-colors ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search items by name, description, category..."
                    className={inputClass}
                  />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              </div>
              {hasFilters && (
                <div className={`flex flex-wrap items-center gap-2 mt-3 pt-3 ${darkMode ? 'border-gray-800' : 'border-gray-100'} border-t`}>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Active filters:</span>
                  {debouncedSearch && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                      Search: {debouncedSearch}
                      <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {category && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                      {category}
                      <button onClick={() => setCategory('')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {type && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                      {type}
                      <button onClick={() => setType('')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{total} items found</div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`rounded-xl overflow-hidden animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
                    <div className={`h-44 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className="p-4 space-y-3">
                      <div className={`h-4 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className={`h-3 rounded w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className={`h-3 rounded w-2/3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item, i) => (
                    <Link
                      key={item.id}
                      to={`/items/${item.id}`}
                      className={`rounded-xl overflow-hidden hover-lift transition group animate-slide-up ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className={`h-44 flex items-center justify-center overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <img src={getItemPlaceholder(item.category)} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`font-semibold truncate group-hover:text-primary-600 transition ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.type === 'LOST' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className={`flex items-center gap-1.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{item.category}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatTimeAgo(item.createdAt)}
                          </div>
                        </div>
                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                          <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700 transition">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className={`p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition ${darkMode ? 'border border-gray-700 text-gray-400 hover:bg-gray-800' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                          p === page ? 'bg-primary-600 text-white' : darkMode ? 'border border-gray-700 text-gray-400 hover:bg-gray-800' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className={`p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition ${darkMode ? 'border border-gray-700 text-gray-400 hover:bg-gray-800' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={`text-center py-16 rounded-xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
                <Package className={`w-14 h-14 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No items found</h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No items found matching your criteria</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

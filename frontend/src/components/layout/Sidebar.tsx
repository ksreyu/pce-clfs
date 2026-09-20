import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, Plus, Package, GitCompare, FileText, Bell, User, Users, BarChart3, GraduationCap } from 'lucide-react';

interface SidebarProps {
  admin?: boolean;
}

const userNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/report-lost', label: 'Report Lost', icon: Search },
  { to: '/report-found', label: 'Report Found', icon: Plus },
  { to: '/my-items', label: 'My Items', icon: Package },
  { to: '/matches', label: 'Matches', icon: GitCompare },
  { to: '/claims', label: 'Claims', icon: FileText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/items', label: 'Items', icon: Package },
  { to: '/admin/claims', label: 'Claims', icon: FileText },
  { to: '/admin/matches', label: 'Matches', icon: GitCompare },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ admin = false }: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = admin ? adminNavItems : userNavItems;

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">PCE CLFS</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Lost & Found System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
          Pillai College of Engineering
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

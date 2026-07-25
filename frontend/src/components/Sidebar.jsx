import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUrl } from '@/utils/avatarUtils';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  Eye, 
  History, 
  LineChart, 
  BarChart3,
  User, 
  ShieldCheck,
  BookOpen,
  X 
} from 'lucide-react';

// Safely derive display name
const getDisplayName = (user) => {
  if (!user) return 'Guest';
  return user.name || user.displayName || user.username || user.email?.split('@')[0] || 'Guest';
};

// Safely derive initials
const getInitials = (user) => {
  const name = getDisplayName(user);
  if (name === 'Guest') return 'G';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0].charAt(0) || '';
    const last = parts[1].charAt(0) || '';
    return (first + last).toUpperCase();
  }
  return (name.charAt(0) || 'G').toUpperCase();
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const links = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/stocks', name: 'Stock Explorer', icon: TrendingUp },
    { to: '/portfolio', name: 'My Portfolio', icon: Briefcase },
    { to: '/watchlist', name: 'Watchlists', icon: Eye },
    { to: '/transactions', name: 'Transactions', icon: History },
    { to: '/analytics', name: 'Analytics', icon: LineChart },
    { to: '/compare', name: 'Stock Compare', icon: BarChart3 },
    { to: '/learn', name: 'Learning Center', icon: BookOpen },
    { to: '/profile', name: 'Profile Settings', icon: User },
  ];

  // Insert Admin console if role is admin
  if (user && user.role === 'admin') {
    links.push({ to: '/admin', name: 'Admin Console', icon: ShieldCheck });
  }

  const activeClass = "flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 transition-all";
  const inactiveClass = "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-dark-text transition-all";

  // Close sidebar on Escape press when active on mobile view
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside 
        role="complementary"
        aria-label="Sidebar Menu"
        className={`fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-dark-border dark:bg-dark-card transition-all duration-300 md:sticky md:z-10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile close button */}
        <div className="flex justify-end md:hidden">
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Header branding for desktop */}
        <div className="hidden px-2 mb-8 md:block">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              TICKERSIM
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wider uppercase">Virtual Paper Simulator</p>
        </div>

        {/* Navigation list */}
        <nav role="navigation" aria-label="Main Navigation Menu" className="flex-1 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User context indicator footer */}
        {user && (
          <div className="border-t border-slate-100 pt-4 dark:border-dark-border">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-extrabold text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 uppercase overflow-hidden border border-indigo-100 dark:border-indigo-900/30">
                {getAvatarUrl(user.avatar || user.profileImage) ? (
                  <img src={getAvatarUrl(user.avatar || user.profileImage)} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  getInitials(user)
                )}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 dark:text-dark-text truncate">{getDisplayName(user)}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email || ''}</div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

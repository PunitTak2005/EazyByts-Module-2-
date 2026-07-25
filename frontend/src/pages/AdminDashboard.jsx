import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';
import Skeleton from '@/components/ui/Skeleton';
import { 
  ShieldAlert, Users, Landmark, BarChart3, Settings, Plus, 
  Ban, ShieldCheck, Cpu, HardDrive, RefreshCw, ChevronLeft, ChevronRight, Edit2
} from 'lucide-react';

const fetchAdminStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

const fetchAdminUsers = async (page, search) => {
  const { data } = await api.get(`/admin/users?page=${page}&limit=5&search=${search}`);
  return data;
};

const AdminDashboard = () => {
  // Page states
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchFilter, setUserSearchFilter] = useState('');

  // Stock creator state inputs
  const [newStockSym, setNewStockSym] = useState('');
  const [newStockName, setNewStockName] = useState('');
  const [newStockSector, setNewStockSector] = useState('Technology');
  const [newStockPrice, setNewStockPrice] = useState('');
  const [newStockCap, setNewStockCap] = useState('');

  // Stock editor state inputs
  const [editSymbol, setEditSymbol] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Query 1: Admin Stats
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats, isRefetching: isStatsRefetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 10000,
  });

  // Query 2: Users List
  const { data: userData, isLoading: isUsersLoading, refetch: refetchUsers, isRefetching: isUsersRefetching } = useQuery({
    queryKey: ['admin-users', userPage, userSearchFilter],
    queryFn: () => fetchAdminUsers(userPage, userSearchFilter),
  });

  const handleRefreshAll = async () => {
    await Promise.all([refetchStats(), refetchUsers()]);
    toast.success('Admin stats refreshed');
  };

  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    setUserPage(1);
    setUserSearchFilter(userSearch);
  };

  // Toggle user ban status
  const handleToggleUserBan = async (id, name, currentActive) => {
    const action = currentActive ? 'ban/disable' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${name}"?`)) return;

    try {
      await api.put(`/admin/users/${id}/toggle`);
      toast.success(`User "${name}" status toggled!`);
      refetchUsers();
      refetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  // Create Stock
  const handleCreateStockSubmit = async (e) => {
    e.preventDefault();
    if (!newStockSym || !newStockName || !newStockPrice || !newStockCap) {
      toast.error('Please enter all required stock fields');
      return;
    }

    setIsSubmittingStock(true);
    try {
      await api.post('/admin/stocks', {
        symbol: newStockSym,
        name: newStockName,
        sector: newStockSector,
        price: parseFloat(newStockPrice),
        marketCap: parseFloat(newStockCap)
      });

      toast.success(`Stock security $${newStockSym.toUpperCase()} created successfully!`);
      setNewStockSym('');
      setNewStockName('');
      setNewStockPrice('');
      setNewStockCap('');
      refetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create stock security');
    } finally {
      setIsSubmittingStock(false);
    }
  };

  // Edit/Update Stock price & profile
  const handleUpdateStockSubmit = async (e) => {
    e.preventDefault();
    if (!editSymbol) {
      toast.error('Please specify a stock symbol to edit');
      return;
    }

    setIsUpdatingStock(true);
    try {
      await api.put(`/admin/stocks/${editSymbol}`, {
        price: editPrice ? parseFloat(editPrice) : null,
        description: editDesc
      });

      toast.success(`Stock security $${editSymbol.toUpperCase()} updated successfully!`);
      setEditSymbol('');
      setEditPrice('');
      setEditDesc('');
      refetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock security');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const isLoading = isStatsLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <Skeleton key={n} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Admin Console</h1>
          <p className="text-xs text-slate-400">System metrics and administrator actions.</p>
        </div>
        <button 
          onClick={handleRefreshAll}
          disabled={isStatsRefetching || isUsersRefetching}
          className="flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${(isStatsRefetching || isUsersRefetching) ? 'animate-spin' : ''}`} />
          Recheck Stats
        </button>
      </div>

      {/* Admin stats widgets */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Registered Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalUsers}</div>
          <p className="text-[10px] text-slate-400 mt-2">Active paper-trading profiles</p>
        </div>

        {/* Total Ledger Trades */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Trades Executed</span>
            <BarChart3 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalTransactions}</div>
          <p className="text-[10px] text-slate-400 mt-2">Completed Buy & Sell ledger records</p>
        </div>

        {/* Total Trading Volume */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Trading Volume</span>
            <Landmark className="h-5 w-5 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {formatCurrency(stats.totalVolume)}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Average size: {formatCurrency(stats.avgTradeSize)}</p>
        </div>

        {/* Active Securities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Securities</span>
            <Settings className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeStocksCount}</div>
          <p className="text-[10px] text-slate-400 mt-2">Pending limit queue size: {stats.pendingOrders}</p>
        </div>

      </div>

      {/* Main Grid user management & forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* User Management Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-dark-border">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Manage Users Accounts
            </h2>
            
            <form onSubmit={handleUserSearchSubmit} className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-blue-500"
              />
              <SlidersHorizontal className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-1">Name</th>
                  <th className="py-2.5 px-1">Email</th>
                  <th className="py-2.5 px-1">Virtual Balance</th>
                  <th className="py-2.5 px-1">Role</th>
                  <th className="py-2.5 px-1">Status</th>
                  <th className="py-2.5 px-1 text-right">Restrict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                {userData?.users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-1 text-slate-800 dark:text-white font-bold">{u.name}</td>
                    <td className="py-3 px-1 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 px-1 font-bold">{formatCurrency(u.virtualBalance)}</td>
                    <td className="py-3 px-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        u.role === 'admin' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-1">
                      <span className={`h-2 w-2 rounded-full inline-block mr-1.5 ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-[10px] font-bold">{u.isActive ? 'Active' : 'Banned'}</span>
                    </td>
                    <td className="py-3 px-1 text-right">
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleToggleUserBan(u._id, u.name, u.isActive)}
                          className={`rounded-lg p-1.5 border ${
                            u.isActive 
                              ? 'border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-950/20' 
                              : 'border-emerald-200 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-950/20'
                          }`}
                          title={u.isActive ? 'Ban User' : 'Unban User'}
                        >
                          {u.isActive ? <Ban className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        </button>
                      ) : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {userData?.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-dark-border">
              <button
                onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                disabled={userPage === 1}
                className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-card"
              >
                <ChevronLeft className="h-3 w-3" /> Prev
              </button>
              <span className="text-[10px] font-bold text-slate-400">Page {userPage} of {userData.pages}</span>
              <button
                onClick={() => setUserPage(prev => Math.min(userData.pages, prev + 1))}
                disabled={userPage === userData.pages}
                className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-card"
              >
                Next <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: API Server Health Monitor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-indigo-500" />
            Simulator Health Status
          </h2>

          <div className="space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API Server:</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
              </span>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-dark-border">
              <span className="text-slate-400">Database Connection:</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5" /> Online
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-dark-border">
              <span className="text-slate-400">Latency:</span>
              <span className="text-blue-500">24ms</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-dark-border">
              <span className="text-slate-400">Simulation Tick Interval:</span>
              <span className="text-blue-500">8 seconds (Brownian)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Tickers Seeder / Editors Form Desk */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        {/* Seed Ticker */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />
            Seed New Security Ticker
          </h2>

          <form onSubmit={handleCreateStockSubmit} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-500">Ticker Symbol (e.g. INFY)</label>
                <input
                  type="text"
                  placeholder="INFY"
                  value={newStockSym}
                  onChange={(e) => setNewStockSym(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500">Company Name</label>
                <input
                  type="text"
                  placeholder="Infosys Technologies"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-slate-500">Starting Price</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1450"
                  value={newStockPrice}
                  onChange={(e) => setNewStockPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500">Cap Value (Billions)</label>
                <input
                  type="number"
                  placeholder="85"
                  value={newStockCap}
                  onChange={(e) => setNewStockCap(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500">Sector</label>
                <select
                  value={newStockSector}
                  onChange={(e) => setNewStockSector(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg cursor-pointer"
                >
                  <option value="Technology">Technology</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Retail">Retail</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Consumer Defensive">Consumer Defensive</option>
                  <option value="Energy">Energy</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingStock}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 disabled:bg-blue-600/60 transition-all shadow-md mt-4"
            >
              Seed Security
            </button>
          </form>
        </div>

        {/* Update existing quotes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-indigo-500" />
            Modify Existing Security Price
          </h2>

          <form onSubmit={handleUpdateStockSubmit} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-500">Ticker Symbol (e.g. AAPL)</label>
                <input
                  type="text"
                  placeholder="AAPL"
                  value={editSymbol}
                  onChange={(e) => setEditSymbol(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500">Override Ticker Price (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="195.20"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">Modify Ticker Description</label>
              <textarea
                rows="2"
                placeholder="Enter stock description profile details..."
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 outline-none dark:border-dark-border dark:bg-dark-bg focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingStock}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 disabled:bg-indigo-600/60 transition-all shadow-md mt-4"
            >
              Modify Quote Price
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;

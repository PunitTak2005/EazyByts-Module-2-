import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'react-hot-toast';
import { User, Shield, Bell, Globe, Moon, Loader2, Save, AlertOctagon, Phone, Mail, FileText, MapPin, Clock, DollarSign, Lock, Award, ArrowUpDown } from 'lucide-react';
import ProfileAvatarCard from '@/components/profile/ProfileAvatarCard';
import { motion } from 'framer-motion';
const ProfileSettings = () => {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();

  // Local config states
  const [name, setName] = useState(user?.name || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [tradeSuccess, setTradeSuccess] = useState(user?.notificationSettings?.tradeSuccess ?? true);
  const [tradeFailure, setTradeFailure] = useState(user?.notificationSettings?.tradeFailure ?? true);
  const [priceAlerts, setPriceAlerts] = useState(user?.notificationSettings?.priceAlerts ?? true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Only / Mock Fields
  const [username, setUsername] = useState(user?.name?.toLowerCase().replace(/\s+/g, '') || '');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('US');
  const [timezone, setTimezone] = useState('UTC-5');
  const [currency, setCurrency] = useState('USD');
  const [privacyProfile, setPrivacyProfile] = useState('public');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [startingBalance, setStartingBalance] = useState(user?.balance ?? user?.virtualBalance ?? 1000000);
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const handleSaveBalance = async () => {
    const val = parseFloat(startingBalance);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid cash balance amount.');
      return;
    }
    setIsSavingBalance(true);
    try {
      await updateProfile({ balance: val });
      toast.success(`Account cash balance updated to ₹${val.toLocaleString('en-IN')}!`);
    } catch (err) {
      toast.error(err.message || 'Failed to update cash balance');
    } finally {
      setIsSavingBalance(false);
    }
  };
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    // Phone validation: must be exactly 10 digits if provided
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        setPhoneError('Enter a valid 10-digit Indian mobile number.');
        return;
      }
    }
    setPhoneError('');
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name,
        language,
        notificationSettings: {
          tradeSuccess,
          tradeFailure,
          priceAlerts
        }
      });
      toast.success('Profile settings updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change password
  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSavingSecurity(true);
    try {
      await changePassword(newPassword);
      toast.success('Password changed successfully! Keep it secure.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Your TickerSim account has been deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto w-full px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your profile, preferences, and security settings.</p>
      </div>

      <div className="space-y-8">
        
        {/* Top Section: Avatar & Quick Info */}
        <div className="space-y-8">
          <ProfileAvatarCard phone={phone} bio={bio} name={name} language={language} />

          {/* Account Status Card (Visual Only) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Membership</span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Member Since</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">July 2023</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Settings Forms */}
        <div className="space-y-8">
          
          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* Brokerage Cash Balance / Fund Management */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    Brokerage Cash Balance
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your paper-trading account cash balance.</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                  Current Cash: ₹{(user?.balance ?? user?.virtualBalance ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              
              <div className="p-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Account Starting / Refill Balance (₹)</label>
                    <div className="relative max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">₹</div>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={startingBalance}
                        onChange={(e) => setStartingBalance(e.target.value)}
                        className="w-full pl-10 rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold"
                      />
                    </div>
                    <p className="text-xs text-slate-400">All buy orders will require available cash to be greater than or equal to total order cost (Price × Quantity + Fees).</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveBalance}
                    disabled={isSavingBalance}
                    className="py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Update Cash Balance
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Personal Information
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your personal details and how we can reach you.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">@</div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      Email Address <span className="text-xs text-slate-400 font-normal mt-0.5">Read-only</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full pl-10 rounded-xl border border-slate-200 bg-slate-100 py-3 px-4 text-slate-500 dark:border-dark-border dark:bg-dark-bg/60 cursor-not-allowed text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <div className="flex gap-2">
                      {/* Country code prefix */}
                      <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 bg-slate-100 dark:border-dark-border dark:bg-dark-bg/60 text-sm font-bold text-slate-600 dark:text-slate-300 select-none shrink-0">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      {/* 10-digit input */}
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="phone-input"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(digits);
                            if (digits.length > 0 && digits.length < 10) {
                              setPhoneError('Mobile number must be exactly 10 digits.');
                            } else {
                              setPhoneError('');
                            }
                          }}
                          placeholder="98XXXXXXXX"
                          className={`w-full pl-10 rounded-xl border py-3 px-4 outline-none bg-slate-50 dark:bg-dark-bg dark:text-white focus:ring-2 transition-all text-sm font-medium ${
                            phoneError
                              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                              : 'border-slate-200 dark:border-dark-border focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                        />
                      </div>
                    </div>
                    {/* Inline error */}
                    {phoneError && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <span>⚠</span> {phoneError}
                      </p>
                    )}
                    {/* Helper hint */}
                    {!phoneError && phone.length === 10 && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                        <span>✓</span> Looks good! Full number: +91{phone}
                      </p>
                    )}
                    {!phoneError && !phone && (
                      <p className="text-xs text-slate-400 mt-1">Enter your 10-digit Indian mobile number without country code.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Account Information
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize your biography and regional settings.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little bit about yourself..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Country / Region</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full pl-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer"
                      >
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="IN">India</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Timezone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full pl-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer"
                      >
                        <option value="UTC-8">Pacific Time (PT)</option>
                        <option value="UTC-5">Eastern Time (ET)</option>
                        <option value="UTC+0">Greenwich Mean Time (GMT)</option>
                        <option value="UTC+5.5">Indian Standard Time (IST)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Preferred Currency</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full pl-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Language Localization</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full pl-10 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer"
                      >
                        <option value="en">English (US/UK)</option>
                        <option value="in">Hindi (India)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-emerald-500" />
                  Preferences
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage notifications, themes, and privacy.</p>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Moon className="h-4 w-4 text-slate-400" /> UI Theme
                  </label>
                  <ThemeToggle variant="full" />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-dark-border">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Ledger Alerts</h3>
                  
                  <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50 cursor-pointer hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                    <div>
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Trade Success Notifications</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive toast alerts when a transaction completes.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tradeSuccess}
                      onChange={(e) => setTradeSuccess(e.target.checked)}
                      className="rounded-md border-slate-300 dark:border-dark-border text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50 cursor-pointer hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                    <div>
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Trade Failure Notifications</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive alerts when an order is rejected or fails.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tradeFailure}
                      onChange={(e) => setTradeFailure(e.target.checked)}
                      className="rounded-md border-slate-300 dark:border-dark-border text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50 cursor-pointer hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                    <div>
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Price Alerts</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get notified for simulated threshold targets on watchlist.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={priceAlerts}
                      onChange={(e) => setPriceAlerts(e.target.checked)}
                      className="rounded-md border-slate-300 dark:border-dark-border text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
                    />
                  </label>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-dark-border">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Privacy</h3>
                  
                  <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50 cursor-pointer hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                    <div>
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Public Profile</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allow other users to view your profile and portfolio stats.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyProfile === 'public'}
                      onChange={(e) => setPrivacyProfile(e.target.checked ? 'public' : 'private')}
                      className="rounded-md border-slate-300 dark:border-dark-border text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Profile Action Bar */}
            <div className="flex justify-end items-center gap-4 pt-4">
              <button
                type="button"
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-dark-card transition-colors"
              >
                Reset Changes
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:bg-blue-600/60 shadow-lg shadow-blue-500/20 transition-all min-w-[160px]"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Center */}
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden dark:border-dark-border dark:bg-dark-card shadow-sm mt-6">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Security Center
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your password and secure your account.</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSaveSecurity} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingSecurity}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-white hover:bg-amber-400 disabled:bg-amber-500/60 shadow-lg shadow-amber-500/20 transition-all min-w-[160px]"
                  >
                    {isSavingSecurity ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>



          {/* Danger Zone */}
          <div className="rounded-3xl border border-rose-200 bg-white overflow-hidden dark:border-rose-900/30 dark:bg-dark-card shadow-sm mt-6">
            <div className="px-8 py-6 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10">
              <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-rose-500" />
                Danger Zone
              </h2>
            </div>
            
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Delete Account</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                  Once deleted, your portfolio holdings, cash metrics, and transactions ledger will be permanently wiped out. This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-8 py-3 text-sm font-bold text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-rose-500 animate-pulse" />
              Delete Account?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This action is completely irreversible. All active holdings will be liquidated, available virtual cash reset, and all simulation archives deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-dark-border py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 disabled:bg-rose-500/60 shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default ProfileSettings;

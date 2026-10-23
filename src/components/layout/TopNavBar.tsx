/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import { useToast } from '../common/Toast';
import { useTheme } from '../../context/ThemeContext';

interface TopNavBarProps {
  onQuickAction?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onQuickAction }) => {
  const { currentUser, role, activeView, setActiveView, logout } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, settings, checkInMember, members } = useGym();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setShowBranchMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleQuickTurnstileTap = () => {
    const rahul = members.find(m => m.id === 'mem-1042') || members[0];
    if (rahul) {
      try {
        checkInMember(rahul.id, 'Turnstile Gate #04 (Downtown HQ)', 'Optical Dynamic QR');
        showToast('Optical Turnstile #04 Actuated!', `Access GRANTED for ${rahul.name} (#M-1042). Gate solenoid opened: 44ms.`, 'success');
      } catch (err: any) {
        showToast('Turnstile Tap Event', err.message || 'Already checked in', 'info');
      }
    }
  };

  const scrollToSection = (id: string) => {
    if (activeView !== 'public') {
      setActiveView('public');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getUserPortalView = (): 'owner' | 'staff' | 'customer' => {
    if (role === 'OWNER') return 'owner';
    if (role === 'STAFF') return 'staff';
    return 'customer';
  };

  const getPortalLabel = (): string => {
    if (role === 'OWNER') return 'Owner Executive Hub';
    if (role === 'STAFF') return 'Staff Front Desk';
    return 'Member Digital Pass';
  };

  const isPortalView = activeView === 'owner' || activeView === 'staff' || activeView === 'customer';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#180e0d]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-xs w-full transition-colors">
      <div className="flex justify-between items-center w-full px-4 lg:px-8 h-16 max-w-7xl mx-auto">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('public')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to Brand Website"
          >
            <div className="w-10 h-10 rounded-xl bg-[#bc0100] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-150">
              <span className="material-symbols-outlined text-xl">fitness_center</span>
            </div>
            <div>
              <div className="font-headline font-extrabold text-base text-[#bc0100] tracking-tight leading-none flex items-center gap-1.5">
                <span>WARRIOR</span>
                <span className="text-slate-900 dark:text-white italic">FITNESS</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-gray-400 mt-0.5">
                Kinetic Labs Ecosystem
              </div>
            </div>
          </button>

          {/* Portal Context Badge (shown when inside an authenticated portal) */}
          {isPortalView && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-[#bc0100] text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#bc0100] animate-pulse"></span>
              <span>{getPortalLabel()}</span>
            </div>
          )}

          {/* Branch & Turnstile Status Pill (shown in portals or desktop public) */}
          {isPortalView && (
            <div className="relative hidden md:block" ref={branchRef}>
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs hover:border-[#bc0100] transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse"></span>
                <span className="font-bold text-slate-800 dark:text-gray-200">{settings.activeBranch}</span>
                <span className="text-slate-500 dark:text-gray-400 hidden lg:inline">| Gates Active</span>
                <span className="material-symbols-outlined text-sm text-gray-500">unfold_more</span>
              </button>

              {showBranchMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#201211] rounded-xl shadow-xl border border-black/10 dark:border-white/10 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Select Regional Hub
                  </div>
                  {settings.branches.map(b => (
                    <button
                      key={b}
                      onClick={() => setShowBranchMenu(false)}
                      className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-red-50 dark:hover:bg-white/5 flex items-center justify-between text-[#2b1613] dark:text-gray-200"
                    >
                      <span>{b}</span>
                      {b === settings.activeBranch && (
                        <span className="material-symbols-outlined text-sm text-[#bc0100]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Brand Website Navigation Links (Visible on Brand Website) */}
        {!isPortalView && (
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('programs')}
              className="hover:text-[#bc0100] transition-colors cursor-pointer py-1"
            >
              Programs
            </button>
            <button
              onClick={() => scrollToSection('pricing-tiers')}
              className="hover:text-[#bc0100] transition-colors cursor-pointer py-1"
            >
              Membership Plans
            </button>
            <button
              onClick={() => scrollToSection('coaches')}
              className="hover:text-[#bc0100] transition-colors cursor-pointer py-1"
            >
              Coaches
            </button>
            <button
              onClick={() => scrollToSection('telemetry')}
              className="hover:text-[#bc0100] transition-colors cursor-pointer py-1"
            >
              Amenities & Lab
            </button>
            <button
              onClick={() => scrollToSection('locations')}
              className="hover:text-[#bc0100] transition-colors cursor-pointer py-1"
            >
              Locations
            </button>
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Inside Portals: Simulated Turnstile Tap button */}
          {isPortalView && (
            <button
              onClick={handleQuickTurnstileTap}
              title="Simulate Turnstile NFC Scan"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#bc0100] text-[#bc0100] hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">contactless</span>
              <span>Tap Turnstile</span>
            </button>
          )}

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notifications Bell (inside portals) */}
          {isPortalView && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#bc0100] rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notifications Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#201211] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-[#fff8f6] dark:bg-[#1a0e0d]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2b1613] dark:text-white font-headline">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#bc0100] text-white">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-[#bc0100] font-semibold hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3.5 hover:bg-red-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3 ${
                            !n.read ? 'bg-[#fff0ee]/50 dark:bg-white/5' : ''
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                              n.type === 'ALERT'
                                ? 'text-red-600'
                                : n.type === 'WARNING'
                                ? 'text-amber-500'
                                : n.type === 'SUCCESS'
                                ? 'text-emerald-500'
                                : 'text-blue-500'
                            }`}
                          >
                            {n.type === 'ALERT'
                              ? 'warning'
                              : n.type === 'WARNING'
                              ? 'schedule'
                              : n.type === 'SUCCESS'
                              ? 'verified'
                              : 'info'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#2b1613] dark:text-white leading-tight">{n.title}</p>
                            <p className="text-[11px] text-[#603e39] dark:text-gray-400 mt-0.5 leading-normal">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#bc0100] shrink-0 mt-1"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* In Portal View: Button to view Brand Website */}
          {isPortalView && (
            <button
              onClick={() => setActiveView('public')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-white text-xs font-bold hover:border-[#bc0100] hover:text-[#bc0100] transition-all cursor-pointer shadow-xs"
              title="View Public Brand Website"
            >
              <span className="material-symbols-outlined text-sm text-[#bc0100]">public</span>
              <span className="hidden sm:inline">Brand Website</span>
            </button>
          )}

          {/* Public Website View - NOT Logged In: Show Professional Sign In & Join CTAs */}
          {!currentUser && activeView !== 'login' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('login')}
                className="px-3 sm:px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white hover:border-[#bc0100] hover:text-[#bc0100] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-base text-[#bc0100]">lock</span>
                <span>Portal Sign In</span>
              </button>

              <button
                onClick={() => scrollToSection('pricing-tiers')}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold shadow-md shadow-red-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Join Now</span>
                <span className="material-symbols-outlined text-sm hidden sm:inline">arrow_forward</span>
              </button>
            </div>
          )}

          {/* On Login View: Show Return to Website Button */}
          {activeView === 'login' && (
            <button
              onClick={() => setActiveView('public')}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1a0f0e] border border-slate-300 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-white hover:border-[#bc0100] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm text-[#bc0100]">home</span>
              <span>Brand Website</span>
            </button>
          )}

          {/* Authenticated User Menu (shown when logged in) */}
          {currentUser && (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-white/10 group cursor-pointer"
                title="Account & Portal Management"
              >
                <div className="relative w-9 h-9 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#bc0100] to-rose-400 shadow-xs">
                  <img
                    src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={currentUser?.name || 'User'}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900"></span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#2b1613] dark:text-white leading-tight">
                    {currentUser?.name}
                  </span>
                  <span className="text-[10px] font-extrabold text-[#bc0100] tracking-wider uppercase font-mono">
                    {role}
                  </span>
                </div>
                <span className="material-symbols-outlined text-base text-gray-400 group-hover:text-[#bc0100] transition-colors">
                  expand_more
                </span>
              </button>

              {/* User Account & Portal Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#201211] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-black/10 dark:border-white/10">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono">Signed In As</div>
                    <div className="font-bold text-sm text-[#2b1613] dark:text-white mt-0.5">{currentUser?.name}</div>
                    <div className="text-xs text-gray-500 truncate">{currentUser?.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#bc0100] text-[10px] font-bold font-mono">
                      <span>ROLE: {role}</span>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    {/* Enter Portal Link */}
                    <button
                      onClick={() => {
                        setActiveView(getUserPortalView());
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-800 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-[#bc0100]">dashboard</span>
                        <span>Open {getPortalLabel()}</span>
                      </span>
                      <span className="material-symbols-outlined text-sm text-gray-400">arrow_forward</span>
                    </button>

                    {/* View Public Website */}
                    <button
                      onClick={() => {
                        setActiveView('public');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-gray-500">public</span>
                        <span>Brand Homepage</span>
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-black/10 dark:border-white/10 px-2">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      <span>Sign Out (Lock Portal)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { 
  XCircle, Clock, RefreshCw, Send, Search, Phone, 
  Calendar, AlertOctagon, TrendingDown, CheckCircle2 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';
import { formatDisplayDate, getDaysRemaining } from '../../utils/dateUtils';

interface ExpiredMembershipsProps {
  onRenewMembership: (memberId: string) => void;
}

export const ExpiredMemberships: React.FC<ExpiredMembershipsProps> = ({ onRenewMembership }) => {
  const { memberships, members, plans, stats } = useGym();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  // Find all EXPIRED memberships
  const expiredList = memberships.filter(m => {
    const days = getDaysRemaining(m.expiryDate);
    return days < 0 || m.status === 'EXPIRED';
  }).map(m => {
    const member = members.find(mem => mem.id === m.memberId);
    const plan = plans.find(p => p.id === m.planId);
    const daysOverdue = Math.abs(getDaysRemaining(m.expiryDate));
    return {
      membership: m,
      member,
      plan,
      daysOverdue
    };
  }).filter(item => {
    if (!item.member) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.member.name.toLowerCase().includes(q) ||
      item.member.memberCode.toLowerCase().includes(q) ||
      item.member.phone.includes(q) ||
      item.membership.planName.toLowerCase().includes(q)
    );
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);

  const handleWinbackOffer = (memberName: string, phone: string) => {
    addToast(
      `Special 10% Reactivation Winback message sent to ${memberName} (${phone})!`,
      'success'
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-rose-600 dark:text-rose-400 font-bold">Lapsed Accounts</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            Expired Memberships
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Members whose validity has expired. Optical turnstiles are locked for these badges until reactivation.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="text-xs text-rose-600/90 dark:text-rose-400/80 font-mono">TOTAL EXPIRED</p>
              <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-300">{expiredList.length} <span className="text-xs text-rose-500/80 font-normal">Members</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm transition-colors">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expired members by name, code, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[#2b1613] dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-gray-500 dark:text-slate-400 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span>Turnstile access suspended for all listed members</span>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebbbb4]/30 dark:border-slate-800 bg-[#fff0ee]/60 dark:bg-slate-950/40 text-[11px] font-mono uppercase text-[#603e39] dark:text-slate-400 tracking-wider">
                <th className="py-3 px-6">Member Details</th>
                <th className="py-3 px-6">Expired Plan</th>
                <th className="py-3 px-6">Date Expired</th>
                <th className="py-3 px-6">Days Overdue</th>
                <th className="py-3 px-6">Winback Outreach</th>
                <th className="py-3 px-6 text-right">Reactivate Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebbbb4]/20 dark:divide-slate-800/60 text-sm">
              {expiredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/60" />
                    <p className="text-[#2b1613] dark:text-white font-medium">No expired memberships found!</p>
                  </td>
                </tr>
              ) : (
                expiredList.map(({ membership, member, plan, daysOverdue }) => {
                  if (!member) return null;

                  return (
                    <tr key={membership.id} className="hover:bg-red-50/30 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={member.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                            alt={member.name} 
                            className="w-10 h-10 rounded-full object-cover border border-rose-500/30 grayscale" 
                          />
                          <div>
                            <div className="font-bold text-[#2b1613] dark:text-white flex items-center gap-2">
                              {member.name}
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                                {member.memberCode}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                              <span>{member.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-800 dark:text-slate-300 text-sm">{membership.planName}</div>
                        <div className="text-xs font-mono text-gray-400 dark:text-slate-500">Last tier: ₹{membership.price.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-sm text-rose-600 dark:text-rose-400 font-semibold">
                          {formatDisplayDate(membership.expiryDate)}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                          Started: {formatDisplayDate(membership.startDate)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          {daysOverdue} Days Ago
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleWinbackOffer(member.name, member.phone)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white text-xs font-medium border border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-rose-500" />
                          Send Winback
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onRenewMembership(member.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#bc0100] hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md shadow-red-600/20 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

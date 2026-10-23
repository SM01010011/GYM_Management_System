import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, RefreshCw, Send, CheckCircle2, 
  Calendar, Phone, Search, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';
import { formatDisplayDate, getDaysRemaining } from '../../utils/dateUtils';

interface ExpiringMembershipsProps {
  onRenewMembership: (memberId: string) => void;
}

export const ExpiringMemberships: React.FC<ExpiringMembershipsProps> = ({ onRenewMembership }) => {
  const { memberships, members, plans, stats } = useGym();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [windowDays, setWindowDays] = useState<number>(7);

  // Find all memberships that are EXPIRING_SOON or expiring within windowDays
  const expiringList = memberships.filter(m => {
    const days = getDaysRemaining(m.expiryDate);
    return days >= 0 && days <= windowDays;
  }).map(m => {
    const member = members.find(mem => mem.id === m.memberId);
    const plan = plans.find(p => p.id === m.planId);
    const daysLeft = getDaysRemaining(m.expiryDate);
    return {
      membership: m,
      member,
      plan,
      daysLeft
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
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  const handleSendReminder = (memberName: string, phone: string, daysLeft: number) => {
    addToast(
      `WhatsApp reminder dispatched to ${memberName} (${phone}) - Validity expires in ${daysLeft} days.`,
      'success'
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-amber-600 dark:text-amber-400 font-bold">Retention Pipeline</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            Expiring Memberships
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Active passes expiring within the warning threshold. Prevent lapse before gate access is locked.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs text-amber-600/90 dark:text-amber-400/80 font-mono">DUE IN &le; {windowDays} DAYS</p>
              <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-300">{expiringList.length} <span className="text-xs text-amber-500/80 font-normal">Members</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member, code, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[#2b1613] dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-gray-500 dark:text-slate-400">EXPIRY WINDOW:</span>
          {[3, 7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                windowDays === days
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebbbb4]/30 dark:border-slate-800 bg-[#fff0ee]/60 dark:bg-slate-950/40 text-[11px] font-mono uppercase text-[#603e39] dark:text-slate-400 tracking-wider">
                <th className="py-3 px-6">Member Details</th>
                <th className="py-3 px-6">Current Plan</th>
                <th className="py-3 px-6">Expiry Date</th>
                <th className="py-3 px-6">Days Remaining</th>
                <th className="py-3 px-6">Retention Action</th>
                <th className="py-3 px-6 text-right">Process Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebbbb4]/20 dark:divide-slate-800/60 text-sm">
              {expiringList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/60" />
                    <p className="text-[#2b1613] dark:text-white font-medium">All clear!</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">No memberships expiring within the selected {windowDays}-day threshold.</p>
                  </td>
                </tr>
              ) : (
                expiringList.map(({ membership, member, plan, daysLeft }) => {
                  if (!member) return null;

                  return (
                    <tr key={membership.id} className="hover:bg-red-50/30 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={member.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                            alt={member.name} 
                            className="w-10 h-10 rounded-full object-cover border border-amber-500/30" 
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
                        <div className="font-bold text-[#2b1613] dark:text-white text-sm">{membership.planName}</div>
                        <div className="text-xs font-mono text-gray-500 dark:text-slate-400">₹{membership.price.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-sm text-amber-600 dark:text-amber-400 font-semibold">
                          {formatDisplayDate(membership.expiryDate)}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                          Started: {formatDisplayDate(membership.startDate)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                          daysLeft <= 2
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {daysLeft === 0 ? 'Expires TODAY' : `${daysLeft} Day${daysLeft > 1 ? 's' : ''} Left`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleSendReminder(member.name, member.phone, daysLeft)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send WhatsApp
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onRenewMembership(member.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#bc0100] hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md shadow-red-600/20 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Renew Plan
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

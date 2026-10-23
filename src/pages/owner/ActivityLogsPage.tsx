import React, { useState } from 'react';
import { 
  FileText, ShieldCheck, Clock, Search, Filter, 
  UserCheck, DollarSign, RefreshCw, LogIn, Settings 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { formatDisplayDate, formatDisplayTime, formatRelativeTime } from '../../utils/dateUtils';

export const ActivityLogsPage: React.FC = () => {
  const { activityLogs } = useGym();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = activityLogs.filter(log => {
    if (filterAction !== 'ALL' && !log.action.includes(filterAction)) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q)
    );
  });

  const getActionIcon = (action: string) => {
    if (action.includes('PAYMENT')) return <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    if (action.includes('RENEW') || action.includes('MEMBERSHIP')) return <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (action.includes('CHECK_IN') || action.includes('ATTENDANCE')) return <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (action.includes('STAFF') || action.includes('SETTINGS')) return <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    return <ShieldCheck className="w-4 h-4 text-[#bc0100]" />;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-bold">Audit Trail & Compliance</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            System Activity Logs
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Immutable system event ledger tracking all financial, access, and member modifications.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by staff, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[#2b1613] dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'MEMBERSHIP', 'PAYMENT', 'ATTENDANCE', 'SETTINGS'].map(action => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                filterAction === action
                  ? 'bg-[#bc0100] text-white font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebbbb4]/30 dark:border-slate-800 bg-[#fff0ee]/60 dark:bg-slate-950/40 text-[11px] font-mono uppercase text-[#603e39] dark:text-slate-400 tracking-wider">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Actor / Operator</th>
                <th className="py-3 px-6">Event Type</th>
                <th className="py-3 px-6">Description / Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebbbb4]/20 dark:divide-slate-800/60 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No activity logs match the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={`${log.id}-${index}`} className="hover:bg-red-50/30 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-mono text-xs text-[#2b1613] dark:text-white">
                        {formatDisplayTime(log.createdAt)}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                        {formatDisplayDate(log.createdAt)} ({formatRelativeTime(log.createdAt)})
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-bold text-[#2b1613] dark:text-white text-xs">{log.performedBy}</div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400">
                        {log.category || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4]/40 dark:border-slate-800">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="font-mono text-xs font-semibold text-gray-800 dark:text-slate-300">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-700 dark:text-slate-300">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

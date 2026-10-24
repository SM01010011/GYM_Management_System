import React, { useState } from 'react';
import { 
  Users, CheckCircle2, Clock, Search, LogIn, LogOut, 
  DoorOpen, ShieldCheck, AlertCircle, ArrowUpDown, Filter, Sparkles 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';

interface AttendanceManagementProps {
  onAssignMembership?: (memberId: string) => void;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ onAssignMembership }) => {
  const { 
    members, 
    memberships,
    attendance, 
    checkInMember, 
    checkOutMember, 
    stats 
  } = useGym();
  const { addToast } = useToast();

  const getMemberActiveMembership = (mId: string) => 
    memberships.find(m => m.memberId === mId && m.status !== 'EXPIRED');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGate, setSelectedGate] = useState('Gate 01 - Main Turnstile');
  const [filterMode, setFilterMode] = useState<'all' | 'inside' | 'checked_out'>('all');

  // Filter members for quick check-in search.
  // Normalize the display code so both "#M-1234ABCD" and "M-1234ABCD"
  // work, and normalize phone formatting for front-desk searches.
  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/^#/, '');
  const normalizedPhoneQuery = normalizedQuery.replace(/[\\s-]/g, '');

  const matchedMembers = normalizedQuery === '' ? [] : members.filter(m => {
    const name = m.name.toLowerCase();
    const memberCode = m.memberCode.toLowerCase().replace(/^#/, '');
    const phone = m.phone.toLowerCase().replace(/[\\s-]/g, '');

    return (
      name.includes(normalizedQuery) ||
      memberCode.includes(normalizedQuery) ||
      phone.includes(normalizedPhoneQuery)
    );
  }).slice(0, 5);

  const handleQuickCheckIn = async (memberId: string, memberName: string) => {
    const membership = getMemberActiveMembership(memberId);
    if (!membership || membership.status === 'EXPIRED') {
      addToast(
        `Gate Denied: ${memberName}'s membership is expired or inactive. Please renew first.`, 
        'error'
      );
      return;
    }

    try {
      const att = await checkInMember(memberId, selectedGate);
      if (att) {
        addToast(`Turnstile Unlocked! ${memberName} checked in successfully.`, 'success');
        setSearchQuery('');
      }
    } catch (err: any) {
      addToast(err.message || `${memberName} is already checked in.`, 'warning');
    }
  };

  const handleCheckOut = async (recordId: string, memberName: string) => {
    try {
      await checkOutMember(recordId);
      addToast(`${memberName} checked out successfully.`, 'info');
    } catch (err: any) {
      addToast(err.message || 'Error checking out', 'error');
    }
  };

  // Filter attendance records
  const filteredAttendance = attendance.filter(rec => {
    if (filterMode === 'inside') return !rec.checkOut;
    if (filterMode === 'checked_out') return !!rec.checkOut;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-bold">Optical Gate System & NFC Terminal</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            Access Control & Attendance
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Real-time biometric turnstile monitoring, active occupants, and manual gate override.
          </p>
        </div>

        {/* Quick Turnstile Metrics */}
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">INSIDE FACILITY</p>
              <p className="text-xl font-bold font-mono text-[#2b1613] dark:text-white">{stats.checkedInNow} <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">Active</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">TODAY VISITS</p>
              <p className="text-xl font-bold font-mono text-[#2b1613] dark:text-white">{stats.todayAttendance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Check-in Terminal Card */}
      <div className="bg-gradient-to-r from-red-50/50 via-white to-[#fff0ee]/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-[#ebbbb4]/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl relative overflow-visible transition-colors z-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-mono text-xs uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Front Desk Fast Scanner / Member Lookup</span>
            </div>
            <h3 className="text-xl font-bold text-[#2b1613] dark:text-white">Manual Check-In & Gate Override</h3>
            <p className="text-sm text-[#603e39] dark:text-slate-400">
              Type member code, phone number, or name. Active status will be verified before releasing the turnstile brake.
            </p>

            <div className="relative pt-2">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 dark:text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Code (e.g. M-1042), Name, or Mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-700/80 rounded-xl pl-12 pr-4 py-3.5 text-[#2b1613] dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm font-sans shadow-inner transition-colors"
                />
              </div>

              {/* Instant Search Results Dropdown */}
              {matchedMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-700 rounded-xl shadow-2xl p-2 z-[100] space-y-1 max-h-72 overflow-y-auto">
                  {matchedMembers.map(m => {
                    const activeMem = getMemberActiveMembership(m.id);
                    const isCheckedIn = attendance.some(a => a.memberId === m.id && !a.checkOut);
                    const isExpired = !activeMem || activeMem.status === 'EXPIRED';

                    return (
                      <div 
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50/50 dark:hover:bg-slate-900 border border-transparent hover:border-[#ebbbb4]/50 dark:hover:border-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={m.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"} 
                            alt={m.name} 
                            className="w-10 h-10 rounded-full object-cover border border-[#ebbbb4]/50 dark:border-slate-700" 
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#2b1613] dark:text-white text-sm">{m.name}</span>
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                                {m.memberCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              <span className="text-gray-500 dark:text-slate-400">{m.phone}</span>
                              <span className="text-gray-400 dark:text-slate-600">•</span>
                              {isExpired ? (
                                <span className="text-red-500 dark:text-red-400 font-semibold">Membership Expired</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{activeMem.planName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isCheckedIn ? (
                            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                            </span>
                          ) : isExpired ? (
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                onAssignMembership?.(m.id);
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium transition-colors"
                            >
                              Renew First
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQuickCheckIn(m.id, m.name)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-[#bc0100] hover:bg-red-700 text-white font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/20 cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5" /> Check In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Turnstile Selection & Controls */}
          <div className="bg-white/80 dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-mono text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
              Active Access Gate
            </label>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-[#ebbbb4] dark:border-slate-700 rounded-lg px-3 py-2 text-[#2b1613] dark:text-white text-sm focus:outline-none focus:border-red-600"
            >
              <option value="Gate 01 - Main Turnstile">Gate 01 - Main Turnstile (NFC)</option>
              <option value="Gate 02 - Cardio Wing">Gate 02 - Cardio Wing (Optical)</option>
              <option value="Gate 03 - Crossfit Pit">Gate 03 - Crossfit Pit (Barcode)</option>
              <option value="Manual Desk Override">Manual Desk Override (Staff)</option>
            </select>

            <div className="pt-2 border-t border-[#ebbbb4]/30 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">Brake Solenoid Status:</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ARMED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Activity Log */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
        <div className="p-6 border-b border-[#ebbbb4]/30 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#2b1613] dark:text-white">Live Attendance Log</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">All check-ins and check-outs recorded for today</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#bc0100] text-white font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              All Records ({attendance.length})
            </button>
            <button
              onClick={() => setFilterMode('inside')}
              className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer ${
                filterMode === 'inside'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Inside Now ({stats.checkedInNow})
            </button>
            <button
              onClick={() => setFilterMode('checked_out')}
              className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer ${
                filterMode === 'checked_out'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Checked Out
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebbbb4]/30 dark:border-slate-800 bg-[#fff0ee]/60 dark:bg-slate-950/40 text-[11px] font-mono uppercase text-[#603e39] dark:text-slate-400 tracking-wider">
                <th className="py-3 px-6">Member</th>
                <th className="py-3 px-6">Attendance Source</th>
                <th className="py-3 px-6">Check In Time</th>
                <th className="py-3 px-6">Check Out Time</th>
                <th className="py-3 px-6">Session Duration</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebbbb4]/20 dark:divide-slate-800/60 text-sm">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No attendance records found matching this filter.</p>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(rec => {
                  const isInside = !rec.checkOut;

                  // Compute duration
                  let durationStr = 'Active session';
                  if (rec.checkOut) {
                    const start = new Date(rec.checkIn).getTime();
                    const end = new Date(rec.checkOut).getTime();
                    const diffMins = Math.round((end - start) / (1000 * 60));
                    const hrs = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
                  }

                  return (
                    <tr key={rec.id} className="hover:bg-red-50/30 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-slate-800 border border-[#ebbbb4]/40 dark:border-slate-700 flex items-center justify-center font-bold text-red-600 dark:text-white text-xs">
                            {rec.memberName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[#2b1613] dark:text-white">{rec.memberName}</div>
                            <div className="text-xs font-mono text-gray-500 dark:text-slate-400">{rec.memberCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-600 dark:text-slate-300">
                        {rec.gate || 'Supabase'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs text-[#2b1613] dark:text-white">
                          {formatDisplayTime(rec.checkIn)}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-500">
                          {formatDisplayDate(rec.checkIn)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {rec.checkOut ? (
                          <div>
                            <div className="font-mono text-xs text-[#2b1613] dark:text-white">
                              {formatDisplayTime(rec.checkOut)}
                            </div>
                            <div className="text-[11px] text-gray-400 dark:text-slate-500">
                              {formatDisplayDate(rec.checkOut)}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            INSIDE GYM
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-500 dark:text-slate-400">
                        {durationStr}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isInside ? (
                          <button
                            onClick={() => handleCheckOut(rec.id, rec.memberName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-medium border border-gray-300 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 text-amber-500" />
                            Check Out
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-gray-400 dark:text-slate-500">Completed</span>
                        )}
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

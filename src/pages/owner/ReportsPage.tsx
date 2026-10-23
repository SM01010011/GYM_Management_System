import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Calendar, 
  Download, PieChart, Activity, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';

export const ReportsPage: React.FC = () => {
  const { members, memberships, payments, attendance, plans, stats } = useGym();
  const { addToast } = useToast();

  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y'>('30d');

  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  // Revenue by Payment Method
  const paymentByMethod: Record<string, number> = {};
  payments.filter(p => p.status === 'PAID').forEach(p => {
    paymentByMethod[p.paymentMethod] = (paymentByMethod[p.paymentMethod] || 0) + p.amount;
  });

  // Members by Plan
  const planDistribution: Record<string, { count: number; revenue: number }> = {};
  memberships.forEach(m => {
    if (!planDistribution[m.planName]) {
      planDistribution[m.planName] = { count: 0, revenue: 0 };
    }
    planDistribution[m.planName].count += 1;
    planDistribution[m.planName].revenue += m.price;
  });

  // Attendance by Gate
  const gateVisits: Record<string, number> = {};
  attendance.forEach(a => {
    const gate = a.gate || 'Gate 01 - Main';
    gateVisits[gate] = (gateVisits[gate] || 0) + 1;
  });

  const handleExportCSV = (reportName: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportName === 'Revenue') {
      csvContent += "Payment ID,Member Code,Amount,Method,Status,Date\n";
      payments.forEach(p => {
        csvContent += `${p.id},${p.memberCode || 'N/A'},${p.amount},${p.paymentMethod},${p.status},${p.paymentDate}\n`;
      });
    } else if (reportName === 'Attendance') {
      csvContent += "Record ID,Member Name,Gate,Check In,Check Out\n";
      attendance.forEach(a => {
        csvContent += `${a.id},${a.memberName},${a.gate},${a.checkIn},${a.checkOut || 'Active'}\n`;
      });
    } else {
      csvContent += "Member ID,Code,Name,Phone,Status,Join Date\n";
      members.forEach(m => {
        csvContent += `${m.id},${m.memberCode},${m.name},${m.phone},${m.status},${m.joinDate}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WarriorFitness_${reportName}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`${reportName} CSV ledger generated and downloaded.`, 'success');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bc0100]"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-bold">Business Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            Analytics & Executive Reports
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Real-time financial yield, member retention, churn vulnerability, and facility utilization.
          </p>
        </div>

        {/* Global Export Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV('Revenue')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#ebbbb4]/50 dark:border-slate-800 hover:border-emerald-500 text-[#2b1613] dark:text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Revenue CSV
          </button>
          <button
            onClick={() => handleExportCSV('Members')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#ebbbb4]/50 dark:border-slate-800 hover:border-blue-500 text-[#2b1613] dark:text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Members CSV
          </button>
          <button
            onClick={() => handleExportCSV('Attendance')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#ebbbb4]/50 dark:border-slate-800 hover:border-amber-500 text-[#2b1613] dark:text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Gate Traffic CSV
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors">
          <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-mono">
            <span>COLLECTED REVENUE</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-[#2b1613] dark:text-white">₹{totalRevenue.toLocaleString()}</span>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>₹{stats.todayRevenue.toLocaleString()} captured today</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors">
          <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-mono">
            <span>MEMBERSHIP RETENTION</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-[#2b1613] dark:text-white">
              {stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}%
            </span>
            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400 font-mono">
              {stats.activeMembers} active / {stats.totalMembers} total registered
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors">
          <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-mono">
            <span>AT RISK / EXPIRING</span>
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{stats.expiringSoon}</span>
            <div className="mt-1 text-xs text-amber-700 dark:text-amber-500/80 font-mono">
              Expiring within 7-day cycle
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors">
          <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs font-mono">
            <span>TURNSTILE ADMISSION</span>
            <Activity className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-[#2b1613] dark:text-white">{attendance.length}</span>
            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400 font-mono">
              Lifetime verified gate swipes
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: Plan Distribution & Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#2b1613] dark:text-white">Membership Tier Distribution</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Total enrollment and gross revenue by plan</p>
            </div>
            <PieChart className="w-5 h-5 text-gray-400 dark:text-slate-400" />
          </div>

          <div className="space-y-4">
            {Object.entries(planDistribution).map(([name, data]) => {
              const percentage = Math.round((data.count / (memberships.length || 1)) * 100);
              return (
                <div key={name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2b1613] dark:text-white">{name}</span>
                    <span className="font-mono text-gray-600 dark:text-slate-400">
                      {data.count} members ({percentage}%) • ₹{data.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#2b1613] dark:text-white">Payment Method Channels</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Gross funds collected by transaction medium</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400 dark:text-slate-400" />
          </div>

          <div className="space-y-4">
            {Object.entries(paymentByMethod).map(([method, amount]) => {
              const percentage = Math.round((amount / (totalRevenue || 1)) * 100);
              return (
                <div key={method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2b1613] dark:text-white font-mono">{method}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{amount.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gate Utilization Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl transition-colors">
        <h3 className="text-base font-bold text-[#2b1613] dark:text-white mb-1">Turnstile Lane Utilization</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Traffic distribution across physical optical gates</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(gateVisits).map(([gate, count]) => (
            <div key={gate} className="bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-xl p-4">
              <span className="text-xs font-mono text-gray-500 dark:text-slate-400 uppercase">{gate}</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-[#2b1613] dark:text-white">{count}</span>
                <span className="text-xs font-mono text-gray-400 dark:text-slate-500">entries</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

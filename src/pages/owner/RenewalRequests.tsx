import React, { useState } from 'react';
import { 
  Inbox, CheckCircle2, XCircle, Clock, Search, 
  Calendar, CreditCard, UserCheck, MessageSquare, AlertCircle 
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../components/common/Toast';
import { formatDisplayDate, formatDisplayTime, computeRenewalDates } from '../../utils/dateUtils';

export const RenewalRequests: React.FC = () => {
  const { 
    renewalRequests, 
    members, 
    plans, 
    memberships,
    processRenewalRequest
  } = useGym();
  const { addToast } = useToast();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredRequests = renewalRequests.filter(req => {
    if (filterStatus === 'ALL') return true;
    return req.status === filterStatus;
  }).map(req => {
    const member = members.find(m => m.id === req.memberId);
    const plan = plans.find(p => p.id === req.requestedPlanId);
    const currentMembership = memberships.find(m => m.id === req.membershipId);
    return {
      request: req,
      member,
      plan,
      currentMembership
    };
  });

  const handleApprove = (requestId: string, memberName: string, planName: string) => {
    processRenewalRequest(requestId, true);
    addToast(
      `Renewal Approved! ${memberName}'s validity extended for ${planName}.`,
      'success'
    );
  };

  const handleOpenReject = (requestId: string) => {
    setRejectingId(requestId);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingId) return;
    processRenewalRequest(rejectingId, false);
    addToast('Renewal request rejected.', 'info');
    setRejectingId(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-blue-600 dark:text-blue-400 font-bold">Inbound Queue</span>
          </div>
          <h1 className="text-3xl font-black text-[#2b1613] dark:text-white tracking-tight font-display">
            Customer Renewal Requests
          </h1>
          <p className="text-sm text-[#603e39] dark:text-slate-400 mt-1">
            Review membership extensions submitted directly from the Member Portal.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#bc0100] text-white font-bold'
                  : 'text-gray-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-12 text-center text-gray-400 dark:text-slate-500 shadow-sm">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40 text-gray-400 dark:text-slate-400" />
            <h3 className="text-[#2b1613] dark:text-white font-bold">No requests found</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">There are no renewal requests with status {filterStatus}.</p>
          </div>
        ) : (
          filteredRequests.map(({ request, member, plan, currentMembership }) => {
            if (!member) return null;

            return (
              <div
                key={request.id}
                className="bg-white dark:bg-slate-900 border border-[#ebbbb4]/40 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl hover:border-red-400 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Member & Request Details */}
                  <div className="flex items-start gap-4">
                    <img
                      src={member.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#ebbbb4]/50 dark:border-slate-700 mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[#2b1613] dark:text-white">{member.name}</h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                          {member.memberCode}
                        </span>
                        <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          request.status === 'PENDING'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            : request.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-gray-600 dark:text-slate-400 flex flex-wrap items-center gap-4">
                        <span>Requested Tier: <strong className="text-[#2b1613] dark:text-white">{request.requestedPlanName}</strong></span>
                        <span>•</span>
                        <span>Amount: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{request.requestedPlanPrice.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Submitted: <strong className="text-gray-800 dark:text-slate-300 font-mono">{formatDisplayDate(request.requestedAt)}</strong></span>
                      </div>

                      {request.notes && (
                        <div className="mt-3 bg-[#fff8f6] dark:bg-slate-950/60 border border-[#ebbbb4]/40 dark:border-slate-800/80 rounded-xl p-3 text-xs text-gray-700 dark:text-slate-300 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0 mt-0.5" />
                          <span>Member note: "{request.notes}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {request.status === 'PENDING' && (
                    <div className="flex items-center gap-3 lg:self-center shrink-0">
                      <button
                        onClick={() => handleOpenReject(request.id)}
                        className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 text-xs font-bold border border-gray-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprove(request.id, member.name, request.requestedPlanName)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Extend
                      </button>
                    </div>
                  )}

                  {request.status !== 'PENDING' && (
                    <div className="text-right text-xs text-gray-400 dark:text-slate-500 font-mono">
                      Processed by {request.processedBy || 'Admin'}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#ebbbb4] dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#2b1613] dark:text-white">Decline Renewal Request</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Provide a reason for turning down this request. The customer will see this in their portal.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Please visit front desk to verify payment receipt or select an alternative tier."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-[#fff8f6] dark:bg-slate-950 border border-[#ebbbb4] dark:border-slate-800 rounded-xl p-3 text-[#2b1613] dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-600"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

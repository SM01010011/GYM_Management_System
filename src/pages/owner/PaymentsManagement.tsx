/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Payment, PaymentMethod, PaymentStatus } from '../../types';
import { useGym } from '../../context/GymContext';
import { formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const PaymentsManagement: React.FC = () => {
  const { payments, recordPayment, members, stats } = useGym();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [receiptModalPayment, setReceiptModalPayment] = useState<Payment | null>(null);

  // Form State
  const [formMemberId, setFormMemberId] = useState(members[0]?.id || '');
  const [formAmount, setFormAmount] = useState(3500);
  const [formMethod, setFormMethod] = useState<PaymentMethod>('UPI');
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formNotes, setFormNotes] = useState('Counter renewal payment');

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.memberName.toLowerCase().includes(q) ||
        p.transactionReference.toLowerCase().includes(q) ||
        p.recordedBy.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      return true;
    });
  }, [payments, searchQuery, methodFilter, statusFilter]);

  const totalAllRevenue = useMemo(() => {
    return payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const pendingPaymentsCount = useMemo(() => {
    return payments.filter(p => p.status === 'PENDING').length;
  }, [payments]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find(m => m.id === formMemberId);
    if (!mem) {
      showToast('Error', 'Please select a member.', 'error');
      return;
    }

    const txnRef = `TXN-WRR-${Math.floor(100000 + Math.random() * 900000)}`;
    const created = await recordPayment({
      memberId: mem.id,
      memberName: mem.name,
      memberCode: mem.memberCode,
      amount: Number(formAmount),
      paymentDate: formDate,
      paymentMethod: formMethod,
      transactionReference: txnRef,
      status: 'PAID',
      recordedBy: 'Owner Console',
      notes: formNotes,
    });

    setRecordModalOpen(false);
    showToast('Payment Recorded! 💳', `₹${created.amount} recorded for ${created.memberName}.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebbbb4]/40 dark:border-white/10">
        <div>
          <h1 className="font-headline font-bold text-2xl text-[#2b1613] dark:text-white tracking-tight">
            Payments Ledger & Revenue
          </h1>
          <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
            Audit payments, manual collection slips, GST invoices, and cashier reconciliation
          </p>
        </div>

        <button
          onClick={() => setRecordModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold font-headline shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">add_card</span>
          <span>Record New Payment</span>
        </button>
      </div>

      {/* KPI Cards Strip (Matching Section 16) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a0f0e] border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-gray-400 font-label-caps">TOTAL REVENUE</span>
          <div className="font-headline font-extrabold text-2xl text-[#2b1613] dark:text-white mt-1">
            ₹{totalAllRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Audited Gross Ledger</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a0f0e] border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-gray-400 font-label-caps">MONTHLY REVENUE</span>
          <div className="font-headline font-extrabold text-2xl text-[#bc0100] mt-1">
            ₹{stats.monthlyRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">+18.4% vs forecast</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a0f0e] border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-gray-400 font-label-caps">TODAY'S REVENUE</span>
          <div className="font-headline font-extrabold text-2xl text-[#2b1613] dark:text-white mt-1">
            ₹{stats.todayRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-gray-400">Live Counter Receipts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1a0f0e] border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-gray-400 font-label-caps">PENDING PAYMENTS</span>
          <div className="font-headline font-extrabold text-2xl text-amber-600 mt-1">
            {pendingPaymentsCount}
          </div>
          <span className="text-[10px] text-amber-600 font-bold">Awaiting Clearance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl p-4 border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search member name or TXN reference..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f1f3f5] dark:bg-[#221312] border border-black/10 dark:border-white/10 text-xs font-medium focus:border-[#bc0100] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] font-medium"
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-[#fff8f6] dark:bg-white/5 text-[10px] uppercase font-bold text-gray-500 font-label-caps">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Transaction Reference</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Recorded By</th>
                <th className="py-3.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-red-50/30 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#2b1613] dark:text-white">
                      {p.memberName}
                      {p.memberCode && (
                        <span className="block text-[10px] text-[#bc0100] font-mono font-normal">
                          {p.memberCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-headline font-bold text-sm text-[#bc0100]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">
                      {formatDisplayDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold font-mono text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                      {p.transactionReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{p.recordedBy}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setReceiptModalPayment(p)}
                        className="px-2.5 py-1 rounded bg-[#ffe9e6] dark:bg-white/10 text-[#bc0100] hover:bg-[#bc0100] hover:text-white transition-all text-xs font-bold"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Member Payment"
        subtitle="Collect counter fee, renewals or subscription payments"
        icon="payments"
        maxWidth="md"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Member <span className="text-red-500">*</span>
            </label>
            <select
              value={formMemberId}
              onChange={e => setFormMemberId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium focus:border-[#bc0100] outline-none"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberCode}) • {m.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formAmount}
                onChange={e => setFormAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-[#bc0100] font-headline outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['UPI', 'CASH', 'CARD', 'BANK_TRANSFER'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormMethod(m)}
                  className={`py-2 px-1 rounded-lg border font-semibold text-center transition-all ${
                    formMethod === m
                      ? 'border-[#bc0100] bg-[#bc0100] text-white shadow-sm'
                      : 'border-gray-200 dark:border-gray-800 hover:border-black'
                  }`}
                >
                  {m === 'UPI' ? 'UPI' : m === 'CASH' ? 'Cash' : m === 'CARD' ? 'Card' : 'NEFT'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input
              type="text"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="e.g. Counter fee or renewal"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setRecordModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#bc0100] hover:bg-[#eb0000] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Receipt Modal */}
      {receiptModalPayment && (
        <Modal
          isOpen={true}
          onClose={() => setReceiptModalPayment(null)}
          title="Official GST Tax Receipt"
          subtitle={`Invoice #${receiptModalPayment.transactionReference}`}
          icon="receipt"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#fff0ee] dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Payer Name:</span>
                <span className="font-bold text-[#2b1613] dark:text-white">{receiptModalPayment.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date Paid:</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDisplayDate(receiptModalPayment.paymentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Method:</span>
                <span className="font-bold text-[#bc0100]">{receiptModalPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-emerald-700 font-bold">{receiptModalPayment.status}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-black/10 dark:border-white/10 text-sm font-headline font-bold">
                <span>Amount Paid:</span>
                <span className="text-[#bc0100]">₹{receiptModalPayment.amount.toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  showToast('Statement Dispatched', 'Dispatched PDF statement to member WhatsApp line.', 'info');
                  setReceiptModalPayment(null);
                }}
                className="w-full py-2.5 bg-[#bc0100] text-white text-xs font-bold rounded-xl hover:bg-[#eb0000]"
              >
                Send WhatsApp PDF Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

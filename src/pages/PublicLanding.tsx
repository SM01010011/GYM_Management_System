/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';
import { useToast } from '../components/common/Toast';
import confetti from 'canvas-confetti';

export const PublicLanding: React.FC = () => {
  const { setActiveView, switchRole } = useAuth();
  const {
    plans,
    recordPayment,
    assignMembership,
    members,
    addMember,
    memberships,
    payments,
    undoPayment,
    cancelMembership,
  } = useGym();
  const { showToast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    basePrice: number;
    planId: string;
    durationDays: number;
    description: string;
  } | null>(null);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('Rahul Sharma');
  const [checkoutPhone, setCheckoutPhone] = useState('+91 98200 44521');
  const [checkoutEmail, setCheckoutEmail] = useState('rahul.sharma@warrior.io');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'CASH'>('UPI');
  const [upiVpa, setUpiVpa] = useState('rahul@okaxis');
  const [paymentAgreed, setPaymentAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [receiptData, setReceiptData] = useState<any>(null);
  const [tourModalOpen, setTourModalOpen] = useState(false);

  const openEnrollment = (plan?: typeof plans[0]) => {
    if (!plan) return;
    setSelectedPlan({
      name: plan.name,
      basePrice: plan.price,
      planId: plan.id,
      durationDays: plan.durationDays,
      description: plan.description,
    });
    setPaymentAgreed(false);
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsProcessing(true);
    setProcessingStatus('Connecting to Banking Gateway & NPCI Node...');

    setTimeout(() => {
      setProcessingStatus('Validating Biometric Encryption Key WRR-9942...');
    }, 800);

    setTimeout(() => {
      setProcessingStatus('Actuating Optical Turnstile #04 Solenoid Provisioning...');
    }, 1600);

    setTimeout(async () => {
      try {
        setIsProcessing(false);
        setCheckoutModalOpen(false);

        // Check if member already exists, otherwise create in Supabase
        let member = members.find(m => m.email.toLowerCase() === checkoutEmail.toLowerCase());
        if (!member) {
          member = await addMember({
            memberCode: '',
            name: checkoutName,
            phone: checkoutPhone,
            email: checkoutEmail,
            joinDate: new Date().toISOString().slice(0, 10),
            status: 'ACTIVE',
          });
        }

        // Assign Membership
      const gst = Math.round(selectedPlan.basePrice * 0.18);
      const totalAmount = selectedPlan.basePrice + gst;
      const txnRef = `TXN-WRR-${Math.floor(1000000 + Math.random() * 9000000)}`;

      const { membership } = assignMembership({
        memberId: member.id,
        planId: selectedPlan.planId,
        startDate: new Date().toISOString().slice(0, 10),
        recordPaymentNow: true,
        paymentMethod: paymentMethod === 'NET_BANKING' ? 'BANK_TRANSFER' : paymentMethod,
      });

      // Confetti burst!
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (err) {
        console.error(err);
      }

      setReceiptData({
        txnId: txnRef,
        payer: checkoutName,
        phone: checkoutPhone,
        planId: selectedPlan.planId,
        planName: selectedPlan.name,
        amount: totalAmount,
        expiryDate: membership.expiryDate,
        method: paymentMethod,
        membershipId: membership.id,
      });

        showToast('Payment Successful & Pass Active!', `${selectedPlan.name} provisioned for ${checkoutName}.`, 'success');
      } catch (err: any) {
        setIsProcessing(false);
        showToast('Enrollment Failed', err?.message || 'Unable to complete enrollment.', 'error');
      }
    }, 2400);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* HERO SECTION */}
      <section className="relative bg-white dark:bg-[#150c0b] border-b border-slate-200 dark:border-white/10 overflow-hidden py-14 lg:py-24 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffe9e6] dark:bg-red-950/40 border border-[#ebbbb4]/60 dark:border-red-900/40 text-[#bc0100] text-xs font-bold font-label-caps">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span>24/7 BIOMETRIC RECOGNITION & KINETIC PERFORMANCE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-black text-[#2b1613] dark:text-white tracking-tight leading-tight uppercase">
              FORGE <span className="text-[#bc0100] underline decoration-[#eb0000] decoration-4">UNBREAKABLE</span> STRENGTH & MASTERY
            </h1>

            <p className="text-base sm:text-lg text-[#603e39] dark:text-gray-300 max-w-xl leading-relaxed">
              High-octane technical conditioning engineered with surgical precision. Synchronized RFID turnstile credentials, sub-zero cryotherapy recovery, and Olympic strength training.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('pricing-tiers');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-[#bc0100] hover:bg-[#eb0000] text-white font-headline text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-red-600/25 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>VIEW MEMBERSHIP PLANS</span>
                <span className="material-symbols-outlined text-lg">arrow_downward</span>
              </button>

              <button
                onClick={() => setTourModalOpen(true)}
                className="px-5 py-3.5 bg-white dark:bg-[#201211] text-[#2b1613] dark:text-white font-semibold text-xs sm:text-sm border border-[#ebbbb4]/60 dark:border-white/10 rounded-xl hover:border-[#bc0100] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[#bc0100] text-lg">play_circle</span>
                <span>Take Virtual 3D Tour</span>
              </button>
            </div>

            {/* Telemetry Stats Strip */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#ebbbb4]/30 dark:border-white/10 max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white">99.8%</div>
                <div className="text-[11px] font-bold text-[#603e39] dark:text-gray-400 uppercase mt-0.5">Turnstile Uptime</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-headline font-extrabold text-[#bc0100]">48ms</div>
                <div className="text-[11px] font-bold text-[#603e39] dark:text-gray-400 uppercase mt-0.5">RFID Latency</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white">24/7</div>
                <div className="text-[11px] font-bold text-[#603e39] dark:text-gray-400 uppercase mt-0.5">Downtown Lab</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl overflow-hidden border border-[#ebbbb4]/40 dark:border-white/10 shadow-2xl bg-white dark:bg-[#1a0f0e] relative group">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"
                alt="Warrior Fitness High Performance Floor"
                className="w-full h-80 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="p-5 bg-white/95 dark:bg-[#1a0f0e]/95 backdrop-blur border-t border-[#ebbbb4]/40 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    LIVE TELEMETRY
                  </span>
                  <div className="font-headline font-bold text-sm text-[#2b1613] dark:text-white mt-1">
                    Downtown Kinetic Hub • Floor 01
                  </div>
                  <div className="text-xs text-[#603e39] dark:text-gray-400">
                    Occupancy: 42 Athletes • Ambient O₂: 21.2%
                  </div>
                </div>
                <button
                  onClick={() => openEnrollment(plans[2] || plans[0])}
                  className="px-4 py-2 bg-[#bc0100] text-white text-xs font-bold rounded-lg hover:bg-[#eb0000] shadow transition-all"
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE DISCIPLINES */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8" id="programs">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#bc0100] tracking-widest uppercase font-label-caps">
            Precision Engineering
          </span>
          <h2 className="text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white mt-1">
            SIGNATURE TRAINING DISCIPLINES
          </h2>
          <p className="text-sm text-[#603e39] dark:text-gray-400 mt-2">
            Every movement protocol is calibrated against biomechanical benchmarks to guarantee peak neuromuscular adaptation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#1f1312] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 p-6 shadow-sm hover:border-[#bc0100] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#bc0100] mb-4">
                <span className="material-symbols-outlined text-2xl">fitness_center</span>
              </div>
              <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mb-2">
                Hypertrophy & Olympic Lifting
              </h3>
              <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                Barbell velocity tracking, CNS recovery, and progressive overload under national lifting champions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-[#bc0100]">
              <span>Coach Vikram Rajput</span>
              <span>14 Sessions/wk</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1f1312] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 p-6 shadow-sm hover:border-[#bc0100] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#bc0100] mb-4">
                <span className="material-symbols-outlined text-2xl">speed</span>
              </div>
              <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mb-2">
                Conditioning & Hyrox
              </h3>
              <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                Aerobic threshold build-outs, sled pushes, ski-erg pacing, and competition simulation trials.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-[#bc0100]">
              <span>Coach SM01010011</span>
              <span>Daily Slots</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1f1312] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 p-6 shadow-sm hover:border-[#bc0100] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#bc0100] mb-4">
                <span className="material-symbols-outlined text-2xl">sports_mma</span>
              </div>
              <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mb-2">
                Combat Striking & Boxing Lab
              </h3>
              <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                Heavy bag drills, head movement agility, footwork mechanics, and timed high-output punch combos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-[#bc0100]">
              <span>Coach Arjun Dev</span>
              <span>8 Sessions/wk</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1f1312] rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 p-6 shadow-sm hover:border-[#bc0100] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#ffe9e6] dark:bg-white/5 flex items-center justify-center text-[#0059ba] mb-4">
                <span className="material-symbols-outlined text-2xl">ac_unit</span>
              </div>
              <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mb-2">
                Recovery & Infrared Sauna
              </h3>
              <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                4°C Cold immersion pools, contrast therapy, Normatec compression sleeves, and myofascial release.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-emerald-600">
              <span>Therapy Staff</span>
              <span>All-Day Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & INSTANT ENROLLMENT SECTION */}
      <section className="bg-slate-50 dark:bg-[#1a0f0e] border-y border-slate-200 dark:border-white/10 py-16 px-4 lg:px-8" id="pricing-tiers">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#bc0100] tracking-widest uppercase font-label-caps">
              Transparent Pricing Engine
            </span>
            <h2 className="text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white mt-1">
              MEMBERSHIP TIERS & INSTANT ENROLLMENT
            </h2>
            <p className="text-sm text-[#603e39] dark:text-gray-400 mt-2">
              Select your plan to trigger our instant 256-bit encrypted checkout with UPI, Card, Net Banking, or Desk POS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.slice(0, 4).map(plan => {
              const isPopular = plan.isPopular || plan.id === 'plan-premium';

              // Check if plan has an active subscription for current member or current checkout payer
              const activeMembershipForPlan = memberships.find(m =>
                m.planId === plan.id &&
                (m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON') &&
                (m.memberId === 'mem-1042' || m.memberName.toLowerCase() === checkoutName.toLowerCase())
              );
              const isPlanLocked = Boolean(activeMembershipForPlan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
                    isPlanLocked
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500 shadow-sm relative'
                      : isPopular
                      ? 'bg-white dark:bg-[#201211] border-2 border-[#bc0100] shadow-xl relative'
                      : 'bg-white dark:bg-[#1c1110] border border-[#ebbbb4]/50 dark:border-white/10 shadow-sm hover:border-[#bc0100]'
                  }`}
                >
                  {isPlanLocked ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      <span>ACTIVE SUBSCRIBED</span>
                    </div>
                  ) : isPopular ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#bc0100] text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow">
                      MOST POPULAR
                    </div>
                  ) : null}

                  <div>
                    <span className="text-[10px] font-bold text-[#bc0100] uppercase tracking-wider">
                      {plan.tierBadge || 'WARRIOR PASS'}
                    </span>
                    <h3 className="font-headline font-bold text-lg text-[#2b1613] dark:text-white mt-1">
                      {plan.name}
                    </h3>

                    <div className="mt-4 mb-5">
                      <span className="text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#603e39] dark:text-gray-400 ml-1">
                        / {plan.durationDays} days
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-[#2b1613] dark:text-gray-300 mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isPlanLocked ? (
                    <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700 cursor-not-allowed flex items-center justify-center gap-1.5 shadow-inner"
                        title="Purchase button is locked because this subscription is active. Click below to undo payment and unlock."
                      >
                        <span className="material-symbols-outlined text-sm text-[#bc0100]">lock</span>
                        <span>PURCHASE BUTTON LOCKED</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!activeMembershipForPlan) return;
                          const payment = payments.find(p => p.membershipId === activeMembershipForPlan.id && p.status === 'PAID');
                          if (payment) {
                            undoPayment(payment.id);
                          } else {
                            cancelMembership(activeMembershipForPlan.id);
                          }
                          showToast('Payment Undone', `Payment for ${plan.name} has been reversed. The purchase button is now unlocked!`, 'info');
                        }}
                        className="w-full py-1.5 rounded-lg text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">undo</span>
                        <span>Undo Payment (Unlock Button)</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openEnrollment(plan)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isPopular
                          ? 'bg-[#bc0100] hover:bg-[#eb0000] text-white shadow-md active:scale-95'
                          : 'border border-[#bc0100] text-[#bc0100] hover:bg-[#bc0100] hover:text-white'
                      }`}
                    >
                      Select {plan.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COACH ROSTER */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8" id="coaches">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-[#bc0100] tracking-widest uppercase font-label-caps">
              Master Coaches
            </span>
            <h2 className="text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white mt-1">
              ATHLETIC LEADERSHIP
            </h2>
          </div>
          <p className="text-xs text-[#603e39] dark:text-gray-400 max-w-md">
            No influencers. Only credentialed exercise physiologists, national titleholders, and seasoned combat specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 bg-white dark:bg-[#1f1312] overflow-hidden shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=400"
              alt="Vikram Rajput"
              className="w-full h-64 object-cover"
            />
            <div className="p-5">
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-[#bc0100] text-[10px] font-bold">
                HEAD OF STRENGTH
              </span>
              <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mt-1">Vikram Rajput</h3>
              <p className="text-xs text-[#603e39] dark:text-gray-400 mt-1">
                CSCS • Olympic Lifting & Central Nervous System Recovery Specialist
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 bg-white dark:bg-[#1f1312] overflow-hidden shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400"
              alt="Sneha Rao"
              className="w-full h-64 object-cover"
            />
            <div className="p-5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                HYROX & MOBILITY LEAD
              </span>
              <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mt-1">Sneha Rao</h3>
              <p className="text-xs text-[#603e39] dark:text-gray-400 mt-1">
                M.Sc. Sports Science • FMS Level 2 • Metabolic Endurance Pacing
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ebbbb4]/40 dark:border-white/10 bg-white dark:bg-[#1f1312] overflow-hidden shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=400"
              alt="SM01010011"
              className="w-full h-64 object-cover"
            />
            <div className="p-5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                FOUNDER & COMBAT DIRECTOR
              </span>
              <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mt-1">SM01010011</h3>
              <p className="text-xs text-[#603e39] dark:text-gray-400 mt-1">
                Former Golden Gloves • Tactical Striking & Anaerobic Capacity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AMENITIES & RECOVERY LAB */}
      <section className="bg-slate-50 dark:bg-[#1a0f0e] border-y border-slate-200 dark:border-white/10 py-16 px-4 lg:px-8" id="telemetry">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#bc0100] tracking-widest uppercase font-label-caps">
              Next-Gen Infrastructure
            </span>
            <h2 className="text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white mt-1">
              HIGH-PERFORMANCE AMENITIES & RECOVERY LAB
            </h2>
            <p className="text-sm text-[#603e39] dark:text-gray-400 mt-2">
              Every square meter is purpose-built for physiological adaptation, immediate post-training cellular repair, and frictionless biometric access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#201211] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#bc0100] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">sensors</span>
                </div>
                <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mb-2">
                  Optical Turnstile & RFID Gates
                </h3>
                <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                  Sub-50ms solenoid release via encrypted dynamic RFID tokens and NFC smartphones. Instantaneous pass validation with zero waiting lines.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-emerald-600">
                <span>99.98% System Uptime</span>
                <span>24/7 Access</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#201211] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">ac_unit</span>
                </div>
                <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mb-2">
                  -110°C Cryotherapy & Ice Baths
                </h3>
                <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                  Whole-body nitrogen cryo pods and chilled contrast plunge pools to accelerate metabolic recovery, blunt soreness, and trigger endorphin release.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-blue-600">
                <span>Clinical Cold Protocol</span>
                <span>Session Included</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#201211] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">fitness_center</span>
                </div>
                <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white mb-2">
                  Eleiko Olympic Lifting Platforms
                </h3>
                <p className="text-xs text-[#603e39] dark:text-gray-400 leading-relaxed">
                  Competition-grade vibration-dampened oak platforms, calibrated steel discs, stainless bearing barbells, and digital barbell velocity tracking.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-amber-600">
                <span>IPF / IWF Standards</span>
                <span>12 Platforms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REGIONAL LOCATIONS */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8" id="locations">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#bc0100] tracking-widest uppercase font-label-caps">
            Flagship Network
          </span>
          <h2 className="text-3xl font-headline font-extrabold text-[#2b1613] dark:text-white mt-1">
            REGIONAL PERFORMANCE HUBS
          </h2>
          <p className="text-sm text-[#603e39] dark:text-gray-400 mt-2">
            One membership pass unlocks access to all facilities in the Warrior network with synchronized entry credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1f1312] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  FLAGSHIP • 24/7
                </span>
                <span className="text-xs font-mono text-slate-400">18,500 sq ft</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-[#2b1613] dark:text-white">
                Downtown Performance HQ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Plot 42, Financial District, Grand Central Blvd. Optical turnstile node #01 to #06.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm text-[#bc0100]">pin_drop</span>
                Downtown Hub
              </span>
              <span className="text-emerald-600 font-bold">All Gates Active</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1f1312] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                  TECH LAB • 05:00 - 23:30
                </span>
                <span className="text-xs font-mono text-slate-400">14,000 sq ft</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-[#2b1613] dark:text-white">
                Midtown Kinetic Lab
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Level 02, Tech Hub 07, Sector 18. Equipped with Hyrox sprint track and cold hydrotherapy.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm text-[#bc0100]">pin_drop</span>
                Midtown Lab
              </span>
              <span className="text-emerald-600 font-bold">All Gates Active</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1f1312] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                  COMBAT ARENA • 24/7
                </span>
                <span className="text-xs font-mono text-slate-400">12,500 sq ft</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-[#2b1613] dark:text-white">
                Cyber City Combat Suite
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tower B, Global Corporate Arcade. Boxing ring, heavy bag cage, and infrared recovery sauna.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm text-[#bc0100]">pin_drop</span>
                Cyber City Hub
              </span>
              <span className="text-emerald-600 font-bold">All Gates Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND FOOTER */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-16 px-4 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#bc0100] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-xl">fitness_center</span>
                </div>
                <div>
                  <div className="font-headline font-extrabold text-lg text-white tracking-tight leading-none">
                    <span>WARRIOR</span>
                    <span className="text-[#bc0100] italic ml-1">FITNESS</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5 font-mono">
                    High Performance Athletic Systems
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Elite conditioning ecosystem integrating calibrated Olympic lifting, metabolic pacing, cryotherapy restoration, and sub-50ms optical turnstile gate automation.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 font-bold">
                  SYSTEM ONLINE • ALL HUBS LIVE
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 font-mono">
                Explore Brand
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => { const el = document.getElementById('programs'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">
                    Training Programs
                  </button>
                </li>
                <li>
                  <button onClick={() => { const el = document.getElementById('pricing-tiers'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">
                    Membership Passes
                  </button>
                </li>
                <li>
                  <button onClick={() => { const el = document.getElementById('coaches'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">
                    Athletic Coaches
                  </button>
                </li>
                <li>
                  <button onClick={() => { const el = document.getElementById('telemetry'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">
                    Recovery Lab & Facilities
                  </button>
                </li>
                <li>
                  <button onClick={() => { const el = document.getElementById('locations'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">
                    Regional Hubs
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 font-mono">
                Portal Sign In
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorized staff operators, executive owners, and enrolled members can access their dedicated portals with account credentials.
              </p>
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-[#bc0100] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-[#bc0100] cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Member / Staff Sign In</span>
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Warrior Fitness Systems Pvt. Ltd. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>ISO 9001:2015 Certified Facilities</span>
              <span>256-bit SSL Security</span>
            </div>
          </div>
        </div>
      </footer>

      {/* CHECKOUT / PAYMENT GATEWAY MODAL */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-[#fff8f6] dark:bg-[#201211]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#bc0100] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">credit_card</span>
                </div>
                <div>
                  <h3 className="font-headline font-extrabold text-base text-[#2b1613] dark:text-white">
                    Warrior Secure Payment Gateway
                  </h3>
                  <p className="text-xs text-[#603e39] dark:text-gray-400">
                    256-Bit SSL Encrypted Instant Turnstile Provisioning
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-black dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Summary */}
              <div className="md:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-[#fff0ee] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5 text-xs font-bold">
                    <span className="text-[#bc0100] uppercase text-[10px]">SELECTED TIER</span>
                    <span className="text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded text-[10px]">
                      Instant QR Pass
                    </span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                      {selectedPlan.name}
                    </h4>
                    <p className="text-xs text-[#603e39] dark:text-gray-400 mt-0.5">
                      {selectedPlan.description}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-xs pt-2 border-t border-black/5 dark:border-white/5">
                    <div className="flex justify-between text-gray-500">
                      <span>Base Plan Price:</span>
                      <span className="font-bold text-[#2b1613] dark:text-white">
                        ₹{selectedPlan.basePrice.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Sports GST (18%):</span>
                      <span className="font-bold text-[#2b1613] dark:text-white">
                        ₹{Math.round(selectedPlan.basePrice * 0.18).toLocaleString('en-IN')}.00
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>RFID Activation Fee:</span>
                      <span className="font-bold text-emerald-600">WAIVED (₹0.00)</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[#2b1613] dark:text-white pt-2 border-t border-black/10 dark:border-white/10">
                      <span>Total Amount:</span>
                      <span className="text-[#bc0100] font-headline text-base">
                        ₹{Math.round(selectedPlan.basePrice * 1.18).toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* Athlete Credentials */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Athlete / Payer Info
                  </span>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={checkoutName}
                      onChange={e => setCheckoutName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">WhatsApp Mobile</label>
                    <input
                      type="tel"
                      value={checkoutPhone}
                      onChange={e => setCheckoutPhone(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={checkoutEmail}
                      onChange={e => setCheckoutEmail(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Methods */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 border border-black/5 dark:border-white/10 text-xs font-bold">
                  {(['UPI', 'CARD', 'NET_BANKING', 'CASH'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode)}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        paymentMethod === mode
                          ? 'bg-white dark:bg-[#2b1614] text-[#bc0100] shadow-sm'
                          : 'text-gray-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {mode === 'UPI' ? 'UPI' : mode === 'CARD' ? 'Card' : mode === 'NET_BANKING' ? 'Net Banking' : 'Desk Cash'}
                    </button>
                  ))}
                </div>

                {/* UPI Panel */}
                {paymentMethod === 'UPI' && (
                  <div className="p-4 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-white p-2 rounded-lg border border-black/10 flex flex-col items-center justify-center shrink-0">
                        <div className="grid grid-cols-4 gap-1 w-16 h-16">
                          <div className="bg-black rounded-xs"></div><div className="bg-black rounded-xs"></div><div className="bg-white"></div><div className="bg-black rounded-xs"></div>
                          <div className="bg-white"></div><div className="bg-[#bc0100] rounded-xs"></div><div className="bg-[#bc0100] rounded-xs"></div><div className="bg-white"></div>
                          <div className="bg-black rounded-xs"></div><div className="bg-[#bc0100] rounded-xs"></div><div className="bg-white"></div><div className="bg-black rounded-xs"></div>
                          <div className="bg-black rounded-xs"></div><div className="bg-white"></div><div className="bg-black rounded-xs"></div><div className="bg-black rounded-xs"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                          ZERO CONVENIENCE FEE
                        </span>
                        <div className="font-bold text-xs text-[#2b1613] dark:text-white">
                          Scan with Google Pay, PhonePe or Paytm
                        </div>
                        <div className="text-[11px] text-[#603e39] dark:text-gray-400">
                          Instant clearance & mobile turnstile pass issuance.
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Or enter UPI VPA / Handle
                      </label>
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={e => setUpiVpa(e.target.value)}
                        placeholder="username@okaxis"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Card Panel */}
                {paymentMethod === 'CARD' && (
                  <div className="p-4 rounded-xl bg-[#fff8f6] dark:bg-white/5 border border-[#ebbbb4]/40 dark:border-white/10 space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                      <input
                        type="text"
                        defaultValue="4532 8821 9920 4018"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          defaultValue="08/28"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">CVV</label>
                        <input
                          type="password"
                          defaultValue="882"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201211] font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {paymentMethod === 'NET_BANKING' && (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'].map((bank, i) => (
                      <button
                        key={bank}
                        type="button"
                        className={`p-3 rounded-xl border font-bold ${
                          i === 0
                            ? 'border-[#bc0100] text-[#bc0100] bg-red-50 dark:bg-red-950/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-black'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                )}

                {/* Desk Cash */}
                {paymentMethod === 'CASH' && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold">Desk Cash Collection Option</p>
                    <p className="mt-1 text-[11px]">
                      Collect cash at the Downtown front desk terminal. Staff will mark payment paid and issue your RFID pass token immediately.
                    </p>
                  </div>
                )}

                {/* Processing State */}
                {isProcessing ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-[#bc0100] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="text-xs font-bold text-[#bc0100] animate-pulse">
                      {processingStatus}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {/* Payment Authorization Checkbox */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/10 dark:border-white/10 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={paymentAgreed}
                        onChange={e => setPaymentAgreed(e.target.checked)}
                        className="mt-0.5 rounded text-[#bc0100] focus:ring-[#bc0100] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[11px] text-[#603e39] dark:text-gray-300 leading-snug">
                        I authorize instantaneous charge of <strong className="text-[#bc0100]">₹{Math.round(selectedPlan.basePrice * 1.18).toLocaleString('en-IN')}.00</strong> and activation of digital turnstile RFID pass.
                      </span>
                    </label>

                    {/* Purchase Button: LOCKED until payment details and agreement are confirmed */}
                    <button
                      type="button"
                      disabled={!checkoutName.trim() || !checkoutPhone.trim() || !checkoutEmail.trim() || (paymentMethod === 'UPI' && !upiVpa.trim()) || !paymentAgreed || isProcessing}
                      onClick={handleCheckoutSubmit}
                      className={`w-full py-3.5 font-headline text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        checkoutName.trim() && checkoutPhone.trim() && checkoutEmail.trim() && (paymentMethod !== 'UPI' || upiVpa.trim()) && paymentAgreed && !isProcessing
                          ? 'bg-[#bc0100] hover:bg-[#eb0000] text-white shadow-lg shadow-red-600/30 active:scale-98 cursor-pointer'
                          : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {checkoutName.trim() && checkoutPhone.trim() && checkoutEmail.trim() && paymentAgreed ? 'verified_user' : 'lock'}
                      </span>
                      <span>
                        {checkoutName.trim() && checkoutPhone.trim() && checkoutEmail.trim() && paymentAgreed
                          ? `PAY ₹${Math.round(selectedPlan.basePrice * 1.18).toLocaleString('en-IN')} & ACTIVATE PASS`
                          : 'PURCHASE BUTTON LOCKED (Authorize Payment Above)'}
                      </span>
                    </button>

                    {!paymentAgreed && (
                      <p className="text-[10px] text-center text-gray-500">
                        🔒 Purchase button is locked until required credentials and payment authorization are checked.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST-PAYMENT RECEIPT MODAL */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl border-2 border-emerald-500 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-emerald-600 text-white p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <h3 className="font-headline font-extrabold text-lg">Payment Confirmed & Pass Active!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Turnstile #04 Access Granted</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#fff0ee] dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-gray-500">
                  <span>TRANSACTION ID</span>
                  <span className="font-bold text-[#2b1613] dark:text-white">{receiptData.txnId}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>MEMBER NAME</span>
                  <span className="font-bold text-[#2b1613] dark:text-white">{receiptData.payer}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>PLAN ACTIVATED</span>
                  <span className="font-bold text-[#bc0100]">{receiptData.planName}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>VALID UNTIL</span>
                  <span className="font-bold text-emerald-600">{receiptData.expiryDate}</span>
                </div>
                <div className="flex justify-between text-gray-500 pt-2 border-t border-black/10 dark:border-white/10 font-bold text-sm">
                  <span>TOTAL PAID</span>
                  <span className="text-[#bc0100] font-headline">₹{receiptData.amount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5 text-amber-600">lock</span>
                <div>
                  <span className="font-bold">Subscription Active & Locked:</span> The purchase button for {receiptData.planName} is now locked so duplicate payments cannot occur, until payment is undone.
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {/* 1. Go to Login Button */}
                <button
                  type="button"
                  onClick={() => {
                    setReceiptData(null);
                    setActiveView('login');
                  }}
                  className="w-full py-3 bg-[#bc0100] text-white font-bold text-xs rounded-xl hover:bg-[#eb0000] shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>Go to Login</span>
                </button>

                {/* 2. Return to Home Button */}
                <button
                  type="button"
                  onClick={() => {
                    setReceiptData(null);
                    setActiveView('public');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 bg-white dark:bg-[#251514] border border-[#ebbbb4]/60 dark:border-white/15 text-[#2b1613] dark:text-white font-bold text-xs rounded-xl hover:border-[#bc0100] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base text-[#bc0100]">home</span>
                  <span>Return to Home</span>
                </button>

                {/* 3. Open Customer Digital Pass */}
                <button
                  type="button"
                  onClick={() => {
                    setReceiptData(null);
                    switchRole('CUSTOMER');
                    setActiveView('customer');
                  }}
                  className="w-full py-2.5 bg-[#fff0ee] dark:bg-white/10 text-[#bc0100] dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-100 dark:hover:bg-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>Open Customer Digital Pass</span>
                </button>

                {/* 4. Undo Payment & Unlock Plan */}
                <button
                  type="button"
                  onClick={() => {
                    undoPayment(receiptData.txnId);
                    setReceiptData(null);
                    showToast('Payment Undone', `Payment for ${receiptData.planName} has been reversed. The purchase button is now unlocked!`, 'info');
                  }}
                  className="w-full py-2 text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">undo</span>
                  <span>Undo Payment (Unlock Purchase Button)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D VIRTUAL TOUR MODAL */}
      {tourModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a0f0e] rounded-2xl max-w-2xl w-full p-6 border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-base text-[#2b1613] dark:text-white">
                  3D Virtual Tour • Downtown Performance Lab
                </h3>
                <p className="text-xs text-gray-500">Live 360° walkthrough of all 4 pods</p>
              </div>
              <button
                onClick={() => setTourModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative">
              <img
                src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800"
                alt="Gym 3D Walkthrough"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#bc0100] text-white flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-3xl">360</span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded text-white text-[10px] font-mono">
                POD 01: Olympic Power Cages • Live Turnstile Node
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-gray-500">Use mouse or touch to pan 360°</span>
              <button
                onClick={() => {
                  setTourModalOpen(false);
                  openEnrollment(plans[0]);
                }}
                className="text-[#bc0100] font-bold hover:underline"
              >
                Claim Pass Instead →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

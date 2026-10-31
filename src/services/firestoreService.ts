/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Member,
  Membership,
  MembershipPlan,
  Payment,
  Attendance,
  RenewalRequest,
  GymSettings
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_MEMBERSHIPS,
  INITIAL_PLANS,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_RENEWAL_REQUESTS,
  INITIAL_SETTINGS
} from './seedData';

const COLLECTIONS = {
  MEMBERS: 'members',
  MEMBERSHIPS: 'memberships',
  PLANS: 'membershipPlans',
  PAYMENTS: 'payments',
  ATTENDANCE: 'attendance',
  RENEWALS: 'renewalRequests',
  SETTINGS: 'gymSettings',
};

export class FirestoreGymService {
  /**
   * Seed Firestore collections if they are empty (Owner authenticated only)
   */
  public async initializeFirestoreSeed(): Promise<void> {
    if (!auth.currentUser) {
      return;
    }

    try {
      const plansSnap = await getDocs(collection(db, COLLECTIONS.PLANS));
      if (plansSnap.empty) {
        console.log('Seeding initial plans to Cloud Firestore...');
        for (const plan of INITIAL_PLANS) {
          await setDoc(doc(db, COLLECTIONS.PLANS, plan.id), plan);
        }
      }
    } catch (err) {
      console.warn('Firestore initial plans check/seed notice:', err);
    }

    try {
      const membersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));
      if (membersSnap.empty) {
        console.log('Seeding initial members and records to Cloud Firestore...');
        for (const member of INITIAL_MEMBERS) {
          await setDoc(doc(db, COLLECTIONS.MEMBERS, member.id), member);
        }
        for (const mship of INITIAL_MEMBERSHIPS) {
          await setDoc(doc(db, COLLECTIONS.MEMBERSHIPS, mship.id), mship);
        }
        for (const pay of INITIAL_PAYMENTS) {
          await setDoc(doc(db, COLLECTIONS.PAYMENTS, pay.id), pay);
        }
        for (const att of INITIAL_ATTENDANCE) {
          await setDoc(doc(db, COLLECTIONS.ATTENDANCE, att.id), att);
        }
        for (const ren of INITIAL_RENEWAL_REQUESTS) {
          await setDoc(doc(db, COLLECTIONS.RENEWALS, ren.id), ren);
        }
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default'), INITIAL_SETTINGS);
      }
    } catch (err) {
      console.warn('Firestore initial members check/seed notice:', err);
    }
  }

  // ---------------- SUBSCRIPTIONS ----------------

  public subscribeToPlans(callback: (plans: MembershipPlan[]) => void): Unsubscribe {
    const path = COLLECTIONS.PLANS;
    return onSnapshot(
      collection(db, path),
      snapshot => {
        const plans: MembershipPlan[] = [];
        snapshot.forEach(docSnap => {
          plans.push(docSnap.data() as MembershipPlan);
        });
        if (plans.length > 0) {
          callback(plans);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  public subscribeToMembers(callback: (members: Member[]) => void): Unsubscribe {
    const path = COLLECTIONS.MEMBERS;
    return onSnapshot(
      collection(db, path),
      snapshot => {
        const members: Member[] = [];
        snapshot.forEach(docSnap => {
          members.push(docSnap.data() as Member);
        });
        if (members.length > 0) {
          callback(members);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  public subscribeToMemberships(callback: (memberships: Membership[]) => void): Unsubscribe {
    const path = COLLECTIONS.MEMBERSHIPS;
    return onSnapshot(
      collection(db, path),
      snapshot => {
        const list: Membership[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Membership);
        });
        if (list.length > 0) {
          callback(list);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  public subscribeToPayments(callback: (payments: Payment[]) => void): Unsubscribe {
    const path = COLLECTIONS.PAYMENTS;
    return onSnapshot(
      collection(db, path),
      snapshot => {
        const list: Payment[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Payment);
        });
        if (list.length > 0) {
          callback(list);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  public subscribeToAttendance(callback: (attendance: Attendance[]) => void): Unsubscribe {
    const path = COLLECTIONS.ATTENDANCE;
    return onSnapshot(
      collection(db, path),
      snapshot => {
        const list: Attendance[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Attendance);
        });
        if (list.length > 0) {
          callback(list);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  public subscribeToRenewals(callback: (renewals: RenewalRequest[]) => void): Unsubscribe {
    const path = COLLECTIONS.RENEWALS;
    return onSnapshot(
      collection(db, path),
      snapshot => {
        const list: RenewalRequest[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as RenewalRequest);
        });
        if (list.length > 0) {
          callback(list);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  public subscribeToSettings(callback: (settings: GymSettings) => void): Unsubscribe {
    const path = COLLECTIONS.SETTINGS;
    return onSnapshot(
      doc(db, path, 'default'),
      docSnap => {
        if (docSnap.exists()) {
          callback(docSnap.data() as GymSettings);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, `${path}/default`);
      }
    );
  }

  // ---------------- WRITES ----------------

  public async saveMember(member: Member): Promise<void> {
    const path = `${COLLECTIONS.MEMBERS}/${member.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.MEMBERS, member.id), member);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async saveMembership(membership: Membership): Promise<void> {
    const path = `${COLLECTIONS.MEMBERSHIPS}/${membership.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.MEMBERSHIPS, membership.id), membership);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async savePayment(payment: Payment): Promise<void> {
    const path = `${COLLECTIONS.PAYMENTS}/${payment.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.PAYMENTS, payment.id), payment);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async saveAttendance(attendance: Attendance): Promise<void> {
    const path = `${COLLECTIONS.ATTENDANCE}/${attendance.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.ATTENDANCE, attendance.id), attendance);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async saveRenewalRequest(renewal: RenewalRequest): Promise<void> {
    const path = `${COLLECTIONS.RENEWALS}/${renewal.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.RENEWALS, renewal.id), renewal);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async savePlan(plan: MembershipPlan): Promise<void> {
    const path = `${COLLECTIONS.PLANS}/${plan.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.PLANS, plan.id), plan);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async saveSettings(settings: GymSettings): Promise<void> {
    const path = `${COLLECTIONS.SETTINGS}/default`;
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default'), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteMember(id: string): Promise<void> {
    const path = `${COLLECTIONS.MEMBERS}/${id}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.MEMBERS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async deletePlan(id: string): Promise<void> {
    const path = `${COLLECTIONS.PLANS}/${id}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PLANS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export const firestoreGym = new FirestoreGymService();

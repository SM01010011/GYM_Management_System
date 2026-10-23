/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MembershipStatus } from '../types';

/**
 * Returns today's date in local YYYY-MM-DD format, avoiding timezone drift.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD into a localized Date with time set to midnight 00:00:00.
 */
export function parseDateAtMidnight(dateString: string): Date {
  if (!dateString) return new Date();
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const d = new Date(dateString);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculates the number of calendar days between today and the expiry date.
 * If expiry date is in the future: returns positive integer.
 * If expiry date is today: returns 0.
 * If expiry date is in the past: returns negative integer.
 */
export function getDaysRemaining(expiryDateString: string): number {
  const today = parseDateAtMidnight(getTodayDateString());
  const expiry = parseDateAtMidnight(expiryDateString);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes membership status strictly from the expiry date according to gym rules:
 * - Before today (< 0 days): EXPIRED
 * - Today or within the next 7 days (0 <= days <= 7): EXPIRING_SOON
 * - More than 7 days away (> 7): ACTIVE
 */
export function calculateMembershipStatus(expiryDateString: string, currentStatus?: MembershipStatus): MembershipStatus {
  if (currentStatus === 'CANCELLED') return 'CANCELLED';
  const days = getDaysRemaining(expiryDateString);
  if (days < 0) {
    return 'EXPIRED';
  } else if (days <= 7) {
    return 'EXPIRING_SOON';
  } else {
    return 'ACTIVE';
  }
}

/**
 * Adds a specific number of days to a base date string (YYYY-MM-DD).
 * Handles leap years and month boundaries accurately.
 */
export function addDaysToDate(baseDateString: string, daysToAdd: number): string {
  const baseDate = parseDateAtMidnight(baseDateString);
  baseDate.setDate(baseDate.getDate() + daysToAdd);
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes renewal dates based on current membership status:
 * - If currently ACTIVE or EXPIRING_SOON (not yet expired):
 *   new startDate remains the current startDate, or new renewal period starts after current expiry.
 *   new expiry extends from CURRENT EXPIRY DATE.
 * - If currently EXPIRED:
 *   starts from TODAY, and new expiry = today + durationDays.
 */
export function computeRenewalDates(
  currentExpiryDate: string,
  durationDays: number
): { startDate: string; newExpiryDate: string; wasActive: boolean } {
  const daysRemaining = getDaysRemaining(currentExpiryDate);
  const todayStr = getTodayDateString();

  if (daysRemaining >= 0) {
    // Current membership is still active or expiring soon
    // New expiry extends from the current expiry date
    const newExpiry = addDaysToDate(currentExpiryDate, durationDays);
    return {
      startDate: currentExpiryDate,
      newExpiryDate: newExpiry,
      wasActive: true,
    };
  } else {
    // Already expired - starts from today
    const newExpiry = addDaysToDate(todayStr, durationDays);
    return {
      startDate: todayStr,
      newExpiryDate: newExpiry,
      wasActive: false,
    };
  }
}

/**
 * Formats YYYY-MM-DD into readable human format: e.g. "22 Oct 2026"
 */
export function formatDisplayDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = parseDateAtMidnight(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats timestamp into readable time: e.g. "10:42 AM" or "Today at 07:15 AM"
 */
export function formatDisplayTime(isoString: string | undefined): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Format relative time (e.g. "12m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(isoString: string | undefined): string {
  if (!isoString) return '';
  try {
    const now = new Date();
    const d = new Date(isoString);
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDisplayDate(isoString.slice(0, 10));
  } catch {
    return isoString;
  }
}

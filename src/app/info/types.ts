export interface UserInfo {
  patronLevel: number;
  tierName: string;
  /** Advertised monthly call allowance, or null for admin accounts. */
  monthlyLimit: number | null;
  remainingCalls: number | null;
  usedCalls: number | null;
  /** Advertised next reset as an ISO timestamp (00:00 UTC on the first of the month). */
  resetAt: string;
  /** CBB and CFB share one monthly allowance. */
  sharedPool: boolean;
  products: string[];
}

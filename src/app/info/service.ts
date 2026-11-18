import { ApiUser } from '../../globals';
import { UserInfo } from './types';

type ApiTier = {
  name: string;
  monthlyLimit: number;
};

const freeTier: ApiTier = { name: 'Free', monthlyLimit: 1000 };
const academicTier: ApiTier = { name: 'Academic', monthlyLimit: 3000 };

// Keep the advertised policy aligned with CFB's /info. The benefits-reset job
// applies the actual allocation, which is reflected in the shared balance.
const paidTiers: Record<number, ApiTier> = {
  1: { name: 'Tier 1', monthlyLimit: 5000 },
  2: { name: 'Tier 2', monthlyLimit: 30000 },
  3: { name: 'Tier 3', monthlyLimit: 75000 },
  4: { name: 'Tier 4', monthlyLimit: 125000 },
  5: { name: 'Tier 5', monthlyLimit: 200000 },
  6: { name: 'Tier 6', monthlyLimit: 500000 },
};

const getTier = (user: ApiUser): ApiTier => {
  if (user.patronLevel > 0) {
    return (
      paidTiers[user.patronLevel] ?? {
        name: `Tier ${user.patronLevel}`,
        monthlyLimit: paidTiers[6].monthlyLimit,
      }
    );
  }

  const domain = user.username.trim().toLowerCase().split('@')[1];
  return domain?.endsWith('.edu') ? academicTier : freeTier;
};

export const getUserInfo = (user: ApiUser, now = new Date()): UserInfo => {
  const shared = {
    patronLevel: user.patronLevel,
    resetAt: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    ).toISOString(),
    sharedPool: true,
    products: ['cfb', 'cbb'],
  };

  if (user.isAdmin) {
    return {
      ...shared,
      tierName: 'Admin',
      monthlyLimit: null,
      remainingCalls: null,
      usedCalls: null,
    };
  }

  const tier = getTier(user);
  return {
    ...shared,
    tierName: tier.name,
    monthlyLimit: tier.monthlyLimit,
    remainingCalls: user.remainingCalls,
    usedCalls: Math.max(tier.monthlyLimit - user.remainingCalls, 0),
  };
};

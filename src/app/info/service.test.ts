import { ApiUser } from '../../globals';
import { getUserInfo } from './service';

const user: ApiUser = {
  id: 1,
  username: 'test@example.com',
  patronLevel: 0,
  remainingCalls: 400,
  isAdmin: false,
};

const november = new Date('2026-11-17T12:00:00Z');

test('reports the advertised free allowance and actual shared balance', () => {
  expect(getUserInfo(user, november)).toEqual({
    patronLevel: 0,
    tierName: 'Free',
    monthlyLimit: 1000,
    remainingCalls: 400,
    usedCalls: 600,
    resetAt: '2026-12-01T00:00:00.000Z',
    sharedPool: true,
    products: ['cfb', 'cbb'],
  });
});

test('advertises the academic tier for an education email', () => {
  expect(
    getUserInfo({ ...user, username: ' Test@Example.EDU ' }),
  ).toMatchObject({
    tierName: 'Academic',
    monthlyLimit: 3000,
    usedCalls: 2600,
  });
});

test.each([
  [1, 5000],
  [2, 30000],
  [3, 75000],
  [4, 125000],
  [5, 200000],
  [6, 500000],
  [7, 500000],
])('advertises the allowance for tier %i', (patronLevel, monthlyLimit) => {
  const info = getUserInfo({
    ...user,
    patronLevel,
    username: 'test@example.edu',
  });
  expect(info).toMatchObject({
    patronLevel,
    tierName: `Tier ${patronLevel}`,
    monthlyLimit,
    remainingCalls: 400,
    usedCalls: monthlyLimit - 400,
  });
});

test('reports null counts for admins and handles the year boundary', () => {
  expect(
    getUserInfo({ ...user, isAdmin: true }, new Date('2026-12-31T23:59:59Z')),
  ).toMatchObject({
    tierName: 'Admin',
    monthlyLimit: null,
    remainingCalls: null,
    usedCalls: null,
    resetAt: '2027-01-01T00:00:00.000Z',
  });
});

test('preserves a balance above the advertised limit and clamps used calls', () => {
  expect(getUserInfo({ ...user, remainingCalls: 1500 })).toMatchObject({
    monthlyLimit: 1000,
    remainingCalls: 1500,
    usedCalls: 0,
  });
});

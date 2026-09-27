import { getMockReq } from '@jest-mock/express';
import type { Request } from 'express';

import { expressAuthentication } from './auth';
import { ApiUser, AuthorizationError } from '../globals';

const mockSelectUserExecuteTakeFirst = jest.fn();
const mockInsertMetricsExecute = jest.fn();
const mockIsDeniedCfbWebsitePrincipal = jest.fn((userId: number) => {
  void userId;
  return false;
});

jest.mock('./database', () => ({
  authDb: {
    selectFrom: jest.fn(() => ({
      where: jest.fn(() => ({
        selectAll: jest.fn(() => ({
          executeTakeFirst: mockSelectUserExecuteTakeFirst,
        })),
      })),
    })),
    insertInto: jest.fn(() => ({
      values: jest.fn(() => ({
        execute: mockInsertMetricsExecute,
      })),
    })),
  },
}));

jest.mock('./cfbServicePrincipals', () => ({
  ...jest.requireActual('./cfbServicePrincipals'),
  isDeniedCfbWebsitePrincipal: (userId: number) =>
    mockIsDeniedCfbWebsitePrincipal(userId),
}));

const mockDatabaseUser = {
  id: 123,
  username: 'test@example.com',
  patronLevel: 0,
  blacklisted: false,
  throttled: false,
  remainingCalls: 1000,
  isAdmin: false,
};

const toRequest = (request: ReturnType<typeof getMockReq>) =>
  request as unknown as Request;

describe('generic auth tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectUserExecuteTakeFirst.mockResolvedValue(mockDatabaseUser);
    mockInsertMetricsExecute.mockResolvedValue(undefined);
    mockIsDeniedCfbWebsitePrincipal.mockReturnValue(false);
  });

  test('non api key auth type', async () => {
    const request = getMockReq();

    await expect(
      expressAuthentication(toRequest(request), 'notApiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  test('missing bearer prefix', async () => {
    const request = getMockReq({
      headers: {
        authorization: 'my_api_key',
      },
    });

    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  test('unknown api key', async () => {
    mockSelectUserExecuteTakeFirst.mockResolvedValueOnce(null);

    const request = getMockReq({
      headers: {
        authorization: 'Bearer my_api_key',
      },
    });

    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  test('blacklisted user', async () => {
    mockSelectUserExecuteTakeFirst.mockResolvedValueOnce({
      ...mockDatabaseUser,
      blacklisted: true,
    });

    const request = getMockReq({
      headers: {
        authorization: 'Bearer my_api_key',
      },
    });

    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  test('CFB website service users are denied before metrics', async () => {
    mockIsDeniedCfbWebsitePrincipal.mockReturnValueOnce(true);
    const request = getMockReq({
      headers: {
        authorization: 'Bearer cfb-service-key',
      },
    });

    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(mockIsDeniedCfbWebsitePrincipal).toHaveBeenCalledWith(123);
    expect(mockInsertMetricsExecute).not.toHaveBeenCalled();
  });

  test('Patreon user can access scoreboard', async () => {
    mockSelectUserExecuteTakeFirst.mockResolvedValueOnce({
      ...mockDatabaseUser,
      patronLevel: 1,
    });

    const request = getMockReq({
      path: '/scoreboard',
      headers: {
        authorization: 'Bearer my_api_key',
      },
    });

    const user = await expressAuthentication(toRequest(request), 'apiKey');

    expect(user as ApiUser).toBeDefined();
  });

  test('Tier 2 Patreon user can access premium leaderboard', async () => {
    mockSelectUserExecuteTakeFirst.mockResolvedValueOnce({
      ...mockDatabaseUser,
      patronLevel: 2,
    });

    const request = getMockReq({
      path: '/stats/team/leaderboard',
      headers: {
        authorization: 'Bearer my_api_key',
      },
    });

    const user = await expressAuthentication(toRequest(request), 'apiKey');

    expect(user as ApiUser).toBeDefined();
  });
});

describe('untrusted request identity', () => {
  test.each([
    'origin',
    'host',
    'referer',
    'x-forwarded-for',
    'cf-connecting-ip',
  ])('rejects forged %s even in development', async (header) => {
    process.env.NODE_ENV = 'development';
    const request = getMockReq({
      headers: { [header]: 'https://collegebasketballdata.com' },
    });
    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
  test.each([
    'Bearer ',
    'bearer abc',
    'Bearer a b',
    'prefix Bearer abc',
    'Bearer abc\n',
  ])('rejects malformed bearer %s', async (authorization) => {
    await expect(
      expressAuthentication(
        toRequest(getMockReq({ headers: { authorization } })),
        'apiKey',
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});

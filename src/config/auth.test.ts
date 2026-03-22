import { getMockReq } from '@jest-mock/express';

import { expressAuthentication, patreonLocked } from './auth';
import { ApiUser, AuthorizationError } from '../globals';

const mockSelectUserExecuteTakeFirst = jest.fn();
const mockInsertMetricsExecute = jest.fn();

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

const mockDatabaseUser = {
  id: 123,
  username: 'test@example.com',
  patronLevel: 0,
  blacklisted: false,
  throttled: false,
  remainingCalls: 1000,
  isAdmin: false,
};

const toRequest = (request: ReturnType<typeof getMockReq>) => request as any;

describe('generic auth tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectUserExecuteTakeFirst.mockResolvedValue(mockDatabaseUser);
    mockInsertMetricsExecute.mockResolvedValue(undefined);
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

  test('non-Patreon user cannot access scoreboard', async () => {
    mockSelectUserExecuteTakeFirst.mockResolvedValueOnce({
      ...mockDatabaseUser,
      patronLevel: 0,
    });

    const request = getMockReq({
      path: '/scoreboard',
      headers: {
        authorization: 'Bearer my_api_key',
      },
    });

    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
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

  test('Tier 1 Patreon user cannot access premium leaderboard', async () => {
    mockSelectUserExecuteTakeFirst.mockResolvedValueOnce({
      ...mockDatabaseUser,
      patronLevel: 1,
    });

    const request = getMockReq({
      path: '/stats/team/leaderboard',
      headers: {
        authorization: 'Bearer my_api_key',
      },
    });

    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
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

describe('CORS auth tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectUserExecuteTakeFirst.mockResolvedValue(mockDatabaseUser);
    mockInsertMetricsExecute.mockResolvedValue(undefined);
  });

  test('cors allowed for domain origin', async () => {
    const request = getMockReq({
      headers: {
        origin: 'https://collegebasketballdata.com',
      },
    });

    (request as any).get = (header: string) =>
      header === 'origin' ? 'https://collegebasketballdata.com' : '';

    const user = await expressAuthentication(toRequest(request), 'apiKey');

    expect(user).toEqual(null);
  });

  test('cors allowed for domain host', async () => {
    const request = getMockReq({
      headers: {
        host: 'https://collegebasketballdata.com',
      },
    });

    (request as any).get = (header: string) =>
      header === 'host' ? 'https://collegebasketballdata.com' : '';

    const user = await expressAuthentication(toRequest(request), 'apiKey');

    expect(user).toEqual(null);
  });

  test('cors behavior for other domain respects NODE_ENV bypass', async () => {
    const request = getMockReq({
      headers: {
        host: 'https://example.com',
        origin: 'https://example.com',
      },
    });

    (request as any).get = (header: string) =>
      header === 'host' || header === 'origin' ? 'https://example.com' : '';

    if (process.env.NODE_ENV === 'development') {
      const user = await expressAuthentication(toRequest(request), 'apiKey');
      expect(user).toEqual(null);
      return;
    }

    await expect(
      expressAuthentication(toRequest(request), 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  test.each(Object.keys(patreonLocked))(
    'cors not allowed for Patreon locked endpoint %s',
    async (path) => {
      const request = getMockReq({ path });

      await expect(
        expressAuthentication(toRequest(request), 'apiKey'),
      ).rejects.toBeInstanceOf(AuthorizationError);
    },
  );
});

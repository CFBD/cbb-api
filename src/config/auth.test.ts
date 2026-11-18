import { getMockReq } from '@jest-mock/express';
import { EventEmitter } from 'node:events';

import { expressAuthentication } from './auth';
import { ApiUser, AuthorizationError } from '../globals';
import type { QuotaRequest } from './middleware/quotas';

const mockSelectUserExecuteTakeFirst = jest.fn();
const mockInsertMetricsExecute = jest.fn();
const mockMetricsValues = jest.fn(() => ({
  execute: mockInsertMetricsExecute,
}));
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
      values: mockMetricsValues,
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

const toRequest = (
  request: ReturnType<typeof getMockReq>,
  res = new EventEmitter(),
) => Object.assign(request, { res }) as unknown as QuotaRequest;

const metricsRequest = () => {
  const res = Object.assign(new EventEmitter(), {
    statusCode: 200,
    writableFinished: false,
  });
  const request = getMockReq({
    headers: { authorization: 'Bearer my_api_key' },
    path: '/teams/42',
    route: { path: '/teams/:id' },
    query: { season: '2026' },
    get: jest.fn().mockReturnValue('test-client'),
  });
  return { res, request: toRequest(request, res) };
};

beforeEach(() => {
  mockSelectUserExecuteTakeFirst
    .mockReset()
    .mockResolvedValue(mockDatabaseUser);
  mockInsertMetricsExecute.mockReset().mockResolvedValue(undefined);
  mockIsDeniedCfbWebsitePrincipal.mockReset().mockReturnValue(false);
});

describe('generic auth tests', () => {
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
    const { request, res } = metricsRequest();

    await expect(
      expressAuthentication(request, 'apiKey'),
    ).rejects.toBeInstanceOf(AuthorizationError);
    res.emit('close');
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

describe('request metrics', () => {
  afterEach(() => jest.restoreAllMocks());

  test('writes once after close with the final status and measured duration', async () => {
    const { request, res } = metricsRequest();
    const now = jest.spyOn(performance, 'now').mockReturnValue(100);

    await expressAuthentication(request, 'apiKey');
    expect(mockInsertMetricsExecute).not.toHaveBeenCalled();

    res.statusCode = 400;
    res.writableFinished = true;
    now.mockReturnValue(125.7);
    res.emit('close');
    res.emit('close');

    expect(mockInsertMetricsExecute).toHaveBeenCalledTimes(1);
    expect(mockMetricsValues).toHaveBeenCalledWith({
      userId: 123,
      endpoint: '/teams/:id',
      query: { season: '2026' },
      userAgent: 'test-client',
      apiVersion: 'cbb',
      statusCode: 400,
      durationMs: 26,
    });
  });

  test('records an unfinished response after authentication as 499', async () => {
    const { request, res } = metricsRequest();
    await expressAuthentication(request, 'apiKey');
    res.emit('close');

    expect(mockMetricsValues).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 499 }),
    );
  });

  test.each([mockDatabaseUser, null])(
    'waits for the lookup after an early disconnect (lookup returns %p)',
    async (user) => {
      let completeLookup!: (value: typeof user) => void;
      mockSelectUserExecuteTakeFirst.mockReturnValueOnce(
        new Promise((resolve) => {
          completeLookup = resolve;
        }),
      );
      const now = jest.spyOn(performance, 'now').mockReturnValue(100);
      const { request, res } = metricsRequest();
      const authenticated = expressAuthentication(request, 'apiKey');

      now.mockReturnValue(110);
      res.emit('close');
      expect(mockInsertMetricsExecute).not.toHaveBeenCalled();

      now.mockReturnValue(200);
      completeLookup(user);
      if (user) {
        await authenticated;
        expect(mockInsertMetricsExecute).toHaveBeenCalledTimes(1);
        expect(mockMetricsValues).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 499, durationMs: 10 }),
        );
      } else {
        await expect(authenticated).rejects.toBeInstanceOf(AuthorizationError);
        expect(mockInsertMetricsExecute).not.toHaveBeenCalled();
      }
    },
  );

  test('skips the insert when the quota refusal is known at close', async () => {
    const { request, res } = metricsRequest();
    await expressAuthentication(request, 'apiKey');
    request.quotaRefused = true;
    res.statusCode = 429;
    res.writableFinished = true;
    res.emit('close');

    expect(mockInsertMetricsExecute).not.toHaveBeenCalled();
  });

  test('logs a failed insert without affecting the response', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockInsertMetricsExecute.mockRejectedValueOnce(new Error('write failed'));
    const { request, res } = metricsRequest();
    await expressAuthentication(request, 'apiKey');
    res.writableFinished = true;
    res.emit('close');
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith('API metrics write failed.');
    expect(res.statusCode).toBe(200);
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

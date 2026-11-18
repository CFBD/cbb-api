import express from 'express';
import type { Server } from 'http';
import { AddressInfo } from 'net';
const mockUser = jest.fn();
const mockMetrics = jest.fn().mockResolvedValue(undefined);
const mockReserve = jest.fn().mockResolvedValue({ remainingCalls: 9 });
const mockRefund = jest.fn().mockResolvedValue({ remainingCalls: 10 });
jest.mock('./database', () => ({
  authDb: {
    selectFrom: () => ({
      where: () => ({ selectAll: () => ({ executeTakeFirst: mockUser }) }),
    }),
    insertInto: () => ({
      values: (row: unknown) => ({ execute: () => mockMetrics(row) }),
    }),
    updateTable: () => ({
      set: () => ({
        where: () => ({
          where: () => ({
            returning: () => ({ executeTakeFirst: mockReserve }),
          }),
          returning: () => ({ executeTakeFirstOrThrow: mockRefund }),
        }),
      }),
    }),
  },
  db: {},
}));
jest.mock('./servicePrincipals', () => {
  const actual = jest.requireActual('./servicePrincipals');
  return {
    ...actual,
    classifyPrincipal: (id: number) =>
      actual.classifyPrincipal(id, { websitePage: 101, websiteExporter: 102 }),
  };
});
jest.mock('./cfbServicePrincipals', () => ({
  isDeniedCfbWebsitePrincipal: (id: number) => [201, 202].includes(id),
}));
jest.mock('../app/games/service', () => ({
  getScoreboard: jest.fn().mockResolvedValue([]),
}));
jest.mock('../app/lineups/service', () => ({
  getLineupStatsByTeam: jest.fn(),
}));
jest.mock('../app/stats/service', () => ({
  getTeamLeaderboardStats: jest.fn().mockResolvedValue([]),
}));
jest.mock('../app/auth/service', () => ({
  generateApiKey: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../app/teams/service', () => ({
  getTeams: jest.fn().mockResolvedValue([]),
}));
jest.mock('../app/teams/seasonOverview', () => ({
  getTeamSeasonOverview: jest
    .fn()
    .mockResolvedValue({ teamId: 72, season: 2026 }),
}));
jest.mock('../app/teams/directory', () => ({
  ...jest.requireActual('../app/teams/directory'),
  getTeamDirectory: jest
    .fn()
    .mockResolvedValue({ season: 2026, teams: [], conferences: [] }),
}));
import { RegisterRoutes } from '../../build/routes';
import { updateQuotas } from './middleware/quotas';
import errorHandler from './errors';
import * as stats from '../app/stats/service';
import { getScoreboard } from '../app/games/service';
import { getLineupStatsByTeam } from '../app/lineups/service';
import { TeamProfileError } from '../app/teams/directory';
import { getTeamSeasonOverview } from '../app/teams/seasonOverview';
import { getTeams } from '../app/teams/service';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

let server: Server;
let base: string;
let nextRequestId = 0;
const responseCloses = new Map<string, () => void>();

const startRequest = (path: string, options?: RequestInit) => {
  const requestId = String(++nextRequestId);
  const close = deferred<void>();
  responseCloses.set(requestId, close.resolve);
  const headers = new Headers(options?.headers);
  headers.set('x-test-request-id', requestId);
  const response = fetch(base + path, { ...options, headers });
  return { response, closed: close.promise };
};

const requestAfterClose = async (path: string, options?: RequestInit) => {
  const { response, closed } = startRequest(path, options);
  const result = await response;
  await closed;
  return result;
};

beforeAll((done) => {
  const app = express();
  app.use((req, res, next) => {
    const requestId = req.get('x-test-request-id');
    if (requestId) {
      const onClose = responseCloses.get(requestId);
      responseCloses.delete(requestId);
      if (onClose) res.once('close', onClose);
    }
    next();
  });
  app.use(express.json());
  app.use(updateQuotas);
  RegisterRoutes(app);
  app.use(errorHandler as express.ErrorRequestHandler);
  server = app.listen(0, '127.0.0.1', () => {
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    done();
  });
});
afterAll((done) => {
  server.close(done);
});
beforeEach(() => {
  jest.clearAllMocks();
  mockReserve.mockResolvedValue({ remainingCalls: 9 });
  mockRefund.mockResolvedValue({ remainingCalls: 10 });
});
const paths = [
  '/scoreboard',
  '/ScoreBoard',
  '/scoreboard/',
  '/ScoreBoard/',
  '/stats/team/leaderboard',
  '/Stats/Team/LeaderBoard',
  '/stats/team/leaderboard/',
  '/Stats/Team/LeaderBoard/',
];
test.each(paths)('handler guard applies to %s', async (path) => {
  const leaderboard = path.toLowerCase().includes('leaderboard');
  for (const [id, tier, admin] of [
    [1, 0, false],
    [1, 1, false],
    [1, 2, false],
    [1, 3, false],
    [1, 0, true],
    [101, 0, false],
    [102, 0, false],
  ]) {
    jest.clearAllMocks();
    mockUser.mockResolvedValue({
      id,
      patronLevel: tier,
      isAdmin: admin,
      remainingCalls: 10,
    });
    const response = await requestAfterClose(path + '?season=2026', {
      headers: { authorization: 'Bearer test' },
    });
    const allowed =
      id === 101
        ? leaderboard
        : id === 102
          ? false
          : Number(tier) >= (leaderboard ? 2 : 1);
    expect(response.status).toBe(allowed ? 200 : 401);
    expect(
      leaderboard ? stats.getTeamLeaderboardStats : getScoreboard,
    ).toHaveBeenCalledTimes(allowed ? 1 : 0);
    if (id === 102 || (id === 101 && !leaderboard)) {
      expect(mockMetrics).not.toHaveBeenCalled();
      expect(mockReserve).not.toHaveBeenCalled();
    }
    if (leaderboard && id === 1 && Number(tier) < 2 && !admin)
      expect(mockRefund).toHaveBeenCalledTimes(1);
    if (!leaderboard || id === 101) expect(mockReserve).not.toHaveBeenCalled();
  }
});
test('foreign identities stop before successful metrics and quota', async () => {
  for (const id of [201, 202]) {
    mockUser.mockResolvedValue({ id, patronLevel: 2, remainingCalls: 10 });
    expect(
      (
        await requestAfterClose('/scoreboard', {
          headers: { authorization: 'Bearer foreign' },
        })
      ).status,
    ).toBe(401);
  }
  expect(mockMetrics).not.toHaveBeenCalled();
  expect(mockReserve).not.toHaveBeenCalled();
  expect(getScoreboard).not.toHaveBeenCalled();
});
test('forged headers cannot dispatch data, but enrollment remains anonymous', async () => {
  expect(
    (
      await fetch(base + '/scoreboard', {
        headers: {
          origin: 'https://collegebasketballdata.com',
          host: 'collegebasketballdata.com',
        },
      })
    ).status,
  ).toBe(401);
  expect(getScoreboard).not.toHaveBeenCalled();
  expect(
    (
      await fetch(base + '/auth/key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
    ).status,
  ).toBe(200);
});

test('misconfigured privileged or restricted service accounts fail closed', async () => {
  for (const patch of [
    { isAdmin: true },
    { patronLevel: 2 },
    { throttled: true },
  ]) {
    mockUser.mockResolvedValue({
      id: 101,
      patronLevel: 0,
      isAdmin: false,
      remainingCalls: 10,
      ...patch,
    });
    expect(
      (
        await requestAfterClose('/stats/team/leaderboard?season=2026', {
          headers: { authorization: 'Bearer service' },
        })
      ).status,
    ).toBe(401);
  }
  expect(mockMetrics).not.toHaveBeenCalled();
  expect(mockReserve).not.toHaveBeenCalled();
  expect(stats.getTeamLeaderboardStats).not.toHaveBeenCalled();
});

test('website headers cannot authenticate public GETs or alternate route spellings', async () => {
  const origin = process.env.CORS_ORIGIN || 'https://collegebasketballdata.com';
  const rejectedHeaders: Record<string, string>[] = [
    {},
    { origin },
    { origin: 'https://unrelated.example' },
    { host: 'collegebasketballdata.com' },
    {
      origin,
      host: 'collegebasketballdata.com',
      referer: origin,
      'x-forwarded-for': '192.0.2.1',
      'cf-connecting-ip': '192.0.2.2',
    },
    { origin, authorization: 'malformed' },
  ];
  for (const path of ['/teams', '/Teams/']) {
    for (const headers of rejectedHeaders) {
      expect((await fetch(base + path, { headers })).status).toBe(401);
    }
  }
  expect(
    (await fetch(base + '/teams', { method: 'HEAD', headers: { origin } }))
      .status,
  ).toBe(401);
  for (const path of paths) {
    expect(
      (await fetch(base + path + '?season=2026', { headers: { origin } }))
        .status,
    ).toBe(401);
  }
  expect(getTeams).not.toHaveBeenCalled();
  expect(getScoreboard).not.toHaveBeenCalled();
  expect(stats.getTeamLeaderboardStats).not.toHaveBeenCalled();
  expect(mockUser).not.toHaveBeenCalled();
  expect(mockMetrics).not.toHaveBeenCalled();
  expect(mockReserve).not.toHaveBeenCalled();
});

test.each(['/teams/directory?season=2026', '/teams/72/season/2026/overview'])(
  'new page operation preserves service boundaries: %s',
  async (path) => {
    for (const [id, allowed] of [
      [101, true],
      [102, false],
      [201, false],
      [202, false],
      [1, true],
    ] as const) {
      jest.clearAllMocks();
      mockUser.mockResolvedValue({ id, patronLevel: 0, remainingCalls: 10 });
      const response = await fetch(base + path, {
        headers: { authorization: 'Bearer test' },
      });
      expect(response.status).toBe(allowed ? 200 : 401);
      if (id !== 1) expect(mockReserve).not.toHaveBeenCalled();
    }
  },
);

const individual = {
  id: 1,
  username: 'test@example.com',
  patronLevel: 0,
  isAdmin: false,
  remainingCalls: 10,
};
const authorized = { headers: { authorization: 'Bearer test' } };
const lineupsPath = '/lineups/team?season=2026&team=Duke';

test('an exhausted individual can check their balance while metrics are still writing', async () => {
  const insert = deferred<void>();
  mockMetrics.mockReturnValueOnce(insert.promise);
  mockUser.mockResolvedValue({ ...individual, remainingCalls: 0 });

  try {
    const response = await requestAfterClose('/info', authorized);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-CallLimit-Remaining')).toBe('0');
    await expect(response.json()).resolves.toMatchObject({
      tierName: 'Free',
      monthlyLimit: 1000,
      remainingCalls: 0,
      usedCalls: 1000,
      sharedPool: true,
      products: ['cfb', 'cbb'],
    });
    expect(mockUser).toHaveBeenCalledTimes(1);
    expect(mockReserve).not.toHaveBeenCalled();
    expect(mockRefund).not.toHaveBeenCalled();
    expect(mockMetrics).toHaveBeenCalledTimes(1);
    expect(mockMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/info',
        statusCode: 200,
        durationMs: expect.any(Number),
      }),
    );
  } finally {
    insert.resolve();
  }
});

test.each([
  ['website page', 101],
  ['website exporter', 102],
  ['missing key', undefined],
] as const)(
  '/info rejects %s before quota or metrics',
  async (_description, id) => {
    mockUser.mockResolvedValue({ ...individual, id });
    const response = await requestAfterClose(
      '/info',
      id ? authorized : undefined,
    );

    expect(response.status).toBe(401);
    expect(mockReserve).not.toHaveBeenCalled();
    expect(mockRefund).not.toHaveBeenCalled();
    expect(mockMetrics).not.toHaveBeenCalled();
  },
);

test.each([true, false])(
  'applies quota before the in-flight limit (exhausted: %s)',
  async (exhausted) => {
    let remainingCalls = exhausted ? 2 : 10;
    mockUser.mockImplementation(async () => ({
      ...individual,
      remainingCalls,
    }));
    mockReserve.mockImplementation(async () => ({
      remainingCalls: --remainingCalls,
    }));
    mockRefund.mockImplementation(async () => ({
      remainingCalls: ++remainingCalls,
    }));

    const lineups = jest.mocked(getLineupStatsByTeam);
    const bothInFlight = deferred<void>();
    const release = deferred<[]>();
    const holdHandler = () => {
      if (lineups.mock.calls.length === 2) bothInFlight.resolve();
      return release.promise;
    };
    lineups
      .mockImplementationOnce(holdHandler)
      .mockImplementationOnce(holdHandler);
    const inFlight = [
      requestAfterClose(lineupsPath, authorized),
      requestAfterClose(lineupsPath, authorized),
    ];

    try {
      await Promise.race([
        bothInFlight.promise,
        ...inFlight.map((pending) =>
          pending.then((response) => {
            throw new Error(
              `Expected a held lineup response, received ${response.status}`,
            );
          }),
        ),
      ]);
      const response = await requestAfterClose(lineupsPath, authorized);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe(exhausted ? null : '1');
      expect(response.headers.get('X-CallLimit-Remaining')).toBe(
        exhausted ? '0' : '8',
      );
      await expect(response.json()).resolves.toEqual({
        message: exhausted
          ? 'Monthly call quota exceeded.'
          : 'Too many concurrent requests for this endpoint.',
      });
      expect(lineups).toHaveBeenCalledTimes(2);
      expect(mockReserve).toHaveBeenCalledTimes(exhausted ? 2 : 3);
      expect(mockRefund).toHaveBeenCalledTimes(exhausted ? 0 : 1);
      expect(remainingCalls).toBe(exhausted ? 0 : 8);
      expect(mockMetrics).toHaveBeenCalledTimes(exhausted ? 0 : 1);
      if (!exhausted) {
        expect(mockMetrics).toHaveBeenCalledWith(
          expect.objectContaining({
            endpoint: '/lineups/team',
            statusCode: 429,
          }),
        );
      }
    } finally {
      release.resolve([]);
      await Promise.allSettled(inFlight);
    }
  },
);

test('skips metrics when the guarded decrement loses the last call', async () => {
  mockUser.mockResolvedValue({ ...individual, remainingCalls: 1 });
  mockReserve.mockResolvedValueOnce(undefined);

  const response = await requestAfterClose(lineupsPath, authorized);
  expect(response.status).toBe(429);
  await expect(response.json()).resolves.toEqual({
    message: 'Monthly call quota exceeded.',
  });
  expect(mockReserve).toHaveBeenCalledTimes(1);
  expect(mockMetrics).not.toHaveBeenCalled();
  expect(getLineupStatsByTeam).not.toHaveBeenCalled();
});

test('records a disconnect before the pending quota decision as 499', async () => {
  const reserveStarted = deferred<void>();
  const reservation = deferred<undefined>();
  mockUser.mockResolvedValue({ ...individual, remainingCalls: 1 });
  mockReserve.mockImplementationOnce(() => {
    reserveStarted.resolve();
    return reservation.promise;
  });
  const abort = new AbortController();
  const { response, closed } = startRequest(lineupsPath, {
    ...authorized,
    signal: abort.signal,
  });

  try {
    await Promise.race([
      reserveStarted.promise,
      response.then((result) => {
        throw new Error(
          `Expected a pending quota decision, received ${result.status}`,
        );
      }),
    ]);
    abort.abort();
    await expect(response).rejects.toMatchObject({ name: 'AbortError' });
    await closed;
    expect(mockMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: '/lineups/team', statusCode: 499 }),
    );
  } finally {
    abort.abort();
    reservation.resolve(undefined);
    await reservation.promise;
  }
  expect(mockMetrics).toHaveBeenCalledTimes(1);
  expect(getLineupStatsByTeam).not.toHaveBeenCalled();
});

test.each([
  [400, '/lineups/team?season=invalid&team=Duke', '/lineups/team'],
  [401, '/scoreboard', '/scoreboard'],
  [
    404,
    '/teams/999/season/2026/overview',
    '/teams/:teamId/season/:season/overview',
  ],
  [500, '/teams', '/teams'],
  [503, lineupsPath, '/lineups/team'],
] as const)(
  'records the delivered status %i for an authenticated request',
  async (statusCode, path, endpoint) => {
    mockUser.mockResolvedValue(individual);
    if (statusCode === 404) {
      jest
        .mocked(getTeamSeasonOverview)
        .mockRejectedValueOnce(new TeamProfileError(404, 'Team not found.'));
    }
    if (statusCode === 500)
      jest.mocked(getTeams).mockRejectedValueOnce(new Error('test failure'));
    if (statusCode === 503)
      mockReserve.mockRejectedValueOnce(new Error('test failure'));

    const response = await requestAfterClose(path, authorized);
    expect(response.status).toBe(statusCode);
    expect(mockMetrics).toHaveBeenCalledTimes(1);
    expect(mockMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint, statusCode }),
    );
  },
);

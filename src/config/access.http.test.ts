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
    insertInto: () => ({ values: () => ({ execute: mockMetrics }) }),
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
jest.mock('../app/stats/service', () => ({
  getTeamLeaderboardStats: jest.fn().mockResolvedValue([]),
}));
jest.mock('../app/auth/service', () => ({
  generateApiKey: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../app/teams/service', () => ({
  getTeams: jest.fn().mockResolvedValue([]),
}));
import { RegisterRoutes } from '../../build/routes';
import { updateQuotas } from './middleware/quotas';
import errorHandler from './errors';
import * as stats from '../app/stats/service';
import { getScoreboard } from '../app/games/service';
import { getTeams } from '../app/teams/service';
let server: Server;
let base: string;
beforeAll((done) => {
  const app = express();
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
beforeEach(() => jest.clearAllMocks());
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
    const response = await fetch(base + path + '?season=2026', {
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
        await fetch(base + '/scoreboard', {
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
        await fetch(base + '/stats/team/leaderboard?season=2026', {
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

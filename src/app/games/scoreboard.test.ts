import {
  getScoreboard,
  mapScoreboardGame,
  ScoreboardRedis,
} from './scoreboard';
import type { Selectable } from 'kysely';
import type { Scoreboard } from '../../config/types/db';
jest.mock('../../config/database', () => ({ db: {} }));
const row = {
  tv: null,
  venue: null,
  city: null,
  state: null,
  currentPeriod: null,
  homeLocation: null,
  awayLocation: null,
  homeConference: null,
  awayConference: null,
  id: 42,
  startDate: new Date('2026-09-27T12:00:00Z'),
  homeId: 1,
  awayId: 2,
  homeConferenceAbbreviation: 'ACC',
  awayConferenceAbbreviation: 'SEC',
  homeLineScores: [20, 30],
  awayLineScores: null,
  homePoints: 50,
  awayPoints: null,
  spread: '0',
  overUnder: '140.5',
  moneylineHome: '-110',
  moneylineAway: null,
  currentClock: '05:04',
  startTimeTbd: false,
} as unknown as Selectable<Scoreboard>;
const redisFixture = () => {
  const values = new Map<string, string>();
  const redis: ScoreboardRedis = {
    get: jest.fn(async (key) => values.get(key) ?? null),
    set: jest.fn(async (key, value, options) => {
      if (options.NX && values.has(key)) return null;
      values.set(key, value);
      return 'OK';
    }),
    eval: jest.fn(async (_script, { keys, arguments: args }) => {
      if (values.get(keys[0]) === args[0]) values.delete(keys[0]);
      return 1;
    }),
  };
  return { redis, values };
};
test('caches a canonical snapshot, preserves CBB fields and filters without a second query', async () => {
  const { redis, values } = redisFixture();
  const queryAll = jest.fn().mockResolvedValue([row]);
  const queryFiltered = jest.fn();
  const result = await getScoreboard('acc', { redis, queryAll, queryFiltered });
  expect(result[0]).toMatchObject({
    startTimeTbd: false,
    clock: '05:04',
    betting: {
      spread: 0,
      overUnder: 140.5,
      homeMoneyline: -110,
      awayMoneyline: null,
    },
    homeTeam: { lineScores: [20, 30] },
  });
  expect(
    await getScoreboard('SEC', { redis, queryAll, queryFiltered }),
  ).toEqual(result);
  expect(
    await getScoreboard('B1G', { redis, queryAll, queryFiltered }),
  ).toEqual([]);
  expect(queryAll).toHaveBeenCalledTimes(1);
  expect(queryFiltered).not.toHaveBeenCalled();
  const payload = values.get('cbb-api:v1:scoreboard:snapshot')!;
  expect(JSON.parse(payload).games[0].startDate).toBe(
    '2026-09-27T12:00:00.000Z',
  );
  const separate = redisFixture();
  separate.values.set('cbb-api:v1:scoreboard:snapshot', payload);
  expect(
    JSON.stringify(
      await getScoreboard(undefined, {
        redis: separate.redis,
        queryAll,
        queryFiltered,
      }),
    ),
  ).toBe(JSON.stringify(result));
  expect(redis.set).toHaveBeenCalledWith(
    'cbb-api:v1:scoreboard:snapshot',
    expect.any(String),
    { EX: 60 },
  );
  expect(redis.eval).toHaveBeenCalledWith(
    expect.stringContaining('ARGV[1]'),
    expect.objectContaining({ keys: ['cbb-api:v1:scoreboard:refresh-lock'] }),
  );
});
test('simultaneous misses perform one refresh and followers reuse it', async () => {
  const { redis } = redisFixture();
  const queryAll = jest.fn().mockResolvedValue([row]);
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      getScoreboard(undefined, { redis, queryAll }),
    ),
  );
  expect(queryAll).toHaveBeenCalledTimes(1);
  expect(results.every((r) => r.length === 1)).toBe(true);
});
test.each([
  'garbage',
  '{"version":2,"games":[]}',
  '{"version":1,"games":[{}]}',
])('refreshes corrupt snapshots %s', async (value) => {
  const { redis, values } = redisFixture();
  values.set('cbb-api:v1:scoreboard:snapshot', value);
  const queryAll = jest.fn().mockResolvedValue([]);
  expect(await getScoreboard(undefined, { redis, queryAll })).toEqual([]);
  expect(queryAll).toHaveBeenCalledTimes(1);
});
test('Redis errors and follower expiry use filtered DB fallback; DB failure is never cached', async () => {
  const { redis, values } = redisFixture();
  const queryFiltered = jest.fn().mockResolvedValue([row]);
  (redis.get as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  expect(await getScoreboard('ACC', { redis, queryFiltered })).toEqual([
    mapScoreboardGame(row),
  ]);
  expect(queryFiltered).toHaveBeenCalledWith('ACC');
  values.set('cbb-api:v1:scoreboard:refresh-lock', 'other-owner');
  let time = Date.now();
  await getScoreboard('SEC', {
    redis,
    queryFiltered,
    now: () => new Date(time),
    sleep: async (ms) => {
      time += ms;
    },
  });
  expect(queryFiltered).toHaveBeenCalledWith('SEC');
  expect(redis.eval).not.toHaveBeenCalled();
  await expect(
    getScoreboard(undefined, {
      redis: null,
      queryFiltered: async () => {
        throw new Error('DB failed');
      },
    }),
  ).rejects.toThrow('DB failed');
});

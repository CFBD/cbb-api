import { randomUUID } from 'crypto';
import { Selectable } from 'kysely';
import { db } from '../../config/database';
import { getRedisClient } from '../../config/redis';
import { Scoreboard as ScoreboardRow } from '../../config/types/db';
import { GameStatus } from '../enums';
import { ScoreboardGame } from './types';

const SNAPSHOT_KEY = 'cbb-api:v1:scoreboard:snapshot';
const LOCK_KEY = 'cbb-api:v1:scoreboard:refresh-lock';
const SNAPSHOT_TTL_SECONDS = 60;
const LOCK_TTL_MS = 30_000;
const FOLLOWER_WAIT_MS = 5_000;
const FOLLOWER_POLL_MS = 50;
const LOCAL_SNAPSHOT_TTL_MS = 1000;

export interface ScoreboardSnapshotV1 {
  version: 1;
  generatedAt: string;
  games: ScoreboardGame[];
}

export interface ScoreboardRedis {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options: { EX?: number; PX?: number; NX?: boolean },
  ): Promise<string | null>;
  eval(
    script: string,
    options: { keys: string[]; arguments: string[] },
  ): Promise<unknown>;
}

interface ScoreboardDependencies {
  redis?: ScoreboardRedis | null;
  queryAll?: () => Promise<Selectable<ScoreboardRow>[]>;
  queryFiltered?: (conference?: string) => Promise<Selectable<ScoreboardRow>[]>;
  now?: () => Date;
  sleep?: (milliseconds: number) => Promise<void>;
}

const logCache = (
  outcome:
    | 'hit'
    | 'miss'
    | 'refresh_success'
    | 'refresh_failure'
    | 'lock_wait'
    | 'db_fallback',
  gameCount?: number,
): void => {
  console.info(
    JSON.stringify({
      event: 'scoreboard_cache',
      outcome,
      ...(gameCount === undefined ? {} : { gameCount }),
    }),
  );
};

export const mapScoreboardGame = (
  game: Selectable<ScoreboardRow>,
): ScoreboardGame => ({
  id: game.id ?? -1,
  startDate: game.startDate ?? new Date(0),
  startTimeTbd: game.startTimeTbd ?? false,
  tv: game.tv,
  neutralSite: game.neutralSite ?? false,
  conferenceGame: game.conferenceGame ?? false,
  status: (game.status ?? GameStatus.Scheduled) as GameStatus,
  period: game.currentPeriod,
  clock: game.currentClock,
  venue: game.venue,
  city: game.city,
  state: game.state,
  homeTeam: {
    id: game.homeId ?? -1,
    name: game.homeTeam ?? '',
    location: game.homeLocation,
    conference: game.homeConference,
    conferenceAbbreviation: game.homeConferenceAbbreviation,
    points: game.homePoints,
    lineScores: game.homeLineScores,
  },
  awayTeam: {
    id: game.awayId ?? -1,
    name: game.awayTeam ?? '',
    location: game.awayLocation,
    conference: game.awayConference,
    conferenceAbbreviation: game.awayConferenceAbbreviation,
    points: game.awayPoints,
    lineScores: game.awayLineScores,
  },
  betting: {
    spread: game.spread !== null ? Number(game.spread) : null,
    overUnder: game.overUnder !== null ? Number(game.overUnder) : null,
    homeMoneyline:
      game.moneylineHome !== null ? Number(game.moneylineHome) : null,
    awayMoneyline:
      game.moneylineAway !== null ? Number(game.moneylineAway) : null,
  },
});
const queryFilteredScoreboard = async (
  conference?: string,
): Promise<Selectable<ScoreboardRow>[]> => {
  let query = db.selectFrom('scoreboard').selectAll();

  if (conference) {
    query = query.where((eb) =>
      eb.or([
        eb(
          eb.fn('lower', ['scoreboard.homeConferenceAbbreviation']),
          '=',
          conference.toLowerCase(),
        ),
        eb(
          eb.fn('lower', ['scoreboard.awayConferenceAbbreviation']),
          '=',
          conference.toLowerCase(),
        ),
      ]),
    );
  }

  return query.orderBy('scoreboard.startDate', 'asc').execute();
};
const queryAllScoreboard = () => queryFilteredScoreboard();
const createSnapshot = (
  rows: Selectable<ScoreboardRow>[],
  now: Date,
): ScoreboardSnapshotV1 => ({
  version: 1,
  generatedAt: now.toISOString(),
  games: rows.map(mapScoreboardGame),
});

const validGame = (game: ScoreboardGame): boolean => {
  if (
    !game ||
    typeof game !== 'object' ||
    !Number.isSafeInteger(game.id) ||
    typeof game.startTimeTbd !== 'boolean' ||
    typeof game.neutralSite !== 'boolean' ||
    typeof game.conferenceGame !== 'boolean' ||
    !Object.values(GameStatus).includes(game.status)
  )
    return false;
  for (const key of ['tv', 'clock', 'venue', 'city', 'state'] as const)
    if (game[key] !== null && typeof game[key] !== 'string') return false;
  if (game.period !== null && !Number.isInteger(game.period)) return false;
  for (const team of [game.homeTeam, game.awayTeam]) {
    if (
      !team ||
      typeof team !== 'object' ||
      !Number.isSafeInteger(team.id) ||
      typeof team.name !== 'string'
    )
      return false;
    for (const key of [
      'location',
      'conference',
      'conferenceAbbreviation',
    ] as const)
      if (team[key] !== null && typeof team[key] !== 'string') return false;
    if (team.points !== null && !Number.isFinite(team.points)) return false;
    if (
      team.lineScores !== null &&
      (!Array.isArray(team.lineScores) ||
        team.lineScores.some((score) => !Number.isFinite(score)))
    )
      return false;
  }
  return (
    !!game.betting &&
    ['spread', 'overUnder', 'homeMoneyline', 'awayMoneyline'].every((key) => {
      const value = game.betting[key as keyof ScoreboardGame['betting']];
      return (
        value === null || (typeof value === 'number' && Number.isFinite(value))
      );
    })
  );
};

const parseSnapshot = (
  value: string | null,
  now: Date,
): ScoreboardSnapshotV1 | null => {
  if (!value) {
    return null;
  }

  try {
    const snapshot = JSON.parse(value) as Partial<ScoreboardSnapshotV1>;
    const generatedAt = Date.parse(snapshot.generatedAt ?? '');
    if (
      snapshot.version !== 1 ||
      !Array.isArray(snapshot.games) ||
      !Number.isFinite(generatedAt) ||
      generatedAt > now.getTime() ||
      now.getTime() - generatedAt >= SNAPSHOT_TTL_SECONDS * 1000 ||
      snapshot.games.some((game) => !validGame(game))
    ) {
      return null;
    }
    for (const game of snapshot.games) {
      const startDate = new Date(game.startDate);
      if (Number.isNaN(startDate.getTime())) {
        return null;
      }
      game.startDate = startDate;
    }
    return snapshot as ScoreboardSnapshotV1;
  } catch {
    return null;
  }
};

const localSnapshots = new WeakMap<
  ScoreboardRedis,
  {
    snapshot: ScoreboardSnapshotV1;
    checkedAt: number;
    expiresAt: number;
  }
>();
const pendingSnapshotReads = new WeakMap<
  ScoreboardRedis,
  Promise<ScoreboardSnapshotV1 | null>
>();

const rememberSnapshot = (
  redis: ScoreboardRedis,
  snapshot: ScoreboardSnapshotV1,
  now: Date,
): void => {
  localSnapshots.set(redis, {
    snapshot,
    checkedAt: now.getTime(),
    expiresAt: Math.min(
      now.getTime() + LOCAL_SNAPSHOT_TTL_MS,
      Date.parse(snapshot.generatedAt) + SNAPSHOT_TTL_SECONDS * 1000,
    ),
  });
};

const readSnapshot = async (
  redis: ScoreboardRedis,
  now: () => Date,
): Promise<ScoreboardSnapshotV1 | null> => {
  const time = now().getTime();
  const local = localSnapshots.get(redis);
  if (local && time >= local.checkedAt && time < local.expiresAt)
    return local.snapshot;
  localSnapshots.delete(redis);
  const pending = pendingSnapshotReads.get(redis);
  if (pending) return pending;
  const read = redis
    .get(SNAPSHOT_KEY)
    .then((value) => {
      const checkedAt = now();
      const snapshot = parseSnapshot(value, checkedAt);
      if (snapshot) rememberSnapshot(redis, snapshot, checkedAt);
      return snapshot;
    })
    .finally(() => pendingSnapshotReads.delete(redis));
  pendingSnapshotReads.set(redis, read);
  return read;
};

export const filterScoreboardSnapshot = (
  snapshot: ScoreboardSnapshotV1,
  conference?: string,
): ScoreboardGame[] =>
  snapshot.games.filter(
    (game) =>
      !conference ||
      game.homeTeam.conferenceAbbreviation?.toLowerCase() ===
        conference.toLowerCase() ||
      game.awayTeam.conferenceAbbreviation?.toLowerCase() ===
        conference.toLowerCase(),
  );

const releaseLock = async (
  redis: ScoreboardRedis,
  owner: string,
): Promise<void> => {
  await redis.eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    { keys: [LOCK_KEY], arguments: [owner] },
  );
};

const databaseFallback = async (
  conference: string | undefined,
  queryFiltered: NonNullable<ScoreboardDependencies['queryFiltered']>,
): Promise<ScoreboardGame[]> => {
  logCache('db_fallback');
  return (await queryFiltered(conference)).map(mapScoreboardGame);
};

export const getScoreboard = async (
  conference?: string,
  dependencies: ScoreboardDependencies = {},
): Promise<ScoreboardGame[]> => {
  const now = dependencies.now ?? (() => new Date());
  const sleep =
    dependencies.sleep ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const queryAll = dependencies.queryAll ?? queryAllScoreboard;
  const queryFiltered = dependencies.queryFiltered ?? queryFilteredScoreboard;
  const redis =
    dependencies.redis === undefined
      ? ((await getRedisClient()) as ScoreboardRedis | null)
      : dependencies.redis;

  if (!redis) {
    return databaseFallback(conference, queryFiltered);
  }

  try {
    const cached = await readSnapshot(redis, now);
    if (cached) {
      logCache('hit', cached.games.length);
      return filterScoreboardSnapshot(cached, conference);
    }
    logCache('miss');

    const owner = randomUUID();
    const acquired = await redis.set(LOCK_KEY, owner, {
      NX: true,
      PX: LOCK_TTL_MS,
    });
    if (acquired) {
      try {
        const snapshot = createSnapshot(await queryAll(), now());
        try {
          await redis.set(SNAPSHOT_KEY, JSON.stringify(snapshot), {
            EX: SNAPSHOT_TTL_SECONDS,
          });
          rememberSnapshot(redis, snapshot, now());
          logCache('refresh_success', snapshot.games.length);
        } catch {
          logCache('refresh_failure');
        }
        return filterScoreboardSnapshot(snapshot, conference);
      } finally {
        try {
          await releaseLock(redis, owner);
        } catch {
          logCache('refresh_failure');
        }
      }
    }

    logCache('lock_wait');
    const deadline = now().getTime() + FOLLOWER_WAIT_MS;
    while (now().getTime() < deadline) {
      await sleep(FOLLOWER_POLL_MS);
      const published = await readSnapshot(redis, now);
      if (published) {
        logCache('hit', published.games.length);
        return filterScoreboardSnapshot(published, conference);
      }
    }
  } catch {
    logCache('refresh_failure');
  }

  return databaseFallback(conference, queryFiltered);
};

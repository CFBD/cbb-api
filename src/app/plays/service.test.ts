import { getPlaysByGameId } from './service';

const mockResults: Record<string, unknown>[][] = [];
const mockQueries: string[] = [];

jest.mock('../../config/database', () => {
  const { CamelCasePlugin, DummyDriver, Kysely, PostgresAdapter } =
    jest.requireActual('kysely');
  const { PostgresIntrospector, PostgresQueryCompiler } =
    jest.requireActual('kysely');

  class QueuedDriver extends DummyDriver {
    async acquireConnection() {
      return {
        executeQuery: async (query: { sql: string }) => {
          mockQueries.push(query.sql);
          return { rows: mockResults.shift() ?? [] };
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        streamQuery: async function* () {},
      };
    }
  }

  const replicaDb = new Kysely({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new QueuedDriver(),
      createIntrospector: (db: unknown) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
    plugins: [new CamelCasePlugin()],
  });

  return { db: replicaDb, replicaDb };
});

const createPlayRow = (
  id: number,
  period: number,
  secondsRemaining: number,
) => ({
  game_id: 10,
  game_source_id: '401',
  game_start_date: new Date('2026-02-07T17:00:00Z'),
  home_team_id: 1,
  home_team: 'Home',
  home_conference: 'HC',
  home_seed: null,
  away_team_id: 2,
  away_team: 'Away',
  away_conference: 'AC',
  away_seed: null,
  season: 2026,
  season_type: 'regular',
  game_type: 'STD',
  tournament: null,
  id,
  source_id: `${id}`,
  home_score: 0,
  away_score: 0,
  period,
  clock: '0:00',
  seconds_remaining: secondsRemaining,
  wallclock: null,
  team_id: 1,
  shooting_play: false,
  scoring_play: false,
  score_value: null,
  play_type: 'Foul',
  play_text: 'Foul',
  wp: null,
  shot_location_x: null,
  shot_location_y: null,
  participants: [],
});

const createSubstitutionRow = (
  id: number,
  start: number,
  end: number,
  startInclusive: boolean,
  endInclusive: boolean,
) => ({
  game_id: 10,
  id,
  name: `Player ${id}`,
  team: 'Home',
  start,
  end,
  start_inclusive: startInclusive,
  end_inclusive: endInclusive,
});

describe('plays service on-floor players', () => {
  beforeEach(() => {
    mockResults.length = 0;
    mockQueries.length = 0;
  });

  it('returns players whose substitution interval contains the play time', async () => {
    mockResults.push(
      [createPlayRow(1, 1, 1100), createPlayRow(2, 3, 300)],
      [
        createSubstitutionRow(101, 0, 100, false, true),
        createSubstitutionRow(102, 100, 200, true, true),
        createSubstitutionRow(103, 100, 200, false, true),
        createSubstitutionRow(104, 2300, 2400, false, true),
        createSubstitutionRow(105, 2400, 2700, true, true),
        createSubstitutionRow(106, 2400, 2700, false, true),
      ],
    );

    const plays = await getPlaysByGameId(10);

    expect(
      plays.map((play) => play.onFloor.map((player) => player.id)),
    ).toEqual([
      [101, 102],
      [104, 105],
    ]);
    expect(plays[0].onFloor[0]).toEqual({
      id: 101,
      name: 'Player 101',
      team: 'Home',
    });
    expect(mockQueries).toHaveLength(2);
    expect(mockQueries[0]).not.toContain('substitution');
    expect(mockQueries[1]).toContain('"substitution"."game_id" in ($1)');
  });

  it('skips the substitution query when no plays match', async () => {
    mockResults.push([]);

    await expect(getPlaysByGameId(10)).resolves.toEqual([]);
    expect(mockQueries).toHaveLength(1);
  });
});

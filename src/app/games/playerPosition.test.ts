import { getGamePlayerStatistics } from './service';
import { getPlayerSeasonStats } from '../stats/service';

// Compile the real Kysely queries, but never connect to a database.
jest.mock('../../config/database', () => {
  const { Kysely, PostgresDialect, CamelCasePlugin } =
    jest.requireActual('kysely');
  const query = jest.fn();
  const client = { query, release: jest.fn() };
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: { connect: async () => client, end: async () => {} },
    }),
    plugins: [new CamelCasePlugin()],
  });
  return { db, query };
});

const { query } = jest.requireMock('../../config/database') as {
  query: jest.Mock;
};

beforeEach(() => query.mockReset());

test.each([null, 'F'])(
  'game box scores retain canonical identity and points with position %s',
  async (position) => {
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 212768,
          season: 2026,
          teamId: 50,
          periodPoints: [29, 33],
          players: [
            {
              id: 999999,
              athleteId: 198637,
              name: 'Stephen Byard',
              position,
              points: 16,
              minutes: 15,
              fgm: 6,
              fga: 8,
              fta: 4,
              ftm: 4,
              '3pm': 0,
              '3pa': 0,
              reb: 4,
              oreb: 1,
              dreb: 3,
              ast: 0,
              to: 1,
              pf: 2,
              stl: 0,
              blk: 1,
            },
          ],
        },
      ],
    });
    const games = await getGamePlayerStatistics(
      undefined,
      undefined,
      'Chicago State',
      undefined,
      2026,
    );
    expect(games[0].players[0]).toMatchObject({
      athleteId: 198637,
      points: 16,
      minutes: 15,
      position: position ?? '',
    });
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain(
      'left join "position" on "athlete"."position_id" = "position"."id"',
    );
    expect(sql).not.toContain('inner join "position"');
    expect(sql).toContain('"game_player_stats"."minutes" is not null');
  },
);

test.each([null, 'F'])(
  'season summaries retain canonical identity and points with position %s',
  async (position) => {
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 198637,
          name: 'Stephen Byard',
          position,
          season: 2026,
          teamId: 50,
          school: 'Chicago State',
          games: 1,
          starts: 0,
          points: 16,
          minutes: 15,
          teamMinutes: 40,
          possessionsTeam: 72,
          possessionsOpp: 73,
          fgm: 6,
          fga: 8,
          fta: 4,
          ftm: 4,
          '3pm': 0,
          '3pa': 0,
          reb: 4,
          oreb: 1,
          dreb: 3,
          ast: 0,
          to: 1,
          pf: 2,
          stl: 0,
          blk: 1,
        },
      ],
    });
    const players = await getPlayerSeasonStats(
      2026,
      undefined,
      'Chicago State',
    );
    expect(players[0]).toMatchObject({
      athleteId: 198637,
      points: 16,
      minutes: 15,
      position: position ?? '',
    });
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain(
      'left join "position" on "athlete"."position_id" = "position"."id"',
    );
    expect(sql).not.toContain('inner join "position"');
    expect(sql).toContain('"game_player_stats"."minutes" is not null');
  },
);

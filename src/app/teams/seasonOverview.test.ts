import expanded from './fixtures/expanded.json';
import modern from './fixtures/modern.json';
import historical from './fixtures/historical.json';
import upcoming from './fixtures/upcoming.json';
import { isTeamSeasonOverview } from './seasonOverviewPayload';
import { getTeamSeasonOverview } from './seasonOverview';
import { getTeamDirectory } from './directory';
import { db } from '../../config/database';
jest.mock('../../config/database', () => ({ db: { selectFrom: jest.fn() } }));
const select = db.selectFrom as jest.Mock;
const chain = (value: unknown) => {
  const q: Record<string, jest.Mock> = {};
  for (const k of ['where', 'select', 'innerJoin', 'orderBy'])
    q[k] = jest.fn(() => q);
  q.execute = jest.fn(async () => value);
  q.executeTakeFirst = jest.fn(async () => value);
  return q;
};
beforeEach(() => {
  select.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
function setup(payload: unknown = modern, version = 1) {
  select.mockImplementation((table) =>
    chain(
      table === 'team'
        ? { id: 72 }
        : table === 'conferenceTeam'
          ? [{ conferenceId: 1 }]
          : {
              payload: JSON.stringify(payload),
              formatVersion: version,
              generatedAt: modern.generatedAt,
            },
    ),
  );
}
test.each([modern, historical, upcoming])(
  'valid format-1 fixture for $season',
  (p) => expect(isTeamSeasonOverview(p, p.teamId, p.season)).toBe(true),
);
test('bounded read returns stored content without querying statistics', async () => {
  setup();
  expect(await getTeamSeasonOverview(72, 2026)).toEqual(modern);
  expect(select.mock.calls.map((c) => c[0])).toEqual([
    'team',
    'conferenceTeam',
    'teamSeasonSnapshot',
  ]);
});
test.each([
  [0, 2026],
  [1.5, 2026],
  [72, 32768],
  [72, -1],
])('rejects invalid selectors %s %s', async (id, season) => {
  await expect(getTeamSeasonOverview(id, season)).rejects.toMatchObject({
    status: 400,
  });
  expect(select).not.toHaveBeenCalled();
});
test('unknown ID and ineligible season are distinct', async () => {
  select.mockReturnValue(chain(undefined));
  await expect(getTeamSeasonOverview(72, 2026)).rejects.toMatchObject({
    status: 404,
  });
  select.mockImplementation((t) => chain(t === 'team' ? { id: 72 } : []));
  await expect(getTeamSeasonOverview(72, 2026)).rejects.toMatchObject({
    status: 422,
  });
});
test.each([
  null,
  { ...modern, teamId: 150 },
  { ...modern, efficiency: null },
  {
    ...modern,
    record: {
      ...modern.record,
      overall: { games: 1, wins: 10, losses: 0, unresolved: 0 },
    },
  },
])('unusable payload is unavailable without fallback', async (p) => {
  setup(p);
  await expect(getTeamSeasonOverview(72, 2026)).rejects.toMatchObject({
    status: 503,
  });
  expect(
    select.mock.calls.every((c) =>
      ['team', 'conferenceTeam', 'teamSeasonSnapshot'].includes(c[0]),
    ),
  ).toBe(true);
});
test('unsupported storage version is unavailable', async () => {
  setup(modern, 2);
  await expect(getTeamSeasonOverview(72, 2026)).rejects.toMatchObject({
    status: 503,
  });
});
test('storage failure does not leak upstream detail', async () => {
  select.mockImplementation(() => {
    throw new Error('secret SQL');
  });
  await expect(getTeamSeasonOverview(72, 2026)).rejects.toMatchObject({
    status: 503,
    message: 'Season overview temporarily unavailable.',
  });
});
test('directory deduplicates exact memberships, rejects conflicts, and allows empty season', async () => {
  const row = {
    id: 72,
    sourceId: '150',
    school: 'Duke',
    mascot: null,
    abbreviation: null,
    displayName: null,
    shortDisplayName: null,
    conferenceId: 1,
    conferenceName: 'ACC',
    conferenceAbbreviation: 'ACC',
  };
  select.mockReturnValue(chain([row, row]));
  expect((await getTeamDirectory(2014)).teams).toHaveLength(1);
  select.mockReturnValue(chain([row, { ...row, conferenceId: 2 }]));
  await expect(getTeamDirectory(2014)).rejects.toMatchObject({ status: 503 });
  select.mockReturnValue(chain([]));
  expect(await getTeamDirectory(2027)).toMatchObject({
    teams: [],
    conferences: [],
  });
});

test('format-2 expanded payload is served through the same bounded reader', async () => {
  setup(expanded, 2);
  expect(await getTeamSeasonOverview(72, 2026)).toEqual(expanded);
  expect(select).toHaveBeenCalledTimes(3);
});
test('format-2 requires all new fields and bounded model coverage', () => {
  expect(isTeamSeasonOverview({ ...modern, formatVersion: 2 }, 72, 2026)).toBe(
    false,
  );
  const bad = structuredClone(expanded);
  bad.players.rows[0].seasonStats.advanced.games = 999;
  expect(isTeamSeasonOverview(bad, 72, 2026)).toBe(false);
  bad.players.rows[0].seasonStats.advanced.games = 1;
  bad.players.rows[0].seasonStats.advanced.netRating = -10;
  bad.players.rows[0].seasonStats.advanced.winShares.total = -0.5;
  expect(isTeamSeasonOverview(bad, 72, 2026)).toBe(true);
});

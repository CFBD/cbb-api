import { TeamSeasonOverview } from './seasonOverviewTypes';

// Fail closed before publication and serving. Nullable measurements are intentional.
type Obj = Record<string, unknown>;
const object = (v: unknown): v is Obj =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Number(v) >= 0;
const id = (v: unknown) => count(v) && v > 0;
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const nullable = (v: unknown) => v === null || number(v);
const string = (v: unknown) => typeof v === 'string';
const text = (v: unknown) => v === null || string(v);
const iso = (v: unknown) =>
  string(v) &&
  /^\d{4}-\d{2}-\d{2}T.*Z$/.test(v as string) &&
  Number.isFinite(Date.parse(v as string));
const oneOf = (v: unknown, values: unknown[]) => values.includes(v);
const fields = (v: Obj, keys: string[], check: (v: unknown) => boolean) =>
  keys.every((k) => check(v[k]));
const record = (v: unknown) =>
  object(v) &&
  fields(v, ['games', 'wins', 'losses', 'unresolved'], count) &&
  v.games === Number(v.wins) + Number(v.losses) + Number(v.unresolved);
const coverage = (v: unknown) =>
  object(v) &&
  oneOf(v.state, ['available', 'partial', 'unavailable']) &&
  oneOf(v.reason, [
    null,
    'no_games',
    'no_source_rows',
    'incomplete_inputs',
    'zero_denominator',
    'unclassified_games',
    'unclassified_shots',
  ]) &&
  count(v.eligibleGames) &&
  count(v.coveredGames) &&
  v.coveredGames <= v.eligibleGames;
const conference = (v: unknown) =>
  object(v) && id(v.id) && fields(v, ['name', 'abbreviation'], string);
const poll = (v: unknown) =>
  object(v) &&
  oneOf(v.state, ['ranked', 'unranked', 'unavailable']) &&
  (v.date === null ||
    (string(v.date) && /^\d{4}-\d{2}-\d{2}$/.test(v.date as string))) &&
  (v.week === null || count(v.week)) &&
  oneOf(v.seasonType, [null, 'regular', 'postseason', 'preseason']) &&
  (v.state === 'ranked' ? id(v.rank) : v.rank === null);
const unit = (v: unknown) =>
  object(v) &&
  fields(
    v,
    [
      'points',
      'possessions',
      'rawRating',
      'effectiveFieldGoalPct',
      'turnoverPct',
      'offensiveReboundPct',
      'freeThrowRate',
    ],
    (x) => nullable(x) && (x === null || Number(x) >= 0),
  );
const unique = (rows: Obj[], key: string) =>
  new Set(rows.map((r) => r[key])).size === rows.length;

const nonnegative = (v: unknown) =>
  nullable(v) && (v === null || Number(v) >= 0);
const shotLine = (v: unknown) =>
  object(v) &&
  fields(v, ['made', 'attempted', 'pct'], nonnegative) &&
  (v.made === null ||
    v.attempted === null ||
    Number(v.made) <= Number(v.attempted));
const seasonBox = (v: unknown): v is Obj =>
  object(v) &&
  [
    'fieldGoals',
    'twoPointFieldGoals',
    'threePointFieldGoals',
    'freeThrows',
  ].every((k) => shotLine(v[k])) &&
  object(v.rebounds) &&
  fields(v.rebounds, ['offensive', 'defensive', 'total'], nonnegative) &&
  fields(v, ['assists', 'steals', 'blocks', 'turnovers', 'fouls'], nonnegative);
const teamBox = (v: unknown) =>
  seasonBox(v) &&
  fields(
    v,
    [
      'minutes',
      'teamTurnovers',
      'technicalFouls',
      'flagrantFouls',
      'pointsInPaint',
      'pointsOffTurnovers',
      'fastBreakPoints',
      'trueShootingPct',
    ],
    nonnegative,
  );
const playerDetails = (v: unknown, games: unknown) =>
  seasonBox(v) &&
  (v.starts === null ||
    (count(v.starts) && Number(v.starts) <= Number(games))) &&
  fields(
    v,
    ['assistTurnoverRatio', 'freeThrowRate', 'offensiveReboundPct'],
    nonnegative,
  ) &&
  object(v.advanced) &&
  count(v.advanced.games) &&
  v.advanced.games <= Number(games) &&
  fields(
    v.advanced,
    ['offensiveRating', 'defensiveRating', 'netRating', 'porpag'],
    nullable,
  ) &&
  object(v.advanced.winShares) &&
  fields(
    v.advanced.winShares,
    ['offensive', 'defensive', 'total', 'per40'],
    nullable,
  );

export function isTeamSeasonOverview(
  v: unknown,
  teamId: number,
  season: number,
): v is TeamSeasonOverview {
  if (
    !object(v) ||
    !oneOf(v.formatVersion, [1, 2]) ||
    v.teamId !== teamId ||
    v.season !== season ||
    !id(teamId) ||
    !id(season) ||
    !string(v.seasonLabel) ||
    !iso(v.generatedAt)
  )
    return false;
  if (
    !object(v.team) ||
    !string(v.team.school) ||
    !text(v.team.mascot) ||
    !text(v.team.sourceId) ||
    !conference(v.team.conference)
  )
    return false;
  if (
    !object(v.record) ||
    !record(v.record.overall) ||
    !record(v.record.conference) ||
    typeof v.record.complete !== 'boolean' ||
    !fields(
      v.record,
      ['unknownEligibilityGames', 'unknownConferenceGames'],
      count,
    )
  )
    return false;
  if (
    !object(v.ratings) ||
    !nullable(v.ratings.elo) ||
    !nullable(v.ratings.srs) ||
    !object(v.ratings.polls) ||
    !poll(v.ratings.polls.ap) ||
    !poll(v.ratings.polls.coaches)
  )
    return false;
  const a = v.ratings.adjusted;
  if (
    a !== null &&
    (!object(a) ||
      !id(a.population) ||
      !['offense', 'defense', 'net'].every((k) => {
        const r = a[k];
        return (
          object(r) &&
          number(r.value) &&
          id(r.rank) &&
          Number(r.rank) <= Number(a.population)
        );
      }))
  )
    return false;
  if (
    !object(v.efficiency) ||
    !coverage(v.efficiency.coverage) ||
    !nullable(v.efficiency.pace) ||
    !count(v.efficiency.paceGames) ||
    !unit(v.efficiency.offense) ||
    !unit(v.efficiency.defense)
  )
    return false;
  if (
    !object(v.shooting) ||
    !coverage(v.shooting.coverage) ||
    !count(v.shooting.trackedAttempts) ||
    !Array.isArray(v.shooting.buckets)
  )
    return false;
  const buckets = v.shooting.buckets;
  if (
    !buckets.every(
      (b) =>
        object(b) &&
        oneOf(b.key, [
          'at_rim',
          'two_point_jumper',
          'three_point_jumper',
          'unknown',
        ]) &&
        count(b.attempts) &&
        count(b.made) &&
        b.made <= b.attempts &&
        fields(b, ['attemptPct', 'fieldGoalPct'], nullable),
    ) ||
    !unique(buckets, 'key') ||
    buckets.reduce((s, b) => s + b.attempts, 0) !== v.shooting.trackedAttempts
  )
    return false;
  if (
    !object(v.players) ||
    !coverage(v.players.coverage) ||
    !Array.isArray(v.players.rows)
  )
    return false;
  const players = v.players.rows;
  if (
    !players.every(
      (p) =>
        object(p) &&
        id(p.athleteId) &&
        string(p.name) &&
        text(p.position) &&
        ['onRoster', 'hasStats', 'complete'].every(
          (k) => typeof p[k] === 'boolean',
        ) &&
        count(p.usageGames) &&
        (p.games === null || count(p.games)) &&
        fields(
          p,
          [
            'minutes',
            'points',
            'rebounds',
            'assists',
            'minutesPerGame',
            'pointsPerGame',
            'usagePct',
            'trueShootingPct',
            'effectiveFieldGoalPct',
          ],
          (x) => nullable(x) && (x === null || Number(x) >= 0),
        ),
    ) ||
    !unique(players, 'athleteId')
  )
    return false;
  if (
    (v.formatVersion === 2 ||
      (v.efficiency.offense as Obj).boxScore !== undefined) &&
    !teamBox((v.efficiency.offense as Obj).boxScore)
  )
    return false;
  if (
    (v.formatVersion === 2 ||
      (v.efficiency.defense as Obj).boxScore !== undefined) &&
    !teamBox((v.efficiency.defense as Obj).boxScore)
  )
    return false;
  if (
    !players.every(
      (p) =>
        (v.formatVersion !== 2 && p.seasonStats === undefined) ||
        playerDetails(p.seasonStats, p.games),
    )
  )
    return false;
  if (!object(v.schedule) || !Array.isArray(v.schedule.games)) return false;
  const games = v.schedule.games;
  if (
    !games.every(
      (g) =>
        object(g) &&
        id(g.id) &&
        id(g.opponentId) &&
        string(g.opponent) &&
        typeof g.opponentHasProfile === 'boolean' &&
        iso(g.startDate) &&
        string(g.calendarDate) &&
        /^\d{4}-\d{2}-\d{2}$/.test(g.calendarDate as string) &&
        typeof g.startTimeTbd === 'boolean' &&
        oneOf(g.location, ['home', 'away', 'neutral']) &&
        oneOf(g.status, [
          'scheduled',
          'in_progress',
          'final',
          'postponed',
          'cancelled',
        ]) &&
        oneOf(g.seasonType, ['regular', 'postseason', 'preseason']) &&
        text(g.gameType) &&
        oneOf(g.eligibility, ['counted', 'exhibition', 'unknown']) &&
        (g.conferenceGame === null || typeof g.conferenceGame === 'boolean') &&
        [g.teamPoints, g.opponentPoints].every((x) => x === null || count(x)) &&
        oneOf(g.result, ['W', 'L', null]) &&
        text(g.venue) &&
        (g.status === 'final' ||
          (g.teamPoints === null &&
            g.opponentPoints === null &&
            g.result === null)),
    ) ||
    !unique(games, 'id')
  )
    return false;
  if (
    !object(v.sources) ||
    !(
      v.sources.leaderboardUpdatedAt === null ||
      iso(v.sources.leaderboardUpdatedAt)
    ) ||
    !(
      v.sources.latestFinalStartDate === null ||
      iso(v.sources.latestFinalStartDate)
    ) ||
    !Array.isArray(v.sources.notes) ||
    v.sources.notes.length > 20 ||
    !v.sources.notes.every((n) => string(n) && (n as string).length <= 500)
  )
    return false;
  // Catch non-finite or undefined values anywhere, including optional future keys.
  const safe = (x: unknown): boolean =>
    x === null ||
    typeof x === 'boolean' ||
    string(x) ||
    number(x) ||
    (Array.isArray(x)
      ? x.every(safe)
      : object(x) && Object.values(x).every(safe));
  return safe(v);
}

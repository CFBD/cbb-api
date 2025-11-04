import { db } from '../../config/database';
import { sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { LineupStats } from './types';

export const getLineupStatsByGame = async (
  gameId: number,
): Promise<LineupStats[]> => {
  return getLineupStats(undefined, undefined, gameId);
};

export const getLineupStatsByTeam = async (
  season: number,
  team: string,
  startDateRange?: Date,
  endDateRange?: Date,
): Promise<LineupStats[]> => {
  return getLineupStats(season, team, undefined, startDateRange, endDateRange);
};

const getLineupStats = async (
  season?: number,
  team?: string,
  gameId?: number,
  startDateRange?: Date,
  endDateRange?: Date,
): Promise<LineupStats[]> => {
  let query = db
    .with('ranges', (eb) => {
      let cte = eb
        .selectFrom('game')
        .innerJoin('substitution as s1', 's1.gameId', 'game.id')
        .innerJoin('conferenceTeam', (join) =>
          join
            .onRef('conferenceTeam.teamId', '=', 's1.teamId')
            .onRef('conferenceTeam.startYear', '<=', 'game.season')
            .on((qb) =>
              qb.or([
                qb('conferenceTeam.endYear', '>=', qb.ref('game.season')),
                qb('conferenceTeam.endYear', 'is', null),
              ]),
            ),
        )
        .innerJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
        .innerJoin('team', 'team.id', 's1.teamId')
        .innerJoin('substitution as s2', (join) =>
          join
            .onRef('s2.gameId', '=', 'game.id')
            .onRef('s2.teamId', '=', 's1.teamId')
            .onRef('s2.athleteId', '>', 's1.athleteId')
            .onRef('s2.timeRange', '&&', 's1.timeRange'),
        )
        .innerJoin('substitution as s3', (join) =>
          join
            .onRef('s3.gameId', '=', 'game.id')
            .onRef('s3.teamId', '=', 's1.teamId')
            .onRef('s3.athleteId', '>', 's2.athleteId')
            .on((qb) =>
              qb(
                's3.timeRange',
                '&&',
                qb('s1.timeRange', '*', qb.ref('s2.timeRange')),
              ),
            ),
        )
        .innerJoin('substitution as s4', (join) =>
          join
            .onRef('s4.gameId', '=', 'game.id')
            .onRef('s4.teamId', '=', 's1.teamId')
            .onRef('s4.athleteId', '>', 's3.athleteId')
            .on((qb) =>
              qb(
                's4.timeRange',
                '&&',
                qb(
                  's1.timeRange',
                  '*',
                  qb('s2.timeRange', '*', qb.ref('s3.timeRange')),
                ),
              ),
            ),
        )
        .innerJoin('substitution as s5', (join) =>
          join
            .onRef('s5.gameId', '=', 'game.id')
            .onRef('s5.teamId', '=', 's1.teamId')
            .onRef('s5.athleteId', '>', 's4.athleteId')
            .on((qb) =>
              qb(
                's5.timeRange',
                '&&',
                qb(
                  's1.timeRange',
                  '*',
                  qb(
                    's2.timeRange',
                    '*',
                    qb('s3.timeRange', '*', qb.ref('s4.timeRange')),
                  ),
                ),
              ),
            ),
        )
        .select([
          'game.id',
          'team.id as teamId',
          'team.school as team',
          'conference.abbreviation as conference',
        ])
        .select(
          sql<string>`s1.athlete_id || '-' || s2.athlete_id || '-' || s3.athlete_id || '-' || s4.athlete_id || '-' || s5.athlete_id`.as(
            'idHash',
          ),
        )
        .select(
          sql<Range>`s1.time_range * s2.time_range * s3.time_range * s4.time_range * s5.time_range`.as(
            'timeRange',
          ),
        );

      if (team) {
        cte = cte.where((eb) =>
          eb(
            'team.id',
            '=',
            eb
              .selectFrom('team')
              .where(
                (qb) => qb.fn('lower', ['team.school']),
                '=',
                team.toLowerCase(),
              )
              .select('team.id'),
          ),
        );
      }

      if (season) {
        cte = cte.where('game.season', '=', season);
      }

      if (gameId) {
        cte = cte.where('game.id', '=', gameId);
      }

      if (startDateRange) {
        cte = cte.where('game.startDate', '>=', startDateRange);
      }

      if (endDateRange) {
        cte = cte.where('game.startDate', '<=', endDateRange);
      }

      return cte;
    })
    .selectFrom('ranges')
    .innerJoin('play', (join) =>
      join
        .onRef('play.gameId', '=', 'ranges.id')
        .on('ranges.timeRange', '@>', sql`play.seconds_elapsed::numeric`),
    )
    .innerJoin('playType', 'play.playTypeId', 'playType.id')
    .groupBy([
      'ranges.teamId',
      'ranges.team',
      'ranges.idHash',
      'ranges.conference',
    ])
    .select([
      'ranges.teamId',
      'ranges.team',
      'ranges.idHash',
      'ranges.conference',
    ])
    .select((eb) =>
      jsonArrayFrom(
        eb
          .selectFrom('athlete')
          .where(
            'athlete.id',
            '=',
            sql<
              number | null
            >`ANY(string_to_array(ranges.id_hash, '-')::int[])`,
          )
          .select(['athlete.id', 'athlete.name']),
      ).as('athletes'),
    )
    .select((eb) =>
      eb
        .selectFrom('ranges as r2')
        .whereRef('r2.idHash', '=', 'ranges.idHash')
        .select((qb) =>
          qb.fn
            .sum(
              qb(
                qb.fn('upper', ['r2.timeRange']),
                '-',
                qb.fn('lower', ['r2.timeRange']),
              ),
            )
            .as('duration'),
        )
        .as('duration'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb.or([
              qb('playType.name', 'in', [
                'Lost Ball Turnover',
                'Defensive Rebound',
              ]),
              qb.and([
                qb('playType.name', '<>', 'MadeFreeThrow'),
                qb('play.scoringPlay', '=', true),
              ]),
            ]),
          ]),
        )
        .as('possessions'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb.or([
              qb('playType.name', 'in', [
                'Lost Ball Turnover',
                'Defensive Rebound',
              ]),
              qb.and([
                qb('playType.name', '<>', 'MadeFreeThrow'),
                qb('play.scoringPlay', '=', true),
              ]),
            ]),
          ]),
        )
        .as('oppPossessions'),
    )
    .select((eb) =>
      eb.fn
        .sum('play.scoreValue')
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('points'),
    )
    .select((eb) =>
      eb.fn
        .sum('play.scoreValue')
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('oppPoints'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'MadeFreeThrow'),
          ]),
        )
        .as('freeThrowAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'MadeFreeThrow'),
          ]),
        )
        .as('oppFreeThrowAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'MadeFreeThrow'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('freeThrowsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'MadeFreeThrow'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('oppFreeThrowsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'TipShot'),
          ]),
        )
        .as('tipShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'TipShot'),
          ]),
        )
        .as('oppTipShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'TipShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('tipShotsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'TipShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('oppTipShotsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'DunkShot'),
          ]),
        )
        .as('dunkShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'DunkShot'),
          ]),
        )
        .as('oppDunkShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'DunkShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('dunkShotsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'DunkShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('oppDunkShotsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'LayUpShot'),
          ]),
        )
        .as('layupShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'LayUpShot'),
          ]),
        )
        .as('oppLayupShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'LayUpShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('layupShotsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'LayUpShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('oppLayupShotsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoreValue', '=', 2),
          ]),
        )
        .as('twoPointJumperAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoreValue', '=', 2),
          ]),
        )
        .as('oppTwoPointJumperAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoringPlay', '=', true),
            qb('play.scoreValue', '=', 2),
          ]),
        )
        .as('twoPointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoringPlay', '=', true),
            qb('play.scoreValue', '=', 2),
          ]),
        )
        .as('oppTwoPointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoreValue', '=', 3),
          ]),
        )
        .as('threePointJumperAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoreValue', '=', 3),
          ]),
        )
        .as('oppThreePointJumperAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoringPlay', '=', true),
            qb('play.scoreValue', '=', 3),
          ]),
        )
        .as('threePointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'JumpShot'),
            qb('play.scoringPlay', '=', true),
            qb('play.scoreValue', '=', 3),
          ]),
        )
        .as('oppThreePointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Block Shot'),
          ]),
        )
        .as('blocks'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Block Shot'),
          ]),
        )
        .as('oppBlocks'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Steal'),
          ]),
        )
        .as('steals'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Steal'),
          ]),
        )
        .as('oppSteals'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Lost Ball Turnover'),
          ]),
        )
        .as('turnovers'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Lost Ball Turnover'),
          ]),
        )
        .as('oppTurnovers'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Defensive Rebound'),
          ]),
        )
        .as('defensiveRebounds'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Defensive Rebound'),
          ]),
        )
        .as('oppDefensiveRebounds'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Offensive Rebound'),
          ]),
        )
        .as('offensiveRebounds'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('playType.name', '=', 'Offensive Rebound'),
          ]),
        )
        .as('oppOffensiveRebounds'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
          ]),
        )
        .as('assists'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
          ]),
        )
        .as('oppAssists'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '=', 2),
          ]),
        )
        .as('twoPointersAttempted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '=', 2),
          ]),
        )
        .as('oppTwoPointersAttempted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '=', 2),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('twoPointersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '=', 2),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('oppTwoPointersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '>=', 2),
          ]),
        )
        .as('fieldGoalsAttempted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '>=', 2),
          ]),
        )
        .as('oppFieldGoalsAttempted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '=', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '>=', 2),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('fieldGoalsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.teamId', '<>', qb.ref('ranges.teamId')),
            qb('play.shootingPlay', '=', true),
            qb('play.scoreValue', '>=', 2),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('oppFieldGoalsMade'),
    )
    .orderBy('duration desc');

  const results = await query.execute();
  return results
    .filter(
      (result) => Number(result.duration ?? 0) >= 0, //&&
      // Number(result.possessions ?? 0) > 0 &&
      // Number(result.oppPossessions ?? 0) > 0 &&
      // Number(result.points ?? 0) > 0 &&
      // Number(result.oppPoints ?? 0) > 0,
    )
    .map((result): LineupStats => {
      return {
        teamId: result.teamId,
        team: result.team,
        conference: result.conference,
        idHash: result.idHash,
        athletes: result.athletes,
        totalSeconds: Number(result.duration),
        pace:
          Math.round(
            ((Number(result.possessions) + Number(result.oppPossessions)) /
              ((Number(result.duration) * 2) / 60)) *
              400,
          ) / 10,
        offenseRating:
          Math.round(
            (Number(result.points) / Number(result.possessions)) * 1000,
          ) / 10,
        defenseRating:
          Math.round(
            (Number(result.oppPoints) / Number(result.oppPossessions)) * 1000,
          ) / 10,
        netRating:
          Math.round(
            (Number(result.points) / Number(result.possessions)) * 1000 -
              (Number(result.oppPoints) / Number(result.oppPossessions)) * 1000,
          ) / 10,
        teamStats: {
          points: Number(result.points),
          possessions: Number(result.possessions),
          assists: Number(result.assists),
          steals: Number(result.steals),
          turnovers: Number(result.turnovers),
          blocks: Number(result.blocks),
          defensiveRebounds: Number(result.defensiveRebounds),
          offensiveRebounds: Number(result.offensiveRebounds),
          trueShooting:
            Math.round(
              (Number(result.points) /
                (2 *
                  (Number(result.fieldGoalsAttempted) +
                    0.44 * Number(result.freeThrowAttempts)))) *
                1000,
            ) / 10,
          fieldGoals: {
            made: Number(result.fieldGoalsMade),
            attempted: Number(result.fieldGoalsAttempted),
            pct: result.fieldGoalsAttempted
              ? Math.round(
                  (Number(result.fieldGoalsMade) /
                    Number(result.fieldGoalsAttempted)) *
                    1000,
                ) / 10
              : 0,
          },
          freeThrows: {
            made: Number(result.freeThrowsMade),
            attempted: Number(result.freeThrowAttempts),
            pct: result.freeThrowAttempts
              ? Math.round(
                  (Number(result.freeThrowsMade) /
                    Number(result.freeThrowAttempts)) *
                    1000,
                ) / 10
              : 0,
          },
          twoPointers: {
            made: Number(result.twoPointersMade),
            attempted: Number(result.twoPointersAttempted),
            pct: result.twoPointersAttempted
              ? Math.round(
                  (Number(result.twoPointersMade) /
                    Number(result.twoPointersAttempted)) *
                    1000,
                ) / 10
              : 0,
            tipIns: {
              made: Number(result.tipShotsMade),
              attempted: Number(result.tipShotAttempts),
              pct: result.tipShotAttempts
                ? Math.round(
                    (Number(result.tipShotsMade) /
                      Number(result.tipShotAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
            dunks: {
              made: Number(result.dunkShotsMade),
              attempted: Number(result.dunkShotAttempts),
              pct: result.dunkShotAttempts
                ? Math.round(
                    (Number(result.dunkShotsMade) /
                      Number(result.dunkShotAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
            layups: {
              made: Number(result.layupShotsMade),
              attempted: Number(result.layupShotAttempts),
              pct: result.layupShotAttempts
                ? Math.round(
                    (Number(result.layupShotsMade) /
                      Number(result.layupShotAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
            jumpers: {
              made: Number(result.twoPointJumpersMade),
              attempted: Number(result.twoPointJumperAttempts),
              pct: result.twoPointJumperAttempts
                ? Math.round(
                    (Number(result.twoPointJumpersMade) /
                      Number(result.twoPointJumperAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
          },
          threePointers: {
            made: Number(result.threePointJumpersMade),
            attempted: Number(result.threePointJumperAttempts),
            pct: result.threePointJumperAttempts
              ? Math.round(
                  (Number(result.threePointJumpersMade) /
                    Number(result.threePointJumperAttempts)) *
                    1000,
                ) / 10
              : 0,
          },
          fourFactors: {
            effectiveFieldGoalPct: result.fieldGoalsMade
              ? Math.round(
                  (1000 *
                    (Number(result.fieldGoalsMade) +
                      0.5 * Number(result.threePointJumpersMade))) /
                    Number(result.fieldGoalsAttempted),
                ) / 10
              : 0,
            turnoverRatio: result.possessions
              ? Math.round(
                  100 * (Number(result.turnovers) / Number(result.possessions)),
                ) / 100
              : 0,
            offensiveReboundPct: result.offensiveRebounds
              ? Math.round(
                  1000 *
                    (Number(result.offensiveRebounds) /
                      (Number(result.defensiveRebounds) |
                        Number(result.offensiveRebounds))),
                ) / 10
              : 0,
            freeThrowRate: result.fieldGoalsAttempted
              ? Math.round(
                  1000 *
                    (Number(result.freeThrowAttempts) /
                      Number(result.fieldGoalsAttempted)),
                ) / 10
              : 0,
          },
        },
        opponentStats: {
          points: Number(result.oppPoints),
          possessions: Number(result.oppPossessions),
          assists: Number(result.oppAssists),
          steals: Number(result.oppSteals),
          turnovers: Number(result.oppTurnovers),
          blocks: Number(result.oppBlocks),
          defensiveRebounds: Number(result.oppDefensiveRebounds),
          offensiveRebounds: Number(result.oppOffensiveRebounds),
          trueShooting:
            Math.round(
              (Number(result.oppPoints) /
                (2 *
                  (Number(result.oppFieldGoalsAttempted) +
                    0.44 * Number(result.oppFreeThrowAttempts)))) *
                1000,
            ) / 10,
          fieldGoals: {
            made: Number(result.oppFieldGoalsMade),
            attempted: Number(result.oppFieldGoalsAttempted),
            pct: result.oppFieldGoalsAttempted
              ? Math.round(
                  (Number(result.oppFieldGoalsMade) /
                    Number(result.oppFieldGoalsAttempted)) *
                    1000,
                ) / 10
              : 0,
          },
          freeThrows: {
            made: Number(result.oppFreeThrowsMade),
            attempted: Number(result.oppFreeThrowAttempts),
            pct: result.oppFreeThrowAttempts
              ? Math.round(
                  (Number(result.oppFreeThrowsMade) /
                    Number(result.oppFreeThrowAttempts)) *
                    1000,
                ) / 10
              : 0,
          },
          twoPointers: {
            made: Number(result.oppTwoPointersMade),
            attempted: Number(result.oppTwoPointersAttempted),
            pct: result.oppTwoPointersAttempted
              ? Math.round(
                  (Number(result.oppTwoPointersMade) /
                    Number(result.oppTwoPointersAttempted)) *
                    1000,
                ) / 10
              : 0,
            tipIns: {
              made: Number(result.oppTipShotsMade),
              attempted: Number(result.oppTipShotAttempts),
              pct: result.oppTipShotAttempts
                ? Math.round(
                    (Number(result.oppTipShotsMade) /
                      Number(result.oppTipShotAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
            dunks: {
              made: Number(result.oppDunkShotsMade),
              attempted: Number(result.oppDunkShotAttempts),
              pct: result.oppDunkShotAttempts
                ? Math.round(
                    (Number(result.oppDunkShotsMade) /
                      Number(result.oppDunkShotAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
            layups: {
              made: Number(result.oppLayupShotsMade),
              attempted: Number(result.oppLayupShotAttempts),
              pct: result.oppLayupShotAttempts
                ? Math.round(
                    (Number(result.oppLayupShotsMade) /
                      Number(result.oppLayupShotAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
            jumpers: {
              made: Number(result.oppTwoPointJumpersMade),
              attempted: Number(result.oppTwoPointJumperAttempts),
              pct: result.oppTwoPointJumperAttempts
                ? Math.round(
                    (Number(result.oppTwoPointJumpersMade) /
                      Number(result.oppTwoPointJumperAttempts)) *
                      1000,
                  ) / 10
                : 0,
            },
          },
          threePointers: {
            made: Number(result.oppThreePointJumpersMade),
            attempted: Number(result.oppThreePointJumperAttempts),
            pct: result.oppThreePointJumperAttempts
              ? Math.round(
                  (Number(result.oppThreePointJumpersMade) /
                    Number(result.oppThreePointJumperAttempts)) *
                    1000,
                ) / 10
              : 0,
          },
          fourFactors: {
            effectiveFieldGoalPct: result.oppFieldGoalsAttempted
              ? Math.round(
                  (1000 *
                    (Number(result.oppFieldGoalsMade) +
                      0.5 * Number(result.oppThreePointJumpersMade))) /
                    Number(result.oppFieldGoalsAttempted),
                ) / 10
              : 0,
            turnoverRatio: result.oppPossessions
              ? Math.round(
                  100 *
                    (Number(result.oppTurnovers) /
                      Number(result.oppPossessions)),
                ) / 100
              : 0,
            offensiveReboundPct: result.oppOffensiveRebounds
              ? Math.round(
                  1000 *
                    (Number(result.oppOffensiveRebounds) /
                      (Number(result.oppDefensiveRebounds) |
                        Number(result.oppOffensiveRebounds))),
                ) / 10
              : 0,
            freeThrowRate: result.oppFieldGoalsAttempted
              ? Math.round(
                  1000 *
                    (Number(result.oppFreeThrowAttempts) /
                      Number(result.oppFieldGoalsAttempted)),
                ) / 10
              : 0,
          },
        },
      };
    });
};

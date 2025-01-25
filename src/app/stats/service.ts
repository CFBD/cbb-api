import { GameStatus, SeasonType } from '../enums';
import { TeamSeasonStats } from './types';

import { db } from '../../config/database';
import { sql } from 'kysely';
import { ValidateError } from 'tsoa';

export const getTeamSeasonStats = async (
  season?: number,
  seasonType?: SeasonType,
  team?: string,
  conference?: string,
  startDateRange?: Date,
  endDateRange?: Date,
): Promise<TeamSeasonStats[]> => {
  if (!season && !team) {
    throw new ValidateError(
      {
        season: {
          value: season,
          message: 'season required when team not specified',
        },
        team: {
          value: team,
          message: 'team required when season not specified',
        },
      },
      'Validation error',
    );
  }

  let query = db
    .selectFrom('game')
    .innerJoin('gameTeam', 'game.id', 'gameTeam.gameId')
    .innerJoin('team', 'gameTeam.teamId', 'team.id')
    .innerJoin('gameTeamStats', 'gameTeam.id', 'gameTeamStats.gameTeamId')
    .innerJoin('gameTeam as oppTeam', (join) =>
      join
        .onRef('game.id', '=', 'oppTeam.gameId')
        .onRef('oppTeam.id', '<>', 'gameTeam.id'),
    )
    .innerJoin('gameTeamStats as oppStats', 'oppStats.gameTeamId', 'oppTeam.id')
    .leftJoin('conferenceTeam', (join) =>
      join
        .onRef('team.id', '=', 'conferenceTeam.teamId')
        .onRef('conferenceTeam.startYear', '<=', 'game.season')
        .on((eb) =>
          eb.or([
            eb('conferenceTeam.endYear', '>=', eb.ref('game.season')),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .where((eb) =>
      eb.and({
        status: GameStatus.Final,
      }),
    )
    .groupBy([
      'game.season',
      'game.seasonLabel',
      'team.id',
      'team.school',
      'conference.abbreviation',
    ])
    .select((eb) => [
      'game.season',
      'game.seasonLabel',
      'team.id',
      'team.school',
      'conference.abbreviation',
      eb.fn.countAll().as('games'),
      eb.fn.sum('gameTeam.points').as('points'),
      eb.fn.sum('gameTeamStats.possessions').as('possessions'),
      eb.fn.sum('gameTeamStats.2pa').as('2pa'),
      eb.fn.sum('gameTeamStats.2pm').as('2pm'),
      eb.fn.sum('gameTeamStats.3pa').as('3pa'),
      eb.fn.sum('gameTeamStats.3pm').as('3pm'),
      eb.fn.sum('gameTeamStats.fta').as('fta'),
      eb.fn.sum('gameTeamStats.ftm').as('ftm'),
      eb.fn.sum('gameTeamStats.fga').as('fga'),
      eb.fn.sum('gameTeamStats.fgm').as('fgm'),
      eb.fn.sum('gameTeamStats.oreb').as('oreb'),
      eb.fn.sum('gameTeamStats.dreb').as('dreb'),
      eb.fn.sum('gameTeamStats.reb').as('reb'),
      eb.fn.sum('gameTeamStats.ast').as('ast'),
      eb.fn.sum('gameTeamStats.blk').as('blk'),
      eb.fn.sum('gameTeamStats.stl').as('stl'),
      eb.fn.sum('gameTeamStats.to').as('to'),
      eb.fn.sum('gameTeamStats.tto').as('tto'),
      eb.fn.sum('gameTeamStats.toto').as('toto'),
      eb.fn.sum('gameTeamStats.pf').as('pf'),
      eb.fn.sum('gameTeamStats.tech').as('tech'),
      eb.fn.sum('gameTeamStats.flag').as('flag'),
      eb.fn.sum('gameTeamStats.pointsFastBreak').as('pointsFastBreak'),
      eb.fn.sum('gameTeamStats.pointsInPaint').as('pointsInPaint'),
      eb.fn.sum('gameTeamStats.pointsOffTo').as('pointsOffTo'),
      eb.fn.sum('gameTeam.points').as('pointsOpp'),
      eb.fn.sum('oppStats.possessions').as('possessionsOpp'),
      eb.fn.sum('oppStats.2pa').as('2paOpp'),
      eb.fn.sum('oppStats.2pm').as('2pmOpp'),
      eb.fn.sum('oppStats.3pa').as('3paOpp'),
      eb.fn.sum('oppStats.3pm').as('3pmOpp'),
      eb.fn.sum('oppStats.fta').as('ftaOpp'),
      eb.fn.sum('oppStats.ftm').as('ftmOpp'),
      eb.fn.sum('oppStats.fga').as('fgaOpp'),
      eb.fn.sum('oppStats.fgm').as('fgmOpp'),
      eb.fn.sum('oppStats.oreb').as('orebOpp'),
      eb.fn.sum('oppStats.dreb').as('drebOpp'),
      eb.fn.sum('oppStats.reb').as('rebOpp'),
      eb.fn.sum('oppStats.ast').as('astOpp'),
      eb.fn.sum('oppStats.blk').as('blkOpp'),
      eb.fn.sum('oppStats.stl').as('stlOpp'),
      eb.fn.sum('oppStats.to').as('toOpp'),
      eb.fn.sum('oppStats.tto').as('ttoOpp'),
      eb.fn.sum('oppStats.toto').as('totoOpp'),
      eb.fn.sum('oppStats.pf').as('pfOpp'),
      eb.fn.sum('oppStats.tech').as('techOpp'),
      eb.fn.sum('oppStats.flag').as('flagOpp'),
      eb.fn.sum('oppStats.pointsFastBreak').as('pointsFastBreakOpp'),
      eb.fn.sum('oppStats.pointsInPaint').as('pointsInPaintOpp'),
      eb.fn.sum('oppStats.pointsOffTo').as('pointsOffToOpp'),
      sql<number>`SUM(case when array_length(game_team.period_points, 1) > 2 THEN 40 + array_length(game_team.period_points, 1) * 5 ELSE 40 END)`.as(
        'minutes',
      ),
    ]);

  if (season) {
    query = query.where('game.season', '=', season);
  }

  if (seasonType) {
    query = query.where('game.seasonType', '=', seasonType);
  }

  if (team) {
    query = query.where(
      (eb) => eb.fn('lower', ['team.school']),
      '=',
      team.toLowerCase(),
    );
  }

  if (conference) {
    query = query.where(
      (eb) => eb.fn('lower', ['conference.abbreviation']),
      '=',
      conference.toLowerCase(),
    );
  }

  if (startDateRange) {
    query = query.where('game.startDate', '>=', startDateRange);
  }

  if (endDateRange) {
    query = query.where('game.startDate', '<=', endDateRange);
  }

  const teams = await query.execute();

  return teams.map((team): TeamSeasonStats => {
    return {
      season: team.season,
      seasonLabel: team.seasonLabel,
      teamId: team.id,
      team: team.school,
      conference: team.abbreviation,
      totalMinutes: Number(team.minutes),
      pace:
        Math.round(
          400 *
            ((Number(team.possessions) + Number(team.possessionsOpp)) /
              (2 * Number(team.minutes))),
        ) / 10,
      offense: {
        assists: Number(team.ast),
        blocks: Number(team.blk),
        steals: Number(team.stl),
        possessions: Number(team.possessions),
        trueShooting:
          Math.round(
            (Number(team.points) /
              (2 * (Number(team.fga) + 0.44 * Number(team.fta)))) *
              10,
          ) / 10,
        rating:
          Math.round((1000 * Number(team.points)) / Number(team.possessions)) /
          10,
        fieldGoals: {
          made: Number(team.fgm),
          attempted: Number(team.fga),
          pct:
            Math.round(
              (Number(team.fgm) / (team.fga != 0 ? Number(team.fga) : 1)) *
                1000,
            ) / 10,
        },
        twoPointFieldGoals: {
          made: Number(team['2pm']),
          attempted: Number(team['2pa']),
          pct:
            Math.round(
              (Number(team.fgm) /
                (team['2pa'] != 0 ? Number(team['2pa']) : 1)) *
                1000,
            ) / 10,
        },
        threePointFieldGoals: {
          made: Number(team['3pm']),
          attempted: Number(team['3pa']),
          pct:
            Math.round(
              (Number(team['3pm']) /
                (team['3pa'] != 0 ? Number(team['3pa']) : 1)) *
                1000,
            ) / 10,
        },
        freeThrows: {
          made: Number(team.ftm),
          attempted: Number(team.fta),
          pct:
            Math.round(
              (Number(team.ftm) / (team.fta != 0 ? Number(team.fta) : 1)) *
                1000,
            ) / 10,
        },
        rebounds: {
          offensive: Number(team.oreb),
          defensive: Number(team.dreb),
          total: Number(team.reb),
        },
        turnovers: {
          total: Number(team.to),
          teamTotal: Number(team.tto),
        },
        fouls: {
          total: Number(team.pf),
          technical: Number(team.tech),
          flagrant: Number(team.flag),
        },
        points: {
          total: Number(team.points),
          inPaint: Number(team.pointsInPaint),
          offTurnovers: Number(team.pointsOffTo),
          fastBreak: Number(team.pointsFastBreak),
        },
        fourFactors: {
          effectiveFieldGoalPct:
            Math.round(
              (1000 * (Number(team.fgm) + 0.5 * Number(team['3pm']))) /
                Number(team.fga),
            ) / 10,
          turnoverRatio:
            Math.round((Number(team.to) / Number(team.possessions)) * 10) / 10,
          offensiveReboundPct:
            Math.round(1000 * (Number(team.oreb) / Number(team.reb))) / 10,
          freeThrowRate:
            Math.round(1000 * (Number(team.fta) / Number(team.fga))) / 10,
        },
      },
      defense: {
        assists: Number(team.astOpp),
        blocks: Number(team.blkOpp),
        steals: Number(team.stlOpp),
        possessions: Number(team.possessionsOpp),
        trueShooting:
          Math.round(
            (Number(team.pointsOpp) /
              (2 * (Number(team.fgaOpp) + 0.44 * Number(team.ftaOpp)))) *
              10,
          ) / 10,
        rating:
          Math.round(
            (1000 * Number(team.pointsOpp)) / Number(team.possessionsOpp),
          ) / 10,
        fieldGoals: {
          made: Number(team.fgmOpp),
          attempted: Number(team.fgaOpp),
          pct:
            Math.round(
              (Number(team.fgmOpp) /
                (team.fgaOpp != 0 ? Number(team.fgaOpp) : 1)) *
                1000,
            ) / 10,
        },
        twoPointFieldGoals: {
          made: Number(team['2pmOpp']),
          attempted: Number(team['2paOpp']),
          pct:
            Math.round(
              (Number(team.fgmOpp) /
                (team['2paOpp'] != 0 ? Number(team['2paOpp']) : 1)) *
                1000,
            ) / 10,
        },
        threePointFieldGoals: {
          made: Number(team['3pmOpp']),
          attempted: Number(team['3paOpp']),
          pct:
            Math.round(
              (Number(team['3pmOpp']) /
                (team['3paOpp'] != 0 ? Number(team['3paOpp']) : 1)) *
                1000,
            ) / 10,
        },
        freeThrows: {
          made: Number(team.ftmOpp),
          attempted: Number(team.ftaOpp),
          pct:
            Math.round(
              (Number(team.ftmOpp) /
                (team.ftaOpp != 0 ? Number(team.ftaOpp) : 1)) *
                1000,
            ) / 10,
        },
        rebounds: {
          offensive: Number(team.orebOpp),
          defensive: Number(team.drebOpp),
          total: Number(team.rebOpp),
        },
        turnovers: {
          total: Number(team.toOpp),
          teamTotal: Number(team.ttoOpp),
        },
        fouls: {
          total: Number(team.pfOpp),
          technical: Number(team.techOpp),
          flagrant: Number(team.flagOpp),
        },
        points: {
          total: Number(team.pointsOpp),
          inPaint: Number(team.pointsInPaintOpp),
          offTurnovers: Number(team.pointsOffToOpp),
          fastBreak: Number(team.pointsFastBreakOpp),
        },
        fourFactors: {
          effectiveFieldGoalPct:
            Math.round(
              (1000 * (Number(team.fgmOpp) + 0.5 * Number(team['3pmOpp']))) /
                Number(team.fgaOpp),
            ) / 10,
          turnoverRatio:
            Math.round(
              (Number(team.toOpp) / Number(team.possessionsOpp)) * 10,
            ) / 10,
          offensiveReboundPct:
            Math.round(1000 * (Number(team.orebOpp) / Number(team.rebOpp))) /
            10,
          freeThrowRate:
            Math.round(1000 * (Number(team.ftaOpp) / Number(team.fgaOpp))) / 10,
        },
      },
    };
  });
};

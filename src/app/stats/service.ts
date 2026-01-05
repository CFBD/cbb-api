import { GameStatus, SeasonType } from '../enums';
import {
  PlayerSeasonShootingStats,
  PlayerSeasonStats,
  SeasonShootingStats,
  TeamSeasonStats,
} from './types';

import { db } from '../../config/database';
import { sql } from 'kysely';
import { ValidateError } from 'tsoa';
import {
  calculatePlayerSeasonDefensiveRating,
  calculatePlayerSeasonOffenseRatings,
} from '../../globals/calculations';

const shootingTypes = [
  558, 572, 574, 437, 20424, 20429, 20437, 20574, 20572, 20558, 30495, 30558,
  540,
];

export const getTeamSeasonStats = async (
  season?: number,
  seasonType?: SeasonType,
  team?: string,
  conference?: string,
  startDateRange?: Date,
  endDateRange?: Date,
  tournament?: string,
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
    .innerJoin('gameTeam as oppTeam', (join) =>
      join
        .onRef('game.id', '=', 'oppTeam.gameId')
        .onRef('oppTeam.id', '<>', 'gameTeam.id'),
    )
    .leftJoin('gameTeamStats', 'gameTeam.id', 'gameTeamStats.gameTeamId')
    .leftJoin('gameTeamStats as oppStats', 'oppStats.gameTeamId', 'oppTeam.id')
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
    .leftJoin('tournament', 'game.tournamentId', 'tournament.id')
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
      eb.fn.countAll().filterWhere('gameTeam.isWinner', '=', true).as('wins'),
      eb.fn
        .countAll()
        .filterWhere('gameTeam.isWinner', '=', false)
        .as('losses'),
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
      eb.fn.sum('oppTeam.points').as('pointsOpp'),
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

  if (tournament) {
    query = query.where(
      (eb) => eb.fn('lower', ['tournament.shortName']),
      '=',
      tournament.toLowerCase(),
    );
  }

  const teams = await query.execute();

  return teams.map((team): TeamSeasonStats => {
    return {
      season: team.season,
      seasonLabel: team.seasonLabel,
      teamId: team.id,
      team: team.school,
      conference: team.abbreviation,
      games: Number(team.games),
      wins: Number(team.wins),
      losses: Number(team.losses),
      totalMinutes: Number(team.minutes),
      pace:
        Math.round(
          400 *
            ((Number(team.possessions) + Number(team.possessionsOpp)) /
              (2 * Number(team.minutes))),
        ) / 10,
      teamStats: {
        assists: Number(team.ast),
        blocks: Number(team.blk),
        steals: Number(team.stl),
        possessions: Number(team.possessions),
        trueShooting:
          Math.round(
            (Number(team.points) /
              (2 * (Number(team.fga) + 0.44 * Number(team.fta)))) *
              1000,
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
              (Number(team['2pm']) /
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
            Math.round((Number(team.to) / Number(team.possessions)) * 100) /
            100,
          offensiveReboundPct:
            Math.round(1000 * (Number(team.oreb) / Number(team.reb))) / 10,
          freeThrowRate:
            Math.round(1000 * (Number(team.fta) / Number(team.fga))) / 10,
        },
      },
      opponentStats: {
        assists: Number(team.astOpp),
        blocks: Number(team.blkOpp),
        steals: Number(team.stlOpp),
        possessions: Number(team.possessionsOpp),
        trueShooting:
          Math.round(
            (Number(team.pointsOpp) /
              (2 * (Number(team.fgaOpp) + 0.44 * Number(team.ftaOpp)))) *
              1000,
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
              (Number(team['2pmOpp']) /
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
              (Number(team.toOpp) / Number(team.possessionsOpp)) * 100,
            ) / 100,
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

export const getPlayerSeasonStats = async (
  season: number,
  seasonType?: SeasonType,
  team?: string,
  conference?: string,
  startDateRange?: Date,
  endDateRange?: Date,
  tournament?: string,
): Promise<PlayerSeasonStats[]> => {
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
    .innerJoin('gamePlayerStats', 'gameTeam.id', 'gamePlayerStats.gameTeamId')
    .innerJoin('athlete', 'gamePlayerStats.athleteId', 'athlete.id')
    .innerJoin('position', 'athlete.positionId', 'position.id')
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
    .leftJoin('tournament', 'game.tournamentId', 'tournament.id')
    .where((eb) =>
      eb.and({
        status: GameStatus.Final,
        season,
      }),
    )
    .where('gamePlayerStats.minutes', 'is not', null)
    .groupBy([
      'game.season',
      'game.seasonLabel',
      'team.id',
      'team.school',
      'conference.abbreviation',
      'athlete.id',
      'athlete.sourceId',
      'athlete.name',
      'position.abbreviation',
    ])
    .select((eb) => [
      'game.season',
      'game.seasonLabel',
      'team.id as teamId',
      'team.school',
      'conference.abbreviation as conference',
      'athlete.id',
      'athlete.sourceId',
      'athlete.name',
      'position.abbreviation as position',
      eb.fn.countAll().as('games'),
      eb.fn.sum('gameTeam.points').as('pointsTeam'),
      eb.fn.sum('gameTeamStats.possessions').as('possessionsTeam'),
      eb.fn.sum('gameTeamStats.2pa').as('2paTeam'),
      eb.fn.sum('gameTeamStats.2pm').as('2pmTeam'),
      eb.fn.sum('gameTeamStats.3pa').as('3paTeam'),
      eb.fn.sum('gameTeamStats.3pm').as('3pmTeam'),
      eb.fn.sum('gameTeamStats.fta').as('ftaTeam'),
      eb.fn.sum('gameTeamStats.ftm').as('ftmTeam'),
      eb.fn.sum('gameTeamStats.fga').as('fgaTeam'),
      eb.fn.sum('gameTeamStats.fgm').as('fgmTeam'),
      eb.fn.sum('gameTeamStats.oreb').as('orebTeam'),
      eb.fn.sum('gameTeamStats.dreb').as('drebTeam'),
      eb.fn.sum('gameTeamStats.reb').as('rebTeam'),
      eb.fn.sum('gameTeamStats.ast').as('astTeam'),
      eb.fn.sum('gameTeamStats.blk').as('blkTeam'),
      eb.fn.sum('gameTeamStats.stl').as('stlTeam'),
      eb.fn.sum('gameTeamStats.to').as('toTeam'),
      eb.fn.sum('gameTeamStats.tto').as('ttoTeam'),
      eb.fn.sum('gameTeamStats.toto').as('totoTeam'),
      eb.fn.sum('gameTeamStats.pf').as('pfTeam'),
      eb.fn.sum('oppTeam.points').as('pointsOpp'),
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
      sql<number>`SUM(case when array_length(game_team.period_points, 1) > 2 THEN 40 + array_length(game_team.period_points, 1) * 5 ELSE 40 END)`.as(
        'teamMinutes',
      ),
      eb.fn
        .countAll()
        .filterWhere('gamePlayerStats.starter', '=', true)
        .as('starts'),
      eb.fn.sum('gamePlayerStats.minutes').as('minutes'),
      eb.fn.sum('gamePlayerStats.points').as('points'),
      eb.fn.sum('gamePlayerStats.fga').as('fga'),
      eb.fn.sum('gamePlayerStats.fgm').as('fgm'),
      eb.fn.sum('gamePlayerStats.2pa').as('2pa'),
      eb.fn.sum('gamePlayerStats.2pm').as('2pm'),
      eb.fn.sum('gamePlayerStats.3pa').as('3pa'),
      eb.fn.sum('gamePlayerStats.3pm').as('3pm'),
      eb.fn.sum('gamePlayerStats.fta').as('fta'),
      eb.fn.sum('gamePlayerStats.ftm').as('ftm'),
      eb.fn.sum('gamePlayerStats.oreb').as('oreb'),
      eb.fn.sum('gamePlayerStats.dreb').as('dreb'),
      eb.fn.sum('gamePlayerStats.reb').as('reb'),
      eb.fn.sum('gamePlayerStats.ast').as('ast'),
      eb.fn.sum('gamePlayerStats.blk').as('blk'),
      eb.fn.sum('gamePlayerStats.stl').as('stl'),
      eb.fn.sum('gamePlayerStats.to').as('to'),
      eb.fn.sum('gamePlayerStats.pf').as('pf'),
    ]);

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

  if (tournament) {
    query = query.where(
      (eb) => eb.fn('lower', ['tournament.shortName']),
      '=',
      tournament.toLowerCase(),
    );
  }

  const players = await query.execute();

  return players.map((player): PlayerSeasonStats => {
    const teamPace =
      40 *
      ((Number(player.possessionsTeam) + Number(player.possessionsOpp)) /
        (2 * player.teamMinutes));

    const offensiveRatings = calculatePlayerSeasonOffenseRatings(player);
    const marginalOffense =
      offensiveRatings.pointsProduced -
      0.875 * 1.05 * offensiveRatings.possessions;
    const marginalOffensivePointsPerWin = 0.5 * 71 * (teamPace / 66.3);
    const offensiveWinShares =
      Math.round((10 * marginalOffense) / marginalOffensivePointsPerWin) / 10;

    const defensiveRating = calculatePlayerSeasonDefensiveRating(player);
    const marginalDefense =
      (Number(player.minutes) / (Number(player.teamMinutes) * 5)) *
      Number(player.possessionsOpp) *
      (1.125 * 1.05 - defensiveRating / 100);
    const marginalDefensivePointsPerWin = 0.5 * 71 * (teamPace / 66.3);
    const defensiveWinShares =
      Math.round((10 * marginalDefense) / marginalDefensivePointsPerWin) / 10;

    const netRating =
      Math.round((offensiveRatings.offensiveRating - defensiveRating) * 10) /
      10;
    const usage =
      Math.round(
        1000 *
          (((Number(player.fga) +
            0.44 * Number(player.fta) +
            Number(player.to)) *
            Number(player.teamMinutes)) /
            (Number(player.minutes) *
              (Number(player.fgaTeam) +
                0.44 * Number(player.ftaTeam) +
                Number(player.toTeam)))),
      ) / 10;

    const PORPAG =
      Math.round(
        ((offensiveRatings.offensiveRating - 88) *
          (usage / 100) *
          66 *
          (Number(player.minutes) / Number(player.teamMinutes))) /
          10,
      ) / 10;

    return {
      season: player.season,
      seasonLabel: player.seasonLabel,
      teamId: player.teamId,
      team: player.school,
      conference: player.conference,
      athleteId: player.id,
      athleteSourceId: player.sourceId,
      name: player.name,
      position: player.position,
      games: Number(player.games),
      starts: Number(player.starts),
      minutes: Number(player.minutes),
      points: Number(player.points),
      turnovers: Number(player.to),
      fouls: Number(player.pf),
      assists: Number(player.ast),
      steals: Number(player.stl),
      blocks: Number(player.blk),
      offensiveRating: offensiveRatings.offensiveRating,
      defensiveRating,
      netRating,
      PORPAG,
      usage,
      assistsTurnoverRatio:
        player.to != 0
          ? Math.round((Number(player.ast) / Number(player.to)) * 100) / 100
          : null,
      offensiveReboundPct:
        player.reb != 0
          ? Math.round((Number(player.oreb) * 1000) / Number(player.reb)) / 10
          : null,
      freeThrowRate:
        player.fga != 0
          ? Math.round((Number(player.fta) * 1000) / Number(player.fga)) / 10
          : null,
      effectiveFieldGoalPct:
        player.fga != 0
          ? Math.round(
              (1000 * (Number(player.fgm) + 0.5 * Number(player['3pm']))) /
                Number(player.fga),
            ) / 10
          : null,
      trueShootingPct:
        Math.round(
          (Number(player.points) /
            (2 * (Number(player.fga) + 0.44 * Number(player.fta)))) *
            1000,
        ) / 1000,
      fieldGoals: {
        made: Number(player.fgm),
        attempted: Number(player.fga),
        pct:
          Math.round(
            (Number(player.fgm) / (player.fga != 0 ? Number(player.fga) : 1)) *
              1000,
          ) / 10,
      },
      twoPointFieldGoals: {
        made: Number(player['2pm']),
        attempted: Number(player['2pa']),
        pct:
          Math.round(
            (Number(player['2pm']) /
              (player['2pa'] != 0 ? Number(player['2pa']) : 1)) *
              1000,
          ) / 10,
      },
      threePointFieldGoals: {
        made: Number(player['3pm']),
        attempted: Number(player['3pa']),
        pct:
          Math.round(
            (Number(player['3pm']) /
              (player['3pa'] != 0 ? Number(player['3pa']) : 1)) *
              1000,
          ) / 10,
      },
      freeThrows: {
        made: Number(player.ftm),
        attempted: Number(player.fta),
        pct:
          Math.round(
            (Number(player.ftm) / (player.fta != 0 ? Number(player.fta) : 1)) *
              1000,
          ) / 10,
      },
      rebounds: {
        offensive: Number(player.oreb),
        defensive: Number(player.dreb),
        total: Number(player.reb),
      },
      winShares: {
        offensive: offensiveWinShares,
        defensive: defensiveWinShares,
        total: Math.round(10 * (offensiveWinShares + defensiveWinShares)) / 10,
        totalPer40:
          Math.round(
            (40000 * (offensiveWinShares + defensiveWinShares)) /
              Number(player.minutes ?? 0),
          ) / 1000,
      },
    };
  });
};

export const getTeamSeasonShootingStats = async (
  season: number,
  seasonType?: SeasonType,
  team?: string,
  conference?: string,
  startDateRange?: Date,
  endDateRange?: Date,
): Promise<SeasonShootingStats[]> => {
  if (!team && !conference) {
    throw new ValidateError(
      {
        team: {
          value: team,
          message: 'Either team or conference parameter is required',
        },
        conference: {
          value: conference,
          message: 'Either team or conference parameter is required',
        },
      },
      'Validation error',
    );
  }

  let query = db
    .selectFrom('team')
    .innerJoin('gameTeam', 'team.id', 'gameTeam.teamId')
    .innerJoin('game', 'gameTeam.gameId', 'game.id')
    .innerJoin('conferenceTeam', (join) =>
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
    .innerJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .innerJoin('play', (join) =>
      join
        .onRef('game.id', '=', 'play.gameId')
        .onRef('team.id', '=', 'play.teamId')
        .on('play.playTypeId', 'in', shootingTypes),
    )
    .innerJoin('playType', 'play.playTypeId', 'playType.id')
    .where('game.season', '=', season)
    .groupBy([
      'game.season',
      'team.id',
      'team.school',
      'conference.abbreviation',
    ])
    .select([
      'game.season',
      'team.id as teamId',
      'team.school as team',
      'conference.abbreviation as conference',
    ])
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('playType.name', '=', 'DunkShot')
        .as('dunkAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', '=', 'DunkShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('dunksMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', '=', 'DunkShot'),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('dunksAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('playType.name', 'in', ['LayUpShot', 'LayupShot'])
        .as('layupAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', 'in', ['LayUpShot', 'LayupShot']),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('layupsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', 'in', ['LayUpShot', 'LayupShot']),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('layupsAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('playType.name', '=', 'TipShot')
        .as('tipShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
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
            qb('playType.name', 'in', ['JumpShot', 'RegularJumpShot']),
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
            qb('playType.name', 'in', ['JumpShot', 'RegularJumpShot']),
            qb('play.scoreValue', '=', 2),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('twoPointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', 'in', ['JumpShot', 'RegularJumpShot']),
            qb('play.scoreValue', '=', 2),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('twoPointJumpersAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.playTypeId', 'in', [558, 30558, 30495]),
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
            qb('play.playTypeId', 'in', [558, 30558, 30495]),
            qb('play.scoreValue', '=', 3),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('threePointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.playTypeId', 'in', [558, 30558, 30495]),
            qb('play.scoreValue', '=', 3),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('threePointJumpersAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('play.playTypeId', '=', 540)
        .as('freeThrowAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.playTypeId', '=', 540),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('freeThrowsMade'),
    );

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
  return teams.map((team): SeasonShootingStats => {
    const trackedShots =
      Number(team.dunkAttempts) +
      Number(team.layupAttempts) +
      Number(team.tipShotAttempts) +
      Number(team.twoPointJumperAttempts) +
      Number(team.threePointJumperAttempts);

    return {
      season: team.season,
      teamId: team.teamId,
      team: team.team,
      conference: team.conference,
      trackedShots: Number(trackedShots),
      freeThrowRate:
        Number(trackedShots) > 0
          ? Math.round(
              (1000 * Number(team.freeThrowAttempts ?? 0)) /
                Number(trackedShots),
            ) / 10
          : 0,
      assistedPct:
        Number(trackedShots) > 0
          ? Math.round(
              ((Number(team.dunksAssisted) +
                Number(team.layupsAssisted) +
                Number(team.twoPointJumpersAssisted) +
                Number(team.threePointJumpersAssisted)) /
                Number(trackedShots)) *
                1000,
            ) / 10
          : 0,
      dunks: {
        attempted: Number(team.dunkAttempts),
        made: Number(team.dunksMade),
        pct:
          Number(team.dunkAttempts) > 0
            ? Math.round(
                (Number(team.dunksMade) / Number(team.dunkAttempts)) * 1000,
              ) / 10
            : 0,
        assisted: Number(team.dunksAssisted),
        assistedPct:
          Number(team.dunksMade) > 0
            ? Math.round(
                (Number(team.dunksAssisted) / Number(team.dunksMade)) * 1000,
              ) / 10
            : 0,
      },
      layups: {
        attempted: Number(team.layupAttempts),
        made: Number(team.layupsMade),
        pct:
          Number(team.layupAttempts) > 0
            ? Math.round(
                (Number(team.layupsMade) / Number(team.layupAttempts)) * 1000,
              ) / 10
            : 0,
        assisted: Number(team.layupsAssisted),
        assistedPct:
          Number(team.layupsMade) > 0
            ? Math.round(
                (Number(team.layupsAssisted) / Number(team.layupsMade)) * 1000,
              ) / 10
            : 0,
      },
      tipIns: {
        attempted: Number(team.tipShotAttempts),
        made: Number(team.tipShotsMade),
        pct:
          Number(team.tipShotAttempts) > 0
            ? Math.round(
                (Number(team.tipShotsMade) / Number(team.tipShotAttempts)) *
                  1000,
              ) / 10
            : 0,
      },
      twoPointJumpers: {
        attempted: Number(team.twoPointJumperAttempts),
        made: Number(team.twoPointJumpersMade),
        pct:
          Number(team.twoPointJumperAttempts) > 0
            ? Math.round(
                (Number(team.twoPointJumpersMade) /
                  Number(team.twoPointJumperAttempts)) *
                  1000,
              ) / 10
            : 0,
        assisted: Number(team.twoPointJumpersAssisted),
        assistedPct:
          Number(team.twoPointJumpersMade) > 0
            ? Math.round(
                (Number(team.twoPointJumpersAssisted) /
                  Number(team.twoPointJumpersMade)) *
                  1000,
              ) / 10
            : 0,
      },
      threePointJumpers: {
        attempted: Number(team.threePointJumperAttempts),
        made: Number(team.threePointJumpersMade),
        pct:
          Number(team.threePointJumperAttempts) > 0
            ? Math.round(
                (Number(team.threePointJumpersMade) /
                  Number(team.threePointJumperAttempts)) *
                  1000,
              ) / 10
            : 0,
        assisted: Number(team.threePointJumpersAssisted),
        assistedPct:
          Number(team.threePointJumpersMade) > 0
            ? Math.round(
                (Number(team.threePointJumpersAssisted) /
                  Number(team.threePointJumpersMade)) *
                  1000,
              ) / 10
            : 0,
      },
      freeThrows: {
        attempted: Number(team.freeThrowAttempts),
        made: Number(team.freeThrowsMade),
        pct:
          Number(team.freeThrowAttempts) > 0
            ? Math.round(
                (Number(team.freeThrowsMade) / Number(team.freeThrowAttempts)) *
                  1000,
              ) / 10
            : 0,
      },
      attemptsBreakdown: {
        dunks:
          Math.round(
            (Number(team.dunkAttempts) / Number(trackedShots)) * 1000,
          ) / 10,
        layups:
          Math.round(
            (Number(team.layupAttempts) / Number(trackedShots)) * 1000,
          ) / 10,
        tipIns:
          Math.round(
            (Number(team.tipShotAttempts) / Number(trackedShots)) * 1000,
          ) / 10,
        twoPointJumpers:
          Math.round(
            (Number(team.twoPointJumperAttempts) / Number(trackedShots)) * 1000,
          ) / 10,
        threePointJumpers:
          Math.round(
            (Number(team.threePointJumperAttempts) / Number(trackedShots)) *
              1000,
          ) / 10,
      },
    };
  });
};

export const getPlayerSeasonShootingStats = async (
  season: number,
  seasonType?: SeasonType,
  team?: string,
  conference?: string,
  startDateRange?: Date,
  endDateRange?: Date,
): Promise<PlayerSeasonShootingStats[]> => {
  if (!team && !conference) {
    throw new ValidateError(
      {
        team: {
          value: team,
          message: 'Either team or conference parameter is required',
        },
        conference: {
          value: conference,
          message: 'Either team or conference parameter is required',
        },
      },
      'Validation error',
    );
  }

  let query = db
    .selectFrom('team')
    .innerJoin('gameTeam', 'team.id', 'gameTeam.teamId')
    .innerJoin('game', 'gameTeam.gameId', 'game.id')
    .innerJoin('conferenceTeam', (join) =>
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
    .innerJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .innerJoin('play', (join) =>
      join
        .onRef('game.id', '=', 'play.gameId')
        .onRef('team.id', '=', 'play.teamId')
        .on('play.playTypeId', 'in', shootingTypes),
    )
    .innerJoin('athlete', (join) =>
      join
        .on(
          'athlete.sourceId',
          '=',
          sql<string>`ANY(play.participants:: varchar[])`,
        )
        .on((eb) =>
          eb.or([
            eb(
              'play.playText',
              'like',
              sql<string>`CONCAT('%', athlete.name, ' made %')`,
            ),
            eb(
              'play.playText',
              'like',
              sql<string>`CONCAT('%', athlete.name, ' makes %')`,
            ),
            eb(
              'play.playText',
              'like',
              sql<string>`CONCAT('%', athlete.name, ' missed %')`,
            ),
            eb(
              'play.playText',
              'like',
              sql<string>`CONCAT('%', athlete.name, ' misses %')`,
            ),
          ]),
        ),
    )
    .innerJoin('playType', 'play.playTypeId', 'playType.id')
    .where('game.season', '=', season)
    .groupBy([
      'game.season',
      'team.id',
      'team.school',
      'conference.abbreviation',
      'athlete.id',
      'athlete.name',
    ])
    .select([
      'game.season',
      'team.id as teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      'athlete.id',
      'athlete.name',
    ])
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('playType.name', '=', 'DunkShot')
        .as('dunkAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', '=', 'DunkShot'),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('dunksMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', '=', 'DunkShot'),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('dunksAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('playType.name', 'in', ['LayUpShot', 'LayupShot'])
        .as('layupAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', 'in', ['LayUpShot', 'LayupShot']),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('layupsMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', 'in', ['LayUpShot', 'LayupShot']),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('layupsAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('playType.name', '=', 'TipShot')
        .as('tipShotAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
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
            qb('playType.name', 'in', ['JumpShot', 'RegularJumpShot']),
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
            qb('playType.name', 'in', ['JumpShot', 'RegularJumpShot']),
            qb('play.scoreValue', '=', 2),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('twoPointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('playType.name', 'in', ['JumpShot', 'RegularJumpShot']),
            qb('play.scoreValue', '=', 2),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('twoPointJumpersAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.playTypeId', 'in', [558, 30558, 30495]),
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
            qb('play.playTypeId', 'in', [558, 30558, 30495]),
            qb('play.scoreValue', '=', 3),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('threePointJumpersMade'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.playTypeId', 'in', [558, 30558, 30495]),
            qb('play.scoreValue', '=', 3),
            qb('play.scoringPlay', '=', true),
            qb.or([
              qb(qb.fn('lower', ['play.playText']), 'like', '% assisted by %'),
              qb(qb.fn('lower', ['play.playText']), 'like', '% assists)'),
            ]),
          ]),
        )
        .as('threePointJumpersAssisted'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere('play.playTypeId', '=', 540)
        .as('freeThrowAttempts'),
    )
    .select((eb) =>
      eb.fn
        .countAll()
        .filterWhere((qb) =>
          qb.and([
            qb('play.playTypeId', '=', 540),
            qb('play.scoringPlay', '=', true),
          ]),
        )
        .as('freeThrowsMade'),
    );

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

  const players = await query.execute();
  return players.map((player): PlayerSeasonShootingStats => {
    const trackedShots =
      Number(player.dunkAttempts) +
      Number(player.layupAttempts) +
      Number(player.tipShotAttempts) +
      Number(player.twoPointJumperAttempts) +
      Number(player.threePointJumperAttempts);

    return {
      season: player.season,
      teamId: player.teamId,
      team: player.team,
      conference: player.conference,
      athleteId: player.id,
      athleteName: player.name,
      trackedShots: Number(trackedShots),
      freeThrowRate:
        Number(trackedShots) > 0
          ? Math.round(
              (1000 * Number(player.freeThrowAttempts ?? 0)) /
                Number(trackedShots),
            ) / 10
          : 0,
      assistedPct:
        Number(trackedShots) > 0
          ? Math.round(
              ((Number(player.dunksAssisted) +
                Number(player.layupsAssisted) +
                Number(player.twoPointJumpersAssisted) +
                Number(player.threePointJumpersAssisted)) /
                Number(trackedShots)) *
                1000,
            ) / 10
          : 0,
      dunks: {
        attempted: Number(player.dunkAttempts),
        made: Number(player.dunksMade),
        pct:
          Number(player.dunkAttempts) > 0
            ? Math.round(
                (Number(player.dunksMade) / Number(player.dunkAttempts)) * 1000,
              ) / 10
            : 0,
        assisted: Number(player.dunksAssisted),
        assistedPct:
          Number(player.dunksMade) > 0
            ? Math.round(
                (Number(player.dunksAssisted) / Number(player.dunksMade)) *
                  1000,
              ) / 10
            : 0,
      },
      layups: {
        attempted: Number(player.layupAttempts),
        made: Number(player.layupsMade),
        pct:
          Number(player.layupAttempts) > 0
            ? Math.round(
                (Number(player.layupsMade) / Number(player.layupAttempts)) *
                  1000,
              ) / 10
            : 0,
        assisted: Number(player.layupsAssisted),
        assistedPct:
          Number(player.layupsMade) > 0
            ? Math.round(
                (Number(player.layupsAssisted) / Number(player.layupsMade)) *
                  1000,
              ) / 10
            : 0,
      },
      tipIns: {
        attempted: Number(player.tipShotAttempts),
        made: Number(player.tipShotsMade),
        pct:
          Number(player.tipShotAttempts) > 0
            ? Math.round(
                (Number(player.tipShotsMade) / Number(player.tipShotAttempts)) *
                  1000,
              ) / 10
            : 0,
      },
      twoPointJumpers: {
        attempted: Number(player.twoPointJumperAttempts),
        made: Number(player.twoPointJumpersMade),
        pct:
          Number(player.twoPointJumperAttempts) > 0
            ? Math.round(
                (Number(player.twoPointJumpersMade) /
                  Number(player.twoPointJumperAttempts)) *
                  1000,
              ) / 10
            : 0,
        assisted: Number(player.twoPointJumpersAssisted),
        assistedPct:
          Number(player.twoPointJumpersMade) > 0
            ? Math.round(
                (Number(player.twoPointJumpersAssisted) /
                  Number(player.twoPointJumpersMade)) *
                  1000,
              ) / 10
            : 0,
      },
      threePointJumpers: {
        attempted: Number(player.threePointJumperAttempts),
        made: Number(player.threePointJumpersMade),
        pct:
          Number(player.threePointJumperAttempts) > 0
            ? Math.round(
                (Number(player.threePointJumpersMade) /
                  Number(player.threePointJumperAttempts)) *
                  1000,
              ) / 10
            : 0,
        assisted: Number(player.threePointJumpersAssisted),
        assistedPct:
          Number(player.threePointJumpersMade) > 0
            ? Math.round(
                (Number(player.threePointJumpersAssisted) /
                  Number(player.threePointJumpersMade)) *
                  1000,
              ) / 10
            : 0,
      },
      freeThrows: {
        attempted: Number(player.freeThrowAttempts),
        made: Number(player.freeThrowsMade),
        pct:
          Number(player.freeThrowAttempts) > 0
            ? Math.round(
                (Number(player.freeThrowsMade) /
                  Number(player.freeThrowAttempts)) *
                  1000,
              ) / 10
            : 0,
      },
      attemptsBreakdown: {
        dunks:
          Math.round(
            (Number(player.dunkAttempts) / Number(trackedShots)) * 1000,
          ) / 10,
        layups:
          Math.round(
            (Number(player.layupAttempts) / Number(trackedShots)) * 1000,
          ) / 10,
        tipIns:
          Math.round(
            (Number(player.tipShotAttempts) / Number(trackedShots)) * 1000,
          ) / 10,
        twoPointJumpers:
          Math.round(
            (Number(player.twoPointJumperAttempts) / Number(trackedShots)) *
              1000,
          ) / 10,
        threePointJumpers:
          Math.round(
            (Number(player.threePointJumperAttempts) / Number(trackedShots)) *
              1000,
          ) / 10,
      },
    };
  });
};

import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { GameStatus, SeasonType } from '../enums';
import { db } from '../../config/database';
import {
  GameBoxScorePlayers,
  GameBoxScoreTeam,
  GameInfo,
  GameMediaInfo,
} from './types';
import {
  getPlayerDefensiveRating,
  getPlayerOffensiveRatings,
  getUsage,
} from '../../globals/calculations';

export const getGames = async (
  startDateRange?: Date,
  endDateRange?: Date,
  team?: string,
  conference?: string,
  season?: number,
  seasonType?: SeasonType,
  status?: GameStatus,
): Promise<GameInfo[]> => {
  let query = db
    .selectFrom('gameInfo as game')
    .leftJoin('venue', 'venue.id', 'game.venueId')
    .select([
      'game.id',
      'game.sourceId',
      'game.seasonLabel',
      'game.season',
      'game.seasonType',
      'game.startDate',
      'game.startTimeTbd',
      'game.neutralSite',
      'game.conferenceGame',
      'game.gameType',
      'game.status',
      'game.attendance',
      'game.homeTeamId',
      'game.homeTeam',
      'game.homeConferenceId',
      'game.homeConference',
      'game.homePoints',
      'game.homePeriodPoints',
      'game.homeWinner',
      'game.awayTeamId',
      'game.awayTeam',
      'game.awayConferenceId',
      'game.awayConference',
      'game.awayPoints',
      'game.awayPeriodPoints',
      'game.awayWinner',
      'venue.id as venueId',
      'venue.name as venue',
      'venue.city',
      'venue.state',
      'game.excitement',
    ])
    .orderBy('game.startDate', 'asc')
    .limit(3000);

  if (startDateRange) {
    query = query.where('game.startDate', '>=', startDateRange);
  }

  if (endDateRange) {
    query = query.where('game.startDate', '<=', endDateRange);
  }

  if (team) {
    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['game.homeTeam']), '=', team.toLowerCase()),
        eb(eb.fn('lower', ['game.awayTeam']), '=', team.toLowerCase()),
      ]),
    );
  }

  if (conference) {
    query = query.where((eb) =>
      eb.or([
        eb(
          eb.fn('lower', ['game.homeConference']),
          '=',
          conference.toLowerCase(),
        ),
        eb(
          eb.fn('lower', ['game.awayConference']),
          '=',
          conference.toLowerCase(),
        ),
      ]),
    );
  }

  if (season) {
    query = query.where('game.season', '=', season);
  }

  if (seasonType) {
    query = query.where('game.seasonType', '=', seasonType);
  }

  if (status) {
    query = query.where('game.status', '=', status);
  }

  const games = await query.execute();

  return games.map((game) => ({
    id: game.id,
    sourceId: game.sourceId,
    seasonLabel: game.seasonLabel,
    season: game.season,
    seasonType: game.seasonType as SeasonType,
    startDate: game.startDate,
    startTimeTbd: game.startTimeTbd,
    neutralSite: game.neutralSite,
    conferenceGame: game.conferenceGame,
    gameType: game.gameType,
    status: game.status as GameStatus,
    attendance: game.attendance,
    homeTeamId: game.homeTeamId ?? -1,
    homeTeam: game.homeTeam ?? '',
    homeConferenceId: game.homeConferenceId,
    homeConference: game.homeConference,
    homePoints: game.homePoints,
    homePeriodPoints: game.homePeriodPoints,
    homeWinner: game.homeWinner,
    awayTeamId: game.awayTeamId ?? -1,
    awayTeam: game.awayTeam ?? '',
    awayConferenceId: game.awayConferenceId,
    awayConference: game.awayConference,
    awayPoints: game.awayPoints,
    awayPeriodPoints: game.awayPeriodPoints,
    awayWinner: game.awayWinner,
    excitement: game.excitement
      ? Math.round(Number(game.excitement) * 10) / 10
      : null,
    venueId: game.venueId,
    venue: game.venue,
    city: game.city,
    state: game.state,
  }));
};

export const getBroadcasts = async (
  startDateRange?: Date,
  endDateRange?: Date,
  team?: string,
  conference?: string,
  season?: number,
  seasonType?: SeasonType,
): Promise<GameMediaInfo[]> => {
  let query = db
    .selectFrom('gameInfo')
    .select((eb) => [
      'gameInfo.id as gameId',
      'gameInfo.season',
      'gameInfo.seasonLabel',
      'gameInfo.seasonType',
      'gameInfo.startDate',
      'gameInfo.startTimeTbd',
      'gameInfo.homeTeamId',
      'gameInfo.homeTeam',
      'gameInfo.homeConference',
      'gameInfo.awayTeamId',
      'gameInfo.awayTeam',
      'gameInfo.awayConference',
      'gameInfo.neutralSite',
      'gameInfo.conferenceGame',
      'gameInfo.gameType',
      'gameInfo.notes',
      jsonArrayFrom(
        eb
          .selectFrom('gameMedia')
          .whereRef('gameMedia.gameId', '=', 'gameInfo.id')
          .select([
            'gameMedia.mediaType as broadcastType',
            'gameMedia.name as broadcastName',
          ])
          .distinct(),
      ).as('broadcasts'),
    ])
    .orderBy('gameInfo.startDate', 'asc')
    .limit(3000);

  if (startDateRange) {
    query = query.where('gameInfo.startDate', '>=', startDateRange);
  }

  if (endDateRange) {
    query = query.where('gameInfo.startDate', '<=', endDateRange);
  }

  if (team) {
    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['gameInfo.homeTeam']), '=', team.toLowerCase()),
        eb(eb.fn('lower', ['gameInfo.awayTeam']), '=', team.toLowerCase()),
      ]),
    );
  }

  if (conference) {
    query = query.where((eb) =>
      eb.or([
        eb(
          eb.fn('lower', ['gameInfo.homeConference']),
          '=',
          conference.toLowerCase(),
        ),
        eb(
          eb.fn('lower', ['gameInfo.awayConference']),
          '=',
          conference.toLowerCase(),
        ),
      ]),
    );
  }

  if (season) {
    query = query.where('gameInfo.season', '=', season);
  }

  if (seasonType) {
    query = query.where('gameInfo.seasonType', '=', seasonType);
  }

  const games = await query.execute();
  // @ts-ignore
  return games;
};

export const getGameTeamStatistics = async (
  startDateRange?: Date,
  endDateRange?: Date,
  team?: string,
  conference?: string,
  season?: number,
  seasonType?: SeasonType,
): Promise<GameBoxScoreTeam[]> => {
  let query = db
    .selectFrom('game')
    .innerJoin('gameTeam', 'game.id', 'gameTeam.gameId')
    .innerJoin('team', 'gameTeam.teamId', 'team.id')
    .innerJoin('gameTeamStats', 'gameTeam.id', 'gameTeamStats.gameTeamId')
    .innerJoin('gameTeam as gt2', (join) =>
      join
        .onRef('game.id', '=', 'gt2.gameId')
        .onRef('gameTeam.id', '<>', 'gt2.id'),
    )
    .innerJoin('team as t2', 'gt2.teamId', 't2.id')
    .innerJoin('gameTeamStats as gts2', 'gt2.id', 'gts2.gameTeamId')
    .leftJoin('conferenceTeam', (join) =>
      join
        .onRef('team.id', '=', 'conferenceTeam.teamId')
        .onRef('game.season', '>=', 'conferenceTeam.startYear')
        .on((eb) =>
          eb.or([
            eb('game.season', '<=', eb.ref('conferenceTeam.endYear')),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference', 'conferenceTeam.conferenceId', 'conference.id')
    .leftJoin('conferenceTeam as ct2', (join) =>
      join
        .onRef('t2.id', '=', 'ct2.teamId')
        .onRef('game.season', '>=', 'ct2.startYear')
        .on((eb) =>
          eb.or([
            eb('game.season', '<=', eb.ref('ct2.endYear')),
            eb('ct2.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference as c2', 'ct2.conferenceId', 'c2.id')
    .select([
      'game.id',
      'game.season',
      'game.seasonLabel',
      'game.seasonType',
      'game.startDate',
      'game.startTimeTbd',
      'team.id as teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      't2.id as opponentId',
      't2.school as opponent',
      'c2.abbreviation as opponentConference',
      'game.neutralSite',
      'game.conferenceGame',
      'game.gameType',
      'game.notes',
      'gameTeam.points',
      'gameTeam.periodPoints',
      'gt2.points as opponentPoints',
      'gt2.periodPoints as opponentPeriodPoints',
      'gameTeamStats.2pm',
      'gameTeamStats.2pa',
      'gameTeamStats.2pPct',
      'gameTeamStats.3pm',
      'gameTeamStats.3pa',
      'gameTeamStats.3pPct',
      'gameTeamStats.ftm',
      'gameTeamStats.fta',
      'gameTeamStats.ftPct',
      'gameTeamStats.fgm',
      'gameTeamStats.fga',
      'gameTeamStats.fgPct',
      'gameTeamStats.oreb',
      'gameTeamStats.dreb',
      'gameTeamStats.reb',
      'gameTeamStats.ast',
      'gameTeamStats.stl',
      'gameTeamStats.blk',
      'gameTeamStats.to',
      'gameTeamStats.tto',
      'gameTeamStats.toto',
      'gameTeamStats.pf',
      'gameTeamStats.tech',
      'gameTeamStats.flag',
      'gameTeamStats.possessions',
      'gameTeamStats.pointsFastBreak',
      'gameTeamStats.pointsInPaint',
      'gameTeamStats.pointsOffTo',
      'gameTeamStats.trueShooting',
      'gameTeamStats.efg',
      'gameTeamStats.largestLead',
      'gts2.2pm as opponent2pm',
      'gts2.2pa as opponent2pa',
      'gts2.2pPct as opponent2pPct',
      'gts2.3pm as opponent3pm',
      'gts2.3pa as opponent3pa',
      'gts2.3pPct as opponent3pPct',
      'gts2.ftm as opponentFtm',
      'gts2.fta as opponentFta',
      'gts2.ftPct as opponentFtPct',
      'gts2.fgm as opponentFgm',
      'gts2.fga as opponentFga',
      'gts2.fgPct as opponentFgPct',
      'gts2.oreb as opponentOreb',
      'gts2.dreb as opponentDreb',
      'gts2.reb as opponentReb',
      'gts2.ast as opponentAst',
      'gts2.stl as opponentStl',
      'gts2.blk as opponentBlk',
      'gts2.to as opponentTo',
      'gts2.tto as opponentTto',
      'gts2.toto as opponentToto',
      'gts2.pf as opponentPf',
      'gts2.tech as opponentTech',
      'gts2.flag as opponentFlag',
      'gts2.possessions as opponentPossessions',
      'gts2.pointsFastBreak as opponentPointsFastBreak',
      'gts2.pointsInPaint as opponentPointsInPaint',
      'gts2.pointsOffTo as opponentPointsOffTo',
      'gts2.trueShooting as opponentTrueShooting',
      'gts2.efg as opponentEfg',
      'gts2.largestLead as opponentLargestLead',
    ])
    .orderBy('game.startDate', 'asc')
    .limit(3000);

  if (startDateRange) {
    query = query.where('game.startDate', '>=', startDateRange);
  }

  if (endDateRange) {
    query = query.where('game.startDate', '<=', endDateRange);
  }

  if (team) {
    query = query.where(
      (eb) => eb.fn('lower', ['team.school']),
      '=',
      team.toLowerCase(),
    );
  }

  if (conference) {
    query = query.where((eb) =>
      eb(
        eb.fn('lower', ['conference.abbreviation']),
        '=',
        conference.toLowerCase(),
      ),
    );
  }

  if (season) {
    query = query.where('game.season', '=', season);
  }

  if (seasonType) {
    query = query.where('game.seasonType', '=', seasonType);
  }

  const games = await query.execute();

  return games.map((game): GameBoxScoreTeam => {
    const gameMinutes = game.periodPoints
      ? game.periodPoints.length > 2
        ? 40 + (game.periodPoints.length - 2) * 5
        : 40
      : null;
    const pace =
      gameMinutes && game.possessions && game.opponentPossessions
        ? Math.round(
            40 *
              ((game.possessions + game.opponentPossessions) /
                (2 * gameMinutes)) *
              10,
          ) / 10
        : null;
    let teamScore = null;
    let opponentScore = null;
    if (
      game.points !== null &&
      game.fgm !== null &&
      game.fga !== null &&
      game.fta !== null &&
      game.ftm !== null &&
      game.oreb !== null &&
      game.dreb !== null &&
      game.stl !== null &&
      game.ast !== null &&
      game.blk !== null &&
      game.pf !== null &&
      game.to !== null
    ) {
      teamScore =
        game.points +
        0.4 * game.fgm -
        0.7 * game.fga -
        0.4 * (game.fta - game.ftm) +
        0.7 * game.oreb +
        0.3 * game.dreb +
        game.stl +
        0.7 * game.ast +
        0.7 * game.blk -
        0.4 * game.pf -
        game.to;
    }

    if (
      game.opponentPoints !== null &&
      game.opponentFgm !== null &&
      game.opponentFga !== null &&
      game.opponentFta !== null &&
      game.opponentFtm !== null &&
      game.opponentOreb !== null &&
      game.opponentDreb !== null &&
      game.opponentStl !== null &&
      game.opponentAst !== null &&
      game.opponentBlk !== null &&
      game.opponentPf !== null &&
      game.opponentTo !== null
    ) {
      opponentScore =
        game.opponentPoints +
        0.4 * game.opponentFgm -
        0.7 * game.opponentFga -
        0.4 * (game.opponentFta - game.opponentFtm) +
        0.7 * game.opponentOreb +
        0.3 * game.opponentDreb +
        game.opponentStl +
        0.7 * game.opponentAst +
        0.7 * game.opponentBlk -
        0.4 * game.opponentPf -
        game.opponentTo;
    }

    return {
      gameId: game.id,
      season: game.season,
      seasonLabel: game.seasonLabel,
      seasonType: game.seasonType as SeasonType,
      startDate: game.startDate,
      startTimeTbd: game.startTimeTbd,
      teamId: game.teamId,
      team: game.team,
      conference: game.conference,
      opponentId: game.opponentId,
      opponent: game.opponent,
      opponentConference: game.opponentConference,
      neutralSite: game.neutralSite,
      conferenceGame: game.conferenceGame,
      gameType: game.gameType,
      notes: game.notes,
      gameMinutes,
      pace,
      teamStats: {
        possessions: game.possessions,
        assists: game.ast,
        steals: game.stl,
        blocks: game.blk,
        trueShooting: game.trueShooting ? Number(game.trueShooting) : null,
        rating:
          game.points && game.possessions
            ? Math.round(1000 * (game.points / game.possessions)) / 10
            : null,
        gameScore: teamScore,
        points: {
          total: game.points,
          byPeriod: game.periodPoints,
          largestLead: game.largestLead,
          fastBreak: game.pointsFastBreak,
          inPaint: game.pointsInPaint,
          offTurnovers: game.pointsOffTo,
        },
        twoPointFieldGoals: {
          made: game['2pm'],
          attempted: game['2pa'],
          pct: game['2pPct'] !== null ? Number(game['2pPct']) : null,
        },
        threePointFieldGoals: {
          made: game['3pm'],
          attempted: game['3pa'],
          pct: game['3pPct'] !== null ? Number(game['3pPct']) : null,
        },
        freeThrows: {
          made: game.ftm,
          attempted: game.fta,
          pct: game.ftPct !== null ? Number(game.ftPct) : null,
        },
        fieldGoals: {
          made: game.fgm,
          attempted: game.fga,
          pct: game.fgPct !== null ? Number(game.fgPct) : null,
        },
        turnovers: {
          total: game.to,
          teamTotal: game.tto,
        },
        rebounds: {
          offensive: game.oreb,
          defensive: game.dreb,
          total: game.reb,
        },
        fouls: {
          total: game.pf,
          technical: game.tech,
          flagrant: game.flag,
        },
        fourFactors: {
          effectiveFieldGoalPct: game.efg !== null ? Number(game.efg) : null,
          freeThrowRate:
            game.fta !== null && game.fga !== null
              ? Math.round((Number(game.fta) / Number(game.fga)) * 1000) / 10
              : null,
          turnoverRatio:
            game.to !== null && game.possessions
              ? Math.round(
                  (Number(game.to) * 1000) / Number(game.possessions),
                ) / 10
              : null,
          offensiveReboundPct:
            game.oreb !== null && game.reb
              ? Math.round((game.oreb / game.reb) * 1000) / 10
              : null,
        },
      },
      opponentStats: {
        possessions: game.opponentPossessions,
        assists: game.opponentAst,
        steals: game.opponentStl,
        blocks: game.opponentBlk,
        trueShooting:
          game.opponentTrueShooting !== null
            ? Number(game.opponentTrueShooting)
            : null,
        rating:
          game.opponentPoints && game.opponentPossessions
            ? Math.round(
                1000 * (game.opponentPoints / game.opponentPossessions),
              ) / 10
            : null,
        gameScore: opponentScore,
        points: {
          total: game.opponentPoints,
          byPeriod: game.opponentPeriodPoints,
          largestLead: game.opponentLargestLead,
          fastBreak: game.opponentPointsFastBreak,
          inPaint: game.opponentPointsInPaint,
          offTurnovers: game.opponentPointsOffTo,
        },
        twoPointFieldGoals: {
          made: game.opponent2pm,
          attempted: game.opponent2pa,
          pct: game.opponent2pPct !== null ? Number(game.opponent2pPct) : null,
        },
        threePointFieldGoals: {
          made: game.opponent3pm,
          attempted: game.opponent3pa,
          pct: game.opponent3pPct !== null ? Number(game.opponent3pPct) : null,
        },
        freeThrows: {
          made: game.opponentFtm,
          attempted: game.opponentFta,
          pct: game.opponentFtPct !== null ? Number(game.opponentFtPct) : null,
        },
        fieldGoals: {
          made: game.opponentFgm,
          attempted: game.opponentFga,
          pct: game.opponentFgPct !== null ? Number(game.opponentFgPct) : null,
        },
        turnovers: {
          total: game.opponentTo,
          teamTotal: game.opponentTto,
        },
        rebounds: {
          offensive: game.opponentOreb,
          defensive: game.opponentDreb,
          total: game.opponentReb,
        },
        fouls: {
          total: game.opponentPf,
          technical: game.opponentTech,
          flagrant: game.opponentFlag,
        },
        fourFactors: {
          effectiveFieldGoalPct:
            game.opponentEfg !== null ? Number(game.opponentEfg) : null,
          freeThrowRate:
            game.opponentFta !== null && game.opponentFga
              ? Math.round(
                  (Number(game.opponentFta) / Number(game.opponentFga)) * 1000,
                ) / 10
              : null,
          turnoverRatio:
            game.opponentTo !== null && game.opponentPossessions
              ? Math.round(
                  (Number(game.opponentTo) * 1000) /
                    Number(game.opponentPossessions),
                ) / 10
              : null,
          offensiveReboundPct:
            game.opponentOreb !== null && game.opponentReb
              ? Math.round((game.opponentOreb / game.opponentReb) * 1000) / 10
              : null,
        },
      },
    };
  });
};

export const getGamePlayerStatistics = async (
  startDateRange?: Date,
  endDateRange?: Date,
  team?: string,
  conference?: string,
  season?: number,
  seasonType?: SeasonType,
): Promise<GameBoxScorePlayers[]> => {
  let query = db
    .selectFrom('game')
    .innerJoin('gameTeam', 'game.id', 'gameTeam.gameId')
    .innerJoin('team', 'gameTeam.teamId', 'team.id')
    .innerJoin('gameTeamStats', 'gameTeam.id', 'gameTeamStats.gameTeamId')
    .innerJoin('gameTeam as gt2', (join) =>
      join
        .onRef('game.id', '=', 'gt2.gameId')
        .onRef('gameTeam.id', '<>', 'gt2.id'),
    )
    .innerJoin('team as t2', 'gt2.teamId', 't2.id')
    .innerJoin('gameTeamStats as gts2', 'gt2.id', 'gts2.gameTeamId')
    .leftJoin('conferenceTeam', (join) =>
      join
        .onRef('team.id', '=', 'conferenceTeam.teamId')
        .onRef('game.season', '>=', 'conferenceTeam.startYear')
        .on((eb) =>
          eb.or([
            eb('game.season', '<=', eb.ref('conferenceTeam.endYear')),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference', 'conferenceTeam.conferenceId', 'conference.id')
    .leftJoin('conferenceTeam as ct2', (join) =>
      join
        .onRef('t2.id', '=', 'ct2.teamId')
        .onRef('game.season', '>=', 'ct2.startYear')
        .on((eb) =>
          eb.or([
            eb('game.season', '<=', eb.ref('ct2.endYear')),
            eb('ct2.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference as c2', 'ct2.conferenceId', 'c2.id')
    .select((eb) => [
      'game.id',
      'game.season',
      'game.seasonLabel',
      'game.seasonType',
      'game.startDate',
      'game.startTimeTbd',
      'team.id as teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      't2.id as opponentId',
      't2.school as opponent',
      'c2.abbreviation as opponentConference',
      'game.neutralSite',
      'game.conferenceGame',
      'game.gameType',
      'game.notes',
      'gameTeam.points',
      'gameTeam.periodPoints',
      'gt2.points as opponentPoints',
      'gt2.periodPoints as opponentPeriodPoints',
      'gameTeamStats.2pm as team2pm',
      'gameTeamStats.2pa as team2pa',
      'gameTeamStats.2pPct as team2pPct',
      'gameTeamStats.3pm as team3pm',
      'gameTeamStats.3pa as team3pa',
      'gameTeamStats.3pPct as team3pPct',
      'gameTeamStats.ftm as teamFtm',
      'gameTeamStats.fta as teamFta',
      'gameTeamStats.ftPct as teamFtPct',
      'gameTeamStats.fgm as teamFgm',
      'gameTeamStats.fga as teamFga',
      'gameTeamStats.fgPct as teamFgPct',
      'gameTeamStats.oreb as teamOreb',
      'gameTeamStats.dreb as teamDreb',
      'gameTeamStats.reb as teamReb',
      'gameTeamStats.ast as teamAst',
      'gameTeamStats.stl as teamStl',
      'gameTeamStats.blk as teamBlk',
      'gameTeamStats.to as teamTo',
      'gameTeamStats.tto as teamTto',
      'gameTeamStats.toto as teamToto',
      'gameTeamStats.pf as teamPf',
      'gameTeamStats.tech as teamTech',
      'gameTeamStats.flag as teamFlag',
      'gameTeamStats.possessions as teamPossessions',
      'gameTeamStats.pointsFastBreak as teamPointsFastBreak',
      'gameTeamStats.pointsInPaint as teamPointsInPaint',
      'gameTeamStats.pointsOffTo as teamPointsOffTo',
      'gameTeamStats.trueShooting as teamTrueShooting',
      'gameTeamStats.efg as teamEfg',
      'gameTeamStats.largestLead as teamLargestLead',
      'gts2.2pm as opponent2pm',
      'gts2.2pa as opponent2pa',
      'gts2.2pPct as opponent2pPct',
      'gts2.3pm as opponent3pm',
      'gts2.3pa as opponent3pa',
      'gts2.3pPct as opponent3pPct',
      'gts2.ftm as opponentFtm',
      'gts2.fta as opponentFta',
      'gts2.ftPct as opponentFtPct',
      'gts2.fgm as opponentFgm',
      'gts2.fga as opponentFga',
      'gts2.fgPct as opponentFgPct',
      'gts2.oreb as opponentOreb',
      'gts2.dreb as opponentDreb',
      'gts2.reb as opponentReb',
      'gts2.ast as opponentAst',
      'gts2.stl as opponentStl',
      'gts2.blk as opponentBlk',
      'gts2.to as opponentTo',
      'gts2.tto as opponentTto',
      'gts2.toto as opponentToto',
      'gts2.pf as opponentPf',
      'gts2.tech as opponentTech',
      'gts2.flag as opponentFlag',
      'gts2.possessions as opponentPossessions',
      'gts2.pointsFastBreak as opponentPointsFastBreak',
      'gts2.pointsInPaint as opponentPointsInPaint',
      'gts2.pointsOffTo as opponentPointsOffTo',
      'gts2.trueShooting as opponentTrueShooting',
      'gts2.efg as opponentEfg',
      'gts2.largestLead as opponentLargestLead',
      jsonArrayFrom(
        eb
          .selectFrom('gamePlayerStats')
          .innerJoin('athlete', 'athlete.id', 'gamePlayerStats.athleteId')
          .innerJoin('position', 'athlete.positionId', 'position.id')
          .whereRef('gamePlayerStats.gameTeamId', '=', 'gameTeam.id')
          .where('gamePlayerStats.minutes', 'is not', null)
          .select([
            'athlete.id',
            'athlete.sourceId',
            'athlete.name',
            'position.abbreviation as position',
          ])
          .selectAll('gamePlayerStats'),
      ).as('players'),
    ])
    .orderBy('game.startDate', 'asc')
    .limit(1000);

  if (startDateRange) {
    query = query.where('game.startDate', '>=', startDateRange);
  }

  if (endDateRange) {
    query = query.where('game.startDate', '<=', endDateRange);
  }

  if (team) {
    query = query.where(
      (eb) => eb.fn('lower', ['team.school']),
      '=',
      team.toLowerCase(),
    );
  }

  if (conference) {
    query = query.where((eb) =>
      eb(
        eb.fn('lower', ['conference.abbreviation']),
        '=',
        conference.toLowerCase(),
      ),
    );
  }

  if (season) {
    query = query.where('game.season', '=', season);
  }

  if (seasonType) {
    query = query.where('game.seasonType', '=', seasonType);
  }

  const games = await query.execute();
  return games.map((game): GameBoxScorePlayers => {
    const gameMinutes =
      game.periodPoints && game.periodPoints.length > 2
        ? 40 + (game.periodPoints.length - 2) * 5
        : 40;
    const gamePace =
      gameMinutes && game.teamPossessions && game.opponentPossessions
        ? Math.round(
            40 *
              ((game.teamPossessions + game.opponentPossessions) /
                (2 * gameMinutes)) *
              10,
          ) / 10
        : null;

    return {
      gameId: game.id,
      season: game.season,
      seasonLabel: game.seasonLabel,
      seasonType: game.seasonType as SeasonType,
      startDate: game.startDate,
      startTimeTbd: game.startTimeTbd,
      conferenceGame: game.conferenceGame,
      neutralSite: game.neutralSite,
      gameType: game.gameType,
      notes: game.notes,
      teamId: game.teamId,
      team: game.team,
      conference: game.conference,
      opponentId: game.opponentId,
      opponent: game.opponent,
      opponentConference: game.opponentConference,
      gameMinutes,
      gamePace,
      players: game.players.map((player) => {
        const usage = getUsage(player, game, gameMinutes);
        const offensiveRatings = getPlayerOffensiveRatings(
          player,
          game,
          gameMinutes,
        );
        const defensiveRating = getPlayerDefensiveRating(
          player,
          game,
          gameMinutes,
        );

        return {
          athleteId: player.id,
          athleteSourceId: player.sourceId,
          name: player.name,
          position: player.position,
          starter: player.starter,
          ejected: player.ejected,
          minutes: player.minutes,
          points: player.points,
          turnovers: player.to,
          fouls: player.pf,
          assists: player.ast,
          steals: player.stl,
          blocks: player.blk,
          gameScore:
            player.gameScore !== null ? Number(player.gameScore) : null,
          offensiveRating: offensiveRatings?.offensiveRating ?? null,
          defensiveRating,
          netRating:
            offensiveRatings !== null && defensiveRating !== null
              ? Math.round(
                  (offensiveRatings.offensiveRating - defensiveRating) * 10,
                ) / 10
              : null,
          usage,
          effectiveFieldGoalPct:
            player.efg !== null ? Number(player.efg) : null,
          trueShootingPct:
            player.trueShooting !== null ? Number(player.trueShooting) : null,
          assistsTurnoverRatio:
            player.to !== null
              ? Math.round(((player.ast ?? 0) * 10) / player.to) / 10
              : null,
          freeThrowRate:
            player.fga !== null
              ? Math.round(((player.fta ?? 0) * 1000) / player.fga) / 10
              : null,
          offensiveReboundPct:
            player.reb !== null
              ? Math.round(((player.oreb ?? 0) * 1000) / player.reb) / 10
              : null,
          fieldGoals: {
            made: player.fgm,
            attempted: player.fga,
            pct: player.fgPct !== null ? Number(player.fgPct) : null,
          },
          twoPointFieldGoals: {
            made: player['2pm'],
            attempted: player['2pa'],
            pct: player['2pPct'] !== null ? Number(player['2pPct']) : null,
          },
          threePointFieldGoals: {
            made: player['3pm'],
            attempted: player['3pa'],
            pct: player['3pPct'] !== null ? Number(player['3pPct']) : null,
          },
          freeThrows: {
            made: player.ftm,
            attempted: player.fta,
            pct: player.ftPct !== null ? Number(player.ftPct) : null,
          },
          rebounds: {
            offensive: player.oreb,
            defensive: player.dreb,
            total: player.reb,
          },
        };
      }),
    };
  });
};

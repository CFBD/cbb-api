import { db } from '../../config/database';

export const getGames = async (startDateRange: Date = new Date()) => {
  const games = await db
    .selectFrom('game')
    .innerJoin('gameTeam', (join) =>
      join
        .onRef('game.id', '=', 'gameTeam.gameId')
        .on('gameTeam.isHome', '=', true),
    )
    .innerJoin('team', 'team.id', 'gameTeam.teamId')
    .innerJoin('gameTeam as gt2', (join) =>
      join.onRef('game.id', '=', 'gt2.gameId').on('gt2.isHome', '=', false),
    )
    .innerJoin('team as t2', 't2.id', 'gt2.teamId')
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
      'team.id as homeTeamId',
      'team.school as homeTeam',
      'gameTeam.points as homePoints',
      'gameTeam.periodPoints as homePeriodPoints',
      'gameTeam.isWinner as homeWinner',
      't2.id as awayTeamId',
      't2.school as awayTeam',
      'gt2.points as awayPoints',
      'gt2.periodPoints as awayPeriodPoints',
      'gt2.isWinner as awayWinner',
      'venue.id as venueId',
      'venue.name as venue',
      'venue.city',
      'venue.state',
    ])
    .where('game.startDate', '>=', startDateRange)
    .execute();

  return games;
};

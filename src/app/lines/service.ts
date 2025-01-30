import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { db } from '../../config/database';
import { GameLines, LineProviderInfo } from './types';
import { SeasonType } from '../enums';

export const getProviders = async (): Promise<LineProviderInfo[]> => {
  const providers = await db
    .selectFrom('lineProvider')
    .select(['id', 'name'])
    .execute();

  return providers;
};

export const getLines = async (
  season?: number,
  team?: string,
  conference?: string,
  startDateRange?: Date,
  endDateRange?: Date,
): Promise<GameLines[]> => {
  let query = db
    .selectFrom('gameInfo')
    .select((eb) => [
      'gameInfo.id as gameId',
      'gameInfo.season',
      'gameInfo.seasonType',
      'gameInfo.startDate',
      'gameInfo.homeTeamId',
      'gameInfo.homeTeam',
      'gameInfo.homeConference',
      'gameInfo.homePoints as homeScore',
      'gameInfo.awayTeamId',
      'gameInfo.awayTeam',
      'gameInfo.awayConference',
      'gameInfo.awayPoints as awayScore',
      jsonArrayFrom(
        eb
          .selectFrom('gameLine')
          .innerJoin(
            'lineProvider',
            'lineProvider.id',
            'gameLine.lineProviderId',
          )
          .whereRef('gameLine.gameId', '=', 'gameInfo.id')
          .select([
            'lineProvider.name as provider',
            'gameLine.spread',
            'gameLine.overUnder',
            'gameLine.homeMoneyline',
            'gameLine.awayMoneyline',
            'gameLine.spreadOpen',
            'gameLine.overUnderOpen',
          ]),
      ).as('lines'),
    ])
    .orderBy('gameInfo.startDate')
    .limit(3000);

  if (season) {
    query = query.where('gameInfo.season', '=', season);
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

  if (startDateRange) {
    query = query.where('gameInfo.startDate', '>=', startDateRange);
  }

  if (endDateRange) {
    query = query.where('gameInfo.startDate', '<=', endDateRange);
  }

  const games = await query.execute();

  return games.map((game) => ({
    gameId: game.gameId ?? -1,
    season: game.season ?? -1,
    seasonType: game.seasonType as SeasonType,
    startDate: game.startDate ?? new Date(),
    homeTeamId: game.homeTeamId ?? -1,
    homeTeam: game.homeTeam ?? '',
    homeConference: game.homeConference,
    homeScore: game.homeScore,
    awayTeamId: game.awayTeamId ?? -1,
    awayTeam: game.awayTeam ?? '',
    awayConference: game.awayConference,
    awayScore: game.awayScore,
    lines: game.lines.map((line) => ({
      provider: line.provider,
      spread: line.spread ? Number(line.spread) : null,
      overUnder: line.overUnder ? Number(line.overUnder) : null,
      homeMoneyline: line.homeMoneyline ? Number(line.homeMoneyline) : null,
      awayMoneyline: line.awayMoneyline ? Number(line.awayMoneyline) : null,
      spreadOpen: line.spreadOpen ? Number(line.spreadOpen) : null,
      overUnderOpen: line.overUnderOpen ? Number(line.overUnderOpen) : null,
    })),
  }));
};

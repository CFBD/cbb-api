import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { db } from '../../config/database';
import { PlayInfo, PlayTypeInfo } from './types';
import { sql } from 'kysely';
import { SeasonType } from '../enums';

export const getPlaysByGameId = async (gameId: number): Promise<PlayInfo[]> => {
  return await getPlays(undefined, gameId, undefined, undefined, undefined);
};

export const getPlaysByTeam = async (
  season: number,
  team: string,
): Promise<PlayInfo[]> => {
  return await getPlays(season, undefined, team, undefined, undefined);
};

export const getPlaysByDate = async (date: Date): Promise<PlayInfo[]> => {
  const endRange = new Date();
  endRange.setDate(date.getDate() + 1);
  return await getPlays(undefined, undefined, undefined, date, endRange);
};

export const getPlaysByPlayerId = async (
  season: number,
  playerId: number,
): Promise<PlayInfo[]> => {
  return await getPlays(
    season,
    undefined,
    undefined,
    undefined,
    undefined,
    playerId,
  );
};

export const getPlayTypes = async (): Promise<PlayTypeInfo[]> => {
  return await db.selectFrom('playType').selectAll().orderBy('id').execute();
};

const getPlays = async (
  season?: number,
  gameId?: number,
  team?: string,
  startDateRange?: Date,
  endDateRange?: Date,
  playerId?: number,
): Promise<PlayInfo[]> => {
  let query = db
    .selectFrom('gameInfo')
    .innerJoin('play', 'gameInfo.id', 'play.gameId')
    .innerJoin('playType', 'play.playTypeId', 'playType.id')
    .orderBy('gameInfo.startDate')
    .orderBy('gameInfo.id')
    .orderBy('play.period')
    .orderBy('play.secondsRemaining desc')
    // .limit(5000)
    .select((eb) => [
      'gameInfo.id as gameId',
      'gameInfo.sourceId as gameSourceId',
      'gameInfo.startDate as gameStartDate',
      'gameInfo.homeTeamId',
      'gameInfo.homeTeam',
      'gameInfo.homeConference',
      'gameInfo.awayTeamId',
      'gameInfo.awayTeam',
      'gameInfo.awayConference',
      'gameInfo.season',
      'gameInfo.seasonType',
      'gameInfo.gameType',
      'play.id',
      'play.sourceId',
      'play.homeScore',
      'play.awayScore',
      'play.period',
      'play.clock',
      'play.secondsRemaining',
      'play.wallclock',
      'play.teamId',
      'play.shootingPlay',
      'play.scoringPlay',
      'play.scoreValue',
      'playType.name as playType',
      'play.playText',
      jsonArrayFrom(
        eb
          .selectFrom('athlete')
          .where(
            'athlete.sourceId',
            '=',
            sql<string>`ANY(play.participants::varchar[])`,
          )
          .select(['athlete.id', 'athlete.name']),
      ).as('participants'),
    ]);

  if (season) {
    query = query.where('gameInfo.season', '=', season);
  }

  if (gameId) {
    query = query.where('gameInfo.id', '=', gameId);
  }

  if (team) {
    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['gameInfo.homeTeam']), '=', team.toLowerCase()),
        eb(eb.fn('lower', ['gameInfo.awayTeam']), '=', team.toLowerCase()),
      ]),
    );
  }

  if (startDateRange) {
    query = query.where('gameInfo.startDate', '>=', startDateRange);
  }

  if (endDateRange) {
    query = query.where('gameInfo.startDate', '<=', endDateRange);
  }

  if (playerId) {
    query = query.innerJoin('athlete', (join) =>
      join
        .on('athlete.id', '=', playerId)
        .on(
          'athlete.sourceId',
          '=',
          sql<string>`ANY(play.participants::varchar[])`,
        ),
    );
  }

  const plays = await query.execute();

  return plays
    .map(
      (play): PlayInfo => ({
        gameId: play.gameId ?? -1,
        gameSourceId: play.gameSourceId ?? '',
        gameStartDate: play.gameStartDate ?? new Date(),
        season: play.season ?? -1,
        seasonType: play.seasonType as SeasonType,
        gameType: play.gameType ?? '',
        id: Number(play.id),
        sourceId: play.sourceId,
        playType: play.playType,
        isHomeTeam:
          play.teamId !== null ? play.teamId === play.homeTeamId : null,
        teamId: play.teamId,
        team:
          play.teamId !== null
            ? play.teamId === play.homeTeamId
              ? play.homeTeam
              : play.awayTeam
            : null,
        conference:
          play.teamId !== null
            ? play.teamId === play.homeTeamId
              ? play.homeConference
              : play.awayConference
            : null,
        opponentId:
          play.teamId !== null
            ? play.teamId === play.homeTeamId
              ? play.awayTeamId
              : play.homeTeamId
            : null,
        opponent:
          play.teamId !== null
            ? play.teamId === play.homeTeamId
              ? play.awayTeam
              : play.homeTeam
            : null,
        opponentConference:
          play.teamId !== null
            ? play.teamId === play.homeTeamId
              ? play.awayConference
              : play.homeConference
            : null,
        homeScore: play.homeScore,
        awayScore: play.awayScore,
        period: play.period,
        clock: play.clock,
        secondsRemaining: play.secondsRemaining,
        scoringPlay: play.scoringPlay,
        shootingPlay: play.shootingPlay,
        scoreValue: play.scoreValue,
        wallclock: play.wallclock,
        playText: play.playText,
        participants: play.participants,
      }),
    )
    .filter((play) => play.gameId !== -1);
};

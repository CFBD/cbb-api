import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { db } from '../../config/database';
import { PlayInfo, PlayTypeInfo } from './types';
import { sql } from 'kysely';
import { SeasonType } from '../enums';

export const getPlaysByGameId = async (
  gameId: number,
  shootingPlaysOnly?: boolean,
): Promise<PlayInfo[]> => {
  return await getPlays(
    undefined,
    gameId,
    undefined,
    undefined,
    undefined,
    undefined,
    shootingPlaysOnly,
  );
};

export const getPlaysByTeam = async (
  season: number,
  team: string,
  shootingPlaysOnly?: boolean,
): Promise<PlayInfo[]> => {
  return await getPlays(
    season,
    undefined,
    team,
    undefined,
    undefined,
    undefined,
    shootingPlaysOnly,
  );
};

export const getPlaysByDate = async (
  date: Date,
  shootingPlaysOnly?: boolean,
): Promise<PlayInfo[]> => {
  const endRange = new Date();
  endRange.setDate(date.getDate() + 1);
  return await getPlays(
    undefined,
    undefined,
    undefined,
    date,
    endRange,
    undefined,
    shootingPlaysOnly,
  );
};

export const getPlaysByPlayerId = async (
  season: number,
  playerId: number,
  shootingPlaysOnly?: boolean,
): Promise<PlayInfo[]> => {
  return await getPlays(
    season,
    undefined,
    undefined,
    undefined,
    undefined,
    playerId,
    shootingPlaysOnly,
  );
};

export const getPlayTypes = async (): Promise<PlayTypeInfo[]> => {
  return await db.selectFrom('playType').selectAll().orderBy('id').execute();
};

const getShotRange = (
  playType: string,
  playText: string,
): 'rim' | 'jumper' | 'three_pointer' | 'free_throw' => {
  const playTypeText = playType.toLowerCase();
  if (playTypeText.includes('free')) {
    return 'free_throw';
  } else if (
    playTypeText.includes('three') ||
    playText.toLowerCase().includes('three point')
  ) {
    return 'three_pointer';
  } else if (
    playTypeText.includes('layup') ||
    playTypeText.includes('dunk') ||
    playTypeText.includes('tip')
  ) {
    return 'rim';
  }

  return 'jumper';
};

const getPlays = async (
  season?: number,
  gameId?: number,
  team?: string,
  startDateRange?: Date,
  endDateRange?: Date,
  playerId?: number,
  shootingPlaysOnly?: boolean,
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
      'play.wp',
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

  if (shootingPlaysOnly === true) {
    query = query.where('play.shootingPlay', '=', true);
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
        homeWinProbability: play.wp
          ? Math.round(Number(play.wp) * 1000) / 1000
          : null,
        period: play.period,
        clock: play.clock,
        secondsRemaining: play.secondsRemaining,
        scoringPlay: play.scoringPlay,
        shootingPlay: play.shootingPlay,
        scoreValue: play.scoreValue,
        wallclock: play.wallclock,
        playText: play.playText,
        participants: play.participants,
        shotInfo: play.shootingPlay
          ? {
              shooter:
                (play.participants?.length ?? 0) > 0
                  ? {
                      id: play.participants[0].id,
                      name: play.participants[0].name,
                    }
                  : null,
              made: play.scoringPlay ?? false,
              range: getShotRange(play.playType, play.playText ?? ''),
              assisted:
                play.playText?.toLowerCase().includes('assisted by') ?? false,
              assistedBy:
                play.playText?.toLowerCase().includes('assisted by') &&
                (play.participants?.length ?? 0) > 1
                  ? {
                      id: play.participants[1].id,
                      name: play.participants[1].name,
                    }
                  : null,
            }
          : null,
      }),
    )
    .filter((play) => play.gameId !== -1);
};

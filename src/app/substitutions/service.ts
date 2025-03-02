import { db } from '../../config/database';
import { PlayerSubsititution } from './types';

export const getSubsByPlayerId = async (
  season: number,
  playerId: number,
): Promise<PlayerSubsititution[]> => {
  return await getSubstitutions(season, undefined, undefined, playerId);
};

export const getSubsByGameId = async (
  gameId: number,
): Promise<PlayerSubsititution[]> => {
  return await getSubstitutions(undefined, gameId, undefined, undefined);
};

export const getSubsByTeam = async (
  season: number,
  team: string,
): Promise<PlayerSubsititution[]> => {
  return await getSubstitutions(season, undefined, team, undefined);
};

const getSubstitutions = async (
  season?: number,
  gameId?: number,
  team?: string,
  playerId?: number,
): Promise<PlayerSubsititution[]> => {
  let query = db
    .selectFrom('gameInfo')
    .innerJoin('substitution', 'gameInfo.id', 'substitution.gameId')
    .innerJoin('team', 'substitution.teamId', 'team.id')
    .innerJoin('athlete', 'substitution.athleteId', 'athlete.id')
    .leftJoin('position', 'athlete.positionId', 'position.id')
    .select([
      'gameInfo.id as gameId',
      'gameInfo.startDate',
      'gameInfo.homeTeamId as homeTeamId',
      'gameInfo.homeTeam as homeTeam',
      'gameInfo.homeConference as homeConference',
      'gameInfo.awayTeamId as awayTeamId',
      'gameInfo.awayTeam as awayTeam',
      'gameInfo.awayConference as awayConference',
      'team.id as teamId',
      'team.school as team',
      'athlete.id as athleteId',
      'athlete.name as athlete',
      'position.abbreviation as position',
      'substitution.subInPeriod',
      'substitution.subInSecondsRemaining',
      'substitution.startTeamPoints',
      'substitution.startOpponentPoints',
      'substitution.subOutPeriod',
      'substitution.subOutSecondsRemaining',
      'substitution.endTeamPoints',
      'substitution.endOpponentPoints',
    ]);

  if (season) {
    query = query.where('gameInfo.season', '=', season);
  }

  if (gameId) {
    query = query.where('gameInfo.id', '=', gameId);
  }

  if (team) {
    query = query.where(
      (eb) => eb.fn('lower', ['team.school']),
      '=',
      team.toLowerCase(),
    );
  }

  if (playerId) {
    query = query.where('athlete.id', '=', playerId);
  }

  const records = await query.execute();

  return records.map((r) => ({
    gameId: r.gameId ?? -1,
    startDate: r.startDate ?? new Date(),
    teamId: r.teamId,
    team: r.team,
    conference: r.homeTeamId === r.teamId ? r.homeConference : r.awayConference,
    athleteId: r.athleteId,
    athlete: r.athlete,
    position: r.position,
    opponentId: (r.homeTeamId === r.teamId ? r.awayTeamId : r.homeTeamId) ?? -1,
    opponent: (r.homeTeamId === r.teamId ? r.awayTeam : r.homeTeam) ?? '',
    opponentConference:
      r.homeTeamId === r.teamId ? r.awayConference : r.homeConference,
    subIn: {
      period: r.subInPeriod,
      secondsRemaining: r.subInSecondsRemaining,
      teamPoints: r.startTeamPoints,
      opponentPoints: r.startOpponentPoints,
    },
    subOut: {
      period: r.subOutPeriod,
      secondsRemaining: r.subOutSecondsRemaining,
      teamPoints: r.endTeamPoints,
      opponentPoints: r.endOpponentPoints,
    },
  }));
};

import { db } from '../../config/database';
import { DraftPick, DraftPosition, DraftTeam } from './types';

export const getDraftPositions = async (): Promise<DraftPosition[]> => {
  return await db
    .selectFrom('draftPosition')
    .select(['name', 'abbreviation'])
    .orderBy('name')
    .execute();
};

export const getDraftTeams = async (): Promise<DraftTeam[]> => {
  const teams = await db
    .selectFrom('draftTeam')
    .selectAll()
    .orderBy('displayName')
    .execute();

  return teams.map((t) => ({
    id: t.id,
    sourceId: t.sourceId,
    location: t.location,
    name: t.name ?? '',
    displayName: t.displayName ?? '',
    abbreviation: t.abbreviation ?? '',
  }));
};

export const getDraftPicks = async (
  year?: number,
  draftTeam?: string,
  sourceTeam?: string,
  position?: string,
): Promise<DraftPick[]> => {
  let query = db
    .selectFrom('draftPick')
    .innerJoin('draftTeam', 'draftTeam.id', 'draftPick.draftTeamId')
    .innerJoin('draftPosition', 'draftPosition.id', 'draftPick.draftPositionId')
    .leftJoin('draftSourceTeam', 'draftSourceTeam.id', 'draftPick.sourceTeamId')
    .select([
      'draftPick.collegeId as athleteId',
      'draftPick.sourceTeamId',
      'draftTeam.id as draftTeamId',
      'draftTeam.displayName as draftTeam',
      'draftSourceTeam.location as sourceTeamLocation',
      'draftSourceTeam.name as sourceTeamName',
      'draftSourceTeam.leagueAffiliation as sourceTeamLeagueAffiliation',
      'draftSourceTeam.teamId as sourceTeamCollegeId',
      'draftPick.year',
      'draftPick.overall',
      'draftPick.round',
      'draftPick.pick',
      'draftPick.name',
      'draftPick.overallRank',
      'draftPick.positionRank',
      'draftPick.height',
      'draftPick.weight',
      'draftPosition.abbreviation as position',
    ])
    .orderBy('draftPick.year', 'desc')
    .orderBy('draftPick.overall', 'asc');

  if (year) {
    query = query.where('draftPick.year', '=', year);
  }

  if (draftTeam) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('draftTeam.name')]),
      '=',
      draftTeam.toLowerCase(),
    );
  }

  if (sourceTeam) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('draftSourceTeam.location')]),
      '=',
      sourceTeam.toLowerCase(),
    );
  }

  if (position) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('draftPosition.abbreviation')]),
      '=',
      position.toLowerCase(),
    );
  }

  const picks = await query.execute();
  return picks.map((p) => ({
    athleteId: p.athleteId,
    draftTeamId: p.draftTeamId,
    draftTeam: p.draftTeam ?? '',
    sourceTeamId: p.sourceTeamId,
    sourceTeamLocation: p.sourceTeamLocation,
    sourceTeamName: p.sourceTeamName,
    sourceTeamLeagueAffiliation: p.sourceTeamLeagueAffiliation,
    sourceTeamCollegeId: p.sourceTeamCollegeId,
    year: p.year,
    overall: p.overall,
    round: p.round,
    pick: p.pick,
    name: p.name,
    overallRank: p.overallRank,
    positionRank: p.positionRank,
    height: p.height,
    weight: p.weight,
    position: p.position,
  }));
};

import { db } from '../../config/database';
import { TeamDirectory } from './seasonOverviewTypes';
import { ValidateError } from 'tsoa';

export class TeamProfileError extends Error {
  constructor(
    public status: 404 | 422 | 503,
    message: string,
  ) {
    super(message);
  }
}
export function validateTeamSelector(value: number, name: 'season' | 'teamId') {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > (name === 'season' ? 32767 : 2147483647)
  )
    throw new ValidateError(
      {
        [name]: {
          message: 'Expected a positive integer within the supported range.',
        },
      },
      'Invalid selector',
    );
}
export async function getTeamDirectory(season: number): Promise<TeamDirectory> {
  validateTeamSelector(season, 'season');
  try {
    const rows = await db
      .selectFrom('team as t')
      .innerJoin('conferenceTeam as ct', 'ct.teamId', 't.id')
      .innerJoin('conference as c', 'c.id', 'ct.conferenceId')
      .where('ct.startYear', '<=', season)
      .where((eb) =>
        eb.or([eb('ct.endYear', '>=', season), eb('ct.endYear', 'is', null)]),
      )
      .select([
        't.id',
        't.sourceId',
        't.school',
        't.mascot',
        't.abbreviation',
        't.displayName',
        't.shortDisplayName',
        'c.id as conferenceId',
        'c.name as conferenceName',
        'c.abbreviation as conferenceAbbreviation',
      ])
      .orderBy('t.school')
      .orderBy('t.id')
      .execute();
    const teams = new Map<number, TeamDirectory['teams'][number]>(),
      conferences = new Map<number, TeamDirectory['conferences'][number]>();
    for (const row of rows) {
      if (
        teams.has(row.id) &&
        teams.get(row.id)!.conferenceId !== row.conferenceId
      )
        throw new Error('Conflicting season membership');
      const { conferenceName, conferenceAbbreviation, ...team } = row;
      teams.set(row.id, team);
      conferences.set(row.conferenceId, {
        id: row.conferenceId,
        name: conferenceName,
        abbreviation: conferenceAbbreviation,
      });
    }
    return {
      season,
      seasonLabel: `${season - 1}–${String(season).slice(-2)}`,
      teams: [...teams.values()],
      conferences: [...conferences.values()].sort(
        (a, b) => a.name.localeCompare(b.name) || a.id - b.id,
      ),
    };
  } catch {
    console.error('[team-directory] unavailable', { season });
    throw new TeamProfileError(503, 'Team directory temporarily unavailable.');
  }
}

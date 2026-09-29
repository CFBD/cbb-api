import { sql } from 'kysely';
import { db } from '../../config/database';
import { TeamProfileError, validateTeamSelector } from './directory';
import { isTeamSeasonOverview } from './seasonOverviewPayload';
import { TeamSeasonOverview } from './seasonOverviewTypes';

export async function getTeamSeasonOverview(
  teamId: number,
  season: number,
): Promise<TeamSeasonOverview> {
  validateTeamSelector(teamId, 'teamId');
  validateTeamSelector(season, 'season');
  try {
    const team = await db
      .selectFrom('team')
      .where('id', '=', teamId)
      .select('id')
      .executeTakeFirst();
    if (!team) throw new TeamProfileError(404, 'Team not found.');
    const memberships = await db
      .selectFrom('conferenceTeam')
      .where('teamId', '=', teamId)
      .where('startYear', '<=', season)
      .where((eb) =>
        eb.or([eb('endYear', '>=', season), eb('endYear', 'is', null)]),
      )
      .select('conferenceId')
      .execute();
    if (!memberships.length)
      throw new TeamProfileError(422, 'Team is not available for this season.');
    if (new Set(memberships.map((m) => m.conferenceId)).size !== 1)
      throw new Error('Conflicting membership');
    // Text avoids recursive JSON key conversion by CamelCasePlugin.
    const row = await db
      .selectFrom('teamSeasonSnapshot')
      .where('teamId', '=', teamId)
      .where('season', '=', season)
      .select([
        'formatVersion',
        sql<string>`payload::text`.as('payload'),
        sql<string>`to_char(generated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.as(
          'generatedAt',
        ),
      ])
      .executeTakeFirst();
    const payload: unknown = row ? JSON.parse(row.payload) : null;
    if (
      !row ||
      ![1, 2].includes(row.formatVersion) ||
      !isTeamSeasonOverview(payload, teamId, season) ||
      payload.formatVersion !== row.formatVersion ||
      payload.generatedAt !== row.generatedAt ||
      payload.team.conference.id !== memberships[0].conferenceId
    )
      throw new Error('Unavailable snapshot');
    return payload;
  } catch (error) {
    if (error instanceof TeamProfileError) throw error;
    console.error('[team-season-overview] unavailable', { teamId, season });
    throw new TeamProfileError(503, 'Season overview temporarily unavailable.');
  }
}

import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { db } from '../../config/database';
import { ConferenceHistory, ConferenceInfo } from './types';

export const getConferences = async (): Promise<ConferenceInfo[]> => {
  const conferences = await db.selectFrom('conference').selectAll().execute();

  return conferences.map((conference) => ({
    id: conference.id,
    sourceId: conference.sourceId,
    name: conference.name,
    abbreviation: conference.abbreviation,
    shortName: conference.shortName,
  }));
};

export const getConferenceHistory = async (
  conference?: string,
): Promise<ConferenceHistory[]> => {
  let query = db
    .selectFrom('conference')
    .select((eb) => [
      'id',
      'sourceId',
      'name',
      'abbreviation',
      'shortName',
      jsonArrayFrom(
        eb
          .selectFrom('conferenceTeam')
          .innerJoin('team', 'team.id', 'conferenceTeam.teamId')
          .whereRef('conferenceTeam.conferenceId', '=', 'conference.id')
          .select([
            'team.id',
            'team.sourceId',
            'team.school',
            'team.mascot',
            'conferenceTeam.startYear as startSeason',
            'conferenceTeam.endYear as endSeason',
          ])
          .orderBy('startSeason')
          .orderBy('endSeason')
          .orderBy('team.school'),
      ).as('teams'),
    ]);

  if (conference) {
    query = query.where(
      (eb) => eb.fn('lower', ['conference.abbreviation']),
      '=',
      conference.toLowerCase(),
    );
  }

  return await query.execute();
};

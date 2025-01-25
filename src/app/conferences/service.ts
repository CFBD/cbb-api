import { db } from '../../config/database';
import { ConferenceInfo } from './types';

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

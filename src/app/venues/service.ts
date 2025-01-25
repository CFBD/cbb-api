import { db } from '../../config/database';
import { VenueInfo } from './types';

export const getVenues = async (): Promise<VenueInfo[]> => {
  const venues = await db
    .selectFrom('venue')
    .select([
      'venue.id',
      'venue.sourceId',
      'venue.name',
      'venue.city',
      'venue.state',
      'venue.country',
    ])
    .execute();

  return venues;
};

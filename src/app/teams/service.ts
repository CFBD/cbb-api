import { db } from '../../config/database';
import { TeamInfo } from './types';

export const getTeams = async (
  conference?: string,
  season?: number,
): Promise<TeamInfo[]> => {
  let query = db
    .selectFrom('team')
    .leftJoin('conferenceTeam', (join) => {
      if (season) {
        return join
          .onRef('team.id', '=', 'conferenceTeam.teamId')
          .on('conferenceTeam.startYear', '<=', season)
          .on((eb) =>
            eb.or([
              eb('conferenceTeam.endYear', '>=', season),
              eb('conferenceTeam.endYear', 'is', null),
            ]),
          );
      } else {
        return join
          .onRef('team.id', '=', 'conferenceTeam.teamId')
          .on('conferenceTeam.endYear', 'is', null);
      }
    })
    .leftJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .leftJoin('venue', 'venue.id', 'team.homeVenueId')
    .select([
      'team.id',
      'team.sourceId',
      'team.school',
      'team.mascot',
      'team.abbreviation',
      'team.displayName',
      'team.shortDisplayName',
      'team.primaryColor',
      'team.secondaryColor',
      'team.homeVenueId as currentVenueId',
      'venue.name as currentVenue',
      'venue.city as currentCity',
      'venue.state as currentState',
      'conference.id as conferenceId',
      'conference.abbreviation as conference',
    ]);

  if (conference) {
    query = query.where('conference.abbreviation', '=', conference);
  }

  const teams = await query.execute();

  return teams;
};

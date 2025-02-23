import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { db } from '../../config/database';
import { TeamInfo, TeamRoster, TeamRosterPlayer } from './types';

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

export const getTeamRoster = async (
  season: number,
  team?: string,
): Promise<TeamRoster[]> => {
  let query = db
    .selectFrom('team')
    .leftJoin('conferenceTeam', (join) =>
      join
        .onRef('team.id', '=', 'conferenceTeam.teamId')
        .on('conferenceTeam.startYear', '<=', season)
        .on((eb) =>
          eb.or([
            eb('conferenceTeam.endYear', '>=', season),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .select((eb) => [
      'team.id as teamId',
      'team.sourceId as teamSourceId',
      'team.school as team',
      'conference.abbreviation as conference',
      jsonArrayFrom(
        eb
          .selectFrom('athleteTeam')
          .innerJoin('athlete', 'athlete.id', 'athleteTeam.athleteId')
          .leftJoin('hometown', 'hometown.id', 'athlete.hometownId')
          .leftJoin('position', 'position.id', 'athlete.positionId')
          .whereRef('athleteTeam.teamId', '=', 'team.id')
          .where('athleteTeam.startSeason', '<=', season)
          .where('athleteTeam.endSeason', '>=', season)
          .select([
            'athlete.id',
            'athlete.sourceId',
            'athlete.name',
            'athlete.firstName',
            'athlete.lastName',
            'athlete.jersey',
            'position.name as position',
            'athlete.height',
            'athlete.weight',
            'hometown.city',
            'hometown.state',
            'hometown.country',
            'hometown.latitude',
            'hometown.longitude',
            'hometown.countyFips',
            'athlete.dob',
            'athleteTeam.startSeason',
            'athleteTeam.endSeason',
          ]),
      ).as('players'),
    ]);

  if (team) {
    query = query.where(
      (eb) => eb.fn('lower', ['team.school']),
      '=',
      team.toLowerCase(),
    );
  }

  const roster = await query.execute();

  return roster.map((team) => ({
    teamId: team.teamId,
    teamSourceId: team.teamSourceId,
    team: team.team,
    conference: team.conference,
    season: season,
    players: team.players.map(
      (p): TeamRosterPlayer => ({
        id: p.id,
        sourceId: p.sourceId,
        name: p.name,
        firstName: p.firstName,
        lastName: p.lastName,
        jersey: p.jersey,
        position: p.position,
        height: p.height,
        weight: p.weight,
        hometown: {
          city: p.city,
          state: p.state,
          country: p.country,
          latitude: p.latitude ? Number(p.latitude) : null,
          longitude: p.longitude ? Number(p.longitude) : null,
          countyFips: p.countyFips,
        },
        dateOfBirth: p.dob,
        startSeason: p.startSeason,
        endSeason: p.endSeason,
      }),
    ),
  }));
};

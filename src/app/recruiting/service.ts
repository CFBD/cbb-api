import { db } from '../../config/database';
import { Recruit } from './types';

export const getRecruits = async (
  year?: number,
  team?: string,
  conference?: string,
  position?: string,
): Promise<Recruit[]> => {
  let query = db
    .selectFrom('recruit')
    .leftJoin('recruitSchool', 'recruitSchool.id', 'recruit.recruitSchoolId')
    .leftJoin('team', 'team.id', 'recruit.committedToId')
    .leftJoin(
      'recruitPosition',
      'recruitPosition.id',
      'recruit.recruitPositionId',
    )
    .leftJoin('hometown', 'hometown.id', 'recruit.hometownId')
    .leftJoin('conferenceTeam', (join) =>
      join
        .onRef('conferenceTeam.teamId', '=', 'team.id')
        .onRef('conferenceTeam.startYear', '<=', 'recruit.year')
        .on((eb) =>
          eb.or([
            eb('conferenceTeam.endYear', '>=', eb.ref('recruit.year')),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .select([
      'recruit.id',
      'recruit.sourceId',
      'recruitPosition.position as position',
      'recruitSchool.id as schoolId',
      'recruitSchool.name as school',
      'hometown.city as hometownCity',
      'hometown.state as hometownState',
      'hometown.country as hometownCountry',
      'team.id as committedToId',
      'team.school as committedToSchool',
      'conference.abbreviation as conference',
      'recruit.athleteId',
      'recruit.year',
      'recruit.name',
      'recruit.height',
      'recruit.weight',
      'recruit.stars',
      'recruit.rating',
      'recruit.ranking',
    ])
    .orderBy('recruit.year', 'desc')
    .orderBy('recruit.ranking');

  if (year) {
    query = query.where('recruit.year', '=', year);
  }

  if (team) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('team.school')]),
      '=',
      team.toLowerCase(),
    );
  }

  if (conference) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('conference.abbreviation')]),
      '=',
      conference.toLowerCase(),
    );
  }

  if (position) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('recruitPosition.position')]),
      '=',
      position.toLowerCase(),
    );
  }

  const recruits = await query.execute();
  return recruits.map((r) => ({
    id: r.id,
    sourceId: r.sourceId,
    position: r.position,
    schoolId: r.schoolId,
    school: r.school,
    hometown: r.hometownCity
      ? {
          city: r.hometownCity,
          state: r.hometownState,
          country: r.hometownCountry,
        }
      : null,
    committedTo: r.committedToId
      ? {
          id: r.committedToId,
          name: r.committedToSchool,
          conference: r.conference,
        }
      : null,
    athleteId: r.athleteId,
    year: r.year,
    name: r.name,
    heightInches: r.height,
    weightPounds: r.weight,
    stars: r.stars,
    rating: r.rating,
    ranking: r.ranking,
  }));
};

import { db } from '../../config/database';
import { TransferEligibility } from '../enums';
import { Recruit, TeamRecruitingRanking, Transfer } from './types';

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
      'hometown.latitude as hometownLatitude',
      'hometown.longitude as hometownLongitude',
      'hometown.countyFips as hometownCountyFips',
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
          latitude: r.hometownLatitude ? Number(r.hometownLatitude) : null,
          longitude: r.hometownLongitude ? Number(r.hometownLongitude) : null,
          countyFips: r.hometownCountyFips,
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

export const getTeamRankings = async (
  year?: number,
  team?: string,
  conference?: string,
): Promise<TeamRecruitingRanking[]> => {
  let query = db
    .selectFrom('teamRecruiting')
    .innerJoin('team', 'team.id', 'teamRecruiting.teamId')
    .leftJoin('conferenceTeam', (join) =>
      join
        .onRef('conferenceTeam.teamId', '=', 'team.id')
        .onRef('conferenceTeam.startYear', '<=', 'teamRecruiting.year')
        .on((eb) =>
          eb.or([
            eb('conferenceTeam.endYear', '>=', eb.ref('teamRecruiting.year')),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .select([
      'team.id as teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      'teamRecruiting.year',
      'teamRecruiting.rank as ranking',
      'teamRecruiting.points',
    ])
    .orderBy('teamRecruiting.year', 'desc')
    .orderBy('teamRecruiting.rank');

  if (year) {
    query = query.where('teamRecruiting.year', '=', year);
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

  const rankings = await query.execute();
  return rankings.map((r) => ({
    teamId: r.teamId,
    team: r.team,
    conference: r.conference,
    year: r.year,
    ranking: r.ranking,
    rating: Number(r.points),
  }));
};

export const getTransfers = async (
  season?: number,
  sourceTeam?: string,
  destinationTeam?: string,
  sourceConference?: string,
  destinationConference?: string,
  position?: string,
): Promise<Transfer[]> => {
  let query = db
    .selectFrom('transfer')
    .innerJoin('recruitPosition', 'recruitPosition.id', 'transfer.positionId')
    .leftJoin('team as fromTeam', 'fromTeam.id', 'transfer.fromTeamId')
    .leftJoin('conferenceTeam as fromConferenceTeam', (join) =>
      join
        .onRef('fromConferenceTeam.teamId', '=', 'fromTeam.id')
        .onRef('fromConferenceTeam.startYear', '<=', 'transfer.season')
        .on((eb) =>
          eb.or([
            eb('fromConferenceTeam.endYear', '>=', eb.ref('transfer.season')),
            eb('fromConferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin(
      'conference as fromConference',
      'fromConference.id',
      'fromConferenceTeam.conferenceId',
    )
    .leftJoin('team as toTeam', 'toTeam.id', 'transfer.toTeamId')
    .leftJoin('conferenceTeam as toConferenceTeam', (join) =>
      join
        .onRef('toConferenceTeam.teamId', '=', 'toTeam.id')
        .onRef('toConferenceTeam.startYear', '<=', 'transfer.season')
        .on((eb) =>
          eb.or([
            eb('toConferenceTeam.endYear', '>=', eb.ref('transfer.season')),
            eb('toConferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .leftJoin(
      'conference as toConference',
      'toConference.id',
      'toConferenceTeam.conferenceId',
    )
    .select([
      'transfer.id',
      'transfer.sourceId',
      'transfer.season',
      'transfer.firstName',
      'transfer.lastName',
      'recruitPosition.position as position',
      'fromTeam.id as sourceTeamId',
      'fromTeam.school as sourceTeam',
      'fromConference.abbreviation as sourceConference',
      'toTeam.id as destinationTeamId',
      'toTeam.school as destinationTeam',
      'toConference.abbreviation as destinationConference',
      'transfer.stars',
      'transfer.rating',
      'transfer.eligibility',
      'transfer.yearsRemaining',
    ])
    .orderBy('transfer.season', 'desc')
    .orderBy('transfer.lastName')
    .orderBy('transfer.firstName');

  if (season) {
    query = query.where('transfer.season', '=', season);
  }

  if (sourceTeam) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('fromTeam.school')]),
      '=',
      sourceTeam.toLowerCase(),
    );
  }

  if (destinationTeam) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('toTeam.school')]),
      '=',
      destinationTeam.toLowerCase(),
    );
  }

  if (sourceConference) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('fromConference.abbreviation')]),
      '=',
      sourceConference.toLowerCase(),
    );
  }

  if (destinationConference) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('toConference.abbreviation')]),
      '=',
      destinationConference.toLowerCase(),
    );
  }

  if (position) {
    query = query.where(
      (eb) => eb.fn('lower', [eb.ref('recruitPosition.position')]),
      '=',
      position.toLowerCase(),
    );
  }

  const transfers = await query.execute();
  return transfers.map((t) => ({
    id: t.id,
    sourceId: t.sourceId,
    year: t.season,
    firstName: t.firstName,
    lastName: t.lastName,
    position: t.position,
    origin: t.sourceTeamId
      ? {
          id: t.sourceTeamId,
          name: t.sourceTeam,
          conference: t.sourceConference,
        }
      : null,
    destination: t.destinationTeamId
      ? {
          id: t.destinationTeamId,
          name: t.destinationTeam,
          conference: t.destinationConference,
        }
      : null,
    stars: t.stars,
    rating: t.rating ? Number(t.rating) : null,
    eligibility: t.eligibility ? (t.eligibility as TransferEligibility) : null,
    yearsRemaining: t.yearsRemaining,
  }));
};

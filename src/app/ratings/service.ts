import { db } from '../../config/database';

import { AdjustedEfficiencyInfo, SrsInfo } from './types';

export const getSrs = async (
  year?: number,
  team?: string,
  conference?: string,
): Promise<SrsInfo[]> => {
  let query = db
    .selectFrom('srs')
    .innerJoin('team', 'team.id', 'srs.teamId')
    .innerJoin('conferenceTeam', (join) =>
      join
        .onRef('conferenceTeam.teamId', '=', 'team.id')
        .onRef('conferenceTeam.startYear', '<=', 'srs.season')
        .on((eb) =>
          eb.or([
            eb('conferenceTeam.endYear', '>=', eb.ref('srs.season')),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .innerJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .select([
      'srs.season',
      'srs.teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      'srs.rating',
    ])
    .orderBy('srs.season', 'desc')
    .orderBy('srs.rating', 'desc');

  if (year) {
    query = query.where('srs.season', '=', year);
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

  const ratings = await query.execute();
  return ratings.map((r) => ({
    season: r.season,
    teamId: r.teamId,
    team: r.team,
    conference: r.conference,
    rating: Number(r.rating),
  }));
};

export const getAdjustedEfficiency = async (
  year?: number,
  team?: string,
  conference?: string,
): Promise<AdjustedEfficiencyInfo[]> => {
  let query = db
    .selectFrom('adjustedEfficiency')
    .innerJoin('team', 'team.id', 'adjustedEfficiency.teamId')
    .innerJoin('conferenceTeam', (join) =>
      join
        .onRef('conferenceTeam.teamId', '=', 'team.id')
        .onRef('conferenceTeam.startYear', '<=', 'adjustedEfficiency.season')
        .on((eb) =>
          eb.or([
            eb(
              'conferenceTeam.endYear',
              '>=',
              eb.ref('adjustedEfficiency.season'),
            ),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .innerJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .select([
      'adjustedEfficiency.season',
      'adjustedEfficiency.teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      'adjustedEfficiency.offense as offensiveRating',
      'adjustedEfficiency.defense as defensiveRating',
      'adjustedEfficiency.net as netRating',
    ])
    .select((eb) =>
      eb.fn
        .agg<number>('rank')
        .over((ob) => ob.orderBy('offense', 'desc'))
        .as('offenseRank'),
    )
    .select((eb) =>
      eb.fn
        .agg<number>('rank')
        .over((ob) => ob.orderBy('defense'))
        .as('defenseRank'),
    )
    .select((eb) =>
      eb.fn
        .agg<number>('rank')
        .over((ob) => ob.orderBy('net', 'desc'))
        .as('netRank'),
    )
    .orderBy('adjustedEfficiency.season', 'desc')
    .orderBy('adjustedEfficiency.net', 'desc');

  if (year) {
    query = query.where('adjustedEfficiency.season', '=', year);
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

  const ratings = await query.execute();
  return ratings.map((r) => ({
    season: r.season,
    teamId: r.teamId,
    team: r.team,
    conference: r.conference,
    offensiveRating: Number(r.offensiveRating),
    defensiveRating: Number(r.defensiveRating),
    netRating: Number(r.netRating),
    rankings: {
      offense: Number(r.offenseRank),
      defense: Number(r.defenseRank),
      net: Number(r.netRank),
    },
  }));
};

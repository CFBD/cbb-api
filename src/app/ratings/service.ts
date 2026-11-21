import { sql } from 'kysely';
import { ValidateError } from 'tsoa';
import { db } from '../../config/database';
import { AuthorizationError } from '../../globals';

import {
  AdjustedEfficiencyInfo,
  SrsInfo,
  TeamElo,
  TeamRatingHistory,
} from './types';

const toNullableNumber = (value: string | null): number | null =>
  value === null ? null : Number(value);

export const getRatingHistory = async (
  patronLevel: number,
  season: number,
  date?: string,
  team?: string,
  conference?: string,
): Promise<TeamRatingHistory[]> => {
  if (!Number.isInteger(season) || season < 1 || season > 32767) {
    throw new ValidateError(
      {
        season: {
          value: season,
          message: 'season must be an integer between 1 and 32767',
        },
      },
      'Invalid season',
    );
  }
  if (date === undefined && !team?.trim()) {
    throw new ValidateError(
      { date: { message: 'Provide a rating date or team' } },
      'Missing rating history filter',
    );
  }
  if (date !== undefined) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date.startsWith('0000') ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new ValidateError(
        {
          date: {
            value: date,
            message: 'date must be a valid YYYY-MM-DD date',
          },
        },
        'Invalid rating date',
      );
    }
  }

  const now = new Date();
  const currentSeason = now.getUTCFullYear() + (now.getUTCMonth() >= 9 ? 1 : 0);
  if (season < currentSeason && patronLevel < 3) {
    throw new AuthorizationError(
      'Unauthorized. Ratings history for earlier seasons requires a Patreon subscription at Tier 3 or higher.',
    );
  }

  let query = db
    .selectFrom('teamRatingHistory as history')
    .innerJoin('team', 'team.id', 'history.teamId')
    .innerJoin('conferenceTeam', (join) =>
      join
        .onRef('conferenceTeam.teamId', '=', 'history.teamId')
        .onRef('conferenceTeam.startYear', '<=', 'history.season')
        .on((eb) =>
          eb.or([
            eb('conferenceTeam.endYear', '>=', eb.ref('history.season')),
            eb('conferenceTeam.endYear', 'is', null),
          ]),
        ),
    )
    .innerJoin('conference', 'conference.id', 'conferenceTeam.conferenceId')
    .select([
      'history.season',
      'history.teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      'history.series',
      'history.games',
      'history.offense',
      'history.defense',
      'history.net',
      'history.srs',
      'history.offenseRank',
      'history.defenseRank',
      'history.netRank',
    ])
    .select((eb) => {
      const change = (days: number) =>
        eb
          .selectFrom('teamRatingHistory as prior')
          .whereRef('prior.season', '=', 'history.season')
          .whereRef('prior.teamId', '=', 'history.teamId')
          .where(
            'prior.ratingDate',
            '=',
            sql<Date>`${eb.ref('history.ratingDate')} - ${days}::integer`,
          )
          .select(({ ref }) =>
            sql<string | null>`${ref('history.net')} - ${ref('prior.net')}`.as(
              'change',
            ),
          );
      return [
        sql<string>`to_char(${eb.ref('history.ratingDate')}, 'YYYY-MM-DD')`.as(
          'date',
        ),
        change(1).as('oneDay'),
        change(7).as('sevenDays'),
        change(30).as('thirtyDays'),
      ];
    })
    .where('history.season', '=', season)
    .orderBy('history.ratingDate')
    .orderBy(sql`${sql.ref('history.netRank')} asc nulls last`)
    .orderBy('team.school');

  if (date !== undefined) {
    query = query.where('history.ratingDate', '=', sql<Date>`${date}::date`);
  }
  if (team !== undefined) {
    query = query.where(
      (eb) => eb.fn('lower', ['team.school']),
      '=',
      team.toLowerCase(),
    );
  }
  if (conference !== undefined) {
    query = query.where(
      (eb) => eb.fn('lower', ['conference.abbreviation']),
      '=',
      conference.toLowerCase(),
    );
  }

  const rows = await query.execute();
  return rows.map((row) => ({
    season: row.season,
    date: row.date,
    teamId: row.teamId,
    team: row.team,
    conference: row.conference,
    series: row.series as TeamRatingHistory['series'],
    games: row.games,
    offensiveRating: toNullableNumber(row.offense),
    defensiveRating: toNullableNumber(row.defense),
    netRating: toNullableNumber(row.net),
    srs: toNullableNumber(row.srs),
    rankings: {
      offense: row.offenseRank,
      defense: row.defenseRank,
      net: row.netRank,
    },
    netRatingChange: {
      oneDay: toNullableNumber(row.oneDay),
      sevenDays: toNullableNumber(row.sevenDays),
      thirtyDays: toNullableNumber(row.thirtyDays),
    },
  }));
};

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

export const getElo = async (
  year?: number,
  team?: string,
  conference?: string,
): Promise<TeamElo[]> => {
  const query = db
    .with('elos', (eb) => {
      let cte = eb
        .selectFrom('game')
        .innerJoin('gameTeam', 'game.id', 'gameTeam.gameId')
        .innerJoin('team', 'gameTeam.teamId', 'team.id')
        .innerJoin('conferenceTeam', (join) =>
          join
            .onRef('team.id', '=', 'conferenceTeam.teamId')
            .onRef('conferenceTeam.startYear', '<=', 'game.season')
            .on((eb) =>
              eb.or([
                eb('conferenceTeam.endYear', 'is', null),
                eb('conferenceTeam.endYear', '>=', eb.ref('game.season')),
              ]),
            ),
        )
        .innerJoin('conference', 'conferenceTeam.conferenceId', 'conference.id')
        .where('gameTeam.endElo', 'is not', null)
        .where('game.status', '=', 'final')
        .select((eb) =>
          eb.fn
            .agg<number>('rank')
            .over((over) =>
              over
                .partitionBy(['game.season', 'team.school'])
                .orderBy('game.startDate', 'desc'),
            )
            .as('rowNum'),
        )
        .select([
          'game.season',
          'team.id as teamId',
          'team.school as team',
          'conference.name as conference',
          'gameTeam.endElo as elo',
        ]);

      if (year) {
        cte = cte.where('game.season', '=', year);
      }

      if (team) {
        cte = cte.where((eb) =>
          eb(eb.fn('lower', ['team.school']), '=', team.toLowerCase()),
        );
      }

      if (conference) {
        cte = cte.where((eb) =>
          eb(
            eb.fn('lower', ['conference.abbreviation']),
            '=',
            conference.toLowerCase(),
          ),
        );
      }

      return cte;
    })
    .selectFrom('elos')
    .select(['season', 'teamId', 'team', 'conference', 'elo'])
    .where('rowNum', '=', 1);

  const results = await query.execute();
  return results;
};

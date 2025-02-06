import { SeasonType } from '../enums';
import { PollTeamInfo } from './types';

import { db } from '../../config/database';

export const getPolls = async (
  season?: number,
  seasonType?: SeasonType,
  week?: number,
  pollType?: 'ap' | 'coaches',
  team?: string,
  conference?: string,
): Promise<PollTeamInfo[]> => {
  let query = db
    .selectFrom('poll')
    .innerJoin('pollType', 'poll.pollTypeId', 'pollType.id')
    .innerJoin('pollRank', 'poll.id', 'pollRank.pollId')
    .innerJoin('team', 'pollRank.teamId', 'team.id')
    .leftJoin('conferenceTeam', (join) =>
      join
        .onRef('team.id', '=', 'conferenceTeam.teamId')
        .onRef('conferenceTeam.startYear', '<=', 'poll.season')
        .on((eb) =>
          eb.or([
            eb('conferenceTeam.endYear', 'is', null),
            eb('conferenceTeam.endYear', '>=', eb.ref('poll.season')),
          ]),
        ),
    )
    .leftJoin('conference', 'conferenceTeam.conferenceId', 'conference.id')
    .select([
      'poll.season',
      'poll.seasonType',
      'poll.week',
      'poll.pollDate',
      'pollType.name as pollType',
      'team.id as teamId',
      'team.school as team',
      'conference.abbreviation as conference',
      'pollRank.rank as ranking',
      'pollRank.points',
      'pollRank.firstPlaceVotes',
    ])
    .orderBy('poll.season', 'desc')
    .orderBy('poll.week')
    .orderBy('pollType.name')
    .orderBy('pollRank.rank');

  if (season) {
    query = query.where('poll.season', '=', season);
  }

  if (seasonType) {
    query = query.where('poll.seasonType', '=', seasonType);
  }

  if (week) {
    query = query.where('poll.week', '=', week);
  }

  if (pollType) {
    const pollTypeId = pollType === 'ap' ? 1 : 2;
    query = query.where('pollType.id', '=', pollTypeId);
  }

  if (team) {
    query = query.where(
      (eb) => eb.fn('lower', ['team.school']),
      '=',
      team.toLowerCase(),
    );
  }

  if (conference) {
    query = query.where(
      (eb) => eb.fn('lower', ['conference.abbreviation']),
      '=',
      conference.toLowerCase(),
    );
  }

  const ranks = await query.execute();
  return ranks.map((rank) => ({
    ...rank,
    seasonType: rank.seasonType as SeasonType,
  }));
};

/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from 'kysely';

export type GameStatus =
  | 'cancelled'
  | 'final'
  | 'in_progress'
  | 'postponed'
  | 'scheduled';

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<
  string,
  bigint | number | string,
  bigint | number | string
>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Numeric = ColumnType<string, number | string, number | string>;

export type Point = {
  x: number;
  y: number;
};

export type SeasonType = 'postseason' | 'preseason' | 'regular';

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface AdjustedEfficiency {
  defense: Numeric;
  id: Generated<number>;
  net: Numeric;
  offense: Numeric;
  season: number;
  teamId: number;
}

export interface Athlete {
  dob: Timestamp | null;
  firstName: string | null;
  height: number | null;
  hometownId: number | null;
  id: Generated<number>;
  jersey: string | null;
  lastName: string | null;
  name: string;
  positionId: number | null;
  sourceId: string;
  weight: number | null;
}

export interface AthleteTeam {
  athleteId: number;
  endSeason: number;
  id: Generated<number>;
  startSeason: number;
  teamId: number;
}

export interface Conference {
  abbreviation: string;
  id: Generated<number>;
  name: string;
  shortName: string;
  sourceId: string;
  srInfo: Json | null;
}

export interface ConferenceTeam {
  conferenceId: number;
  endYear: number | null;
  id: Generated<number>;
  startYear: number;
  teamId: number;
}

export interface Game {
  attendance: number | null;
  conferenceGame: Generated<boolean>;
  excitement: Numeric | null;
  gameType: string | null;
  id: Generated<number>;
  neutralSite: Generated<boolean>;
  notes: string | null;
  season: number;
  seasonLabel: string;
  seasonType: SeasonType;
  sourceId: string;
  startDate: Timestamp;
  startTimeTbd: boolean;
  status: GameStatus;
  tournamentId: number | null;
  venueId: number | null;
}

export interface GameInfo {
  attendance: number | null;
  awayConference: string | null;
  awayConferenceId: number | null;
  awayPeriodPoints: number[] | null;
  awayPoints: number | null;
  awayTeam: string | null;
  awayTeamId: number | null;
  awayWinner: boolean | null;
  conferenceGame: boolean | null;
  excitement: Numeric | null;
  gameType: string | null;
  homeConference: string | null;
  homeConferenceId: number | null;
  homePeriodPoints: number[] | null;
  homePoints: number | null;
  homeTeam: string | null;
  homeTeamId: number | null;
  homeWinner: boolean | null;
  id: number | null;
  neutralSite: boolean | null;
  notes: string | null;
  season: number | null;
  seasonLabel: string | null;
  seasonType: SeasonType | null;
  sourceId: string | null;
  startDate: Timestamp | null;
  startTimeTbd: boolean | null;
  status: GameStatus | null;
  tournamentId: number | null;
  venueId: number | null;
}

export interface GameLine {
  awayMoneyline: Numeric | null;
  gameId: number;
  homeMoneyline: Numeric | null;
  id: Generated<number>;
  lineProviderId: number;
  overUnder: Numeric | null;
  overUnderOpen: Numeric | null;
  spread: Numeric | null;
  spreadOpen: Numeric | null;
}

export interface GameMedia {
  gameId: number;
  id: Generated<number>;
  mediaType: string;
  name: string;
}

export interface GamePlayerStats {
  '2pa': number | null;
  '2pm': number | null;
  '2pPct': Numeric | null;
  '3pa': number | null;
  '3pm': number | null;
  '3pPct': Numeric | null;
  ast: number | null;
  athleteId: number;
  blk: number | null;
  dreb: number | null;
  efg: Numeric | null;
  ejected: boolean | null;
  fga: number | null;
  fgm: number | null;
  fgPct: Numeric | null;
  fta: number | null;
  ftm: number | null;
  ftPct: Numeric | null;
  gameScore: Numeric | null;
  gameTeamId: number;
  id: Generated<Int8>;
  minutes: number | null;
  oreb: number | null;
  pf: number | null;
  points: number | null;
  reb: number | null;
  starter: boolean | null;
  stl: number | null;
  to: number | null;
  trueShooting: Numeric | null;
  usage: Numeric | null;
}

export interface GameTeam {
  gameId: number;
  id: Generated<number>;
  isHome: boolean;
  isWinner: boolean | null;
  periodPoints: number[] | null;
  points: number | null;
  teamId: number;
}

export interface GameTeamStats {
  '2pa': number | null;
  '2pm': number | null;
  '2pPct': Numeric | null;
  '3pa': number | null;
  '3pm': number | null;
  '3pPct': Numeric | null;
  ast: number | null;
  blk: number | null;
  dreb: number | null;
  efg: Numeric | null;
  fga: number | null;
  fgm: number | null;
  fgPct: Numeric | null;
  flag: number | null;
  fta: number | null;
  ftm: number | null;
  ftPct: Numeric | null;
  gameTeamId: number;
  id: Generated<number>;
  largestLead: number | null;
  oreb: number | null;
  pf: number | null;
  pointsFastBreak: number | null;
  pointsInPaint: number | null;
  pointsOffTo: number | null;
  possessions: number | null;
  reb: number | null;
  stl: number | null;
  tech: number | null;
  to: number | null;
  toto: number | null;
  trueShooting: Numeric | null;
  tto: number | null;
}

export interface Hometown {
  city: string;
  country: string | null;
  id: Generated<number>;
  state: string | null;
}

export interface LineProvider {
  id: Generated<number>;
  name: string;
  sourceId: string;
}

export interface Play {
  awayScore: number;
  clock: string;
  gameId: number;
  homeScore: number;
  id: Generated<Int8>;
  participants: number[] | null;
  period: number;
  playText: string | null;
  playTypeId: number;
  scoreValue: number | null;
  scoringPlay: boolean | null;
  secondsRemaining: number;
  sequencer: string | null;
  shootingPlay: boolean | null;
  sourceId: string;
  teamId: number | null;
  wallclock: Timestamp | null;
  wp: Numeric | null;
}

export interface PlayType {
  id: number;
  name: string;
}

export interface Poll {
  id: Generated<number>;
  pollDate: Timestamp | null;
  pollTypeId: number;
  season: number;
  seasonType: SeasonType;
  week: number;
}

export interface PollRank {
  firstPlaceVotes: number | null;
  id: Generated<number>;
  points: number | null;
  pollId: number;
  rank: number | null;
  teamId: number;
}

export interface PollType {
  id: number;
  name: string;
  shortName: string;
}

export interface Position {
  abbreviation: string;
  id: Generated<number>;
  name: string;
}

export interface Srs {
  id: Generated<number>;
  rating: Numeric;
  season: number;
  teamId: number;
}

export interface Team {
  abbreviation: string | null;
  active: Generated<boolean>;
  displayName: string | null;
  homeVenueId: number | null;
  id: Generated<number>;
  mascot: string | null;
  nickname: string | null;
  primaryColor: string | null;
  school: string;
  secondaryColor: string | null;
  shortDisplayName: string | null;
  sourceId: string;
  srInfo: Json | null;
}

export interface Venue {
  capacity: number | null;
  city: string | null;
  contructionYear: number | null;
  country: string | null;
  id: Generated<number>;
  indoor: Generated<boolean>;
  location: Point | null;
  name: string;
  postalCode: string | null;
  sourceId: string;
  state: string | null;
  timezone: string | null;
}

export interface DB {
  adjustedEfficiency: AdjustedEfficiency;
  athlete: Athlete;
  athleteTeam: AthleteTeam;
  conference: Conference;
  conferenceTeam: ConferenceTeam;
  game: Game;
  gameInfo: GameInfo;
  gameLine: GameLine;
  gameMedia: GameMedia;
  gamePlayerStats: GamePlayerStats;
  gameTeam: GameTeam;
  gameTeamStats: GameTeamStats;
  hometown: Hometown;
  lineProvider: LineProvider;
  play: Play;
  playType: PlayType;
  poll: Poll;
  pollRank: PollRank;
  pollType: PollType;
  position: Position;
  srs: Srs;
  team: Team;
  venue: Venue;
}

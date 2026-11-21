import {
  Route,
  Tags,
  Controller,
  Get,
  Query,
  Middlewares,
  Request,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import middlewares from '../../config/middleware';
import { requirePatreonTier } from '../../config/middleware/patreon';
import { ApiUser } from '../../globals';
import {
  AdjustedEfficiencyInfo,
  SrsInfo,
  TeamElo,
  TeamRatingHistory,
} from './types';
import {
  getAdjustedEfficiency,
  getElo,
  getRatingHistory,
  getSrs,
} from './service';

@Route('ratings')
@Middlewares(middlewares.standard)
@Tags('ratings')
export class RatingsController extends Controller {
  /**
   * Returns daily snapshots of adjusted efficiency and SRS ratings. Provide at least a date or team.
   * This endpoint requires Patreon Tier 2 access or higher. Earlier seasons require Tier 3 access or higher.
   * @param season Filters results to the specified season.
   * @param date Filters results to the specified UTC rating date (YYYY-MM-DD). Required when team is not provided.
   * @param team Filters results to the specified team name. Required when date is not provided.
   * @param conference Filters results to the specified conference abbreviation.
   * @isInt season
   */
  @Get('history')
  @Middlewares(requirePatreonTier(2))
  public async getRatingHistory(
    @Request() request: ExpressRequest & { user: ApiUser },
    @Query() season: number,
    @Query() date?: string,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<TeamRatingHistory[]> {
    return await getRatingHistory(
      request.user.patronLevel,
      season,
      date,
      team,
      conference,
    );
  }

  /**
   * Returns Simple Rating System (SRS) ratings.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @isInt season
   */
  @Get('srs')
  public async getSrs(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<SrsInfo[]> {
    return await getSrs(season, team, conference);
  }

  /**
   * Returns adjusted offensive and defensive efficiency ratings.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @isInt season
   */
  @Get('adjusted')
  public async getAdjustedEfficiency(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<AdjustedEfficiencyInfo[]> {
    return await getAdjustedEfficiency(season, team, conference);
  }

  /**
   * Returns historical Elo ratings.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @isInt season
   */
  @Get('elo')
  public async getElo(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<TeamElo[]> {
    return await getElo(season, team, conference);
  }
}

import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiUser, AuthorizationError } from '../../globals';

export const requirePatreonTier = (
  requiredLevel: 1 | 2,
  options: { allowWebsitePage?: boolean } = {},
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: ApiUser }).user;
    if (
      options.allowWebsitePage &&
      user?.principalClass === 'websitePage' &&
      req.method === 'GET' &&
      req.route?.path === '/stats/team/leaderboard'
    ) {
      next();
      return;
    }
    if (user && user.patronLevel >= requiredLevel) {
      next();
      return;
    }

    next(
      new AuthorizationError(
        `Unauthorized. This endpoint requires a Patreon subscription at Tier ${requiredLevel} or higher.`,
      ),
    );
  };
};

import { NextFunction, Request, Response } from 'express';
import { authDb } from '../database';
import { ApiUser } from 'src/globals';
import { sql } from 'kysely';

export const ignoredPaths: string[] = [];

export const checkCallQuotas = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    // @ts-ignore
    req.user &&
    // @ts-ignore
    !req.user.isAdmin &&
    !ignoredPaths.includes(req.path) &&
    // @ts-ignore
    req.user.remainingCalls <= 0
  ) {
    res.status(429).send({
      message: 'Monthly call quota exceeded.',
    });
    return;
  }

  next();
};

export const updateQuotas = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const temp = res.send;

  // @ts-ignore
  res.send = async (body) => {
    if (
      res.statusCode === 200 &&
      // @ts-ignore
      req.user &&
      !ignoredPaths.includes(req.path)
    ) {
      // @ts-ignore
      const user = req.user as ApiUser;
      try {
        const remaining = await authDb
          .updateTable('user')
          .set({
            remainingCalls: sql`remaining_calls - 1`,
          })
          .where('id', '=', user.id)
          .returning('remainingCalls')
          .executeTakeFirstOrThrow();
        user.remainingCalls = remaining.remainingCalls;
      } catch (error) {
        console.error('Error updating remaining calls', error);
      }
    }

    // @ts-ignore
    if (req.user) {
      // @ts-ignore
      res.setHeader('X-CallLimit-Remaining', req.user.remainingCalls);
    }

    temp.call(res, body);
  };

  next();
};

import { NextFunction, Request, Response } from 'express';
import { authDb } from '../database';
import { ApiUser } from 'src/globals';
import { sql } from 'kysely';

type QuotaRequest = Request & {
  quotaReserved?: boolean;
  user?: ApiUser;
};

export const ignoredPaths: string[] = ['/scoreboard'];

const isSuccessfulResponse = (statusCode: number): boolean =>
  statusCode >= 200 && statusCode < 300;

const shouldMeterRequest = (
  req: QuotaRequest,
): req is QuotaRequest & { user: ApiUser } =>
  !!req.user && !req.user.isAdmin && !ignoredPaths.includes(req.path);

export const checkCallQuotas = async (
  req: QuotaRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!shouldMeterRequest(req)) {
    next();
    return;
  }

  const user = req.user;

  if (user.remainingCalls <= 0) {
    res.status(429).send({
      message: 'Monthly call quota exceeded.',
    });
    return;
  }

  try {
    const remaining = await authDb
      .updateTable('user')
      .set({
        remainingCalls: sql`remaining_calls - 1`,
      })
      .where('id', '=', user.id)
      .where('remainingCalls', '>', 0)
      .returning('remainingCalls')
      .executeTakeFirst();

    if (!remaining) {
      user.remainingCalls = 0;
      res.status(429).send({
        message: 'Monthly call quota exceeded.',
      });
      return;
    }

    req.quotaReserved = true;
    user.remainingCalls = remaining.remainingCalls;
    next();
  } catch (error) {
    console.error('Error reserving quota', error);
    res.status(503).send({
      message: 'Unable to verify call quota. Please retry later.',
    });
  }
};

export const updateQuotas = async (
  req: QuotaRequest,
  res: Response,
  next: NextFunction,
) => {
  const send = res.send.bind(res);

  res.send = (async (body?: unknown) => {
    if (
      !isSuccessfulResponse(res.statusCode) &&
      req.user &&
      req.quotaReserved
    ) {
      const user = req.user;
      try {
        const remaining = await authDb
          .updateTable('user')
          .set({
            remainingCalls: sql`remaining_calls + 1`,
          })
          .where('id', '=', user.id)
          .returning('remainingCalls')
          .executeTakeFirstOrThrow();
        user.remainingCalls = remaining.remainingCalls;
      } catch (error) {
        console.error('Error refunding remaining calls', error);
      }
    }

    if (req.user) {
      res.setHeader('X-CallLimit-Remaining', req.user.remainingCalls);
    }

    return send(body);
  }) as unknown as Response['send'];

  next();
};

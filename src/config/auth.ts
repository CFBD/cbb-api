import { Request } from 'express';

import { authDb } from './database';
import { AuthorizationError } from '../globals';

const keyPattern = /Bearer (?<token>.+)/;

// export const patreonLocked: Record<string, number> = {
//   '/controller/route': 1,
// };

const corsOrigin: string =
  process.env.CORS_ORIGIN || 'https://collegebasketballdata.com';
const nodeEnv: string = process.env.NODE_ENV || 'production';

export const expressAuthentication = async (
  // @ts-ignore
  request: Request,
  securityName: string,
) => {
  if (securityName === 'apiKey') {
    if (
      !request.headers.authorization //&&
      // !Object.keys(patreonLocked).includes(request.path)
    ) {
      const origin = request.get('origin');
      const host = request.get('host');

      if (
        nodeEnv === 'development' ||
        corsOrigin === origin ||
        corsOrigin === host
      ) {
        return Promise.resolve(null);
      }
    }

    if (
      !request.headers.authorization ||
      !keyPattern.test(request.headers.authorization ?? '')
    ) {
      return Promise.reject(
        new AuthorizationError(
          'Unauthorized. Did you forget to add "Bearer " before your key? Go to CollegeFootballData.com to register for your free API key. See the CFBD Blog for examples on usage: https://blog.collegefootballdata.com/using-api-keys-with-the-cfbd-api.',
        ),
      );
    } else {
      const token = keyPattern.exec(request.headers.authorization ?? '');
      if (!token?.groups?.['token']) {
        return Promise.reject(
          new AuthorizationError(
            'Unauthorized. No token provided. Go to CollegeFootballData.com to register for your free API key.',
          ),
        );
      } else {
        const user = await authDb
          .selectFrom('user')
          .where('token', '=', token?.groups?.['token'] ?? '')
          .selectAll()
          .executeTakeFirst();
        if (user && !user?.blacklisted) {
          // if (!user?.patronLevel || (user?.patronLevel ?? 0) < 1) {
          //   return Promise.reject(
          //     new AuthorizationError(
          //       'Unauthorized. This API is in limited preview for Patreon subscribers. Go to https://www.patreon.com/c/collegefootballdata to subscribe.',
          //     ),
          //   );
          // }
          // if (Object.keys(patreonLocked).includes(request.path)) {
          //   const requiredLevel = patreonLocked[request.path];
          //   if (!user.patron_level || user.patron_level < requiredLevel) {
          //     return Promise.reject(
          //       new AuthorizationError(
          //         `Unauthorized. This endpoint requires a Patreon subscription at Tier ${requiredLevel} or higher.`,
          //       ),
          //     );
          //   }
          // }

          try {
            await authDb
              .insertInto('metrics')
              .values({
                userId: user.id,
                endpoint: request.path,
                query: request.query,
                userAgent: request.get('user-agent') ?? '',
                apiVersion: 'cbb',
              })
              .execute();
          } catch (err) {
            console.error(err);
          }

          return Promise.resolve({
            id: user?.id,
            username: user?.username,
            patronLevel: user?.patronLevel,
            blacklisted: user?.blacklisted,
            throttled: user?.throttled,
            remainingCalls: user?.remainingCalls,
            isAdmin: user?.isAdmin,
          });
        } else if (user?.blacklisted) {
          return Promise.reject(
            new AuthorizationError('Account has been blacklisted.'),
          );
        } else {
          return Promise.reject(new AuthorizationError('Unauthorized'));
        }
      }
    }
  }

  return Promise.reject(new AuthorizationError('Unauthorized'));
};

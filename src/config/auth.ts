import { Request } from 'express';

import { authDb } from './database';
import { AuthorizationError } from '../globals';
import {
  classifyPrincipal,
  isServiceOperationAllowed,
} from './servicePrincipals';
import { isDeniedCfbWebsitePrincipal } from './cfbServicePrincipals';

const keyPattern = /^Bearer (?<token>\S+)$/;

type AuthOutcome =
  | 'allowed'
  | 'missing'
  | 'malformed'
  | 'unknown'
  | 'blacklisted'
  | 'out_of_scope';

const logAuthOutcome = (
  request: Request,
  outcome: AuthOutcome,
  principalClass: 'individual' | 'websitePage' | 'websiteExporter' | 'unknown',
): void => {
  const matchedPath =
    typeof request.route?.path === 'string' ? request.route.path : 'unmatched';
  console.info(
    JSON.stringify({
      event: 'api_request_auth',
      principalClass,
      operation: `${request.method.toUpperCase()} ${matchedPath}`,
      outcome,
    }),
  );
};

export const expressAuthentication = async (
  request: Request,
  securityName: string,
) => {
  if (securityName !== 'apiKey') {
    logAuthOutcome(request, 'malformed', 'unknown');
    return Promise.reject(new AuthorizationError('Unauthorized'));
  }

  const authorization = request.headers.authorization;
  const token = authorization ? keyPattern.exec(authorization) : null;
  if (!token?.groups?.['token']) {
    logAuthOutcome(
      request,
      authorization === undefined ? 'missing' : 'malformed',
      'unknown',
    );
    return Promise.reject(
      new AuthorizationError(
        'Unauthorized. Use "Bearer <key>". Register for a free API key at CollegeBasketballData.com.',
      ),
    );
  }

  const user = await authDb
    .selectFrom('user')
    .where('token', '=', token.groups['token'])
    .selectAll()
    .executeTakeFirst();
  if (!user) {
    logAuthOutcome(request, 'unknown', 'unknown');
    return Promise.reject(new AuthorizationError('Unauthorized'));
  }
  if (user.blacklisted) {
    logAuthOutcome(request, 'blacklisted', 'unknown');
    return Promise.reject(
      new AuthorizationError('Account has been blacklisted.'),
    );
  }

  if (isDeniedCfbWebsitePrincipal(user.id)) {
    logAuthOutcome(request, 'out_of_scope', 'unknown');
    throw new AuthorizationError('Unauthorized');
  }
  const principalClass = classifyPrincipal(user.id);
  const matchedPath =
    typeof request.route?.path === 'string' ? request.route.path : undefined;
  if (
    principalClass !== 'individual' &&
    (user.isAdmin ||
      user.patronLevel !== 0 ||
      user.throttled ||
      !matchedPath ||
      !isServiceOperationAllowed(principalClass, {
        method: request.method,
        path: matchedPath,
      }))
  ) {
    logAuthOutcome(request, 'out_of_scope', principalClass);
    return Promise.reject(new AuthorizationError('Unauthorized'));
  }

  try {
    await authDb
      .insertInto('metrics')
      .values({
        userId: user.id,
        endpoint: matchedPath ?? request.path,
        query: request.query,
        userAgent: request.get('user-agent') ?? '',
        apiVersion: 'cbb',
      })
      .execute();
  } catch {
    console.error('API metrics write failed.');
  }

  logAuthOutcome(request, 'allowed', principalClass);

  return Promise.resolve({
    id: user.id,
    username: user.username,
    patronLevel: user.patronLevel,
    blacklisted: user.blacklisted,
    throttled: user.throttled,
    remainingCalls: user.remainingCalls,
    isAdmin: user.isAdmin,
    principalClass,
  });
};

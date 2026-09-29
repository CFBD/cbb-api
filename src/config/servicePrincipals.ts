import spec from '../../build/swagger.json';
import { ApiPrincipalClass } from '../globals';
import { parseDeniedCfbServiceIds } from './cfbServicePrincipals';

export interface ServicePrincipalIds {
  websitePage?: number;
  websiteExporter?: number;
}

export interface ApiOperation {
  method: string;
  path: string;
}

const pageOperations = new Set([
  'GET /teams',
  'GET /teams/directory',
  'GET /teams/{teamId}/season/{season}/overview',
  'GET /conferences',
  'GET /ratings/adjusted',
  'GET /stats/team/season',
  'GET /stats/team/leaderboard',
]);
export const exporterDeniedPaths = new Set([
  '/scoreboard',
  '/teams/directory',
  '/teams/{teamId}/season/{season}/overview',
  '/stats/team/leaderboard',
]);

const parseId = (
  name: string,
  value: string | undefined,
): number | undefined => {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
};

export const parseServicePrincipalIds = (
  env: NodeJS.ProcessEnv,
): ServicePrincipalIds => {
  const websitePage = parseId(
    'CBBD_PUBLIC_PAGE_SERVICE_USER_ID',
    env.CBBD_PUBLIC_PAGE_SERVICE_USER_ID,
  );
  const websiteExporter = parseId(
    'CBBD_EXPORTER_SERVICE_USER_ID',
    env.CBBD_EXPORTER_SERVICE_USER_ID,
  );

  if ((websitePage === undefined) !== (websiteExporter === undefined)) {
    throw new Error('Both CBBD website service user IDs must be configured.');
  }
  if (websitePage !== undefined && websitePage === websiteExporter) {
    throw new Error('CBBD website service user IDs must be distinct.');
  }
  if (
    env.NODE_ENV === 'production' &&
    (websitePage === undefined || websiteExporter === undefined)
  ) {
    throw new Error(
      'CBBD website service user IDs are required in production.',
    );
  }

  const foreign = parseDeniedCfbServiceIds(env);
  const ids = [
    websitePage,
    websiteExporter,
    foreign.websitePage,
    foreign.websiteExporter,
  ].filter((id) => id !== undefined);
  if (new Set(ids).size !== ids.length)
    throw new Error('Website service user IDs must be disjoint across sports.');
  return { websitePage, websiteExporter };
};

let configuredIds: ServicePrincipalIds | undefined;

export const getServicePrincipalIds = (): ServicePrincipalIds => {
  configuredIds ??= parseServicePrincipalIds(process.env);
  return configuredIds;
};

export const validateServicePrincipalConfiguration = (): void => {
  getServicePrincipalIds();
};

export const classifyPrincipal = (
  userId: number,
  ids: ServicePrincipalIds = getServicePrincipalIds(),
): ApiPrincipalClass => {
  if (userId === ids.websitePage) {
    return 'websitePage';
  }
  if (userId === ids.websiteExporter) {
    return 'websiteExporter';
  }
  return 'individual';
};

interface OpenApiOperation {
  operationId?: unknown;
}

interface OpenApiDocument {
  paths?: Record<string, { get?: OpenApiOperation; [method: string]: unknown }>;
}

export const buildExporterOperations = (
  document: OpenApiDocument,
): Set<string> => {
  if (!document.paths || typeof document.paths !== 'object') {
    throw new Error('Generated OpenAPI document has no paths.');
  }

  const operationIds = new Set<string>();
  const operations = new Set<string>();
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith('/') || path.includes('://') || path.includes('?')) {
      throw new Error(`Invalid OpenAPI path: ${path}`);
    }
    if (!item?.get) {
      continue;
    }
    if (
      typeof item.get.operationId !== 'string' ||
      item.get.operationId.trim() === '' ||
      operationIds.has(item.get.operationId)
    ) {
      throw new Error(`Invalid or duplicate GET operation ID for ${path}.`);
    }

    operationIds.add(item.get.operationId);
    if (!exporterDeniedPaths.has(path)) {
      operations.add(`GET ${path}`);
    }
  }

  return operations;
};

const exporterOperations = buildExporterOperations(spec);
// Map only templates in the generated document, never a concrete caller URL.
const registeredOperations = new Map(
  Object.keys(spec.paths).map((path) => [
    path.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, ':$1'),
    path,
  ]),
);

export const isServiceOperationAllowed = (
  principalClass: ApiPrincipalClass,
  operation: ApiOperation,
): boolean => {
  if (principalClass === 'individual') {
    return true;
  }

  const path = registeredOperations.get(operation.path);
  if (!path) return false;
  const key = `${operation.method.toUpperCase()} ${path}`;
  return principalClass === 'websitePage'
    ? pageOperations.has(key)
    : exporterOperations.has(key);
};

export const getPageOperations = (): ReadonlySet<string> => pageOperations;
export const getExporterOperations = (): ReadonlySet<string> =>
  exporterOperations;

export interface DeniedCfbServiceIds {
  websitePage?: number;
  websiteExporter?: number;
}

const parseId = (
  name: string,
  value: string | undefined,
): number | undefined => {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
};

export const parseDeniedCfbServiceIds = (
  env: NodeJS.ProcessEnv,
): DeniedCfbServiceIds => {
  const websitePage = parseId(
    'CFBD_PUBLIC_PAGE_SERVICE_USER_ID',
    env.CFBD_PUBLIC_PAGE_SERVICE_USER_ID,
  );
  const websiteExporter = parseId(
    'CFBD_EXPORTER_SERVICE_USER_ID',
    env.CFBD_EXPORTER_SERVICE_USER_ID,
  );

  if ((websitePage === undefined) !== (websiteExporter === undefined)) {
    throw new Error('Both CFB website service user IDs must be configured.');
  }
  if (websitePage !== undefined && websitePage === websiteExporter) {
    throw new Error('CFB website service user IDs must be distinct.');
  }
  if (
    env.NODE_ENV === 'production' &&
    (websitePage === undefined || websiteExporter === undefined)
  ) {
    throw new Error('CFB website service user IDs are required in production.');
  }

  return { websitePage, websiteExporter };
};

let configuredIds: DeniedCfbServiceIds | undefined;

const getConfiguredIds = (): DeniedCfbServiceIds => {
  configuredIds ??= parseDeniedCfbServiceIds(process.env);
  return configuredIds;
};

export const validateCfbServicePrincipalConfiguration = (): void => {
  getConfiguredIds();
};

export const isDeniedCfbWebsitePrincipal = (
  userId: number,
  ids: DeniedCfbServiceIds = getConfiguredIds(),
): boolean => userId === ids.websitePage || userId === ids.websiteExporter;

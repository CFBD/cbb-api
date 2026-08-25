import {
  isDeniedCfbWebsitePrincipal,
  parseDeniedCfbServiceIds,
} from './cfbServicePrincipals';

describe('CFB website service principal containment', () => {
  const configured = {
    NODE_ENV: 'production',
    CFBD_PUBLIC_PAGE_SERVICE_USER_ID: '101',
    CFBD_EXPORTER_SERVICE_USER_ID: '202',
  } as NodeJS.ProcessEnv;

  test('denies both configured IDs and no ordinary ID', () => {
    const ids = parseDeniedCfbServiceIds(configured);

    expect(isDeniedCfbWebsitePrincipal(101, ids)).toBe(true);
    expect(isDeniedCfbWebsitePrincipal(202, ids)).toBe(true);
    expect(isDeniedCfbWebsitePrincipal(303, ids)).toBe(false);
  });

  test.each([
    {
      ...configured,
      CFBD_EXPORTER_SERVICE_USER_ID: undefined,
    },
    {
      ...configured,
      CFBD_EXPORTER_SERVICE_USER_ID: '101',
    },
    {
      ...configured,
      CFBD_EXPORTER_SERVICE_USER_ID: '0',
    },
    {
      ...configured,
      CFBD_EXPORTER_SERVICE_USER_ID: 'not-a-number',
    },
    {
      NODE_ENV: 'production',
    },
  ] as NodeJS.ProcessEnv[])(
    'rejects invalid production configuration',
    (env) => {
      expect(() => parseDeniedCfbServiceIds(env)).toThrow();
    },
  );

  test('allows both IDs to be absent outside production', () => {
    expect(parseDeniedCfbServiceIds({ NODE_ENV: 'test' })).toEqual({
      websitePage: undefined,
      websiteExporter: undefined,
    });
  });
});

import spec from '../../build/swagger.json';
import {
  parseServicePrincipalIds,
  getPageOperations,
  getExporterOperations,
  isServiceOperationAllowed,
} from './servicePrincipals';
const config = {
  NODE_ENV: 'production',
  CFBD_PUBLIC_PAGE_SERVICE_USER_ID: '1',
  CFBD_EXPORTER_SERVICE_USER_ID: '2',
  CBBD_PUBLIC_PAGE_SERVICE_USER_ID: '3',
  CBBD_EXPORTER_SERVICE_USER_ID: '4',
};
test('requires four disjoint safe IDs in production', () => {
  expect(parseServicePrincipalIds(config)).toEqual({
    websitePage: 3,
    websiteExporter: 4,
  });
  for (const key of Object.keys(config).filter((key) => key !== 'NODE_ENV'))
    for (const value of [undefined, '', '0', '-1', '1.5', '9007199254740992'])
      expect(() =>
        parseServicePrincipalIds({ ...config, [key]: value }),
      ).toThrow();
  expect(() =>
    parseServicePrincipalIds({ ...config, CBBD_EXPORTER_SERVICE_USER_ID: '1' }),
  ).toThrow();
});
test('reviewed scope covers 36 generated operations and exactly five parameterized routes', () => {
  expect([...getExporterOperations()]).toHaveLength(36);
  expect(
    [...getExporterOperations()].filter((path) => path.includes('{')),
  ).toHaveLength(5);
  expect([...getPageOperations()].sort()).toEqual(
    [
      'GET /teams',
      'GET /conferences',
      'GET /ratings/adjusted',
      'GET /stats/team/season',
      'GET /stats/team/leaderboard',
    ].sort(),
  );
  for (const [path, item] of Object.entries(spec.paths)) {
    if (!('get' in item)) continue;
    const matched = path.replace(/\{(\w+)\}/g, ':$1');
    expect(
      isServiceOperationAllowed('websiteExporter', {
        method: 'GET',
        path: matched,
      }),
    ).toBe(!['/scoreboard', '/stats/team/leaderboard'].includes(path));
    expect(
      isServiceOperationAllowed('websiteExporter', {
        method: 'POST',
        path: matched,
      }),
    ).toBe(false);
  }
  for (const path of ['/plays/game/123', '/auth/key', '/unknown'])
    expect(
      isServiceOperationAllowed('websiteExporter', { method: 'GET', path }),
    ).toBe(false);
});

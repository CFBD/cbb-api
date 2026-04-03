import {
  getGameMinutesFromPeriodCount,
  getSummedGameMinutesSql,
} from './minutes';
import { sql } from 'kysely';

describe('minute calculations', () => {
  test.each([
    [null, null],
    [2, 40],
    [3, 45],
    [4, 50],
    [5, 55],
  ])(
    'getGameMinutesFromPeriodCount(%s) returns %s',
    (periodCount, expectedMinutes) => {
      expect(getGameMinutesFromPeriodCount(periodCount)).toBe(expectedMinutes);
    },
  );

  test('summed SQL subtracts regulation periods before adding overtime minutes', () => {
    const expression = getSummedGameMinutesSql(
      sql<number>`array_length(game_team.period_points, 1)`,
    );

    const operationNode = expression.toOperationNode();
    const sqlNode = JSON.stringify(operationNode);

    expect(sqlNode).toContain('array_length(game_team.period_points, 1)');
    expect(sqlNode).toContain('40');
    expect(sqlNode).toContain('5');
    expect(sqlNode).toContain('2');
  });
});

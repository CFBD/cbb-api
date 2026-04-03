import { RawBuilder, sql } from 'kysely';

const REGULATION_PERIODS = 2;
const REGULATION_GAME_MINUTES = 40;
const OVERTIME_PERIOD_MINUTES = 5;

export const getGameMinutesFromPeriodCount = (
  periodCount: number | null,
): number | null => {
  if (periodCount == null) {
    return null;
  }

  return periodCount > REGULATION_PERIODS
    ? REGULATION_GAME_MINUTES +
        (periodCount - REGULATION_PERIODS) * OVERTIME_PERIOD_MINUTES
    : REGULATION_GAME_MINUTES;
};

export const getSummedGameMinutesSql = (
  periodCountExpression: RawBuilder<number | null>,
): RawBuilder<number> =>
  sql<number>`SUM(
    case
      when ${periodCountExpression} > ${REGULATION_PERIODS}
        then ${REGULATION_GAME_MINUTES} + (${periodCountExpression} - ${REGULATION_PERIODS}) * ${OVERTIME_PERIOD_MINUTES}
      else ${REGULATION_GAME_MINUTES}
    end
  )`;

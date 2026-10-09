import { defaults, types } from 'pg';

import './database';

describe('database timestamps', () => {
  it('reads timestamp without time zone values as UTC', () => {
    const parse = types.getTypeParser(types.builtins.TIMESTAMP);

    expect((parse('2024-04-09 01:20:00') as Date).toISOString()).toBe(
      '2024-04-09T01:20:00.000Z',
    );
    expect((parse('2026-03-08 02:30:00.25') as Date).toISOString()).toBe(
      '2026-03-08T02:30:00.250Z',
    );
  });

  it('sends Date parameters as UTC', () => {
    expect(defaults.parseInputDatesAsUTC).toBe(true);
  });
});

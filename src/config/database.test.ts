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

describe('database replica', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  const loadDatabase = (): typeof import('./database') => {
    let database: typeof import('./database') | undefined;
    jest.isolateModules(() => {
      database = jest.requireActual<typeof import('./database')>('./database');
    });
    return database!;
  };

  it('aliases the primary when replica settings are missing', () => {
    process.env = { ...env, DATABASE_REPLICA_PORT: '5432' };
    delete process.env.DATABASE_REPLICA_HOST;

    const { db, replicaDb } = loadDatabase();

    expect(replicaDb).toBe(db);
  });

  it('creates a separate connection when replica settings are present', () => {
    process.env = {
      ...env,
      DATABASE_REPLICA_HOST: 'replica',
      DATABASE_REPLICA_PORT: '5432',
    };

    const { db, replicaDb } = loadDatabase();

    expect(replicaDb).not.toBe(db);
  });
});

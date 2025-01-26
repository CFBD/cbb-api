import { Pool } from 'pg';
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';

const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const host = process.env.DATABASE_HOST;
const port = process.env.DATABASE_PORT || '5432';
const dbName = process.env.DATABASE_NAME;

import { DB } from './types/db';

const dialect = new PostgresDialect({
  pool: new Pool({
    database: dbName,
    host,
    port: parseInt(port),
    user,
    password,
    max: 10,
  }),
});

export const db = new Kysely<DB>({
  dialect,
  plugins: [new CamelCasePlugin()],
});

const authDbHost = process.env.AUTH_DATABASE_HOST;
const authDbPort = process.env.AUTH_DATABASE_PORT || '5432';
const authDbUser = process.env.AUTH_DATABASE_USER;
const authDbPassword = process.env.AUTH_DATABASE_PASSWORD;
const authDbName = process.env.AUTH_DATABASE;

import { DB as AuthDB } from './types/authdb';

const authDialect = new PostgresDialect({
  pool: new Pool({
    database: authDbName,
    host: authDbHost,
    port: parseInt(authDbPort),
    user: authDbUser,
    password: authDbPassword,
    max: 10,
  }),
});

export const authDb = new Kysely<AuthDB>({
  dialect: authDialect,
  plugins: [new CamelCasePlugin()],
});

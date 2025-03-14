/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from 'kysely';

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<
  string,
  bigint | number | string,
  bigint | number | string
>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Brute {
  count: number | null;
  expires: Timestamp | null;
  firstRequest: Timestamp | null;
  id: string;
  lastRequest: Timestamp | null;
}

export interface Metrics {
  apiVersion: string | null;
  endpoint: string;
  id: Generated<Int8>;
  query: Json | null;
  timestamp: Generated<Timestamp>;
  userAgent: string | null;
  userId: number;
}

export interface User {
  blacklisted: Generated<boolean>;
  id: Generated<number>;
  isAdmin: Generated<boolean>;
  patreonId: number | null;
  patronLevel: Generated<number>;
  remainingCalls: Generated<number>;
  throttled: Generated<boolean>;
  token: string;
  username: string;
}

export interface DB {
  brute: Brute;
  metrics: Metrics;
  user: User;
}

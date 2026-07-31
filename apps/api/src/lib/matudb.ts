import { createClient } from '@devjuanes/matuclient';
import { env } from '../config.js';

let client: ReturnType<typeof createClient> | null = null;

export function getMatuDb(): ReturnType<typeof createClient> {
  if (!client) {
    client = createClient({
      url: env.MATUDB_URL,
      projectId: env.MATUDB_PROJECT_ID,
      apiKey: env.MATUDB_API_KEY,
      useSupabase: env.MATUDB_USE_SUPABASE,
    });
  }
  return client;
}

export type DbRow = Record<string, unknown>;

export function rowToCamel<T extends DbRow>(row: DbRow): T {
  const result: DbRow = {};
  for (const [key, value] of Object.entries(row)) {
    result[key] = value;
  }
  return result as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'msk_';
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

type MatuFilterValue = string | number | boolean | null;
type MatuFilters = Record<string, MatuFilterValue>;
type MatuTableQuery = ReturnType<ReturnType<typeof createClient>['from']>;

function withFilters(table: string, filters: MatuFilters): MatuTableQuery {
  let query = getMatuDb().from(table);
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  return query;
}

function firstRow<T>(data: T | T[] | null | undefined, fallback: T): T {
  if (Array.isArray(data)) return (data[0] ?? fallback) as T;
  if (data != null) return data as T;
  return fallback;
}

/** MatuDB insert — filters must be set before update/delete, not after. */
export async function insertRow<T extends DbRow>(table: string, record: T): Promise<T> {
  const db = getMatuDb();
  const { data, error } = await db.from(table).insert(record);
  if (error) throw new Error(`Insert into ${table} failed: ${error.message}`);
  return firstRow(data, record);
}

export async function updateRow<T extends DbRow>(
  table: string,
  filters: MatuFilters,
  updates: Partial<T>,
): Promise<T | null> {
  const { data, error } = await withFilters(table, filters).update(updates);
  if (error) throw new Error(`Update ${table} failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as T | null;
}

export async function deleteRow(table: string, filters: MatuFilters): Promise<void> {
  const { error } = await withFilters(table, filters).delete();
  if (error) throw new Error(`Delete from ${table} failed: ${error.message}`);
}

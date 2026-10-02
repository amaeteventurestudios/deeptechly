export type SqlValue = string | number | boolean | Date | null | Uint8Array;

export type QueryResult<Row> = {
  rows: Row[];
  rowCount: number;
};

/** Provider-neutral boundary; a PostgreSQL driver belongs in an adapter. */
export interface DatabaseExecutor {
  query<Row extends Record<string, unknown>>(
    sql: string,
    parameters?: readonly SqlValue[]
  ): Promise<QueryResult<Row>>;

  transaction<Result>(
    operation: (transaction: DatabaseExecutor) => Promise<Result>
  ): Promise<Result>;
}

export interface MigrationRunner {
  pending(): Promise<readonly string[]>;
  apply(migrationIds: readonly string[]): Promise<void>;
}

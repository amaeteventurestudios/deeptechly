export type DatabaseMigration = {
  id: string;
  description: string;
  file: string;
  destructive: false;
};

/**
 * Ordered, additive migrations. These are artifacts to be reviewed and applied by
 * an operator; importing this package never opens a database connection.
 */
export const databaseMigrations = [
  {
    id: "0001",
    description: "Create identity, research, evidence, and publishing domains",
    file: "migrations/0001_v2_core.sql",
    destructive: false
  },
  {
    id: "0002",
    description: "Create Aperture government-demand intelligence domains",
    file: "migrations/0002_v2_aperture.sql",
    destructive: false
  },
  {
    id: "0003",
    description: "Create legacy import and reconciliation ledger",
    file: "migrations/0003_legacy_import_ledger.sql",
    destructive: false
  }
] as const satisfies readonly DatabaseMigration[];

export const DATABASE_SCHEMA = "deeptechly" as const;

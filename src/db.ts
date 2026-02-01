import knex, { Knex } from "knex";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const defaultConfig: DbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5430", 10),
  user: process.env.DB_USER || "player_tracker",
  password: process.env.DB_PASSWORD || "player_tracker",
  database: process.env.DB_NAME || "player_tracker",
};

let db: Knex | null = null;

export function getDb(config: DbConfig = defaultConfig): Knex {
  if (!db) {
    db = knex({
      client: "pg",
      connection: {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
      },
    });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}

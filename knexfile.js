/**
 * @type {import('knex').Knex.Config}
 */
export default {
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5430", 10),
    user: process.env.DB_USER || "player_tracker",
    password: process.env.DB_PASSWORD || "player_tracker",
    database: process.env.DB_NAME || "player_tracker",
  },
  migrations: {
    directory: "./migrations",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};

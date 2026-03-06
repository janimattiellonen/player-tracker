/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  // Table for tracking which players we want to monitor
  await knex.schema.createTable("tracked_players", (table) => {
    table.increments("id").primary();
    table.string("pdga_number", 20).notNullable().unique();
    table.string("name", 255);
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  // Table for storing tournament results
  await knex.schema.createTable("tournament_results", (table) => {
    table.increments("id").primary();
    table
      .string("pdga_number", 20)
      .notNullable()
      .references("pdga_number")
      .inTable("tracked_players")
      .onDelete("CASCADE");
    table.string("place", 20).notNullable();
    table.string("points", 20);
    table.string("tournament_name", 500).notNullable();
    table.string("tournament_url", 1000).notNullable();
    table.string("tier", 10);
    table.string("dates", 50);
    table.string("prize", 50);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("notified_at");

    // Unique constraint to prevent duplicate results
    // A player can only have one result per tournament
    table.unique(["pdga_number", "tournament_url"]);
  });

  // Index for faster lookups
  await knex.schema.raw(
    "CREATE INDEX idx_tournament_results_pdga_number ON tournament_results(pdga_number)"
  );
  await knex.schema.raw(
    "CREATE INDEX idx_tournament_results_notified_at ON tournament_results(notified_at)"
  );
}

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("tournament_results");
  await knex.schema.dropTableIfExists("tracked_players");
}

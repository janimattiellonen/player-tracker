import { Knex } from "knex";
import { getDb } from "./db.js";
import type { TournamentResult } from "./types.js";

export interface TrackedPlayer {
  id: number;
  pdga_number: string;
  name: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StoredResult {
  id: number;
  pdga_number: string;
  place: string;
  points: string | null;
  tournament_name: string;
  tournament_url: string;
  tier: string | null;
  dates: string | null;
  prize: string | null;
  created_at: Date;
  notified_at: Date | null;
}

export interface NewResult {
  pdga_number: string;
  place: string;
  points: string | null;
  tournament_name: string;
  tournament_url: string;
  tier: string | null;
  dates: string | null;
  prize: string | null;
}

export class PlayerRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db || getDb();
  }

  async getTrackedPlayers(activeOnly: boolean = true): Promise<TrackedPlayer[]> {
    const query = this.db<TrackedPlayer>("tracked_players");
    if (activeOnly) {
      query.where("active", true);
    }
    return query.orderBy("pdga_number");
  }

  async getTrackedPlayer(pdgaNumber: string): Promise<TrackedPlayer | undefined> {
    return this.db<TrackedPlayer>("tracked_players")
      .where("pdga_number", pdgaNumber)
      .first();
  }

  async addTrackedPlayer(pdgaNumber: string, name?: string): Promise<TrackedPlayer> {
    const [player] = await this.db<TrackedPlayer>("tracked_players")
      .insert({
        pdga_number: pdgaNumber,
        name: name || null,
      })
      .returning("*");
    return player;
  }

  async updateTrackedPlayer(
    pdgaNumber: string,
    updates: { name?: string; active?: boolean }
  ): Promise<TrackedPlayer | undefined> {
    const [player] = await this.db<TrackedPlayer>("tracked_players")
      .where("pdga_number", pdgaNumber)
      .update({
        ...updates,
        updated_at: this.db.fn.now(),
      })
      .returning("*");
    return player;
  }

  async removeTrackedPlayer(pdgaNumber: string): Promise<boolean> {
    const deleted = await this.db<TrackedPlayer>("tracked_players")
      .where("pdga_number", pdgaNumber)
      .delete();
    return deleted > 0;
  }

  async getResultsForPlayer(pdgaNumber: string): Promise<StoredResult[]> {
    return this.db<StoredResult>("tournament_results")
      .where("pdga_number", pdgaNumber)
      .orderBy("created_at", "desc");
  }

  async getExistingTournamentUrls(pdgaNumber: string): Promise<Set<string>> {
    const results = await this.db<StoredResult>("tournament_results")
      .where("pdga_number", pdgaNumber)
      .select("tournament_url");
    return new Set(results.map((r) => r.tournament_url));
  }

  async saveResults(results: NewResult[]): Promise<StoredResult[]> {
    if (results.length === 0) {
      return [];
    }

    const inserted = await this.db<StoredResult>("tournament_results")
      .insert(results)
      .onConflict(["pdga_number", "tournament_url"])
      .ignore()
      .returning("*");

    return inserted;
  }

  async markAsNotified(resultIds: number[]): Promise<void> {
    if (resultIds.length === 0) {
      return;
    }

    await this.db<StoredResult>("tournament_results")
      .whereIn("id", resultIds)
      .update({ notified_at: this.db.fn.now() });
  }

  async getUnnotifiedResults(pdgaNumber?: string): Promise<StoredResult[]> {
    const query = this.db<StoredResult>("tournament_results").whereNull("notified_at");

    if (pdgaNumber) {
      query.where("pdga_number", pdgaNumber);
    }

    return query.orderBy("created_at", "asc");
  }

  convertToNewResult(pdgaNumber: string, result: TournamentResult): NewResult {
    return {
      pdga_number: pdgaNumber,
      place: result.place,
      points: result.points || null,
      tournament_name: result.tournament.name,
      tournament_url: result.tournament.url,
      tier: result.tier || null,
      dates: result.dates || null,
      prize: result.prize || null,
    };
  }
}

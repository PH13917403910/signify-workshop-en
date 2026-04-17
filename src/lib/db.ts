import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH || "./data/workshop.db";

let _db: ReturnType<typeof Database> | null = null;
let _failed = false;

function getDb(): ReturnType<typeof Database> | null {
  if (_db) return _db;
  if (_failed) return null;

  try {
    const dir = dirname(DB_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    _db = new Database(DB_PATH, { readonly: true });
    _db.pragma("journal_mode = WAL");
    return _db;
  } catch {
    _failed = true;
    return null;
  }
}

export interface WorkshopRow {
  id: number;
  title: string;
  event_date: string;
  event_time: string;
  created_at: string;
  completed_at: string | null;
  status: string;
  participant_count?: number;
}

export function listWorkshops(): WorkshopRow[] {
  const db = getDb();
  if (!db) return [];
  return db
    .prepare(
      `SELECT w.*, COUNT(DISTINCT p.id) AS participant_count
       FROM workshops w
       LEFT JOIN participants p ON p.workshop_id = w.id
       GROUP BY w.id
       ORDER BY w.id DESC`,
    )
    .all() as WorkshopRow[];
}

export function getWorkshopFull(id: number) {
  const db = getDb();
  if (!db) return null;
  const ws = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(id) as WorkshopRow | undefined;
  if (!ws) return null;

  const participants: Record<string, string[]> = {};
  for (const row of db
    .prepare(`SELECT team_id, name FROM participants WHERE workshop_id = ? ORDER BY team_id, id`)
    .all(id) as { team_id: string; name: string }[]) {
    if (!participants[row.team_id]) participants[row.team_id] = [];
    participants[row.team_id].push(row.name);
  }

  const polls: Record<
    number,
    { votes: Record<string, string[]>; customTexts: Record<string, string> }
  > = {};
  for (const row of db
    .prepare(
      `SELECT poll_id, option_id, voter_id, custom_text FROM poll_votes WHERE workshop_id = ?`,
    )
    .all(id) as { poll_id: number; option_id: string; voter_id: string; custom_text: string | null }[]) {
    if (!polls[row.poll_id]) polls[row.poll_id] = { votes: {}, customTexts: {} };
    if (!polls[row.poll_id].votes[row.option_id])
      polls[row.poll_id].votes[row.option_id] = [];
    polls[row.poll_id].votes[row.option_id].push(row.voter_id);
    if (row.custom_text) polls[row.poll_id].customTexts[row.voter_id] = row.custom_text;
  }

  const games: Record<number, Record<string, unknown>> = {};
  for (const row of db
    .prepare(
      `SELECT team_id, game_id, data, submitted FROM game_submissions WHERE workshop_id = ?`,
    )
    .all(id) as { team_id: string; game_id: number; data: string; submitted: number }[]) {
    if (!games[row.game_id]) games[row.game_id] = {};
    games[row.game_id][row.team_id] = {
      ...JSON.parse(row.data),
      submitted: !!row.submitted,
    };
  }

  const game4: Record<string, { total: number; voters: Record<string, number> }> = {};
  for (const row of db
    .prepare(`SELECT project_id, voter_id, count FROM game4_votes WHERE workshop_id = ?`)
    .all(id) as { project_id: string; voter_id: string; count: number }[]) {
    if (!game4[row.project_id])
      game4[row.project_id] = { total: 0, voters: {} };
    game4[row.project_id].voters[row.voter_id] = row.count;
    game4[row.project_id].total += row.count;
  }

  return { workshop: ws, participants, polls, games, game4 };
}

export function getWorkshopsComparison(ids: number[]) {
  const db = getDb();
  if (!db) return {};
  const rows = db
    .prepare(
      `SELECT workshop_id, poll_id, option_id, COUNT(*) AS vote_count
       FROM poll_votes
       WHERE workshop_id IN (SELECT value FROM json_each(?))
       GROUP BY workshop_id, poll_id, option_id`,
    )
    .all(JSON.stringify(ids)) as {
    workshop_id: number;
    poll_id: number;
    option_id: string;
    vote_count: number;
  }[];

  const result: Record<number, Record<number, Record<string, number>>> = {};
  for (const row of rows) {
    if (!result[row.workshop_id]) result[row.workshop_id] = {};
    if (!result[row.workshop_id][row.poll_id])
      result[row.workshop_id][row.poll_id] = {};
    result[row.workshop_id][row.poll_id][row.option_id] = row.vote_count;
  }
  return result;
}

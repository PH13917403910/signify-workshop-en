import Database from "better-sqlite3";
import { existsSync, mkdirSync, accessSync, constants } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH || "./data/workshop.db";

let db = null;
let stmts = null;
let _upsertParticipantsTx = null;
let _allocateGame4Tx = null;
let _ready = false;

export function init() {
  if (_ready) return true;

  try {
    const dir = dirname(DB_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    // Verify directory is writable
    accessSync(dir, constants.W_OK);

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS workshops (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT    NOT NULL DEFAULT 'Signify Supply Chain AI Workshop',
        event_date  TEXT    NOT NULL,
        event_time  TEXT    NOT NULL,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        status      TEXT    NOT NULL DEFAULT 'active'
      );
      CREATE TABLE IF NOT EXISTS participants (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id),
        team_id     TEXT    NOT NULL,
        name        TEXT    NOT NULL,
        UNIQUE(workshop_id, team_id, name)
      );
      CREATE TABLE IF NOT EXISTS poll_votes (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id),
        poll_id     INTEGER NOT NULL,
        option_id   TEXT    NOT NULL,
        voter_id    TEXT    NOT NULL,
        custom_text TEXT,
        UNIQUE(workshop_id, poll_id, voter_id)
      );
      CREATE TABLE IF NOT EXISTS game_submissions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id),
        team_id     TEXT    NOT NULL,
        game_id     INTEGER NOT NULL,
        data        TEXT    NOT NULL DEFAULT '{}',
        submitted   INTEGER NOT NULL DEFAULT 0,
        UNIQUE(workshop_id, team_id, game_id)
      );
      CREATE TABLE IF NOT EXISTS game4_votes (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        workshop_id INTEGER NOT NULL REFERENCES workshops(id),
        project_id  TEXT    NOT NULL,
        voter_id    TEXT    NOT NULL,
        count       INTEGER NOT NULL DEFAULT 1,
        UNIQUE(workshop_id, project_id, voter_id)
      );
    `);

    stmts = {
      createWorkshop: db.prepare(`INSERT INTO workshops (event_date, event_time) VALUES (?, ?)`),
      completeWorkshop: db.prepare(`UPDATE workshops SET status = 'completed', completed_at = datetime('now') WHERE id = ?`),
      getActiveWorkshop: db.prepare(`SELECT * FROM workshops WHERE status = 'active' ORDER BY id DESC LIMIT 1`),
      deleteParticipants: db.prepare(`DELETE FROM participants WHERE workshop_id = ? AND team_id = ?`),
      insertParticipant: db.prepare(`INSERT OR IGNORE INTO participants (workshop_id, team_id, name) VALUES (?, ?, ?)`),
      upsertPollVote: db.prepare(`INSERT INTO poll_votes (workshop_id, poll_id, option_id, voter_id, custom_text) VALUES (?, ?, ?, ?, ?) ON CONFLICT(workshop_id, poll_id, voter_id) DO UPDATE SET option_id = excluded.option_id, custom_text = excluded.custom_text`),
      upsertGameSubmission: db.prepare(`INSERT INTO game_submissions (workshop_id, team_id, game_id, data, submitted) VALUES (?, ?, ?, ?, ?) ON CONFLICT(workshop_id, team_id, game_id) DO UPDATE SET data = excluded.data, submitted = excluded.submitted`),
      clearGame4Voter: db.prepare(`DELETE FROM game4_votes WHERE workshop_id = ? AND voter_id = ?`),
      upsertGame4Vote: db.prepare(`INSERT INTO game4_votes (workshop_id, project_id, voter_id, count) VALUES (?, ?, ?, ?) ON CONFLICT(workshop_id, project_id, voter_id) DO UPDATE SET count = excluded.count`),
      getParticipants: db.prepare(`SELECT team_id, name FROM participants WHERE workshop_id = ? ORDER BY team_id, id`),
      getPollVotes: db.prepare(`SELECT poll_id, option_id, voter_id, custom_text FROM poll_votes WHERE workshop_id = ?`),
      getGameSubmissions: db.prepare(`SELECT team_id, game_id, data, submitted FROM game_submissions WHERE workshop_id = ?`),
      getGame4Votes: db.prepare(`SELECT project_id, voter_id, count FROM game4_votes WHERE workshop_id = ?`),
      listWorkshops: db.prepare(`SELECT w.*, COUNT(DISTINCT p.id) AS participant_count FROM workshops w LEFT JOIN participants p ON p.workshop_id = w.id GROUP BY w.id ORDER BY w.id DESC`),
      getPollVotesForWorkshops: db.prepare(`SELECT workshop_id, poll_id, option_id, COUNT(*) AS vote_count FROM poll_votes WHERE workshop_id IN (SELECT value FROM json_each(?)) GROUP BY workshop_id, poll_id, option_id`),
    };

    _upsertParticipantsTx = db.transaction((workshopId, teamId, names) => {
      stmts.deleteParticipants.run(workshopId, teamId);
      for (const name of names) stmts.insertParticipant.run(workshopId, teamId, name);
    });

    _allocateGame4Tx = db.transaction((workshopId, voterId, allocations) => {
      stmts.clearGame4Voter.run(workshopId, voterId);
      for (const [projectId, count] of Object.entries(allocations)) {
        const n = Number(count);
        if (n > 0) stmts.upsertGame4Vote.run(workshopId, projectId, voterId, n);
      }
    });

    _ready = true;
    console.log(`> DB: initialized at ${DB_PATH}`);
    return true;
  } catch (err) {
    console.warn(`> DB: initialization failed (${err.message}). Running without persistence.`);
    db = null;
    stmts = null;
    _ready = false;
    return false;
  }
}

export function isReady() { return _ready; }

// ── Write API (all no-op when DB unavailable) ───────────────────────

export function createWorkshop(date, time) {
  if (!_ready) return null;
  try { return stmts.createWorkshop.run(date, time).lastInsertRowid; } catch (e) { console.warn("> DB write error:", e.message); return null; }
}

export function completeWorkshop(id) {
  if (!_ready) return;
  try { stmts.completeWorkshop.run(id); } catch (e) { console.warn("> DB write error:", e.message); }
}

export function getActiveWorkshop() {
  if (!_ready) return null;
  try { return stmts.getActiveWorkshop.get() || null; } catch { return null; }
}

export function restoreState(workshopId) {
  const empty = {
    teams: {
      demand:    { members: 0, memberNames: [], game1: null, game2: null, game3: null },
      supply:    { members: 0, memberNames: [], game1: null, game2: null, game3: null },
      om:        { members: 0, memberNames: [], game1: null, game2: null, game3: null },
      logistics: { members: 0, memberNames: [], game1: null, game2: null, game3: null },
    },
    polls: {
      1: { open: false, showResults: false, votes: {}, customTexts: {} },
      2: { open: false, showResults: false, votes: {}, customTexts: {} },
      3: { open: false, showResults: false, votes: {}, customTexts: {} },
      4: { open: false, showResults: false, votes: {}, customTexts: {} },
    },
    game4Allocations: {},
  };
  if (!_ready) return empty;

  try {
    const teams = { ...empty.teams };
    for (const row of stmts.getParticipants.all(workshopId)) {
      if (teams[row.team_id]) teams[row.team_id].memberNames.push(row.name);
    }
    for (const row of stmts.getGameSubmissions.all(workshopId)) {
      if (teams[row.team_id]) {
        teams[row.team_id][`game${row.game_id}`] = { ...JSON.parse(row.data), submitted: !!row.submitted };
      }
    }
    const polls = { ...empty.polls };
    for (const row of stmts.getPollVotes.all(workshopId)) {
      const poll = polls[row.poll_id];
      if (!poll) continue;
      if (!poll.votes[row.option_id]) poll.votes[row.option_id] = [];
      poll.votes[row.option_id].push(row.voter_id);
      if (row.custom_text) poll.customTexts[row.voter_id] = row.custom_text;
    }
    const allocations = {};
    for (const row of stmts.getGame4Votes.all(workshopId)) {
      if (!allocations[row.project_id]) allocations[row.project_id] = {};
      allocations[row.project_id][row.voter_id] = row.count;
    }
    return { teams, polls, game4Allocations: allocations };
  } catch { return empty; }
}

export function upsertParticipants(workshopId, teamId, names) {
  if (!_ready) return;
  try { _upsertParticipantsTx(workshopId, teamId, names); } catch (e) { console.warn("> DB write error:", e.message); }
}

export function upsertPollVote(workshopId, pollId, optionId, voterId, customText) {
  if (!_ready) return;
  try { stmts.upsertPollVote.run(workshopId, pollId, optionId, voterId, customText || null); } catch (e) { console.warn("> DB write error:", e.message); }
}

export function upsertGameSubmission(workshopId, teamId, gameId, data, submitted) {
  if (!_ready) return;
  try {
    const json = typeof data === "string" ? data : JSON.stringify(data);
    stmts.upsertGameSubmission.run(workshopId, teamId, gameId, json, submitted ? 1 : 0);
  } catch (e) { console.warn("> DB write error:", e.message); }
}

export function upsertGame4Votes(workshopId, voterId, allocations) {
  if (!_ready) return;
  try { _allocateGame4Tx(workshopId, voterId, allocations); } catch (e) { console.warn("> DB write error:", e.message); }
}

// ── Read-only queries (used by API routes) ──────────────────────────

export function listWorkshops() {
  if (!init()) return [];
  try { return stmts.listWorkshops.all(); } catch { return []; }
}

export function getWorkshopFull(id) {
  if (!init()) return null;
  try {
    const ws = db.prepare(`SELECT * FROM workshops WHERE id = ?`).get(id);
    if (!ws) return null;
    const participants = {};
    for (const row of stmts.getParticipants.all(id)) {
      if (!participants[row.team_id]) participants[row.team_id] = [];
      participants[row.team_id].push(row.name);
    }
    const polls = {};
    for (const row of stmts.getPollVotes.all(id)) {
      if (!polls[row.poll_id]) polls[row.poll_id] = { votes: {}, customTexts: {} };
      if (!polls[row.poll_id].votes[row.option_id]) polls[row.poll_id].votes[row.option_id] = [];
      polls[row.poll_id].votes[row.option_id].push(row.voter_id);
      if (row.custom_text) polls[row.poll_id].customTexts[row.voter_id] = row.custom_text;
    }
    const games = {};
    for (const row of stmts.getGameSubmissions.all(id)) {
      if (!games[row.game_id]) games[row.game_id] = {};
      games[row.game_id][row.team_id] = { ...JSON.parse(row.data), submitted: !!row.submitted };
    }
    const game4 = {};
    for (const row of stmts.getGame4Votes.all(id)) {
      if (!game4[row.project_id]) game4[row.project_id] = { total: 0, voters: {} };
      game4[row.project_id].voters[row.voter_id] = row.count;
      game4[row.project_id].total += row.count;
    }
    return { workshop: ws, participants, polls, games, game4 };
  } catch { return null; }
}

export function getWorkshopsComparison(ids) {
  if (!init()) return {};
  try {
    const rows = stmts.getPollVotesForWorkshops.all(JSON.stringify(ids));
    const result = {};
    for (const row of rows) {
      if (!result[row.workshop_id]) result[row.workshop_id] = {};
      if (!result[row.workshop_id][row.poll_id]) result[row.workshop_id][row.poll_id] = {};
      result[row.workshop_id][row.poll_id][row.option_id] = row.vote_count;
    }
    return result;
  } catch { return {}; }
}

export function close() {
  if (db) db.close();
}

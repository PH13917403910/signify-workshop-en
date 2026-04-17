import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";
import * as db from "./server/db.mjs";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3100", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let activeWorkshopId = null;

const state = {
  currentStage: 0,
  eventDate: "2026.04.01",
  eventTime: "13:00 – 17:00",
  timer: { running: false, remaining: 0, total: 0 },
  teams: {
    demand: { members: 0, memberNames: [], game1: null, game2: null, game3: null },
    supply: { members: 0, memberNames: [], game1: null, game2: null, game3: null },
    om: { members: 0, memberNames: [], game1: null, game2: null, game3: null },
    logistics: { members: 0, memberNames: [], game1: null, game2: null, game3: null },
  },
  polls: {
    1: { open: false, showResults: false, votes: {}, customTexts: {} },
    2: { open: false, showResults: false, votes: {}, customTexts: {} },
    3: { open: false, showResults: false, votes: {}, customTexts: {} },
    4: { open: false, showResults: false, votes: {}, customTexts: {} },
  },
  game3Phase: "red",
  game4: { open: false, showResults: false, allocations: {} },
};

let timerInterval = null;

function startTimer(io, seconds, preserveTotal) {
  stopTimer();
  state.timer = {
    running: true,
    remaining: seconds,
    total: preserveTotal ? state.timer.total : seconds,
  };
  io.emit("timer:sync", state.timer);
  timerInterval = setInterval(() => {
    if (state.timer.remaining <= 0) {
      stopTimer();
      state.timer.running = false;
      io.emit("timer:sync", state.timer);
      io.emit("timer:finished");
      return;
    }
    state.timer.remaining -= 1;
    io.emit("timer:sync", state.timer);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function computeGame4Results() {
  const totals = {};
  const teamBreakdown = {};
  for (const [pid, voters] of Object.entries(state.game4.allocations)) {
    totals[pid] = 0;
    teamBreakdown[pid] = {};
    for (const [voterId, cnt] of Object.entries(voters)) {
      totals[pid] += cnt;
      const tid = voterId.split(":")[0];
      teamBreakdown[pid][tid] = (teamBreakdown[pid][tid] || 0) + cnt;
    }
  }
  return { totals, teamBreakdown };
}

function broadcastState(io) {
  io.emit("state:sync", {
    currentStage: state.currentStage,
    eventDate: state.eventDate,
    eventTime: state.eventTime,
    teams: Object.fromEntries(
      Object.entries(state.teams).map(([k, v]) => [k, { members: v.members, memberNames: v.memberNames || [] }])
    ),
    polls: state.polls,
    game3Phase: state.game3Phase,
    game4: state.game4,
  });
}

app.prepare().then(() => {
  // Initialize DB after app.prepare() so Railway volume is mounted
  const dbOk = db.init();
  if (dbOk) {
    const existing = db.getActiveWorkshop();
    if (existing) {
      activeWorkshopId = existing.id;
      state.eventDate = existing.event_date;
      state.eventTime = existing.event_time;
      const restored = db.restoreState(existing.id);
      Object.assign(state.teams, restored.teams);
      Object.assign(state.polls, restored.polls);
      state.game4.allocations = restored.game4Allocations;
      console.log(`> DB: restored active workshop #${existing.id} (${existing.event_date})`);
    } else {
      activeWorkshopId = db.createWorkshop(state.eventDate, state.eventTime);
      console.log(`> DB: created new workshop #${activeWorkshopId}`);
    }
  }

  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.emit("state:sync", {
      currentStage: state.currentStage,
      eventDate: state.eventDate,
      eventTime: state.eventTime,
      teams: Object.fromEntries(
        Object.entries(state.teams).map(([k, v]) => [k, { members: v.members, memberNames: v.memberNames || [] }])
      ),
      polls: state.polls,
      game3Phase: state.game3Phase,
      game4: state.game4,
    });
    socket.emit("timer:sync", state.timer);

    // --- Team ---
    socket.on("team:join", (teamId) => {
      if (!state.teams[teamId]) return;

      const oldTeam = socket.data.team;

      if (oldTeam === teamId) return;

      if (oldTeam && state.teams[oldTeam]) {
        socket.leave(`team:${oldTeam}`);
        state.teams[oldTeam].members = Math.max(0, state.teams[oldTeam].members - 1);
      }

      socket.data.team = teamId;
      socket.join(`team:${teamId}`);
      state.teams[teamId].members += 1;
      broadcastState(io);
    });

    socket.on("team:setMembers", ({ teamId, names }) => {
      if (!state.teams[teamId]) return;
      if (socket.data.team && socket.data.team !== teamId) return;
      if (!Array.isArray(names)) return;
      state.teams[teamId].memberNames = names.map(String).slice(0, 20);
      broadcastState(io);
      db.upsertParticipants(activeWorkshopId, teamId, state.teams[teamId].memberNames);
    });

    socket.on("team:getMembers", ({ teamId }, callback) => {
      if (typeof callback !== "function") return;
      if (!state.teams[teamId]) return callback([]);
      callback(state.teams[teamId].memberNames || []);
    });

    socket.on("game:getData", ({ teamId, gameId }, callback) => {
      if (typeof callback !== "function") return;
      const team = state.teams[teamId];
      if (!team) return callback(null);
      callback(team[`game${gameId}`] || null);
    });

    socket.on("disconnect", () => {
      const teamId = socket.data?.team;
      if (teamId && state.teams[teamId]) {
        state.teams[teamId].members = Math.max(0, state.teams[teamId].members - 1);
        broadcastState(io);
      }
    });

    // --- Admin Auth ---
    socket.on("admin:auth", (password, callback) => {
      if (typeof callback !== "function") return;
      const ok = password === (process.env.ADMIN_PASSWORD || "signify2026");
      if (ok) {
        socket.data.isAdmin = true;
        socket.join("admin");
      }
      callback({ success: ok });
    });

    function requireAdmin() {
      return socket.data?.isAdmin === true;
    }

    // --- Admin: Command broadcast (director console) ---
    socket.on("admin:command", (cmd) => {
      if (!requireAdmin()) return;
      if (!cmd || typeof cmd.type !== "string") return;
      socket.broadcast.emit("command:execute", cmd);
    });

    // --- Admin: Stage ---
    socket.on("admin:setStage", (stage) => {
      if (!requireAdmin()) return;
      state.currentStage = stage;
      broadcastState(io);
    });

    // --- Admin: Event Info ---
    socket.on("admin:setEventInfo", ({ date, time }) => {
      if (!requireAdmin()) return;
      if (typeof date === "string") state.eventDate = date;
      if (typeof time === "string") state.eventTime = time;
      broadcastState(io);
    });

    // --- Admin: Timer ---
    socket.on("admin:startTimer", (seconds) => {
      if (!requireAdmin()) return;
      startTimer(io, seconds);
    });

    socket.on("admin:pauseTimer", () => {
      if (!requireAdmin()) return;
      stopTimer();
      state.timer.running = false;
      io.emit("timer:sync", state.timer);
    });

    socket.on("admin:resumeTimer", () => {
      if (!requireAdmin()) return;
      if (state.timer.remaining > 0) startTimer(io, state.timer.remaining, true);
    });

    socket.on("admin:resetTimer", (seconds) => {
      if (!requireAdmin()) return;
      stopTimer();
      state.timer = { running: false, remaining: seconds || 0, total: seconds || 0 };
      io.emit("timer:sync", state.timer);
    });

    // --- Admin: Polls ---
    socket.on("admin:openPoll", (pollId) => {
      if (!requireAdmin()) return;
      if (state.polls[pollId]) {
        state.polls[pollId].open = true;
        state.polls[pollId].votes = {};
        state.polls[pollId].customTexts = {};
        broadcastState(io);
      }
    });

    socket.on("admin:closePoll", (pollId) => {
      if (!requireAdmin()) return;
      if (state.polls[pollId]) {
        state.polls[pollId].open = false;
        broadcastState(io);
      }
    });

    socket.on("admin:showPollResults", (pollId) => {
      if (!requireAdmin()) return;
      if (state.polls[pollId]) {
        state.polls[pollId].showResults = true;
        broadcastState(io);
      }
    });

    socket.on("admin:hidePollResults", (pollId) => {
      if (!requireAdmin()) return;
      if (state.polls[pollId]) {
        state.polls[pollId].showResults = false;
        broadcastState(io);
      }
    });

    // --- Admin: Game 3 Phase ---
    socket.on("admin:setGame3Phase", (phase) => {
      if (!requireAdmin()) return;
      state.game3Phase = phase;
      broadcastState(io);
    });

    // --- Admin: Game 4 ---
    socket.on("admin:openGame4", () => {
      if (!requireAdmin()) return;
      state.game4.open = true;
      state.game4.allocations = {};
      broadcastState(io);
    });

    socket.on("admin:closeGame4", () => {
      if (!requireAdmin()) return;
      state.game4.open = false;
      broadcastState(io);
    });

    socket.on("admin:showGame4Results", () => {
      if (!requireAdmin()) return;
      state.game4.showResults = true;
      broadcastState(io);
      const totals = {};
      const teamBreakdown = {};
      for (const [pid, voters] of Object.entries(state.game4.allocations)) {
        totals[pid] = 0;
        teamBreakdown[pid] = {};
        for (const [voterId, cnt] of Object.entries(voters)) {
          totals[pid] += cnt;
          const tid = voterId.split(":")[0];
          teamBreakdown[pid][tid] = (teamBreakdown[pid][tid] || 0) + cnt;
        }
      }
      io.emit("game4:totals", totals);
      io.emit("game4:teamBreakdown", teamBreakdown);
    });

    // --- Admin: Reset Stage ---
    socket.on("admin:resetStage", (stageId) => {
      if (!requireAdmin()) return;
      const gameKey = `game${stageId}`;
      for (const team of Object.values(state.teams)) {
        team[gameKey] = null;
      }
      if (state.polls[stageId]) {
        state.polls[stageId] = { open: false, showResults: false, votes: {}, customTexts: {} };
      }
      if (stageId === 4) {
        state.game4 = { open: false, showResults: false, allocations: {} };
      }
      stopTimer();
      state.timer = { running: false, remaining: 0, total: 0 };
      io.emit("timer:sync", state.timer);
      broadcastState(io);
      io.emit("admin:stageReset", stageId);
    });

    // --- Admin: Reset All ---
    socket.on("admin:resetAll", () => {
      if (!requireAdmin()) return;

      db.completeWorkshop(activeWorkshopId);
      activeWorkshopId = db.createWorkshop(state.eventDate, state.eventTime);
      console.log(`> DB: archived → new workshop #${activeWorkshopId}`);

      state.currentStage = 0;
      for (const team of Object.values(state.teams)) {
        team.members = 0;
        team.memberNames = [];
        team.game1 = null;
        team.game2 = null;
        team.game3 = null;
      }
      for (const [, s] of io.sockets.sockets) {
        if (s.data.team) {
          s.leave(`team:${s.data.team}`);
          s.data.team = null;
        }
      }
      for (const pid of [1, 2, 3, 4]) {
        state.polls[pid] = { open: false, showResults: false, votes: {}, customTexts: {} };
      }
      state.game4 = { open: false, showResults: false, allocations: {} };
      stopTimer();
      state.timer = { running: false, remaining: 0, total: 0 };
      io.emit("timer:sync", state.timer);
      broadcastState(io);
      io.emit("admin:allReset");
    });

    // --- Admin: Complete (archive) current workshop without resetting ---
    socket.on("admin:completeWorkshop", (callback) => {
      if (!requireAdmin()) return;
      db.completeWorkshop(activeWorkshopId);
      const completedId = activeWorkshopId;
      activeWorkshopId = db.createWorkshop(state.eventDate, state.eventTime);
      console.log(`> DB: completed workshop #${completedId}, new #${activeWorkshopId}`);
      if (typeof callback === "function") callback({ success: true, archivedId: completedId });
    });

    // --- Admin: get full state (including game submissions) ---
    socket.on("admin:getFullState", (callback) => {
      if (typeof callback !== "function") return;
      if (!requireAdmin()) return callback(null);
      callback(state);
    });

    // --- Poll Voting ---
    socket.on("poll:vote", ({ pollId, optionId, odientId, customText }) => {
      const poll = state.polls[pollId];
      if (!poll || !poll.open) return;
      const odient = odientId || socket.id;
      for (const opt of Object.keys(poll.votes)) {
        poll.votes[opt] = (poll.votes[opt] || []).filter((id) => id !== odient);
      }
      if (!poll.votes[optionId]) poll.votes[optionId] = [];
      poll.votes[optionId].push(odient);
      if (optionId === "custom" && customText) {
        poll.customTexts[odient] = customText;
      } else {
        delete poll.customTexts[odient];
      }
      broadcastState(io);
      db.upsertPollVote(activeWorkshopId, pollId, optionId, odient, customText || null);
    });

    // --- Game 1: Prompt submissions ---
    socket.on("game1:savePrompt", ({ teamId, promptIndex, prompt, response }) => {
      const team = state.teams[teamId];
      if (!team) return;
      if (!team.game1) team.game1 = { prompts: [], responses: [], submitted: false };
      team.game1.prompts[promptIndex] = prompt;
      team.game1.responses[promptIndex] = response;
      io.to("admin").emit("game1:update", { teamId, data: team.game1 });
      db.upsertGameSubmission(activeWorkshopId, teamId, 1, team.game1, false);
    });

    socket.on("game1:submit", ({ teamId, finalAnswer }) => {
      const team = state.teams[teamId];
      if (!team) return;
      if (!team.game1) team.game1 = { prompts: [], responses: [], submitted: false };
      team.game1.finalAnswer = finalAnswer;
      team.game1.submitted = true;
      io.to("admin").emit("game1:update", { teamId, data: team.game1 });
      io.emit("team:submitted", { teamId, gameId: 1 });
      db.upsertGameSubmission(activeWorkshopId, teamId, 1, team.game1, true);
    });

    // --- Game 2: Lego submissions ---
    socket.on("game2:save", ({ teamId, cards, connections }) => {
      const team = state.teams[teamId];
      if (!team) return;
      team.game2 = { cards, connections, submitted: false };
      io.to("admin").emit("game2:update", { teamId, data: team.game2 });
      db.upsertGameSubmission(activeWorkshopId, teamId, 2, team.game2, false);
    });

    socket.on("game2:submit", ({ teamId, cards, connections, designRationale }) => {
      const team = state.teams[teamId];
      if (!team) return;
      team.game2 = { cards, connections, designRationale, submitted: true };
      io.to("admin").emit("game2:update", { teamId, data: team.game2 });
      io.emit("team:submitted", { teamId, gameId: 2 });
      db.upsertGameSubmission(activeWorkshopId, teamId, 2, team.game2, true);
    });

    // --- Game 3: Crisis Prompt Challenge ---
    socket.on("game3:savePrompt", ({ teamId, promptIndex, prompt, response }) => {
      const team = state.teams[teamId];
      if (!team) return;
      if (!team.game3) team.game3 = { prompts: [], responses: [], submitted: false };
      team.game3.prompts[promptIndex] = prompt;
      team.game3.responses[promptIndex] = response;
      io.to("admin").emit("game3:update", { teamId, data: team.game3 });
      db.upsertGameSubmission(activeWorkshopId, teamId, 3, team.game3, false);
    });

    socket.on("game3:submit", ({ teamId, finalAnswer }) => {
      const team = state.teams[teamId];
      if (!team) return;
      if (!team.game3) team.game3 = { prompts: [], responses: [], submitted: false };
      team.game3.finalAnswer = finalAnswer;
      team.game3.submitted = true;
      io.to("admin").emit("game3:update", { teamId, data: team.game3 });
      io.emit("team:submitted", { teamId, gameId: 3 });
      db.upsertGameSubmission(activeWorkshopId, teamId, 3, team.game3, true);
    });

    // --- Game 4: Shark Tank token allocation ---
    socket.on("game4:allocate", ({ odientId, allocations }) => {
      if (!state.game4.open) return;
      const voter = odientId || socket.id;

      for (const voters of Object.values(state.game4.allocations)) {
        delete voters[voter];
      }

      let total = 0;
      for (const [projectId, count] of Object.entries(allocations)) {
        const n = Number(count);
        if (!Number.isFinite(n) || n <= 0) continue;
        total += n;
        if (total > 3) break;
        if (!state.game4.allocations[projectId]) state.game4.allocations[projectId] = {};
        state.game4.allocations[projectId][voter] = n;
      }

      const { totals, teamBreakdown } = computeGame4Results();
      io.emit("game4:totals", totals);
      io.emit("game4:teamBreakdown", teamBreakdown);
      broadcastState(io);
      db.upsertGame4Votes(activeWorkshopId, voter, allocations);
    });

    socket.on("game4:strategy", ({ odientId, note }) => {
      // best effort, no broadcast needed
    });

    socket.on("game4:getFullResults", (callback) => {
      if (typeof callback === "function") callback(computeGame4Results());
    });

    socket.on("teams:getProgress", (callback) => {
      if (typeof callback !== "function") return;
      const progress = {};
      for (const [tid, t] of Object.entries(state.teams)) {
        progress[tid] = {
          game1: !!t.game1?.submitted,
          game2: !!t.game2?.submitted,
          game3: !!t.game3?.submitted,
        };
      }
      callback(progress);
    });

    socket.on("game4:getTotals", (callback) => {
      if (typeof callback !== "function") return;
      const totals = {};
      for (const [pid, voters] of Object.entries(state.game4.allocations)) {
        totals[pid] = Object.values(voters).reduce((a, b) => a + b, 0);
      }
      callback(totals);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Signify Workshop ready on http://${hostname}:${port}`);
  });
});

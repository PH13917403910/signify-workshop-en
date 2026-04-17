"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket-client";
import type { WorkshopSyncState, TimerState, AdminCommand } from "@/lib/types";

const DEFAULT_STATE: WorkshopSyncState = {
  currentStage: 0,
  eventDate: "2026.04.01",
  eventTime: "13:00 – 17:00",
  teams: {},
  polls: {
    1: { open: false, showResults: false, votes: {}, customTexts: {} },
    2: { open: false, showResults: false, votes: {}, customTexts: {} },
    3: { open: false, showResults: false, votes: {}, customTexts: {} },
    4: { open: false, showResults: false, votes: {}, customTexts: {} },
  },
  game3Phase: "red",
  game4: { open: false, showResults: false, allocations: {} },
};

const DEFAULT_TIMER: TimerState = { running: false, remaining: 0, total: 0 };

// ---- Global singleton: one socket listener, many React subscribers ----
let _state: WorkshopSyncState = DEFAULT_STATE;
let _timer: TimerState = DEFAULT_TIMER;
let _connected = false;
let _initialized = false;

type Fn = () => void;
const _stateSubs = new Set<Fn>();
const _timerSubs = new Set<Fn>();
const _connSubs = new Set<Fn>();

function ensureSocket() {
  if (_initialized) return;
  _initialized = true;

  const socket = getSocket();

  socket.on("state:sync", (s: WorkshopSyncState) => {
    _state = s;
    _stateSubs.forEach((fn) => fn());
  });

  socket.on("timer:sync", (t: TimerState) => {
    _timer = t;
    _timerSubs.forEach((fn) => fn());
  });

  socket.on("connect", () => {
    _connected = true;
    _connSubs.forEach((fn) => fn());
  });

  socket.on("disconnect", () => {
    _connected = false;
    _connSubs.forEach((fn) => fn());
  });

  if (socket.connected) _connected = true;
}

export function useWorkshopState() {
  const [state, setState] = useState<WorkshopSyncState>(_state);
  const [timer, setTimer] = useState<TimerState>(_timer);
  const [connected, setConnected] = useState(_connected);

  useEffect(() => {
    ensureSocket();

    // Immediately sync to latest global values on mount
    setState(_state);
    setTimer(_timer);
    setConnected(_connected);

    const onState = () => setState(_state);
    const onTimer = () => setTimer(_timer);
    const onConn = () => setConnected(_connected);

    _stateSubs.add(onState);
    _timerSubs.add(onTimer);
    _connSubs.add(onConn);

    return () => {
      _stateSubs.delete(onState);
      _timerSubs.delete(onTimer);
      _connSubs.delete(onConn);
    };
  }, []);

  return { state, timer, connected };
}

// ---- Admin hook ----

let _adminAuthed = false;

function getAdminSession(): { authed: boolean; pwd: string | null } {
  if (typeof window === "undefined") return { authed: false, pwd: null };
  return {
    authed: sessionStorage.getItem("admin_authed") === "1",
    pwd: sessionStorage.getItem("admin_pwd"),
  };
}

function setAdminSession(v: boolean, pwd?: string) {
  if (typeof window === "undefined") return;
  if (v) {
    sessionStorage.setItem("admin_authed", "1");
    if (pwd) sessionStorage.setItem("admin_pwd", pwd);
  } else {
    sessionStorage.removeItem("admin_authed");
    sessionStorage.removeItem("admin_pwd");
  }
  _adminAuthed = v;
}

export function useAdmin() {
  const [authed, setAuthed] = useState(() => _adminAuthed || getAdminSession().authed);
  const authedRef = useRef(authed);

  useEffect(() => {
    const session = getAdminSession();
    if (session.authed && session.pwd) {
      _adminAuthed = true;
      setAuthed(true);
      authedRef.current = true;
      const socket = getSocket();
      socket.emit("admin:auth", session.pwd, () => {});
    }
  }, []);

  const login = useCallback((password: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      socket.emit("admin:auth", password, (res: { success: boolean }) => {
        setAuthed(res.success);
        authedRef.current = res.success;
        setAdminSession(res.success, password);
        resolve(res.success);
      });
    });
  }, []);

  const setStage = useCallback((stage: number) => {
    getSocket().emit("admin:setStage", stage);
  }, []);

  const startTimer = useCallback((seconds: number) => {
    getSocket().emit("admin:startTimer", seconds);
  }, []);

  const pauseTimer = useCallback(() => {
    getSocket().emit("admin:pauseTimer");
  }, []);

  const resumeTimer = useCallback(() => {
    getSocket().emit("admin:resumeTimer");
  }, []);

  const resetTimer = useCallback((seconds: number) => {
    getSocket().emit("admin:resetTimer", seconds);
  }, []);

  const openPoll = useCallback((pollId: number) => {
    getSocket().emit("admin:openPoll", pollId);
  }, []);

  const closePoll = useCallback((pollId: number) => {
    getSocket().emit("admin:closePoll", pollId);
  }, []);

  const showPollResults = useCallback((pollId: number) => {
    getSocket().emit("admin:showPollResults", pollId);
  }, []);

  const hidePollResults = useCallback((pollId: number) => {
    getSocket().emit("admin:hidePollResults", pollId);
  }, []);

  const setGame3Phase = useCallback((phase: "red" | "green") => {
    getSocket().emit("admin:setGame3Phase", phase);
  }, []);

  const openGame4 = useCallback(() => {
    getSocket().emit("admin:openGame4");
  }, []);

  const closeGame4 = useCallback(() => {
    getSocket().emit("admin:closeGame4");
  }, []);

  const showGame4Results = useCallback(() => {
    getSocket().emit("admin:showGame4Results");
  }, []);

  const resetStage = useCallback((stageId: number) => {
    getSocket().emit("admin:resetStage", stageId);
  }, []);

  const resetAll = useCallback(() => {
    getSocket().emit("admin:resetAll");
  }, []);

  const sendCommand = useCallback((cmd: AdminCommand) => {
    getSocket().emit("admin:command", cmd);
  }, []);

  const setEventInfo = useCallback((date: string, time: string) => {
    getSocket().emit("admin:setEventInfo", { date, time });
  }, []);

  return {
    authed,
    login,
    setStage,
    setEventInfo,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    openPoll,
    closePoll,
    showPollResults,
    hidePollResults,
    setGame3Phase,
    openGame4,
    closeGame4,
    showGame4Results,
    resetStage,
    resetAll,
    sendCommand,
  };
}

// ---- Command listener hook (participant side) ----

const _cmdSubs = new Set<(cmd: AdminCommand) => void>();
let _cmdListenerInitialized = false;

function ensureCommandListener() {
  if (_cmdListenerInitialized) return;
  _cmdListenerInitialized = true;
  const socket = getSocket();
  socket.on("command:execute", (cmd: AdminCommand) => {
    _cmdSubs.forEach((fn) => fn(cmd));
  });
}

export function useCommandListener(handler: (cmd: AdminCommand) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    ensureSocket();
    ensureCommandListener();

    const wrapper = (cmd: AdminCommand) => handlerRef.current(cmd);
    _cmdSubs.add(wrapper);
    return () => { _cmdSubs.delete(wrapper); };
  }, []);
}

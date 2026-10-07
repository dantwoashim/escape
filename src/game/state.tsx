// Game state: reducer + split contexts + localStorage persistence.
//
// Contexts are split so a window move/drag commit only re-renders the moved
// Frame, never other windows' bodies:
//   ActCtx:  stable, dispatch + actions
//   MetaCtx: everything except the windows array (incl. activeWin)
//   WinCtx:  { windows, zTop }
import {
  createContext, useContext, useEffect, useMemo, useReducer, useRef,
} from "react";
import type { ReactNode, Dispatch } from "react";
import {
  recycleBinNode, FSNode, findNode, docs, DocBlock,
  MILESTONES, Milestone, SkillKey, checkPassword, DESIGN_CLUE_LINES,
} from "./content";
import { levelContent } from "./levels";
import { nextMilestone, pathIsTrap, idsTo, restoreNode } from "./logic";

export const SAVE_KEY = "hajurama-box-save-v2";
export const SEEN_KEY = "hajurama-box-seen-v1";
const STALE_MS = 10 * 60 * 1000; // older than this, a run goes back to the landing
const REDUCED = typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------- types

export type AppKind =
  | "explorer" | "word" | "recycle" | "calculator" | "designer" | "imageview" | "properties";

export interface Win {
  id: number;
  app: AppKind;
  title: string;
  nodeId?: string;
  path: string[];
  x: number; y: number; w: number; h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

export interface DesignEl {
  id: string;
  type: "title" | "clue" | "basket";
  x: number; y: number; w: number; h: number; z: number;
}

export interface Persisted {
  level: 1 | 2;
  team: string;
  started: boolean;
  finished: boolean;
  finishedMs: number | null; // frozen elapsed time when BOX opened
  prizeResult: null | "fell" | "passed"; // final eSewa prank
  coachStep: number;
  startTs: number;
  accumMs: number;
  paused: boolean; // true while the tab is hidden
  tokens: number;
  hintsUsed: number; // tokens spent, teacher grants don't lower it
  hintLevels: Partial<Record<Milestone, number>>;
  milestones: Record<string, boolean>;
  skills: Record<string, boolean>;
  wrongPasswords: number;
  trapsVisited: string[];
  unlocked: string[];
  fsRoots: FSNode[];
  docEdits: Record<string, DocBlock[]>;
  design: DesignEl[];
  revealFlags: Record<string, boolean>;
}

export interface State extends Persisted {
  phase: "landing" | "game";
  windows: Win[];
  zTop: number;
  activeWin: number | null;
  hintMessage: { text: string; step: string } | null;
  toast: string | null;
  finale: boolean;
  teacher: boolean;
}

export type MetaState = Omit<State, "windows" | "zTop">;

export function defaultDesign(): DesignEl[] {
  return [
    { id: "title", type: "title", x: 0.05, y: 0.04, w: 0.55, h: 0.14, z: 3 },
    { id: "clue", type: "clue", x: 0.08, y: 0.24, w: 0.6, h: 0.66, z: 1 },
    { id: "basket", type: "basket", x: 0.04, y: 0.2, w: 0.7, h: 0.74, z: 2 },
  ];
}

function freshPersisted(team = "", level: 1 | 2 = 1): Persisted {
  return {
    level,
    team,
    started: false,
    finished: false,
    finishedMs: null,
    prizeResult: null,
    coachStep: 0,
    startTs: Date.now(),
    accumMs: 0,
    paused: false,
    tokens: 3,
    hintsUsed: 0,
    hintLevels: {},
    milestones: {},
    skills: {},
    wrongPasswords: 0,
    trapsVisited: [],
    unlocked: [],
    fsRoots: levelContent(level).desktopNodes,
    docEdits: {},
    design: defaultDesign(),
    revealFlags: {},
  };
}

const initial: State = {
  ...freshPersisted(),
  phase: "landing",
  windows: [],
  zTop: 1,
  activeWin: null,
  hintMessage: null,
  toast: null,
  finale: false,
  teacher: false,
};

export function initialState(): State {
  return { ...initial, ...freshPersisted(), phase: "landing", windows: [], zTop: 1 };
}

export function load(): State {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initial;
    const p = JSON.parse(raw) as Persisted;
    if (!p || !Array.isArray(p.fsRoots)) return initial;
    const now = Date.now();
    const seen = Number(localStorage.getItem(SEEN_KEY)) || 0;
    let phase: State["phase"] = p.started ? "game" : "landing";
    let accumMs = p.accumMs ?? 0;
    let startTs = p.startTs ?? now;
    let paused = p.paused ?? false;
    if (p.started && !p.finished) {
      if (!paused) {
        // closed-tab hours do not count: fold only up to the last heartbeat
        const lastSeen = Math.min(seen, now);
        if (seen && lastSeen > startTs) accumMs += lastSeen - startTs;
      }
      startTs = now;
      paused = false;
      // a quick refresh resumes; a stale run goes back to the landing
      phase = seen && now - seen <= STALE_MS ? "game" : "landing";
    }
    return {
      ...initial,
      ...p,
      level: p.level ?? 1, // saves from before levels existed
      accumMs,
      startTs,
      paused,
      phase,
      windows: [],
      zTop: 1,
      activeWin: null,
      hintMessage: null,
      toast: null,
      hintsUsed: p.hintsUsed ?? Math.max(0, 3 - (p.tokens ?? 3)), // old saves
      finale: !!p.finished, // finished games reopen on the finale
      teacher: false,
    };
  } catch {
    return initial;
  }
}

export function persisted(s: State): Persisted {
  const {
    level, team, started, finished, finishedMs, prizeResult, coachStep, startTs, accumMs, paused, tokens, hintsUsed, hintLevels,
    milestones, skills, wrongPasswords, trapsVisited, unlocked, fsRoots,
    docEdits, design, revealFlags,
  } = s;
  return {
    level, team, started, finished, finishedMs, prizeResult, coachStep, startTs, accumMs, paused, tokens, hintsUsed, hintLevels,
    milestones, skills, wrongPasswords, trapsVisited, unlocked, fsRoots,
    docEdits, design, revealFlags,
  };
}

// elapsed milliseconds: frozen once finished
export function elapsed(
  state: Pick<State, "finishedMs" | "accumMs" | "started" | "startTs" | "paused">,
): number {
  if (state.finishedMs != null) return state.finishedMs;
  return state.accumMs + (state.started && !state.paused ? Date.now() - state.startTs : 0);
}

// ---------------------------------------------------------------- actions

export type Action =
  | { type: "start"; team: string; level?: 1 | 2 }
  | { type: "start-level"; level: 1 | 2 }
  | { type: "coach"; step: number }
  | { type: "open-node"; nodeId: string }
  | { type: "open-app"; app: AppKind; title: string; nodeId?: string; path?: string[] }
  | { type: "open-explorer"; path: string[] }
  | { type: "navigate"; winId: number; path: string[] }
  | { type: "focus"; id: number }
  | { type: "close"; id: number }
  | { type: "min"; id: number }
  | { type: "min-all" }
  | { type: "max"; id: number }
  | { type: "move"; id: number; x: number; y: number }
  | { type: "unlock"; nodeId: string }
  | { type: "wrong-password" }
  | { type: "prize"; result: "fell" | "passed" }
  | { type: "milestone"; m: Milestone }
  | { type: "skill"; k: SkillKey }
  | { type: "hint" }
  | { type: "clear-hint" }
  | { type: "restore"; nodeId: string }
  | { type: "doc-edit"; docId: string; blocks: DocBlock[] }
  | { type: "design"; els: DesignEl[] }
  | { type: "reveal"; key: string }
  | { type: "toast"; text: string | null }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "resume-game" }
  | { type: "new-game" }
  | { type: "replay" }
  | { type: "finale" }
  | { type: "play-again" }
  | { type: "teacher"; on: boolean }
  | { type: "teacher-token" }
  | { type: "teacher-reset" };

let winSeq = 1;

function cascade(state: State): { x: number; y: number } {
  const n = state.windows.length % 8;
  return { x: 120 + n * 34, y: 60 + n * 30 };
}

function clampWindow(x: number, y: number, w: number, h: number) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1366;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const cw = Math.min(w, vw - 16);
  const ch = Math.min(h, vh - 64); // keep clear of the 48px taskbar
  const cx = Math.max(0, Math.min(x, vw - cw - 8));
  const cy = Math.max(0, Math.min(y, vh - ch - 56));
  return { x: cx, y: cy, w: cw, h: ch };
}

function defaultSize(app: AppKind): { w: number; h: number } {
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1366;
  switch (app) {
    case "word": return { w: Math.min(760, vw - 40), h: Math.min(760, vh - 120) };
    case "designer": return { w: Math.min(980, vw - 40), h: Math.min(640, vh - 120) };
    case "calculator": return { w: 300, h: 420 };
    case "imageview": return { w: Math.min(760, vw - 40), h: Math.min(560, vh - 120) };
    case "properties": return { w: 380, h: 420 };
    default: return { w: Math.min(720, vw - 40), h: Math.min(480, vh - 120) };
  }
}

function openWindow(state: State, app: AppKind, title: string, nodeId: string | undefined, path: string[]): State {
  const existing = state.windows.find((w) => w.app === app && w.nodeId === nodeId && nodeId !== undefined);
  const zTop = state.zTop + 1;
  if (existing) {
    return {
      ...state,
      zTop,
      activeWin: existing.id,
      windows: state.windows.map((w) =>
        w.id === existing.id ? { ...w, z: zTop, minimized: false } : w,
      ),
    };
  }
  const pos = cascade(state);
  const size = defaultSize(app);
  const geom = clampWindow(pos.x, pos.y, size.w, size.h);
  const w: Win = {
    id: winSeq++, app, title, nodeId, path, ...geom,
    z: zTop, minimized: false, maximized: false,
  };
  return {
    ...state,
    zTop,
    activeWin: w.id,
    windows: [...state.windows, w],
  };
}

function nodeOpenEffects(state: State, node: FSNode): State {
  let s = state;
  const bump = (m: Milestone, cond = true) => {
    if (cond && !s.milestones[m]) {
      s = { ...s, milestones: { ...s.milestones, [m]: true } };
    }
  };
  const ids = idsTo(node.id);
  if (pathIsTrap(ids) && !s.trapsVisited.includes(node.id)) {
    s = { ...s, trapsVisited: [...s.trapsVisited, node.id] };
  }
  switch (node.id) {
    case "start-here": bump("openedStart"); break;
    case "chautari": bump("enteredChautari"); break;
    case "leaf-17": bump("openedMagicLeaf"); break;
    case "shepherd-a": bump("enteredShepherdA"); break;
    default: break;
  }
  if ((node.id === "last-page" || node.id === "prayer") && !s.skills.google) {
    s = { ...s, skills: { ...s.skills, google: true } };
  }
  return s;
}

export function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "start": {
      // "Start the hunt" while an old run sits on the landing = a fresh run,
      // it replaces the stale save (Resume is the only way back in)
      const wantLevel = a.level ?? state.level;
      if (state.started && state.phase === "landing") {
        return {
          ...freshPersisted(a.team || state.team, wantLevel),
          phase: "game",
          started: true,
          startTs: Date.now(),
          windows: [], zTop: 1, activeWin: null,
          hintMessage: null, toast: null, finale: false, teacher: state.teacher,
        };
      }
      // switching levels means a fresh run on that level's tree
      const base = a.level && a.level !== state.level
        ? { ...freshPersisted(a.team || state.team, a.level), phase: state.phase, windows: state.windows, zTop: state.zTop, activeWin: state.activeWin, hintMessage: state.hintMessage, toast: state.toast, finale: state.finale, teacher: state.teacher }
        : state;
      return {
        ...base, phase: "game", started: true,
        team: a.team || base.team,
        startTs: base.started && !base.paused ? base.startTs : Date.now(),
        paused: false,
        finale: base.finished ? base.finale : false,
      };
    }
    case "resume-game": {
      // Resume button on the landing: same run, clock restarts from accumMs
      return {
        ...state,
        phase: "game",
        started: true,
        startTs: Date.now(),
        paused: false,
        finale: state.finished ? state.finale : false,
      };
    }
    case "pause": {
      if (!state.started || state.finished || state.paused) return state;
      const now = Date.now();
      return {
        ...state,
        accumMs: state.accumMs + Math.max(0, now - state.startTs),
        startTs: now,
        paused: true,
      };
    }
    case "resume": {
      if (!state.paused) return state;
      return { ...state, startTs: Date.now(), paused: false };
    }
    case "start-level": {
      // "Play Level 2" from the finale: same team, straight to the desktop
      return {
        ...freshPersisted(state.team, a.level),
        phase: "game",
        started: true,
        coachStep: 3,
        windows: [], zTop: 1, activeWin: null,
        hintMessage: null, toast: null, finale: false, teacher: state.teacher,
      };
    }
    case "coach":
      return { ...state, coachStep: a.step };
    case "open-node": {
      const node = findNode(a.nodeId, state.fsRoots);
      if (!node) return state;
      let s = nodeOpenEffects(state, node);
      if (node.kind === "folder") {
        return openWindow(s, "explorer", node.name, node.id, [node.id]);
      }
      const app: AppKind =
        node.app === "designer" ? "designer" :
        node.app === "imageview" ? "imageview" :
        node.app === "recycle" ? "recycle" :
        node.app === "calculator" ? "calculator" : "word";
      return openWindow(s, app, node.name, node.id, []);
    }
    case "open-app": {
      return openWindow(state, a.app, a.title, a.nodeId, a.path ?? []);
    }
    case "open-explorer": {
      const existing = state.windows.find((w) => w.app === "explorer");
      if (existing) {
        const zTop = state.zTop + 1;
        return {
          ...state, zTop, activeWin: existing.id,
          windows: state.windows.map((w) =>
            w.id === existing.id ? { ...w, z: zTop, minimized: false, path: a.path } : w),
        };
      }
      const folder = findNode(a.path[a.path.length - 1], state.fsRoots);
      return openWindow(state, "explorer", folder?.name ?? "Files", undefined, a.path);
    }
    case "navigate":
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === a.winId ? { ...w, path: a.path } : w)),
      };
    case "focus": {
      const w = state.windows.find((x) => x.id === a.id);
      if (!w) return state;
      // no-op when already focused on top, avoids re-render storms per pointerdown
      if (state.activeWin === a.id && w.z === state.zTop && !w.minimized) return state;
      const zTop = state.zTop + 1;
      return {
        ...state, zTop, activeWin: a.id,
        windows: state.windows.map((x) => (x.id === a.id ? { ...x, z: zTop, minimized: false } : x)),
      };
    }
    case "close": {
      const wins = state.windows.filter((w) => w.id !== a.id);
      const top = [...wins].sort((x, y) => y.z - x.z)[0];
      return { ...state, windows: wins, activeWin: top && !top.minimized ? top.id : null };
    }
    case "min-all":
      // mobile home button: everything tucked away, desktop shows through
      return {
        ...state,
        windows: state.windows.map((w) => ({ ...w, minimized: true })),
        activeWin: null,
      };
    case "min":
      return {
        ...state,
        activeWin: null,
        windows: state.windows.map((w) => (w.id === a.id ? { ...w, minimized: true } : w)),
      };
    case "max":
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === a.id ? { ...w, maximized: !w.maximized } : w)),
      };
    case "move":
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === a.id ? { ...w, x: a.x, y: a.y } : w)),
      };
    case "unlock": {
      const s = { ...state, unlocked: [...state.unlocked, a.nodeId] };
      let s2 = { ...s, skills: { ...s.skills, password: true } };
      const bump = (m: Milestone) => {
        if (!s2.milestones[m]) s2 = { ...s2, milestones: { ...s2.milestones, [m]: true } };
      };
      if (a.nodeId === "fork") bump("openedFork");
      if (a.nodeId === "final-code") bump("openedFinalCode");
      if (a.nodeId === "box") {
        bump("openedBox");
        const finishedMs = s2.accumMs + (s2.started ? Date.now() - s2.startTs : 0);
        return { ...s2, finale: true, finished: true, finishedMs };
      }
      return s2;
    }
    case "wrong-password":
      return { ...state, wrongPasswords: state.wrongPasswords + 1 };
    case "prize": {
      if (state.prizeResult) return state;
      if (a.result === "passed") {
        return {
          ...state,
          prizeResult: "passed",
          skills: { ...state.skills, scamRefuse: true },
        };
      }
      return { ...state, prizeResult: "fell" };
    }
    case "milestone":
      if (state.milestones[a.m]) return state;
      return { ...state, milestones: { ...state.milestones, [a.m]: true } };
    case "skill":
      if (state.skills[a.k]) return state;
      return { ...state, skills: { ...state.skills, [a.k]: true } };
    case "hint": {
      if (state.tokens <= 0) return state;
      const w = state.windows.find((x) => x.id === state.activeWin);
      let ids: string[] = [];
      if (w?.path.length) ids = w.path;
      else if (w?.nodeId) ids = idsTo(w.nodeId, state.fsRoots.find((r) => r.id === "box-root") ?? state.fsRoots[0]);
      const lv = levelContent(state.level);
      if (ids.length && pathIsTrap(ids)) {
        return {
          ...state,
          tokens: state.tokens - 1,
          hintsUsed: state.hintsUsed + 1,
          hintMessage: { text: lv.trapHint, step: "Hint" },
        };
      }
      const m = nextMilestone(state.milestones);
      if (!m) {
        return {
          ...state,
          tokens: state.tokens - 1,
          hintsUsed: state.hintsUsed + 1,
          hintMessage: { text: "You already know the way. Finish it!", step: "Hint" },
        };
      }
      const level = (state.hintLevels[m] ?? 0) + 1;
      const text = lv.hints[m][Math.min(level, 2) - 1];
      return {
        ...state,
        tokens: state.tokens - 1,
        hintsUsed: state.hintsUsed + 1,
        hintLevels: { ...state.hintLevels, [m]: level },
        hintMessage: { text, step: `Hint ${level} of 2` },
      };
    }
    case "clear-hint":
      return { ...state, hintMessage: null };
    case "restore": {
      const { roots, ok } = restoreNode(state.fsRoots, a.nodeId);
      if (!ok) return state;
      let s: State = {
        ...state, fsRoots: roots,
        skills: { ...state.skills, restore: true },
        toast: "Restored to " + (findNode(a.nodeId, roots)?.originalLocation ?? "its folder"),
      };
      if (a.nodeId === "last-page" && !s.milestones.restoredLastPage) {
        s = { ...s, milestones: { ...s.milestones, restoredLastPage: true } };
      }
      return s;
    }
    case "doc-edit":
      return { ...state, docEdits: { ...state.docEdits, [a.docId]: a.blocks } };
    case "design":
      return { ...state, design: a.els };
    case "reveal": {
      if (state.revealFlags[a.key]) return state;
      let s: State = { ...state, revealFlags: { ...state.revealFlags, [a.key]: true } };
      if (a.key === "design-clue" && !s.milestones.revealedDesignClue) {
        s = { ...s, milestones: { ...s.milestones, revealedDesignClue: true }, skills: { ...s.skills, design: true } };
      }
      return s;
    }
    case "toast":
      return { ...state, toast: a.text };
    case "finale": {
      const finishedMs = state.finishedMs ?? state.accumMs + (state.started ? Date.now() - state.startTs : 0);
      return { ...state, finale: true, finished: true, finishedMs };
    }
    case "play-again": {
      return {
        ...freshPersisted(state.team),
        phase: "landing",
        windows: [], zTop: 1, activeWin: null,
        hintMessage: null, toast: null, finale: false, teacher: false,
      };
    }
    case "new-game": {
      return {
        ...freshPersisted(),
        phase: "landing",
        windows: [], zTop: 1, activeWin: null,
        hintMessage: null, toast: null, finale: false, teacher: state.teacher,
      };
    }
    case "replay": {
      // same team, fresh run straight to the desktop
      return {
        ...freshPersisted(state.team, state.level),
        phase: "game",
        started: true,
        coachStep: 3,
        windows: [], zTop: 1, activeWin: null,
        hintMessage: null, toast: null, finale: false, teacher: state.teacher,
      };
    }
    case "teacher":
      return { ...state, teacher: a.on };
    case "teacher-token":
      return { ...state, tokens: state.tokens + 1 };
    case "teacher-reset": {
      return {
        ...freshPersisted(),
        phase: "landing",
        windows: [], zTop: 1, activeWin: null,
        hintMessage: null, toast: null, finale: false, teacher: true,
      };
    }
  }
}

// ---------------------------------------------------------------- contexts

interface ActCtx {
  dispatch: Dispatch<Action>;
  openNode: (n: FSNode) => void;
}
const ActionsCtx = createContext<ActCtx | null>(null);
const MetaCtx = createContext<MetaState | null>(null);
const WinCtx = createContext<{ windows: Win[]; zTop: number }>({ windows: [], zTop: 1 });

export const useActions = () => {
  const c = useContext(ActionsCtx);
  if (!c) throw new Error("no actions ctx");
  return c;
};
export const useMeta = () => {
  const c = useContext(MetaCtx);
  if (!c) throw new Error("no meta ctx");
  return c;
};
export const useWindows = () => useContext(WinCtx);
export const useReduced = () => REDUCED;

// current folder helper (meta consumers pass their state)
export function currentFolder(w: Win, roots: FSNode[]): FSNode | undefined {
  return findNode(w.path[w.path.length - 1] ?? "", roots);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const saveRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // heartbeat + pause/resume so closed-tab hours never count
  useEffect(() => {
    const beat = () => {
      const s = stateRef.current;
      if (s.started && !s.finished) {
        try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* ignore */ }
      }
    };
    beat();
    const t = setInterval(beat, 2000);
    const onVis = () => dispatch({ type: document.hidden ? "pause" : "resume" });
    const onHide = () => {
      beat();
      dispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  useEffect(() => {
    cancelAnimationFrame(saveRef.current);
    saveRef.current = requestAnimationFrame(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(persisted(stateRef.current)));
      } catch { /* full/unavailable */ }
    });
  }, [state]);

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "toast", text: null }), 3500);
    return () => clearTimeout(t);
  }, [state.toast]);

  const act = useMemo<ActCtx>(() => ({
    dispatch,
    openNode: (n) => {
      if (n.id === "recycle-bin") {
        dispatch({ type: "open-app", app: "recycle", title: "Recycle Bin", nodeId: n.id, path: ["recycle-bin"] });
        return;
      }
      if (n.app === "calculator") {
        dispatch({ type: "open-app", app: "calculator", title: "Calculator", nodeId: n.id });
        return;
      }
      dispatch({ type: "open-node", nodeId: n.id });
    },
  }), []);

  const meta = useMemo<MetaState>(() => {
    const { windows: _w, zTop: _z, ...rest } = state;
    return rest;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.level, state.team, state.started, state.finished, state.finishedMs, state.prizeResult, state.coachStep,
    state.startTs, state.accumMs, state.paused, state.tokens, state.hintsUsed, state.hintLevels, state.milestones,
    state.skills, state.wrongPasswords, state.trapsVisited, state.unlocked,
    state.fsRoots, state.docEdits, state.design, state.revealFlags, state.phase,
    state.activeWin, state.hintMessage, state.toast, state.finale, state.teacher,
  ]);

  const winSlice = useMemo(
    () => ({ windows: state.windows, zTop: state.zTop }),
    [state.windows, state.zTop],
  );

  return (
    <ActionsCtx.Provider value={act}>
      <MetaCtx.Provider value={meta}>
        <WinCtx.Provider value={winSlice}>{children}</WinCtx.Provider>
      </MetaCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export { docs, checkPassword, DESIGN_CLUE_LINES, recycleBinNode, MILESTONES };

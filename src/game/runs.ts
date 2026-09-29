// Past runs on this computer, kept in their own key so game resets never wipe them.
export interface Run {
  id: number; // startTs of the run
  level?: 1 | 2; // missing = Level 1
  team: string;
  timeMs: number;
  hintsUsed: number;
  wrongPasswords: number;
  trapsCleared: string[];
  prize: "fell" | "passed";
  at: number;
}

const RUNS_KEY = "hajurama-box-runs-v1";
const MAX = 30;

export function loadRuns(): Run[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function recordRun(run: Run): Run[] {
  const runs = loadRuns().filter((r) => r.id !== run.id);
  runs.push(run);
  const kept = runs.slice(-MAX);
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(kept));
  } catch { /* storage full or unavailable */ }
  return kept;
}

export function clearRuns(): void {
  try {
    localStorage.removeItem(RUNS_KEY);
  } catch { /* ignore */ }
}

// Pure game logic, unit-testable, no React.
import {
  FSNode, Milestone, MILESTONES, TRAP_ROOTS, findNode, pathTo, boxRoot,
} from "./content";

// Details-view sorting: column + direction. First click on "modified" = newest first.
export type SortKey = "name" | "modified" | "type" | "size";
export function sortNodes(nodes: FSNode[], key: SortKey, asc: boolean): FSNode[] {
  const val = (n: FSNode): string | number => {
    switch (key) {
      case "name": return n.name.toLowerCase();
      case "modified": return n.modified;
      case "type": return n.kind;
      case "size": return n.size ?? 0;
    }
  };
  return [...nodes].sort((a, b) => {
    const av = val(a), bv = val(b);
    const c = av < bv ? -1 : av > bv ? 1 : 0;
    return asc ? c : -c;
  });
}

// Next missing milestone on the correct path, in order.
export function nextMilestone(done: Record<string, boolean>): Milestone | undefined {
  return MILESTONES.find((m) => !done[m]);
}

// Does an explorer path (list of node ids) or a doc node sit inside a trap?
export function pathIsTrap(ids: string[]): boolean {
  return ids.some((i) => TRAP_ROOTS.includes(i));
}

// ids along the path from a root to nodeId (excluding the root itself? include full chain)
export function idsTo(nodeId: string, root: FSNode = boxRoot): string[] {
  return pathTo(nodeId, root) ?? [nodeId];
}

// Restore: remove node from bin children, append to home folder (clone tree).
export function restoreNode(
  roots: FSNode[],
  nodeId: string,
): { roots: FSNode[]; ok: boolean } {
  const node = findNode(nodeId, roots);
  if (!node || !node.deleted || !node.homePath) return { roots, ok: false };
  const clone = (n: FSNode): FSNode => ({
    ...n,
    children: n.children?.map(clone),
  });
  const newRoots = roots.map(clone);
  // remove from wherever it is (the bin)
  const removeFrom = (n: FSNode) => {
    if (!n.children) return;
    n.children = n.children.filter((c) => c.id !== nodeId);
    n.children.forEach(removeFrom);
  };
  newRoots.forEach(removeFrom);
  // find destination folder by path
  let dest: FSNode | undefined;
  const walk = (n: FSNode): boolean => {
    if (n.id === node.homePath![node.homePath!.length - 1]) {
      dest = n;
      return true;
    }
    return (n.children ?? []).some(walk);
  };
  newRoots.forEach(walk);
  if (!dest) return { roots, ok: false };
  const restored = { ...node, deleted: false, location: node.originalLocation ?? dest.location };
  dest.children = [...(dest.children ?? []), restored];
  return { roots: newRoots, ok: true };
}

// Replace-all count for Find & Replace (mirrors Word behaviour: non-overlapping, all matches)
export function replaceAllCount(haystack: string, needle: string): { text: string; count: number } {
  if (!needle) return { text: haystack, count: 0 };
  let count = 0;
  let out = "";
  let i = 0;
  const lower = haystack.toLowerCase();
  const n = needle.toLowerCase();
  while (i <= haystack.length) {
    const idx = lower.indexOf(n, i);
    if (idx === -1) {
      out += haystack.slice(i);
      break;
    }
    out += haystack.slice(i, idx);
    i = idx + needle.length;
    count++;
  }
  return { text: out, count };
}

// Design-app reveal check: clue visible if it's above the basket (higher z)
// or the basket covers less than 20% of the clue's rect.
export interface Rect {
  x: number; y: number; w: number; h: number;
}
export function overlapRatio(a: Rect, b: Rect): number {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const area = x * y;
  return area / (a.w * a.h);
}
export function clueRevealed(clue: Rect & { z: number }, basket: (Rect & { z: number }) | null): boolean {
  if (!basket) return true;
  if (clue.z > basket.z) return true;
  return overlapRatio(clue, basket) < 0.2;
}

// A trap only counts once its ending was reached.
type TrapSignals = { revealFlags: Record<string, boolean>; unlocked: string[] };
const TRAP_DONE: Record<string, (s: TrapSignals) => boolean> = {
  "tea-shop": (s) => !!s.revealFlags.scam,
  "water-tap": (s) => s.unlocked.includes("note"),
  "temple": (s) => s.unlocked.includes("blessing"),
  "shepherd-b": (s) => s.unlocked.includes("liar"),
};
export function clearedTraps(s: TrapSignals): string[] {
  return TRAP_ROOTS.filter((r) => TRAP_DONE[r](s));
}

// distinct trap roots the player stepped into
export function trapsFound(s: { trapsVisited: string[] }): string[] {
  const found = new Set<string>();
  for (const id of s.trapsVisited) {
    for (const i of idsTo(id)) {
      if (TRAP_ROOTS.includes(i)) found.add(i);
    }
  }
  return TRAP_ROOTS.filter((r) => found.has(r));
}

// score = time + 1 min per hint + 30 s per wrong password.
// with the bonus word, the first hint is free.
export function score(timeMs: number, hintsUsed: number, wrongPasswords: number, bonus = false): number {
  const h = bonus ? Math.max(0, hintsUsed - 1) : hintsUsed;
  return timeMs + 60000 * h + 30000 * wrongPasswords;
}

export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

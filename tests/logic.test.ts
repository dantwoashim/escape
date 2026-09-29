import { describe, it, expect } from "vitest";
import {
  caesar, checkPassword, PRAYER_TEXT, PRAYER_MESSAGE, boxRoot, desktopNodes,
  lastPageNode, findNode, TRAP_ROOTS,
} from "../src/game/content";
import {
  sortNodes, restoreNode, replaceAllCount, clueRevealed, nextMilestone, pathIsTrap, idsTo,
  clearedTraps, trapsFound, score, fmtTime,
} from "../src/game/logic";
import { loadRuns, recordRun, clearRuns } from "../src/game/runs";
import { reducer, elapsed, initialState, load, persisted, SAVE_KEY, State } from "../src/game/state";

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => store.clear(),
};
import { SEGMENTS } from "../src/game/sevenseg";

describe("caesar (matches build.py outputs)", () => {
  it("first clue", () => {
    expect(caesar("GO WHERE PEOPLE REST UNDER THE BIG TREE", 3))
      .toBe("JR ZKHUH SHRSOH UHVW XQGHU WKH ELJ WUHH");
    expect(caesar(caesar("GO WHERE PEOPLE REST UNDER THE BIG TREE", 3), -3))
      .toBe("GO WHERE PEOPLE REST UNDER THE BIG TREE");
  });
  it("temple text", () => {
    const end = "THIS BOX IS EMPTY. GO BACK AND READ MY FIRST LETTER AGAIN.";
    expect(caesar(end, 3)).toBe("WKLV ERA LV HPSWB. JR EDFN DQG UHDG PB ILUVW OHWWHU DJDLQ.");
    expect(caesar(caesar(end, 3), -3)).toBe(end);
  });
  it("final word", () => {
    expect(caesar("DASHAIN", 5)).toBe("IFXMFNS");
    expect(caesar("IFXMFNS", -5)).toBe("DASHAIN");
  });
});

describe("password checks", () => {
  it("case-insensitive + trimmed", () => {
    expect(checkPassword("  dashain ", "DASHAIN")).toBe(true);
    expect(checkPassword("Hello", "HELLO")).toBe(true);
    expect(checkPassword("42", "42")).toBe(true);
    expect(checkPassword("rhododendron", "RHODODENDRON")).toBe(true);
    expect(checkPassword("dashai n", "DASHAIN")).toBe(false);
    expect(checkPassword("", "DASHAIN")).toBe(false);
  });
});

describe("temple prayer replace-all", () => {
  it("removing all @ restores the message", () => {
    const { text, count } = replaceAllCount(PRAYER_TEXT, "@");
    expect(text).toBe(PRAYER_MESSAGE);
    expect(count).toBeGreaterThan(PRAYER_MESSAGE.length); // 1-3 @ per char
    expect(count).toBe(PRAYER_TEXT.split("@").length - 1);
  });
});

describe("chautari sort by date", () => {
  it("leaf 17 is strictly newest and sorts first (newest-first)", () => {
    const chautari = findNode("chautari", desktopNodes)!;
    const leaves = chautari.children!.filter((c) => c.id.startsWith("leaf-"));
    const times = leaves.map((l) => new Date(l.modified).getTime());
    const leaf17 = findNode("leaf-17", desktopNodes)!;
    expect(Math.max(...times)).toBe(new Date(leaf17.modified).getTime());
    expect(times.filter((t) => t === Math.max(...times)).length).toBe(1);
    const sorted = sortNodes(leaves, "modified", false);
    expect(sorted[0].id).toBe("leaf-17");
  });
  it("default first-click on modified = newest first", () => {
    const chautari = findNode("chautari", desktopNodes)!;
    const sorted = sortNodes(chautari.children!, "modified", false);
    expect(sorted[0].name).toBe("leaf 17");
  });
});

describe("recycle bin restore", () => {
  it("moves last page back into Shepherd A", () => {
    const bin = findNode("recycle-bin", desktopNodes)!;
    expect(bin.children!.some((c) => c.id === "last-page")).toBe(true);
    const { roots, ok } = restoreNode(desktopNodes, "last-page");
    expect(ok).toBe(true);
    const bin2 = findNode("recycle-bin", roots)!;
    expect(bin2.children!.length).toBe(0);
    const sa = findNode("shepherd-a", roots)!;
    const lp = sa.children!.find((c) => c.id === "last-page")!;
    expect(lp).toBeDefined();
    expect(lp.deleted).toBe(false);
    expect(lp.location).toBe("Hajurama's Box/Chautari/Shepherd A");
  });
});

describe("hint engine", () => {
  it("picks first missing milestone in order", () => {
    expect(nextMilestone({})).toBe("openedStart");
    expect(nextMilestone({ openedStart: true })).toBe("revealedFirstCode");
    const all = Object.fromEntries(
      ["openedStart","revealedFirstCode","enteredChautari","openedMagicLeaf","openedFork",
       "enteredShepherdA","revealedDesignClue","restoredLastPage","openedFinalCode"].map((m) => [m, true]));
    expect(nextMilestone(all)).toBe("openedBox");
  });
  it("detects trap paths", () => {
    expect(pathIsTrap(["box-root", "temple", "temple-inside", "bell"])).toBe(true);
    expect(pathIsTrap(idsTo("shepherd-b-img", boxRoot))).toBe(true);
    expect(pathIsTrap(idsTo("leaf-17", boxRoot))).toBe(false);
    expect(TRAP_ROOTS).toContain("water-tap");
  });
});

describe("design reveal detection", () => {
  const clue = { x: 0.08, y: 0.24, w: 0.6, h: 0.66, z: 1 };
  it("revealed when clue is on top", () => {
    const basket = { x: 0.04, y: 0.2, w: 0.7, h: 0.74, z: 2 };
    expect(clueRevealed(clue, basket)).toBe(false); // covered >20%
    expect(clueRevealed({ ...clue, z: 3 }, basket)).toBe(true);
  });
  it("revealed when basket moved away", () => {
    const basket = { x: 0.9, y: 0.2, w: 0.7, h: 0.74, z: 2 };
    expect(clueRevealed(clue, basket)).toBe(true);
  });
  it("revealed when basket deleted", () => {
    expect(clueRevealed(clue, null)).toBe(true);
  });
});

describe("timer freeze on finish (#9)", () => {
  it("unlock box sets finishedMs and freezes elapsed", () => {
    let s: State = initialState();
    s = reducer(s, { type: "start", team: "T" });
    s = reducer(s, { type: "unlock", nodeId: "box" });
    expect(s.finished).toBe(true);
    expect(s.finale).toBe(true);
    expect(s.finishedMs).not.toBeNull();
    expect(elapsed(s)).toBe(s.finishedMs);
  });
});

describe("final prize prank", () => {
  it("prize action sets prizeResult; play-again resets it", () => {
    let s: State = initialState();
    const fell = reducer(s, { type: "prize", result: "fell" });
    expect(fell.prizeResult).toBe("fell");
    const passed = reducer(s, { type: "prize", result: "passed" });
    expect(passed.prizeResult).toBe("passed");
    expect(passed.skills.scamRefuse).toBe(true);
    expect(fell.skills.scamRefuse).toBeUndefined();
    const again = reducer(fell, { type: "play-again" });
    expect(again.prizeResult).toBeNull();
    // first choice sticks
    expect(reducer(fell, { type: "prize", result: "passed" }).prizeResult).toBe("fell");
  });
  it("prizeResult is persisted; old saves without it load as null", () => {
    store.clear();
    let s: State = initialState();
    s = reducer(s, { type: "start", team: "T" });
    s = reducer(s, { type: "prize", result: "fell" });
    expect(persisted(s).prizeResult).toBe("fell");
    store.set(SAVE_KEY, JSON.stringify(persisted(s)));
    expect(load().prizeResult).toBe("fell");
    // old save: field missing -> null
    store.set(SAVE_KEY, JSON.stringify({ started: true, team: "T", fsRoots: desktopNodes }));
    expect(load().prizeResult).toBeNull();
  });
});

describe("score and trap counting", () => {
  it("score adds 1 min per hint and 30 s per wrong password", () => {
    expect(score(600000, 2, 1)).toBe(750000);
    expect(fmtTime(score(600000, 2, 1))).toBe("12:30");
    expect(score(600000, 0, 0)).toBe(600000);
  });
  it("clearedTraps counts only trap endings", () => {
    const base = { revealFlags: {} as Record<string, boolean>, unlocked: [] as string[] };
    expect(clearedTraps(base)).toEqual([]);
    expect(clearedTraps({ ...base, revealFlags: { scam: true } })).toEqual(["tea-shop"]);
    expect(clearedTraps({ ...base, unlocked: ["note"] })).toEqual(["water-tap"]);
    expect(clearedTraps({ ...base, unlocked: ["blessing"] })).toEqual(["temple"]);
    expect(clearedTraps({ ...base, unlocked: ["liar"] })).toEqual(["shepherd-b"]);
    // entered a trap but never finished it
    expect(clearedTraps({ revealFlags: {}, unlocked: [] })).toHaveLength(0);
    const all = { revealFlags: { scam: true }, unlocked: ["note", "blessing", "liar"] };
    expect(clearedTraps(all)).toHaveLength(4);
  });
  it("trapsFound counts roots, not nodes", () => {
    const s = { trapsVisited: ["tea-shop", "prize", "water-tap", "bucket", "clue", "note"] };
    expect(trapsFound(s).sort()).toEqual(["tea-shop", "water-tap"]);
    expect(trapsFound({ trapsVisited: [] })).toEqual([]);
  });
});

describe("hintsUsed", () => {
  it("counts every spent token, ignores teacher grants", () => {
    let s: State = initialState();
    s = reducer(s, { type: "start", team: "T" });
    s = reducer(s, { type: "hint" });
    expect(s.hintsUsed).toBe(1);
    expect(s.tokens).toBe(2);
    s = reducer(s, { type: "teacher-token" });
    expect(s.hintsUsed).toBe(1);
    expect(s.tokens).toBe(3);
    // trap hint also counts
    s = reducer(s, { type: "open-node", nodeId: "tea-shop" });
    s = reducer(s, { type: "hint" });
    expect(s.hintsUsed).toBe(2);
  });
  it("old saves without hintsUsed fall back to 3 - tokens", () => {
    store.clear();
    store.set(SAVE_KEY, JSON.stringify({ started: true, team: "T", tokens: 1, fsRoots: desktopNodes }));
    expect(load().hintsUsed).toBe(2);
  });
});

describe("past runs", () => {
  const run = (id: number) => ({
    id, team: "T", timeMs: 1000, hintsUsed: 0, wrongPasswords: 0,
    trapsCleared: [] as string[], prize: "passed" as const, at: id,
  });
  it("appends, dedupes by id, caps at 30, tolerates corrupt data", () => {
    clearRuns();
    expect(loadRuns()).toEqual([]);
    recordRun(run(1));
    recordRun(run(2));
    recordRun(run(1)); // dedupe
    expect(loadRuns().map((r) => r.id)).toEqual([2, 1]);
    for (let i = 10; i < 50; i++) recordRun(run(i));
    expect(loadRuns().length).toBe(30);
    store.set("hajurama-box-runs-v1", "{not json");
    expect(loadRuns()).toEqual([]);
    clearRuns();
    expect(loadRuns()).toEqual([]);
  });
});

describe("replay", () => {
  it("keeps the team, resets progress, skips coach, keeps runs", () => {
    store.clear();
    let s: State = initialState();
    s = reducer(s, { type: "start", team: "Peepal" });
    s = reducer(s, { type: "hint" });
    s = reducer(s, { type: "unlock", nodeId: "box" });
    s = reducer(s, { type: "prize", result: "passed" });
    const r = reducer(s, { type: "replay" });
    expect(r.team).toBe("Peepal");
    expect(r.phase).toBe("game");
    expect(r.started).toBe(true);
    expect(r.finished).toBe(false);
    expect(r.finishedMs).toBeNull();
    expect(r.prizeResult).toBeNull();
    expect(r.coachStep).toBe(3);
    expect(r.hintsUsed).toBe(0);
    expect(r.milestones).toEqual({});
    // runs key is untouched by the reducer, nothing to wipe
    recordRun(run(99));
    expect(loadRuns().length).toBe(1);
  });
  function run(id: number) {
    return { id, team: "Peepal", timeMs: 1, hintsUsed: 0, wrongPasswords: 0, trapsCleared: [], prize: "passed" as const, at: id };
  }
});

describe("focus no-op (#10)", () => {
  it("focusing the already-active top window returns the same state", () => {
    let s: State = initialState();
    s = reducer(s, { type: "start", team: "T" });
    s = reducer(s, { type: "open-node", nodeId: "box-root" });
    const w = s.windows[0];
    expect(s.activeWin).toBe(w.id);
    const s2 = reducer(s, { type: "focus", id: w.id });
    expect(s2).toBe(s); // same reference, no re-render
    // a different (older, lower) window still raises
    s2; // noop
  });
});

describe("seven-segment display map", () => {
  // bit order [a,b,c,d,e,f,g]
  const STD: Record<string, string> = {
    "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg",
    "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg",
    "-": "g", " ": "",
  };
  const IDX = "abcdefg";
  for (const [ch, want] of Object.entries(STD)) {
    it(`digit '${ch}' lights exactly ${want || "none"}`, () => {
      const s = SEGMENTS[ch];
      expect(s, `missing ${ch}`).toBeDefined();
      const lit = s.map((v, i) => (v ? IDX[i] : "")).join("");
      expect(lit.split("").sort().join("")).toBe(want.split("").sort().join(""));
    });
  }
  it("every row has exactly 7 entries", () => {
    for (const [ch, s] of Object.entries(SEGMENTS)) {
      expect(s.length, ch).toBe(7);
      for (const v of s) expect(v === 0 || v === 1).toBe(true);
    }
  });
});

describe("filesystem", () => {
  it("last page starts deleted in the bin with Shepherd A home", () => {
    expect(lastPageNode.deleted).toBe(true);
    expect(lastPageNode.homePath).toEqual(["box-root", "chautari", "shepherd-a"]);
    expect(lastPageNode.originalLocation).toContain("Shepherd A");
  });
  it("shepherd B image carries secret metadata", () => {
    const img = findNode("shepherd-b-img", desktopNodes)!;
    expect(img.details?.title).toBe("Shepherd B's secret");
    expect(img.details?.comments).toContain("months have 28 days");
  });
});

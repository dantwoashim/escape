import { describe, it, expect } from "vitest";
import {
  caesar, checkPassword, PRAYER_TEXT, PRAYER_MESSAGE, boxRoot, desktopNodes,
  lastPageNode, findNode, TRAP_ROOTS,
} from "../src/game/content";
import {
  sortNodes, restoreNode, replaceAllCount, clueRevealed, nextMilestone, pathIsTrap, idsTo,
} from "../src/game/logic";
import { reducer, elapsed, initialState, State } from "../src/game/state";
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

describe("focus no-op (#10)", () => {
  it("focusing the already-active top window returns the same state", () => {
    let s: State = initialState();
    s = reducer(s, { type: "start", team: "T" });
    s = reducer(s, { type: "open-node", nodeId: "box-root" });
    const w = s.windows[0];
    expect(s.activeWin).toBe(w.id);
    const s2 = reducer(s, { type: "focus", id: w.id });
    expect(s2).toBe(s); // same reference — no re-render
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


import { useMeta, useActions } from "../game/state";
import { MILESTONES } from "../game/state";
import { caesar, FIRST_CLUE, FINAL_WORD, TEMPLE_END } from "../game/content";
import { nextMilestone } from "../game/logic";

const ANSWERS: [string, string][] = [
  ["START HERE", `Ctrl+A shows: ${caesar(FIRST_CLUE, 3)} → key 3 → ${FIRST_CLUE} → Chautari`],
  ["Chautari", "Details view, sort Date modified, newest is leaf 17"],
  ["leaf 17", "MOMO=10, CHIYA=4, ROTI=2 → ROTI + MOMO x CHIYA = 42"],
  ["FORK", "password 42. B lies (both-truth impossible), follow Shepherd A"],
  ["Design", "move/send-to-back the basket → pen = Rs 5; last page is in Recycle Bin"],
  ["Recycle Bin", "right-click last page → Restore"],
  ["last page", "Google: Everest 1953 → FINAL CODE"],
  ["FINAL CODE", `password 1953 → ${caesar(FINAL_WORD, 5)}, key = pen price 5 → ${FINAL_WORD}`],
  ["BOX", `password ${FINAL_WORD}, then finish`],
];

const TRAPS: [string, string][] = [
  ["Tea Shop", "PIN/OTP fields or page 2 reveal the scam lesson"],
  ["Water Tap", "clue is 1pt: zoom or font up; 0.7734 → HELLO opens note"],
  ["Temple", `Ctrl+H replace @ with nothing → Google flower → RHODODENDRON → key 3 → "${TEMPLE_END}"`],
  ["Shepherd B", "right-click → Properties → Details → 'how many months have 28 days?' → 12 opens liar"],
];

const STEP_LABELS: Record<string, string> = {
  openedStart: "Open START HERE",
  revealedFirstCode: "Reveal the white text (Ctrl + A)",
  enteredChautari: "Open the Chautari folder",
  openedMagicLeaf: "Find the magic leaf (sort by date)",
  openedFork: "Open FORK (password 42)",
  enteredShepherdA: "Open the Shepherd A folder",
  revealedDesignClue: "Reveal the design clue (move the basket)",
  restoredLastPage: "Restore 'last page' from the Recycle Bin",
  openedFinalCode: "Open FINAL CODE (password 1953)",
  openedBox: "Open BOX (password DASHAIN)",
};

export default function TeacherPanel() {
  const state = useMeta();
  const { dispatch } = useActions();
  const next = nextMilestone(state.milestones);
  const current = next ? STEP_LABELS[next] ?? next : "Done, they found the box";
  return (
    <div className="teacher" data-teacher>
      <span className="tag">Teacher only</span>
      <h3>Answers &amp; progress</h3>
      <div style={{ color: "var(--ink-2)" }}>
        Team: <b>{state.team || "(no name)"}</b> · next step: <b>{current}</b> · tokens: {state.tokens}
      </div>
      <h4 style={{ margin: "10px 0 2px" }}>Correct path</h4>
      <table>
        <tbody>
          {ANSWERS.map(([k, v]) => (
            <tr key={k}><td>{k}</td><td>{v}</td></tr>
          ))}
        </tbody>
      </table>
      <h4 style={{ margin: "6px 0 2px" }}>Traps</h4>
      <table>
        <tbody>
          {TRAPS.map(([k, v]) => (
            <tr key={k}><td>{k}</td><td>{v}</td></tr>
          ))}
        </tbody>
      </table>
      <h4 style={{ margin: "6px 0 2px" }}>Passwords</h4>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
        FORK→42 · FINAL CODE→1953 · BOX→DASHAIN · note→HELLO · blessing→RHODODENDRON · liar→12
      </div>
      <h4 style={{ margin: "8px 0 2px" }}>Milestones</h4>
      <div style={{ fontSize: 11.5, color: "var(--ink-2)" }}>
        {MILESTONES.map((m) => `${state.milestones[m] ? "☑" : "☐"} ${STEP_LABELS[m] ?? m}`).join("  ")}
      </div>
      <div className="row">
        <button className="btn" onClick={() => dispatch({ type: "teacher-token" })}>+1 hint token</button>
        <button
          className="btn"
          onClick={() => {
            if (window.confirm("Reset the whole game?")) dispatch({ type: "teacher-reset" });
          }}
        >
          Reset game
        </button>
        <button className="btn" onClick={() => dispatch({ type: "teacher", on: false })}>Close</button>
      </div>
    </div>
  );
}

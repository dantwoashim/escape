import type { CSSProperties } from "react";
import { useMeta, useActions } from "../game/state";

const STEPS = [
  { title: "Open the box", body: "Double-click the Hajurama's Box folder on the desktop to open it." },
  { title: "Right-click helps", body: "Right-click on files to see more options, like Properties or Restore." },
  { title: "Stuck?", body: "Click Ask Hajurama in the taskbar. You have 3 hints. Use them wisely." },
];

export default function CoachMarks() {
  const state = useMeta();
  const { dispatch } = useActions();
  const step = state.coachStep;
  if (!state.started || step >= 3) return null;
  const positions: CSSProperties[] = [
    { left: 140, top: 60 },
    { left: 140, top: 60 },
    { right: 20, bottom: 70 },
  ];
  const s = STEPS[step];
  return (
    <div className="coach" style={positions[step]}>
      <h4>{s.title}</h4>
      <p>{s.body}</p>
      <div className="row">
        <span className="steps">{step + 1} of 3</span>
        <span>
          <button className="skip" onClick={() => dispatch({ type: "coach", step: 3 })}>Skip</button>
          <button onClick={() => dispatch({ type: "coach", step: step + 1 })}>
            {step === 2 ? "Done" : "Next"}
          </button>
        </span>
      </div>
    </div>
  );
}

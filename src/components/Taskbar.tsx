import { useEffect, useRef, useState } from "react";
import { useMeta, useWindows, useActions, elapsed } from "../game/state";
import { fmtTime } from "../game/logic";
import {
  ListBullets, FolderOpen, Question, ArrowClockwise, Calculator as CalcIcon,
  Clock,
} from "@phosphor-icons/react";

// ticking text isolated in its own component — updates a text node, no re-render elsewhere
function Timer() {
  const state = useMeta();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      if (ref.current) ref.current.textContent = fmtTime(elapsed(state));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.started, state.startTs]);
  return <span className="timer" ref={ref} />;
}

function ClockText() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      if (ref.current)
        ref.current.textContent = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit",
        });
    };
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);
  return <span ref={ref} />;
}

export default function Taskbar() {
  const state = useMeta();
  const { windows } = useWindows();
  const { dispatch, openNode } = useActions();
  const [menu, setMenu] = useState(false);

  const openWindows = [...windows].sort((a, b) => a.id - b.id);

  return (
    <>
      <div className="taskbar">
        <button className="start-btn" onClick={() => setMenu(!menu)} aria-haspopup="menu" aria-expanded={menu}>
          <ListBullets size={15} weight="bold" /> Start
        </button>
        <div className="task-wins">
          {openWindows.map((w) => (
            <button
              key={w.id}
              className={"task-win" + (state.activeWin === w.id && !w.minimized ? " active" : "")}
              onClick={() =>
                w.minimized || state.activeWin !== w.id
                  ? dispatch({ type: "focus", id: w.id })
                  : dispatch({ type: "min", id: w.id })
              }
            >
              {w.title}
            </button>
          ))}
        </div>
        <div className="hud">
          <button
            className="hint-btn"
            disabled={state.tokens <= 0}
            title={state.tokens <= 0 ? "No hints left" : "Ask Hajurama for a hint"}
            onClick={() => dispatch({ type: "hint" })}
          >
            <Question size={14} /> Ask Hajurama <span className="n">{state.tokens}</span>
          </button>
          <span title="Elapsed"><Timer /></span>
          <Clock size={13} />
          <ClockText />
        </div>
      </div>
      {menu && (
        <div className="start-menu" role="menu" onClick={(e) => e.stopPropagation()}>
          <h4>Programs</h4>
          <button className="sm-item" onClick={() => { setMenu(false);
            const r = state.fsRoots.find((x) => x.id === "box-root"); if (r) openNode(r); }}>
            <FolderOpen size={20} /> Hajurama's Box
          </button>
          <button className="sm-item" onClick={() => { setMenu(false);
            const r = state.fsRoots.find((x) => x.id === "recycle-bin"); if (r) openNode(r); }}>
            <ArrowClockwise size={20} /> Recycle Bin
          </button>
          <button className="sm-item" onClick={() => { setMenu(false);
            const r = state.fsRoots.find((x) => x.id === "calculator"); if (r) openNode(r); }}>
            <CalcIcon size={20} /> Calculator
          </button>
          <div className="sm-sep" />
          <button
            className="sm-item"
            onClick={() => {
              setMenu(false);
              if (window.confirm("Start a new game? Your progress will be lost.")) {
                dispatch({ type: "new-game" });
              }
            }}
          >
            <ArrowClockwise size={20} /> New game
          </button>
        </div>
      )}
    </>
  );
}

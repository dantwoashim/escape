import { useEffect } from "react";
import { GameProvider, useMeta, useWindows, useActions } from "./game/state";
import Landing from "./components/Landing";
import Desktop from "./components/Desktop";
import Taskbar from "./components/Taskbar";
import Frame from "./components/Window";
import CoachMarks from "./components/CoachMarks";
import Finale from "./components/Finale";
import TeacherPanel from "./components/TeacherPanel";

function Shell() {
  const state = useMeta();
  const { windows } = useWindows();
  const { dispatch } = useActions();

  // teacher panel: #teacher hash or Ctrl+Alt+H
  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#teacher") dispatch({ type: "teacher", on: true });
    };
    check();
    window.addEventListener("hashchange", check);
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        dispatch({ type: "teacher", on: true });
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", check);
      window.removeEventListener("keydown", key);
    };
  }, [dispatch]);

  if (state.phase === "landing") return (
    <>
      <Landing />
      {state.teacher && <TeacherPanel />}
      <div className="grain" />
    </>
  );

  return (
    <>
      <Desktop />
      {windows.map((w) => (
        <Frame key={w.id} win={w} active={state.activeWin === w.id} />
      ))}
      <Taskbar />
      <CoachMarks />
      {state.hintMessage && (
        <div className="hint-card" data-hint>
          <div className="who">Hajurama · {state.hintMessage.step}</div>
          <p>{state.hintMessage.text}</p>
          <button className="btn close" onClick={() => dispatch({ type: "clear-hint" })}>OK, back to work</button>
        </div>
      )}
      {state.toast && <div className="toast" role="status">{state.toast}</div>}
      {state.finale && <Finale />}
      {state.teacher && <TeacherPanel />}
      <div className="grain" />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}

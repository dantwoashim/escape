// Draggable window shell. Dragging moves via transform on the element + rAF;
// React state is only committed on pointerup.
import { memo, useRef, useCallback } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useActions, Win } from "../game/state";
import { Minus, Square, X } from "@phosphor-icons/react";
import Explorer, { Properties } from "./Explorer";
import Word from "./Word";
import RecycleBin from "./RecycleBin";
import Calculator from "./Calculator";
import Designer from "./Designer";
import ImageViewer from "./ImageViewer";

// memoized so unrelated window state changes never re-render a body
const WinBody = memo(function WinBody({ win }: { win: Win }) {
  // render counter used by the perf spec to prove other bodies don't re-render
  if (typeof window !== "undefined") {
    const rb = ((window as any).__rb ||= {});
    rb[win.id] = (rb[win.id] || 0) + 1;
  }
  switch (win.app) {
    case "explorer": return <Explorer win={win} />;
    case "word": return <Word win={win} />;
    case "recycle": return <RecycleBin />;
    case "calculator": return <Calculator win={win} />;
    case "designer": return <Designer />;
    case "imageview": return <ImageViewer />;
    case "properties": return <Properties win={win} />;
    default: return null;
  }
});

interface Props {
  win: Win;
  active: boolean;
}

const Frame = memo(function Frame({ win, active }: Props) {
  const { dispatch } = useActions();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number; raf: number } | null>(null);
  const focusedThisPress = useRef(false);

  const focusOnce = () => {
    if (!focusedThisPress.current && !active) {
      dispatch({ type: "focus", id: win.id });
    }
    focusedThisPress.current = true;
  };

  const onDown = useCallback(
    (e: ReactPointerEvent) => {
      focusedThisPress.current = false;
      focusOnce();
      if (win.maximized) return;
      if ((e.target as HTMLElement).closest(".tb-btn")) return;
      drag.current = { px: e.clientX, py: e.clientY, x: win.x, y: win.y, raf: 0 };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [win.id, win.x, win.y, win.maximized, dispatch, active],
  );

  const onMove = useCallback(
    (e: ReactPointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const nx = Math.max(-win.w + 120, Math.min(window.innerWidth - 80, d.x + e.clientX - d.px));
      const ny = Math.max(0, Math.min(window.innerHeight - 88, d.y + e.clientY - d.py));
      cancelAnimationFrame(d.raf);
      d.raf = requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `translate(${nx - win.x}px, ${ny - win.y}px)`;
        d.x = nx; d.y = ny;
      });
    },
    [win.w, win.x, win.y],
  );

  const onUp = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    if (ref.current) ref.current.style.transform = "";
    if (d.x !== win.x || d.y !== win.y) dispatch({ type: "move", id: win.id, x: d.x, y: d.y });
  }, [dispatch, win.id, win.x, win.y]);

  const style: CSSProperties = win.maximized
    ? { left: 0, top: 0, width: "100vw", height: "calc(100vh - 48px)", zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      ref={ref}
      className={"window" + (win.maximized ? " max" : "")}
      style={{ ...style, display: win.minimized ? "none" : undefined }}
      onPointerDown={focusOnce}
      data-win={win.id}
      role="dialog"
      aria-label={win.title}
    >
      <div
        className="titlebar"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onDoubleClick={() => dispatch({ type: "max", id: win.id })}
      >
        <span className="t">{win.title}</span>
        <button className="tb-btn" aria-label="Minimize" onClick={() => dispatch({ type: "min", id: win.id })}>
          <Minus size={13} />
        </button>
        <button className="tb-btn" aria-label="Maximize" onClick={() => dispatch({ type: "max", id: win.id })}>
          <Square size={12} />
        </button>
        <button className="tb-btn close" aria-label="Close" onClick={() => dispatch({ type: "close", id: win.id })}>
          <X size={14} />
        </button>
      </div>
      <div className="win-body"><WinBody win={win} /></div>
    </div>
  );
});

export default Frame;

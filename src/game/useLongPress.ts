import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";

// long-press -> context menu on touch screens; cancels if the finger moves
export function useLongPress(onLong: () => void, ms = 450) {
  const t = useRef(0);
  const didLong = useRef(false);
  const pos = useRef({ x: 0, y: 0 });
  const clear = () => {
    clearTimeout(t.current);
    t.current = 0;
  };
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      didLong.current = false;
      clear();
      t.current = window.setTimeout(() => {
        t.current = 0;
        didLong.current = true;
        onLong();
      }, ms);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (Math.hypot(e.clientX - pos.current.x, e.clientY - pos.current.y) > 8) clear();
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    // a click follows the release; swallow it so a long-press never "opens"
    onClickCapture: (e: ReactMouseEvent) => {
      if (didLong.current) {
        didLong.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}

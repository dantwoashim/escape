import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useIsMobile } from "../game/useIsMobile";
import { navPush, navConsume } from "../game/historyNav";

export interface SheetItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

// bottom action sheet, the mobile version of a right-click menu
export default function ActionSheet({ items, onClose }: { items: SheetItem[]; onClose: () => void }) {
  const mobile = useIsMobile();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // a pushed depth on mobile: Back closes the sheet; any direct dismissal
  // consumes that entry first so the stack stays honest
  useEffect(() => {
    if (!mobile) return;
    navPush(() => closeRef.current());
  }, [mobile]);
  const close = () => {
    if (mobile) navConsume();
    onClose();
  };
  // the sheet opens under a held finger; lifting it must not count as a backdrop tap
  const born = useRef(performance.now());
  const closeIfSettled = () => {
    if (performance.now() - born.current > 350) close();
  };
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        // the sheet sits inside .explorer, whose own onClick clears the menu;
        // always stop here, and let closeIfSettled decide if this was a real tap
        e.stopPropagation();
        closeIfSettled();
      }}
    >
      <div className="action-sheet" role="menu" onClick={(e) => e.stopPropagation()}>
        {items.map((it, i) => (
          <button
            key={i}
            className="sheet-item"
            role="menuitem"
            onClick={() => {
              close();
              it.onClick();
            }}
          >
            {it.icon}
            {it.label}
          </button>
        ))}
        <button className="sheet-item cancel" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}

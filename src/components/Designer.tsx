// Canva-style design app. Elements stored as fractions of a 16:9 artboard.
// Element dragging uses refs + rAF, committing on pointerup.
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useMeta, useActions, DesignEl, defaultDesign } from "../game/state";
import { levelContent } from "../game/levels";
import { clueRevealed } from "../game/logic";
import {
  Stack, TrashSimple, ArrowCounterClockwise, TextT, Shapes,
} from "@phosphor-icons/react";

function Doko() {
  // conical woven basket
  return (
    <svg viewBox="0 0 300 220" width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9A566" />
          <stop offset="1" stopColor="#A9763F" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="30" rx="140" ry="26" fill="#8A5A2E" />
      <ellipse cx="150" cy="30" rx="126" ry="19" fill="#5F3C1C" />
      <path d="M10 30 Q150 60 290 30 L210 200 Q150 218 90 200 Z" fill="url(#dk)" />
      <g stroke="#7C5026" strokeWidth="2.5" fill="none" opacity="0.7">
        <path d="M22 60 Q150 88 278 60" />
        <path d="M38 92 Q150 118 262 92" />
        <path d="M55 124 Q150 148 245 124" />
        <path d="M72 156 Q150 177 228 156" />
        <path d="M86 182 Q150 199 214 182" />
      </g>
      <g stroke="#8A5A2E" strokeWidth="2" fill="none" opacity="0.55">
        <path d="M70 44 L120 196" /><path d="M120 40 L140 204" />
        <path d="M180 40 L160 204" /><path d="M230 44 L180 196" />
      </g>
      <ellipse cx="150" cy="204" rx="62" ry="12" fill="#7C5026" />
    </svg>
  );
}

function Topi() {
  // Dhaka topi, flat-topped cap with woven pattern
  return (
    <svg viewBox="0 0 300 220" width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A3B5C" />
          <stop offset="1" stopColor="#2E2238" />
        </linearGradient>
      </defs>
      <path d="M40 190 L40 110 Q40 55 150 55 Q260 55 260 110 L260 190 Z" fill="url(#tk)" stroke="#1E1626" strokeWidth="3" />
      <ellipse cx="150" cy="190" rx="110" ry="16" fill="#1E1626" />
      <g opacity="0.85">
        <path d="M55 100 l20 -20 20 20 -20 20 z" fill="#C9485B" />
        <path d="M115 100 l20 -20 20 20 -20 20 z" fill="#E5B45C" />
        <path d="M175 100 l20 -20 20 20 -20 20 z" fill="#C9485B" />
        <path d="M85 150 l20 -20 20 20 -20 20 z" fill="#E5B45C" />
        <path d="M145 150 l20 -20 20 20 -20 20 z" fill="#7FA368" />
        <path d="M205 150 l20 -20 20 20 -20 20 z" fill="#C9485B" />
      </g>
      <path d="M40 168 Q150 188 260 168 L260 190 L40 190 Z" fill="#3A2C49" />
      <path d="M40 110 Q150 130 260 110" fill="none" stroke="#1E1626" strokeWidth="2.5" opacity="0.6" />
    </svg>
  );
}

export default function Designer() {
  const state = useMeta();
  const { dispatch } = useActions();
  const els = state.design;
  const [sel, setSel] = useState<string | null>(null);
  const [posMenu, setPosMenu] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; px: number; py: number; x: number; y: number; raf: number } | null>(null);
  const elRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const set = (next: DesignEl[]) => dispatch({ type: "design", els: next });

  // reveal detection
  useEffect(() => {
    const clue = els.find((e) => e.id === "clue");
    const basket = els.find((e) => e.id === "basket");
    if (clue && clueRevealed(clue, basket ?? null)) {
      dispatch({ type: "reveal", key: "design-clue" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [els]);

  const onElDown = (e: ReactPointerEvent, el: DesignEl) => {
    e.stopPropagation();
    setSel(el.id);
    drag.current = { id: el.id, px: e.clientX, py: e.clientY, x: el.x, y: el.y, raf: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onElMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    const board = boardRef.current;
    if (!d || !board) return;
    const bw = board.clientWidth, bh = board.clientHeight;
    const nx = Math.max(-0.5, Math.min(1.2, d.x + (e.clientX - d.px) / bw));
    const ny = Math.max(-0.3, Math.min(1.1, d.y + (e.clientY - d.py) / bh));
    cancelAnimationFrame(d.raf);
    d.raf = requestAnimationFrame(() => {
      const node = elRefs.current[d.id];
      const el = els.find((x) => x.id === d.id);
      if (node && el) node.style.transform = `translate(${(nx - el.x) * bw}px, ${(ny - el.y) * bh}px)`;
      d.x = nx; d.y = ny;
    });
  };
  const onElUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    const node = elRefs.current[d.id];
    if (node) node.style.transform = "";
    set(els.map((el) => (el.id === d.id ? { ...el, x: d.x, y: d.y } : el)));
  };

  const reorder = (op: "front" | "back" | "fwd" | "bwd") => {
    if (!sel) return;
    const sorted = [...els].sort((a, b) => a.z - b.z);
    const i = sorted.findIndex((e) => e.id === sel);
    if (i < 0) return;
    if (op === "front") sorted.push(sorted.splice(i, 1)[0]);
    else if (op === "back") sorted.unshift(sorted.splice(i, 1)[0]);
    else if (op === "fwd" && i < sorted.length - 1)
      [sorted[i], sorted[i + 1]] = [sorted[i + 1], sorted[i]];
    else if (op === "bwd" && i > 0)
      [sorted[i], sorted[i - 1]] = [sorted[i - 1], sorted[i]];
    set(sorted.map((e, k) => ({ ...e, z: k + 1 })));
    setPosMenu(false);
  };

  const del = () => {
    if (!sel) return;
    set(els.filter((e) => e.id !== sel));
    setSel(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && sel) del();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, els]);

  const lv = levelContent(state.level);
  const elContent = (el: DesignEl) => {
    if (el.type === "title")
      return <div className="title-text">{lv.designTitle}</div>;
    if (el.type === "clue")
      return (
        <div className="clue-text">
          {lv.designClue.map((l, i) => (
            <div key={i} style={i === 0 ? { fontWeight: 700, marginBottom: 4 } : undefined}>{l}</div>
          ))}
        </div>
      );
    return lv.designShape === "topi" ? <Topi /> : <Doko />;
  };

  return (
    <div className="designer" onClick={() => { setSel(null); setPosMenu(false); }}>
      <div className="dg-rail">
        <button><Shapes size={20} />Elements</button>
        <button><TextT size={20} />Text</button>
      </div>
      <div className="dg-main">
        <div className="dg-toolbar" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <button className={"wbtn" + (posMenu ? " on" : "")} disabled={!sel} style={{ opacity: sel ? 1 : 0.45 }}
            onClick={() => setPosMenu(!posMenu)}>
            <Stack size={14} /> Position
          </button>
          <button className="wbtn" disabled={!sel} style={{ opacity: sel ? 1 : 0.45 }} onClick={del}>
            <TrashSimple size={14} /> Delete
          </button>
          <span style={{ flex: 1 }} />
          <button className="wbtn" onClick={() => { set(defaultDesign()); setSel(null); }}>
            <ArrowCounterClockwise size={14} /> Reset design
          </button>
          {posMenu && (
            <div className="menu-pop">
              <button className="ctx-item" onClick={() => reorder("front")}>Bring to front</button>
              <button className="ctx-item" onClick={() => reorder("fwd")}>Bring forward</button>
              <button className="ctx-item" onClick={() => reorder("bwd")}>Send backward</button>
              <button className="ctx-item" onClick={() => reorder("back")}>Send to back</button>
            </div>
          )}
        </div>
        <div className="dg-stage">
          <div className="artboard" ref={boardRef}>
            {els.map((el) => (
              <div
                key={el.id}
                ref={(n) => { elRefs.current[el.id] = n; }}
                className={"dg-el" + (sel === el.id ? " sel" : "")}
                data-el={el.id}
                style={{
                  left: `${el.x * 100}%`, top: `${el.y * 100}%`,
                  width: `${el.w * 100}%`, height: `${el.h * 100}%`, zIndex: el.z,
                }}
                onPointerDown={(e) => onElDown(e, el)}
                onPointerMove={onElMove}
                onPointerUp={onElUp}
              >
                {elContent(el)}
                {sel === el.id && (
                  <>
                    <span className="handle" style={{ left: -5, top: -5 }} />
                    <span className="handle" style={{ right: -5, top: -5 }} />
                    <span className="handle" style={{ left: -5, bottom: -5 }} />
                    <span className="handle" style={{ right: -5, bottom: -5 }} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

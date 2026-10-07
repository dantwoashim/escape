import { useEffect, useMemo, useRef, useState } from "react";
import { useMeta, useActions, Win, checkPassword } from "../game/state";
import { levelContent } from "../game/levels";
import { DocBlock, ParaBlock, Run, findNode } from "../game/content";
import { replaceAllCount } from "../game/logic";
import { useIsMobile } from "../game/useIsMobile";
import {
  TextB, MagnifyingGlass, ArrowCounterClockwise, Minus, Plus, SelectionAll,
} from "@phosphor-icons/react";

const FONT_VAR: Record<string, string> = {
  serif: "var(--font-serif)",
  sans: "var(--font-ui)",
  mono: "var(--font-mono)",
};

const SWATCHES = [
  { name: "Automatic", color: "" },
  { name: "Brown", color: "#6B3E1E" },
  { name: "Red", color: "#A33A2C" },
  { name: "Green", color: "#4F6B52" },
];

interface Props { win: Win }

export default function Word({ win }: Props) {
  const state = useMeta();
  const { dispatch } = useActions();
  const node = findNode(win.nodeId ?? "", state.fsRoots);
  const docId = node?.docId ?? win.nodeId ?? "";
  const ldocs = levelContent(state.level).docs;
  const baseBlocks = state.docEdits[docId] ?? ldocs[docId]?.blocks ?? [];
  const [blocks, setBlocks] = useState<DocBlock[]>(baseBlocks);
  useEffect(() => setBlocks(state.docEdits[docId] ?? ldocs[docId]?.blocks ?? []), [docId, state.docEdits]);

  const locked = !!node?.password && !state.unlocked.includes(node.id);
  const [zoom, setZoom] = useState(100);
  const [findOpen, setFindOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [findQ, setFindQ] = useState("");
  const [repQ, setRepQ] = useState("");
  const pagesRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = state.activeWin === win.id;
  const mobile = useIsMobile();

  // the doc paints only after the webfonts resolve, so opening a document
  // never reflows mid-swap (this was the "text jumps when the letter opens" bug)
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let on = true;
    if (document.fonts.status === "loaded") { setFontsReady(true); return; }
    document.fonts.ready.then(() => { if (on) setFontsReady(true); });
    return () => { on = false; };
  }, []);

  // font-size field shows first selected run's size, else the document's first
  const firstSize = useMemo(() => {
    for (const b of blocks) if (b.type === "para" && b.runs[0]) return b.runs[0].size;
    return 16;
  }, [blocks]);
  const [selSize, setSelSize] = useState<number | null>(null);
  const [sizeDraft, setSizeDraft] = useState<string | null>(null);
  useEffect(() => {
    const onSel = () => {
      const keys = selectedRunKeys();
      if (keys.size === 0) { setSelSize(null); return; }
      const [bi, ri] = [...keys][0].split(":").map(Number);
      const b = blocks[bi];
      if (b?.type === "para" && b.runs[ri]) setSelSize(b.runs[ri].size);
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // milestone: opening start-here counted at open; reveal on select-all or color change
  const revealFirst = () => {
    if (docId === "start-here") dispatch({ type: "milestone", m: "revealedFirstCode" });
  };

  // ---------------- selection helpers ----------------
  const selectedRunKeys = (): Set<string> => {
    const sel = window.getSelection();
    const out = new Set<string>();
    if (!sel || sel.rangeCount === 0 || !pagesRef.current) return out;
    const range = sel.getRangeAt(0);
    pagesRef.current.querySelectorAll<HTMLElement>("span[data-run]").forEach((sp) => {
      try {
        if (range.intersectsNode(sp)) out.add(sp.dataset.run!);
      } catch { /* detached */ }
    });
    return out;
  };

  const selectAll = () => {
    const sel = window.getSelection();
    if (!sel || !pagesRef.current) return;
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(pagesRef.current);
    sel.addRange(r);
    dispatch({ type: "skill", k: "selectAll" });
    revealFirst();
  };

  const applyToRuns = (fn: (r: Run) => Run) => {
    const keys = selectedRunKeys();
    const sel = window.getSelection();
    const collapsed = !sel || sel.isCollapsed || sel.rangeCount === 0;
    if (keys.size === 0) {
      if (!collapsed) {
        // real selection exists but it's outside this document, do nothing
        dispatch({ type: "toast", text: "Select some text in the document first." });
        return;
      }
      // no selection at all: apply to all runs (kid-friendly, like selecting all first)
      keys.add("*");
    }
    const next = blocks.map((b, bi) => {
      if (b.type !== "para") return b;
      return {
        ...b,
        runs: b.runs.map((r, ri) =>
          keys.has("*") || keys.has(`${bi}:${ri}`) ? fn(r) : r,
        ),
      };
    });
    setBlocks(next);
    dispatch({ type: "doc-edit", docId, blocks: next });
  };

  // keyboard: Ctrl+A/F/H scoped to this focused Word window
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      // let inputs/textareas keep their own Ctrl+A/F/H behaviour
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "a") { e.preventDefault(); selectAll(); }
      else if (k === "f") { e.preventDefault(); setFindOpen(true); setReplaceOpen(false); }
      else if (k === "h") { e.preventDefault(); setReplaceOpen(true); setFindOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, blocks]);

  // ---------------- replace all ----------------
  const doReplaceAll = () => {
    if (!findQ) return;
    let total = 0;
    const next = blocks.map((b) => {
      if (b.type !== "para") return b;
      return {
        ...b,
        runs: b.runs.map((r) => {
          const { text, count } = replaceAllCount(r.text, findQ);
          total += count;
          return count ? { ...r, text } : r;
        }),
      };
    });
    setBlocks(next);
    dispatch({ type: "doc-edit", docId, blocks: next });
    dispatch({ type: "skill", k: "findReplace" });
    dispatch({ type: "toast", text: `All done. We made ${total} replacement${total === 1 ? "" : "s"}.` });
  };

  // ---------------- page split ----------------
  const pages = useMemo(() => {
    const out: { b: DocBlock; idx: number }[][] = [[]];
    blocks.forEach((b, idx) => {
      if (b.type === "para" && b.pageBreakBefore) out.push([{ b, idx }]);
      else out[out.length - 1].push({ b, idx });
    });
    return out;
  }, [blocks]);

  const scamRevealed = !!state.revealFlags["scam"];

  // render helpers -------------------------------------------------
  const renderBlock = (b: DocBlock, myBi: number, pageIdx: number) => {
    if (b.type === "fields") {
      return (
        <div className="field-row" key={myBi}>
          {b.fields.map((f) => (
            <span className="fld" key={f.id}>
              <label>{f.label}:</label>
              <input
                placeholder={f.placeholder}
                aria-label={f.label}
                onChange={() => {
                  if (!state.revealFlags["scam"]) {
                    dispatch({ type: "reveal", key: "scam" });
                    setTimeout(() => {
                      scrollRef.current
                        ?.querySelector('[data-page="1"]')
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 900);
                  }
                }}
              />
            </span>
          ))}
        </div>
      );
    }
    const p = b as ParaBlock;
    const scam = pageIdx === 1 && docId === "prize";
    return (
      <p
        key={myBi}
        className={p.align === "center" ? "center" : ""}
        style={scam && !scamRevealed ? { opacity: 0.25 } : undefined}
      >
        {p.runs.map((r, ri) => (
          <RunSpan key={ri} run={r} runKey={`${myBi}:${ri}`} findQ={findOpen || replaceOpen ? findQ : ""} mobile={mobile} />
        ))}
      </p>
    );
  };

  return (
    <div className="word" data-word>
      <div className="word-toolbar">
        <button className="wbtn" title="Decrease font size" onClick={() => { bumpSize(-2); }}>
          <Minus size={13} />
        </button>
        <input
          className="size-field"
          value={sizeDraft ?? String(selSize ?? firstSize)}
          aria-label="Font size"
          onChange={(e) => setSizeDraft(e.target.value)}
          onBlur={() => setSizeDraft(null)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = parseInt((e.target as HTMLInputElement).value, 10);
              if (v >= 1 && v <= 200) setSize(v);
              setSizeDraft(null);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button className="wbtn" title="Increase font size" onClick={() => { bumpSize(2); }}>
          <Plus size={13} />
        </button>
        <span className="wsep" />
        {SWATCHES.map((s) => (
          <button
            key={s.name}
            className="swatch"
            title={s.name}
            style={{ background: s.color || "var(--ink)" }}
            onClick={() => {
              applyToRuns((r) => ({ ...r, color: s.color || undefined }));
              dispatch({ type: "skill", k: "fontColor" });
              revealFirst();
            }}
          />
        ))}
        <span className="wsep" />
        <button className="wbtn" title="Bold" onClick={() => applyToRuns((r) => ({ ...r, bold: !r.bold }))}>
          <TextB size={15} weight="bold" />
        </button>
        <span className="wsep" />
        <button className="wbtn" onClick={selectAll}>
          <SelectionAll size={15} /> Select all
        </button>
        <button className={"wbtn" + (findOpen ? " on" : "")} onClick={() => { setFindOpen(!findOpen); setReplaceOpen(false); }}>
          <MagnifyingGlass size={14} /> Find
        </button>
        <button className={"wbtn" + (replaceOpen ? " on" : "")} onClick={() => { setReplaceOpen(!replaceOpen); setFindOpen(false); }}>
          <ArrowCounterClockwise size={14} /> Replace
        </button>
        {mobile && (
          <>
            <span className="wsep" />
            <button className="wbtn" title="Zoom out" onClick={() => { setZoom((z) => Math.max(10, z - 25)); dispatch({ type: "skill", k: "zoom" }); }}>
              Zoom -
            </button>
            <button className="wbtn" title="Zoom in" onClick={() => { setZoom((z) => Math.min(500, z + 25)); dispatch({ type: "skill", k: "zoom" }); }}>
              Zoom +
            </button>
          </>
        )}
      </div>

      {(findOpen || replaceOpen) && (
        <div className="fr-dialog" role="dialog" aria-label={replaceOpen ? "Replace" : "Find"}>
          <input
            autoFocus
            placeholder="Find what"
            value={findQ}
            onChange={(e) => setFindQ(e.target.value)}
            aria-label="Find what"
          />
          {replaceOpen && (
            <input
              placeholder="Replace with"
              value={repQ}
              onChange={(e) => setRepQ(e.target.value)}
              aria-label="Replace with"
            />
          )}
          <div className="row">
            {replaceOpen ? (
              <button className="btn primary" onClick={doReplaceAll}>Replace All</button>
            ) : (
              <button className="btn" onClick={() => setFindQ("")}>Clear</button>
            )}
            <button className="btn" onClick={() => { setFindOpen(false); setReplaceOpen(false); setFindQ(""); }}>Close</button>
          </div>
        </div>
      )}

      <div className="word-scroll" ref={scrollRef}>
        {locked ? (
          <PasswordGate win={win} nodeName={node?.name ?? ""} />
        ) : (
          <div ref={pagesRef}>
            {(fontsReady ? pages : [[]]).map((pg, i) => (
              <div className="page" key={i} data-page={i} style={{ zoom: zoom / 100 }}>
                {pg.map(({ b, idx }) => renderBlock(b, idx, i))}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="word-status">
        <span>Page {pages.length > 1 ? `1 of ${pages.length}` : "1 of 1"}</span>
        <div className="zoom-slider">
          <input
            type="range" min={10} max={500} value={zoom} aria-label="Zoom"
            onChange={(e) => { setZoom(+e.target.value); dispatch({ type: "skill", k: "zoom" }); }}
          />
          <span>{zoom}%</span>
        </div>
      </div>
    </div>
  );

  function bumpSize(d: number) { applyToRuns((r) => ({ ...r, size: Math.max(1, Math.min(200, r.size + d)) })); dispatch({ type: "skill", k: "fontSize" }); }
  function setSize(v: number) { applyToRuns((r) => ({ ...r, size: v })); dispatch({ type: "skill", k: "fontSize" }); }
}

function RunSpan({ run, runKey, findQ, mobile }: { run: Run; runKey: string; findQ: string; mobile: boolean }) {
  // mobile uses a native-feeling two-band scale: body 16px, display 20px.
  // genuinely tiny runs (the hidden-font clue) must stay tiny.
  const size =
    mobile && run.size > 8 ? (run.size > 20 ? "20px" : "16px") : `${run.size}pt`;
  const style: React.CSSProperties = {
    fontSize: size,
    color: run.color,
    fontFamily: run.font ? FONT_VAR[run.font] : undefined,
    fontWeight: run.bold ? 700 : undefined,
    fontStyle: run.italic ? "italic" : undefined,
  };
  let text = run.text;
  if (findQ) {
    const idx = text.toLowerCase().indexOf(findQ.toLowerCase());
    const parts: React.ReactNode[] = [];
    let pos = 0, n = 0;
    const low = text.toLowerCase(), q = findQ.toLowerCase();
    while (true) {
      const i = low.indexOf(q, pos);
      if (i === -1) { parts.push(text.slice(pos)); break; }
      parts.push(text.slice(pos, i));
      parts.push(<mark key={n++} className="hit">{text.slice(i, i + findQ.length)}</mark>);
      pos = i + findQ.length;
    }
    if (idx === -1) return <span data-run={runKey} style={style}>{text}</span>;
    return <span data-run={runKey} style={style}>{parts}</span>;
  }
  return <span data-run={runKey} style={style}>{text}</span>;
}

// ---------------------------------------------------------------- password gate

function PasswordGate({ win, nodeName }: { win: Win; nodeName: string }) {
  const state = useMeta();
  const { dispatch } = useActions();
  const node = findNode(win.nodeId ?? "", state.fsRoots);
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const submit = () => {
    if (node && checkPassword(val, node.password!)) {
      dispatch({ type: "unlock", nodeId: node.id });
    } else {
      dispatch({ type: "wrong-password" });
      setErr(true);
      setShakeKey((k) => k + 1);
    }
  };

  return (
    <div className="pw-overlay">
      <div className="pw-dialog" key={shakeKey} style={shakeKey && err ? { animation: "shake 320ms var(--ease)" } : undefined}>
        <h3>'{nodeName}' is password protected.</h3>
        <div className="sub">Enter password to open</div>
        <input
          autoFocus
          type="text"
          value={val}
          aria-label="Password"
          inputMode={node?.password && /^\d+$/.test(node.password) ? "numeric" : undefined}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          data-lpignore="true"
          onChange={(e) => { setVal(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div className="pw-err">{err ? "The password is incorrect." : ""}</div>
        <div className="pw-actions">
          <button className="btn" onClick={() => dispatch({ type: "close", id: win.id })}>Cancel</button>
          <button className="btn primary" onClick={submit}>OK</button>
        </div>
      </div>
    </div>
  );
}

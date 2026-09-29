import { useEffect, useRef, useState } from "react";
import { useMeta, useActions } from "../game/state";

// seven-segment display: 0.7734 upside down reads hELLO
import { SEGMENTS, SEG_PATHS } from "../game/sevenseg";

function SegDigit({ ch }: { ch: string }) {
  if (ch === ".") return <circle cx="9" cy="34" r="2.2" fill="#E5B45C" />;
  const s = SEGMENTS[ch] ?? SEGMENTS[" "];
  return (
    <g>
      {/* ghost segments first so lit strokes always draw on top */}
      {SEG_PATHS.map((d, i) =>
        s[i] ? null : (
          <path key={i} d={d} stroke="rgba(229,181,92,0.07)"
            strokeWidth="2.6" strokeLinecap="round" fill="none" />
        ),
      )}
      {SEG_PATHS.map((d, i) =>
        s[i] ? (
          <path key={i} d={d} stroke="#E5B45C"
            strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : null,
      )}
    </g>
  );
}
function Display({ text }: { text: string }) {
  const chars = text.slice(-14).split("");
  return (
    <svg viewBox={`0 0 ${chars.length * 24} 38`} height="44" style={{ display: "block" }}>
      {chars.map((c, i) => (
        <g key={i} transform={`translate(${i * 24 + 2},0)`}><SegDigit ch={c} /></g>
      ))}
    </svg>
  );
}

type Op = "+" | "-" | "x" | "/";

export default function Calculator({ win }: { win?: { id: number } }) {
  const { dispatch } = useActions();
  const state = useMeta();
  const [disp, setDisp] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);
  const used = useRef(false);

  const mark = () => {
    if (!used.current) { used.current = true; dispatch({ type: "skill", k: "calculator" }); }
  };

  const num = (d: string) => {
    mark();
    setDisp((p) => (fresh ? (d === "." ? "0." : d) : p === "0" && d !== "." ? d : p + d).slice(0, 14));
    setFresh(false);
  };
  const compute = (a: number, b: number, o: Op) =>
    o === "+" ? a + b : o === "-" ? a - b : o === "x" ? a * b : b === 0 ? NaN : a / b;
  const pressOp = (o: Op) => {
    mark();
    const cur = parseFloat(disp);
    if (acc !== null && op && !fresh) {
      const r = compute(acc, cur, op);
      setAcc(r); setDisp(fmt(r));
    } else setAcc(cur);
    setOp(o); setFresh(true);
  };
  const equals = () => {
    if (acc === null || !op) return;
    const r = compute(acc, parseFloat(disp), op);
    setDisp(fmt(r)); setAcc(null); setOp(null); setFresh(true);
  };
  const clear = () => { setDisp("0"); setAcc(null); setOp(null); setFresh(true); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (win && state.activeWin !== win.id) return;
      if (/^[0-9.]$/.test(e.key)) num(e.key);
      else if (["+", "-", "*", "/", "x"].includes(e.key)) pressOp(e.key === "*" ? "x" : (e.key as Op));
      else if (e.key === "Enter" || e.key === "=") equals();
      else if (e.key === "Escape" || e.key.toLowerCase() === "c") clear();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disp, acc, op, fresh, state.activeWin]);

  const keys: { label: string; fn: () => void; cls?: string }[] = [
    { label: "C", fn: clear }, { label: "/", fn: () => pressOp("/"), cls: "op" },
    { label: "x", fn: () => pressOp("x"), cls: "op" }, { label: "-", fn: () => pressOp("-"), cls: "op" },
    { label: "7", fn: () => num("7") }, { label: "8", fn: () => num("8") },
    { label: "9", fn: () => num("9") }, { label: "+", fn: () => pressOp("+"), cls: "op" },
    { label: "4", fn: () => num("4") }, { label: "5", fn: () => num("5") },
    { label: "6", fn: () => num("6") }, { label: "=", fn: equals, cls: "eq" },
    { label: "1", fn: () => num("1") }, { label: "2", fn: () => num("2") },
    { label: "3", fn: () => num("3") },
    { label: "0", fn: () => num("0"), cls: "zero" }, { label: ".", fn: () => num(".") },
  ];

  return (
    <div className="calc">
      <div className="calc-display"><Display text={disp} /></div>
      <div className="calc-grid">
        {keys.map((k) => (
          <button key={k.label} className={"calc-key" + (k.cls ? " " + k.cls : "")} onClick={k.fn}>
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (!isFinite(n)) return "E";
  const s = Math.abs(n) >= 1e12 ? n.toExponential(6) : String(Math.round(n * 1e9) / 1e9);
  return s.replace(/e\+?/i, "E").slice(0, 14);
}

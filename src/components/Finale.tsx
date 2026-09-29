import { useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { useMeta, useActions, elapsed } from "../game/state";
import { fmtTime, clearedTraps, score } from "../game/logic";
import { SKILLS } from "../game/content";
import { levelContent } from "../game/levels";
import { recordRun, loadRuns } from "../game/runs";
import { Check } from "@phosphor-icons/react";

type Stage = "wait" | "offer" | "fell" | "passed" | "blessing";

export default function Finale() {
  const state = useMeta();
  const { dispatch } = useActions();
  const lidRef = useRef<SVGGElement>(null);
  const [stage, setStage] = useState<Stage>(state.prizeResult ? "blessing" : "wait");

  // the typed values live ONLY here, never dispatched, persisted or logged
  const [uid, setUid] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [runs, setRuns] = useState(() => loadRuns());

  const lv = levelContent(state.level);
  const prank = lv.prank;

  useEffect(() => {
    const t1 = setTimeout(() => {
      if (lidRef.current) lidRef.current.style.transform = "rotate(-30deg)";
    }, 400);
    const t2 = setTimeout(() => {
      setStage((s) => (s === "wait" && !state.prizeResult ? "offer" : s));
    }, 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishRun = (result: "fell" | "passed") => {
    dispatch({ type: "prize", result });
    const kept = recordRun({
      id: state.startTs,
      level: state.level,
      team: state.team,
      timeMs: elapsed(state),
      hintsUsed: state.hintsUsed,
      wrongPasswords: state.wrongPasswords,
      trapsCleared: clearedTraps(state),
      prize: result,
      at: Date.now(),
    });
    setRuns(kept);
  };

  const submit = () => {
    setUid("");
    setPw("");
    if (!uid.trim() || !pw.trim()) {
      setErr(true);
      return;
    }
    setErr(false);
    setStage("fell");
    finishRun("fell");
  };
  const pass = () => {
    setStage("passed");
    finishRun("passed");
  };

  const usedSkills = Object.keys(SKILLS)
    .filter((k) => state.skills[k])
    .map((k) => (k === "scamRefuse" ? prank.skillLabel : SKILLS[k as keyof typeof SKILLS]));
  const traps = clearedTraps(state);
  const timeMs = elapsed(state);
  const total = score(timeMs, state.hintsUsed, state.wrongPasswords);
  const parts = [
    `${fmtTime(timeMs)} time`,
    state.hintsUsed ? `${state.hintsUsed} hint${state.hintsUsed === 1 ? "" : "s"} (${fmtTime(60000 * state.hintsUsed)})` : "",
    state.wrongPasswords ? `${state.wrongPasswords} wrong password${state.wrongPasswords === 1 ? "" : "s"} (${fmtTime(30000 * state.wrongPasswords)})` : "",
  ].filter(Boolean);
  const scoreExplain =
    state.hintsUsed === 0 && state.wrongPasswords === 0
      ? "your time, no extras"
      : parts.join(" + ");

  const challenges = [
    {
      name: "Trap Master",
      desc: "Reach the end of all 4 wrong paths, then open the box.",
      done: traps.length === 4,
      progress: `${traps.length}/4`,
    },
    {
      name: "Perfect Run",
      desc: "Open the box with 0 hints and 0 wrong passwords.",
      done: state.hintsUsed === 0 && state.wrongPasswords === 0,
      progress: "",
    },
    {
      name: "Never Fooled",
      desc: prank.challengeDesc,
      done: state.prizeResult === "passed",
      progress: "",
    },
  ];

  return (
    <div className="finale">
      <div className="finale-card">
        {stage !== "blessing" ? (
          <>
            <svg viewBox="0 -60 400 290" width="220" style={{ overflow: "visible", flex: "none" }}>
              <BoxSvg lidRef={lidRef} open={false} />
            </svg>
            <h1>{lv.finaleHeading}</h1>
          </>
        ) : null}

        {stage === "offer" && (
          <div className="prize-card" data-stage="offer" style={{ "--prank": prank.accent } as CSSProperties}>
            <div className="esewa-mark" style={{ color: prank.accent }}>{prank.wordmark}</div>
            <h2>Congratulations!</h2>
            <p>
              {prank.pitch1}<br />
              {prank.pitch2}
            </p>
            <label>{prank.idLabel}</label>
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              data-lpignore="true"
              aria-label={prank.idLabel}
            />
            <label>{prank.pwLabel}</label>
            <input
              type="text"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              data-lpignore="true"
              aria-label={`${prank.wordmark} password`}
              style={{ WebkitTextSecurity: "disc" } as CSSProperties}
            />
            {err && <div className="pw-err" style={{ marginTop: 6 }}>{prank.error}</div>}
            <button className="prize-btn" onClick={submit}>{prank.button}</button>
            <button className="not-now" onClick={pass}>Not now</button>
          </div>
        )}

        {stage === "fell" && (
          <div className="prize-card fell" data-stage="fell">
            <h2>{prank.fellHeading}</h2>
            {prank.fellLines.map((l, i) => <p key={i}>{l}</p>)}
            <p><b>{prank.fellBold}</b></p>
            <button className="prize-btn" onClick={() => setStage("blessing")}>{prank.fellButton}</button>
          </div>
        )}

        {stage === "passed" && (
          <div className="prize-card" data-stage="passed">
            <h2>{prank.passHeading}</h2>
            <p>{prank.passLine}</p>
            <button className="prize-btn" onClick={() => setStage("blessing")}>{prank.passButton}</button>
          </div>
        )}

        {stage === "blessing" && (
          <div className="finale-cols">
            <div className="finale-left">
              <svg viewBox="0 -60 400 290" width="200" style={{ overflow: "visible", flex: "none" }}>
                <BoxSvg lidRef={lidRef} open />
              </svg>
              <h1>{lv.finaleHeading}</h1>
              <p className="sub">Tell your teacher your score, right now!</p>
              <div className="blessing">
                <p>{lv.finaleLetter[0]}</p>
                <p>{lv.finaleLetter[1]}</p>
                <p style={{ fontStyle: "italic", color: "#6B3E1E" }}>{lv.signoff}</p>
              </div>
            </div>
            <div className="finale-right">
              <div className="score-block">
                <div className="score-v">{fmtTime(total)}</div>
                <div className="score-k">Score</div>
                <div className="score-x">{scoreExplain}</div>
              </div>
              <div className="stats-grid">
                <div className="stat"><div className="v">{fmtTime(timeMs)}</div><div className="k">Time</div></div>
                <div className="stat"><div className="v">{state.hintsUsed}</div><div className="k">Hints used</div></div>
                <div className="stat"><div className="v">{state.wrongPasswords}</div><div className="k">Wrong passwords</div></div>
                <div className="stat"><div className="v">{traps.length}/4</div><div className="k">Traps found</div></div>
                <div className="stat" data-stat="prize"><div className="v" style={{ fontSize: 14 }}>{state.prizeResult === "fell" ? "Fell for it" : "Passed"}</div><div className="k">Prize scam</div></div>
              </div>
              <div className="challenges">
                {challenges.map((c) => (
                  <div className={"challenge" + (c.done ? " done" : "")} data-challenge={c.name} key={c.name}>
                    <span className="mark">{c.done ? <Check size={12} weight="bold" /> : ""}</span>
                    <span className="cname">{c.name}</span>
                    <span className="cdesc">{c.desc}</span>
                    {!c.done && c.progress ? <span className="prog-pill">{c.progress}</span> : null}
                  </div>
                ))}
              </div>
              {runs.length > 0 && (
                <div className="runs-card">
                  <h4>Past runs on this computer</h4>
                  <table className="runs-table">
                    <thead>
                      <tr><th>Team</th><th>Level</th><th>Score</th><th>Challenges</th></tr>
                    </thead>
                    <tbody>
                      {runs.slice(-5).reverse().map((r) => {
                        const names = [
                          r.trapsCleared.length === 4 && "Trap Master",
                          r.hintsUsed === 0 && r.wrongPasswords === 0 && "Perfect Run",
                          r.prize === "passed" && "Never Fooled",
                        ].filter(Boolean) as string[];
                        return (
                          <tr key={r.id} className={r.id === state.startTs ? "current" : ""}>
                            <td className="t">
                              {r.team || "(no name)"}
                              {r.id === state.startTs && <span className="this-run"> (this run)</span>}
                            </td>
                            <td>{r.level ?? 1}</td>
                            <td className="mono">{fmtTime(score(r.timeMs, r.hintsUsed, r.wrongPasswords))}</td>
                            <td title={names.length ? names.join(", ") : "none yet"}>
                              {names.length} of 3
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="skills-wrap">
                <ul className="skills-list">
                  {usedSkills.map((label, i) => (
                    <li key={i}><Check size={12} weight="bold" />{label}</li>
                  ))}
                </ul>
              </div>
              <div className="finale-btns">
                <button className="btn-pill" onClick={() => dispatch({ type: "replay" })}>
                  Try a challenge
                  <span className="arrow">→</span>
                </button>
                {state.level === 1 && (
                  <button className="btn-pill" onClick={() => dispatch({ type: "start-level", level: 2 })}>
                    Play Level 2
                    <span className="arrow">→</span>
                  </button>
                )}
                <button
                  className="btn-ghost"
                  onClick={() => {
                    if (window.confirm("Start over with a new team?")) {
                      dispatch({ type: "new-game" });
                    }
                  }}
                >
                  New team
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BoxSvg({ lidRef, open }: { lidRef: RefObject<SVGGElement | null>; open: boolean }) {
  return (
    <g stroke="#5F3C1C" strokeWidth="3" strokeLinejoin="round">
      <path d="M60 110 h280 v110 a8 8 0 0 1 -8 8 H68 a8 8 0 0 1 -8 -8 z" fill="#B0763E" />
      <path d="M60 110 h280 v18 H60 z" fill="#8A5A2E" />
      <path d="M150 110 v118 M250 110 v118" stroke="#7C5026" strokeWidth="10" />
      <g
        ref={lidRef}
        style={{
          transformOrigin: "60px 110px",
          transition: "transform 1200ms cubic-bezier(0.2,0.8,0.2,1)",
          transformBox: "view-box",
          transform: open ? "rotate(-30deg)" : undefined,
        }}
      >
        <path d="M52 66 q0 -14 14 -14 h268 q14 0 14 14 v44 H52 z" fill="#C9884F" />
        <path d="M150 54 v56 M250 54 v56" stroke="#7C5026" strokeWidth="10" />
      </g>
      <ellipse cx="200" cy="112" rx="120" ry="18" fill="#F2D9A0" stroke="none" opacity="0.9" />
    </g>
  );
}

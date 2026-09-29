import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useMeta, useActions, elapsed } from "../game/state";
import { fmtTime } from "../game/logic";
import { SKILLS } from "../game/content";
import { Check } from "@phosphor-icons/react";

type Stage = "wait" | "offer" | "fell" | "passed" | "blessing";

export default function Finale() {
  const state = useMeta();
  const { dispatch } = useActions();
  const lidRef = useRef<SVGGElement>(null);
  const [stage, setStage] = useState<Stage>(state.prizeResult ? "blessing" : "wait");

  // the typed values live ONLY here — never dispatched, persisted or logged
  const [esewaId, setEsewaId] = useState("");
  const [esewaPw, setEsewaPw] = useState("");
  const [err, setErr] = useState(false);

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

  const submit = () => {
    setEsewaId("");
    setEsewaPw("");
    if (!esewaId.trim() || !esewaPw.trim()) {
      setErr(true);
      return;
    }
    setErr(false);
    setStage("fell");
    dispatch({ type: "prize", result: "fell" });
  };
  const pass = () => {
    setStage("passed");
    dispatch({ type: "prize", result: "passed" });
  };

  const usedSkills = Object.keys(SKILLS).filter((k) => state.skills[k]);
  const prizeStat = state.prizeResult === "fell" ? "Fell for it" : state.prizeResult === "passed" ? "Passed" : "—";

  return (
    <div className="finale">
      <div className="finale-card">
        <svg viewBox="0 40 400 200" width="220" style={{ overflow: "visible", flex: "none", marginTop: 34 }}>
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
              }}
            >
              <path d="M52 66 q0 -14 14 -14 h268 q14 0 14 14 v44 H52 z" fill="#C9884F" />
              <path d="M150 54 v56 M250 54 v56" stroke="#7C5026" strokeWidth="10" />
            </g>
            <ellipse cx="200" cy="112" rx="120" ry="18" fill="#F2D9A0" stroke="none" opacity="0.9" />
          </g>
        </svg>
        <h1>You found Hajurama's box!</h1>

        {stage === "offer" && (
          <div className="prize-card" data-stage="offer">
            <div className="esewa-mark">eSewa</div>
            <h2>Congratulations!</h2>
            <p>
              Hajurama has left you Rs 1,00,000 inside the box.<br />
              Log in to eSewa to receive the money in your wallet.
            </p>
            <label>eSewa ID (mobile number or email)</label>
            <input
              type="text"
              value={esewaId}
              onChange={(e) => setEsewaId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              data-lpignore="true"
              aria-label="eSewa ID"
            />
            <label>Password</label>
            <input
              type="text"
              value={esewaPw}
              onChange={(e) => setEsewaPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              data-lpignore="true"
              aria-label="eSewa password"
              style={{ WebkitTextSecurity: "disc" } as CSSProperties}
            />
            {err && <div className="pw-err" style={{ marginTop: 6 }}>Enter your eSewa ID and password</div>}
            <button className="prize-btn" onClick={submit}>Receive Rs 1,00,000</button>
            <button className="not-now" onClick={pass}>Not now</button>
          </div>
        )}

        {stage === "fell" && (
          <div className="prize-card fell" data-stage="fell">
            <h2>Hajurama is very disappointed.</h2>
            <p>
              After everything you learned at the Tea Shop? You just gave your eSewa ID and
              password to a stranger for money that was never there. A real scammer would
              empty your wallet in two minutes.
            </p>
            <p>Relax, this was only a test. The game threw away everything you typed.</p>
            <p><b>Nobody gives free money for your ID, password, PIN or OTP. Keep them secret, always.</b></p>
            <button className="prize-btn" onClick={() => setStage("blessing")}>Sorry, Hajurama</button>
          </div>
        )}

        {stage === "passed" && (
          <div className="prize-card" data-stage="passed">
            <h2>Shabash! You passed the real test.</h2>
            <p>
              There was never any Rs 1 lakh. Anyone who asks for your eSewa ID and
              password is a scammer, even if they say they are Hajurama.
            </p>
            <button className="prize-btn" onClick={() => setStage("blessing")}>Open my real gift</button>
          </div>
        )}

        {stage === "blessing" && (
          <>
            <p className="sub">Tell your teacher your time, right now!</p>
            <div className="blessing">
              <p>My clever grandchild,</p>
              <p>
                Here is my Dashain blessing for you: tika, jamara, and a long, happy life.
                May you always be curious, and may you never stop learning.
              </p>
              <p style={{ fontStyle: "italic", color: "#6B3E1E" }}>With love, Hajurama</p>
            </div>
            <div className="stats-grid">
              <div className="stat"><div className="v">{fmtTime(elapsed(state))}</div><div className="k">Time</div></div>
              <div className="stat"><div className="v">{state.wrongPasswords}</div><div className="k">Wrong passwords</div></div>
              <div className="stat"><div className="v">{3 - state.tokens}</div><div className="k">Hints used</div></div>
              <div className="stat"><div className="v">{state.trapsVisited.length}</div><div className="k">Traps visited</div></div>
              <div className="stat" data-stat="prize"><div className="v" style={{ fontSize: 16 }}>{prizeStat}</div><div className="k">Prize scam</div></div>
            </div>
            <div className="skills-wrap">
              <ul className="skills-list">
                {usedSkills.map((k) => (
                  <li key={k}><Check size={12} weight="bold" />{SKILLS[k as keyof typeof SKILLS]}</li>
                ))}
              </ul>
            </div>
            <button
              className="btn-pill"
              style={{ marginTop: 4 }}
              onClick={() => {
                if (window.confirm("Start a new game? Everything will be reset.")) {
                  dispatch({ type: "play-again" });
                }
              }}
            >
              Play again
              <span className="arrow">→</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

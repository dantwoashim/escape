import { useEffect, useRef } from "react";
import { useMeta, useActions, elapsed } from "../game/state";
import { fmtTime } from "../game/logic";
import { SKILLS } from "../game/content";
import { Check } from "@phosphor-icons/react";

export default function Finale() {
  const state = useMeta();
  const { dispatch } = useActions();
  const lidRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (lidRef.current) lidRef.current.style.transform = "rotate(-30deg)";
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const usedSkills = Object.keys(SKILLS).filter((k) => state.skills[k]);

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
      </div>
    </div>
  );
}

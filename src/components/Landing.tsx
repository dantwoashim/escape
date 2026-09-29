import { useState } from "react";
import { useMeta, useActions } from "../game/state";
import { ArrowRight } from "@phosphor-icons/react";

function BoxArt() {
  return (
    <svg viewBox="0 0 520 460" aria-hidden>
      {/* wooden treasure box, ajar, warm light */}
      <defs>
        <radialGradient id="boxglow" cx="0.5" cy="0.8" r="0.9">
          <stop offset="0" stopColor="#F2D9A0" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#EBC57F" stopOpacity="0.45" />
          <stop offset="1" stopColor="#EBC57F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="260" cy="420" rx="200" ry="22" fill="#C9B18C" opacity="0.5" />
      <g stroke="#5F3C1C" strokeWidth="3" strokeLinejoin="round">
        <path d="M80 210 h360 v180 a10 10 0 0 1 -10 10 H90 a10 10 0 0 1 -10 -10 z" fill="#B0763E" />
        <path d="M80 210 h360 v26 H80 z" fill="#8A5A2E" />
        <path d="M96 250 v140 M424 250 v140" opacity="0.4" />
        <path d="M80 300 h360 M80 340 h360" opacity="0.35" />
      </g>
      {/* warm light inside the opening, under the open lid */}
      <ellipse cx="260" cy="196" rx="170" ry="46" fill="url(#boxglow)" />
      <ellipse cx="260" cy="206" rx="150" ry="14" fill="#F2D9A0" opacity="0.9" />
      <g stroke="#E8B96A" strokeWidth="3" strokeLinecap="round" opacity="0.85">
        <path d="M200 118 l-10 -24 M260 112 v-28 M320 118 l10 -24" />
      </g>
      <g stroke="#5F3C1C" strokeWidth="3" strokeLinejoin="round">
        {/* lid, clearly open */}
        <g transform="rotate(-16 260 210)">
          <path d="M70 150 q0 -16 16 -16 h348 q16 0 16 16 v44 H70 z" fill="#C9884F" />
          <path d="M70 176 h380" opacity="0.5" />
          <path d="M96 140 v50 M424 140 v50" opacity="0.35" />
        </g>
        {/* brass bands + clasp */}
        <path d="M200 134 v266 M320 134 v266" stroke="#7C5026" strokeWidth="14" />
        <rect x="240" y="216" width="40" height="34" rx="5" fill="#E5B45C" stroke="#8A5A2E" />
        <circle cx="260" cy="232" r="5" fill="#5F3C1C" stroke="none" />
      </g>
      {/* hills behind */}
      <g opacity="0.35" stroke="#7FA368" strokeWidth="3" fill="none">
        <path d="M20 120 q60 -50 130 -10" />
        <path d="M370 90 q70 -45 140 -5" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const state = useMeta();
  const { dispatch } = useActions();
  const [team, setTeam] = useState(state.team || "");
  const hasSave = state.started && !state.finished;

  return (
    <>
      <div className="landing">
        <div className="landing-left">
          <div className="eyebrow">A treasure hunt on Hajurama's computer</div>
          <h1>Hajurama's Box</h1>
          <p className="desc">
            Hajurama hid her old box before Dashain and left the clues on her computer.
            Open her folders, crack her codes and find it.
          </p>
          <div className="field">
            <label htmlFor="team">Team name</label>
            <input
              id="team"
              value={team}
              placeholder="e.g. Team Peepal"
              onChange={(e) => setTeam(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "start", team })}
            />
          </div>
          <div>
            <button className="btn-pill" onClick={() => dispatch({ type: "start", team })}>
              Start the hunt
              <span className="arrow"><ArrowRight size={15} weight="bold" /></span>
            </button>
            {hasSave && (
              <button className="btn-ghost" onClick={() => dispatch({ type: "start", team })}>
                Resume game
              </button>
            )}
          </div>
          <div className="meta-line">About 10 minutes · 2 or 3 players · play it on a computer</div>
        </div>
        <div className="landing-art"><BoxArt /></div>
      </div>
      <div className="too-small">
        <div>
          <h2>Hajurama's Box needs a computer</h2>
          <p style={{ color: "var(--ink-2)" }}>
            Open this on a laptop or desktop. The whole game happens on a computer screen.
          </p>
        </div>
      </div>
    </>
  );
}

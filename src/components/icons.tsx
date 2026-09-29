// SVG icons, consistent 1.6 stroke, warm palette.
import type { ReactNode } from "react";


const S = { fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ink = "#221E1A";
const paper = "#FBF8F3";
const wood = "#A8502E";
const woodD = "#7C3A20";
const leaf = "#4F6B52";

export const IconFolder = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <path d="M5 11 a2 2 0 0 1 2 -2 h10 l3 3 h17 a2 2 0 0 1 2 2 v20 a2 2 0 0 1 -2 2 H7 a2 2 0 0 1 -2 -2 z"
      fill="#E5C78F" stroke={woodD} />
    <path d="M5 16 h34 v18 a2 2 0 0 1 -2 2 H7 a2 2 0 0 1 -2 -2 z" fill="#EFD6A2" stroke={woodD} />
  </svg>
);

export const IconDoc = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <path d="M11 4 h15 l7 7 v29 a2 2 0 0 1 -2 2 H11 a2 2 0 0 1 -2 -2 V6 a2 2 0 0 1 2 -2 z"
      fill={paper} stroke={ink} />
    <path d="M26 4 v7 h7" fill="none" stroke={ink} />
    <line x1="14" y1="18" x2="30" y2="18" stroke={ink} opacity="0.5" />
    <line x1="14" y1="24" x2="30" y2="24" stroke={ink} opacity="0.5" />
    <line x1="14" y1="30" x2="24" y2="30" stroke={ink} opacity="0.5" />
  </svg>
);

export const IconDocLocked = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <path d="M11 4 h15 l7 7 v29 a2 2 0 0 1 -2 2 H11 a2 2 0 0 1 -2 -2 V6 a2 2 0 0 1 2 -2 z"
      fill={paper} stroke={ink} />
    <path d="M26 4 v7 h7" fill="none" stroke={ink} />
    <line x1="14" y1="18" x2="30" y2="18" stroke={ink} opacity="0.4" />
    <line x1="14" y1="24" x2="28" y2="24" stroke={ink} opacity="0.4" />
    <g>
      <rect x="24" y="28" width="13" height="10" rx="2" fill={wood} stroke={woodD} />
      <path d="M27 28 v-3.5 a3.5 3.5 0 0 1 7 0 V28" fill="none" stroke={woodD} strokeWidth="2" />
      <circle cx="30.5" cy="33" r="1.4" fill={paper} stroke="none" />
    </g>
  </svg>
);

export const IconImage = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <rect x="6" y="8" width="32" height="28" rx="3" fill="#F7E9D4" stroke={ink} />
    <circle cx="15" cy="17" r="3" fill="#E5B45C" stroke={woodD} />
    <path d="M6 30 l9 -9 l7 7 l6 -6 l10 10" fill="none" stroke={leaf} strokeWidth="2" />
    <path d="M6 30 l9 -9 l7 7 l6 -6 l10 10 v4 a0 0 0 0 1 0 0 H6 z" fill={leaf} opacity="0.25" stroke="none" />
  </svg>
);

export const IconDesign = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <rect x="5" y="10" width="34" height="24" rx="3" fill="#F1E4CF" stroke={ink} />
    <rect x="9" y="14" width="14" height="8" rx="1" fill={paper} stroke={ink} />
    <path d="M26 27 c0 -6 8 -6 8 -12" stroke={woodD} strokeWidth="1.8" fill="none" />
    <path d="M28 14 h9 l-1.5 13 h-6 z" fill="#C98A54" stroke={woodD} />
    <path d="M28.5 17 h8 M28.2 20 h8.4 M28 23 h8.6" stroke={woodD} strokeWidth="0.8" />
  </svg>
);

export const IconCalc = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <rect x="10" y="4" width="24" height="36" rx="3" fill={paper} stroke={ink} />
    <rect x="14" y="8" width="16" height="8" rx="1.5" fill="#2B2620" stroke="none" />
    <text x="27" y="14.5" fontFamily="monospace" fontSize="7" fill="#E5B45C" textAnchor="end">07734</text>
    {[20, 26, 32].map((y) =>
      [14, 20, 26].map((x) => (
        <rect key={`${x}${y}`} x={x} y={y} width="4.5" height="4.5" rx="1" fill="none" stroke={ink} opacity="0.6" />
      )),
    )}
  </svg>
);

export const IconBin = ({ size = 44, full = false }: { size?: number; full?: boolean }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <path d="M10 14 h24 l-2.5 24 a3 3 0 0 1 -3 2.8 h-9 a3 3 0 0 1 -3 -2.8 z" fill={paper} stroke={ink} />
    <path d="M8 14 h28 M17 14 v-3 a2 2 0 0 1 2 -2 h6 a2 2 0 0 1 2 2 v3" fill="none" stroke={ink} />
    <line x1="17" y1="20" x2="18" y2="34" stroke={ink} opacity="0.4" />
    <line x1="22" y1="20" x2="22" y2="34" stroke={ink} opacity="0.4" />
    <line x1="27" y1="20" x2="26" y2="34" stroke={ink} opacity="0.4" />
    {full && (
      <g stroke={ink}>
        <path d="M15 12 c1 -4 5 -4 6 -8" fill="none" opacity="0.7" />
        <path d="M24 12 c0 -5 4 -5 5 -9" fill="none" opacity="0.7" />
        <rect x="19" y="4" width="7" height="9" rx="1" fill="#EFE7D8" transform="rotate(-8 22 8)" />
      </g>
    )}
  </svg>
);

export const IconBox = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} {...S}>
    <rect x="7" y="16" width="30" height="20" rx="2" fill="#C98A54" stroke={woodD} />
    <rect x="7" y="12" width="30" height="6" rx="2" fill="#DDA26B" stroke={woodD} />
    <rect x="20" y="12" width="4" height="24" fill={wood} stroke={woodD} />
    <circle cx="22" cy="24" r="2" fill={paper} stroke={woodD} />
  </svg>
);

export function nodeIcon(kind: string, locked?: boolean, size = 44): ReactNode {
  switch (kind) {
    case "folder": return <IconFolder size={size} />;
    case "doc": return locked ? <IconDocLocked size={size} /> : <IconDoc size={size} />;
    case "image": return <IconImage size={size} />;
    case "design": return <IconDesign size={size} />;
    case "app": return <IconCalc size={size} />;
    default: return <IconDoc size={size} />;
  }
}

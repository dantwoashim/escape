// Shepherd B illustration — hills, shepherd with crook, painted text.
export default function ImageViewer() {
  return (
    <div className="imageview">
      <div className="frame">
        <svg viewBox="0 0 900 600" width="680" role="img" aria-label="Shepherd B">
          <defs>
            <linearGradient id="sb-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#BFDCE8" />
              <stop offset="1" stopColor="#EAF0DC" />
            </linearGradient>
          </defs>
          <rect width="900" height="600" fill="url(#sb-sky)" />
          <circle cx="750" cy="90" r="46" fill="#F0C55E" />
          <path d="M0 420 L250 250 L500 420 Z" fill="#7FA368" />
          <path d="M350 420 L650 220 L900 420 Z" fill="#6B8F57" />
          <rect y="420" width="900" height="180" fill="#8FAF6E" />
          <g stroke="#7A9A5E" strokeWidth="3" fill="none" opacity="0.6">
            <path d="M60 470 Q300 445 560 468" />
            <path d="M140 520 Q450 490 760 516" />
          </g>
          {/* shepherd */}
          <g>
            <ellipse cx="440" cy="285" rx="32" ry="34" fill="#E6B48C" stroke="#3C2814" strokeWidth="3" />
            <path d="M408 275 q32 -34 64 0 l-4 -20 q-28 -16 -56 0 z" fill="#5A3B22" />
            <circle cx="429" cy="283" r="3.4" fill="#2A1C0E" />
            <circle cx="451" cy="283" r="3.4" fill="#2A1C0E" />
            <path d="M430 300 q10 8 20 0" stroke="#2A1C0E" strokeWidth="2.5" fill="none" />
            <path d="M405 325 L475 325 L498 478 L382 478 Z" fill="#A84A32" stroke="#6E2C1C" strokeWidth="3" />
            <path d="M405 325 L440 355 L475 325" fill="#C96A4A" stroke="#6E2C1C" strokeWidth="3" />
            {/* crook */}
            <path d="M522 262 L522 486" stroke="#5A3C1E" strokeWidth="9" strokeLinecap="round" />
            <path d="M522 262 a22 22 0 1 1 44 0" fill="none" stroke="#5A3C1E" strokeWidth="9" strokeLinecap="round" />
            {/* legs */}
            <rect x="415" y="478" width="18" height="46" fill="#3E2E1E" />
            <rect x="448" y="478" width="18" height="46" fill="#3E2E1E" />
          </g>
          {/* a goat */}
          <g transform="translate(200,430)" fill="#EFE7D8" stroke="#5A4A36" strokeWidth="2.5">
            <ellipse cx="0" cy="0" rx="42" ry="26" />
            <circle cx="42" cy="-18" r="15" />
            <path d="M48 -30 l6 -12 M38 -32 l-4 -12" fill="none" />
            <rect x="-30" y="20" width="8" height="26" />
            <rect x="20" y="20" width="8" height="26" />
          </g>
          <text x="450" y="52" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="38" fill="#28140A">
            I am Shepherd B.
          </text>
          <text x="450" y="98" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="34" fill="#28140A">
            I ALWAYS tell the truth!
          </text>
          <rect x="220" y="540" width="460" height="42" rx="21" fill="#28140A" opacity="0.75" />
          <text x="450" y="568" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fill="#FBF8F3">
            My secret is not in the picture. Right-click me.
          </text>
        </svg>
      </div>
    </div>
  );
}

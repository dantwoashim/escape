// Layered Himalayan ridges + terraced hills, warm dawn palette.
export default function Wallpaper() {
  return (
    <svg className="wallpaper" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3E4CE" />
          <stop offset="0.55" stopColor="#F3EDE3" />
          <stop offset="1" stopColor="#EFE5D2" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#sky)" />
      <circle cx="1090" cy="200" r="62" fill="#E8B96A" opacity="0.85" />
      <circle cx="1090" cy="200" r="96" fill="#E8B96A" opacity="0.18" />
      {/* far snow ridge */}
      <path d="M0 380 L140 300 L260 355 L380 265 L520 350 L660 285 L800 360 L960 275 L1120 355 L1280 300 L1440 370 V900 H0 Z"
        fill="#E9DDC9" />
      <path d="M380 265 L440 305 L380 320 L330 300 Z M960 275 L1015 310 L960 322 L915 305 Z"
        fill="#FBF8F3" opacity="0.9" />
      {/* mid ridge */}
      <path d="M0 470 L180 380 L340 450 L520 370 L720 460 L900 390 L1100 465 L1300 395 L1440 460 V900 H0 Z"
        fill="#D9C4A2" />
      {/* terraced hills */}
      <path d="M0 560 Q260 480 520 545 T1040 540 T1440 560 V900 H0 Z" fill="#C2A87E" />
      <path d="M0 640 Q300 570 620 630 T1440 640 V900 H0 Z" fill="#A98F63" />
      <g stroke="#8F7550" strokeWidth="2" fill="none" opacity="0.5">
        <path d="M60 620 Q300 575 560 615" />
        <path d="M160 665 Q430 615 700 660" />
        <path d="M640 610 Q900 575 1180 615" />
        <path d="M780 680 Q1080 630 1340 672" />
      </g>
      <path d="M0 730 Q360 660 760 725 T1440 720 V900 H0 Z" fill="#8E744C" />
      <g stroke="#6E5A3C" strokeWidth="2" fill="none" opacity="0.45">
        <path d="M40 760 Q380 700 720 755" />
        <path d="M420 790 Q800 735 1180 790" />
        <path d="M900 745 Q1180 705 1400 748" />
      </g>
      {/* small tree silhouette on a terrace */}
      <g transform="translate(1160,610)" fill="#6E5A3C">
        <rect x="-2.5" y="18" width="5" height="16" />
        <circle cx="0" cy="8" r="17" opacity="0.9" />
        <circle cx="-13" cy="15" r="11" opacity="0.9" />
        <circle cx="13" cy="14" r="12" opacity="0.9" />
      </g>
    </svg>
  );
}

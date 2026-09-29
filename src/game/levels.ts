// Per-level content bundle. The engine only knows one shape; Level 1 and
// Level 2 share tree ids, milestone keys and mechanics.
import {
  desktopNodes, docs, HINTS, TRAP_HINT, DESIGN_CLUE_LINES, TRAP_ROOTS,
  caesar, FIRST_CLUE, FINAL_WORD, TEMPLE_END, FSNode, Doc, Milestone,
} from "./content";
import {
  desktopNodes2, docs2, HINTS2, TRAP_HINT2, DESIGN_CLUE_LINES2,
  FIRST_CLUE2, FINAL_WORD2, GUMBA_END,
} from "./content2";

export interface PrankCopy {
  wordmark: string;
  accent: string;
  pitch1: string;
  pitch2: string;
  idLabel: string;
  pwLabel: string;
  button: string;
  error: string;
  fellHeading: string;
  fellLines: string[];
  fellBold: string;
  fellButton: string;
  passHeading: string;
  passLine: string;
  passButton: string;
  challengeDesc: string;
  skillLabel: string;
}

export interface LevelContent {
  id: 1 | 2;
  cardTitle: string;
  cardDesc: string;
  desktopNodes: FSNode[];
  docs: Record<string, Doc>;
  hints: Record<Milestone, [string, string]>;
  trapRoots: string[];
  trapHint: string;
  designClue: string[];
  designShape: "basket" | "topi";
  designTitle: string;
  imageLines: [string, string];
  finaleHeading: string;
  finaleLetter: string[];
  signoff: string;
  prank: PrankCopy;
  teacherAnswers: [string, string][];
  teacherTraps: [string, string][];
}

export const LEVEL1: LevelContent = {
  id: 1,
  cardTitle: "Level 1 · Hajurama's Box",
  cardDesc: "The first hunt.",
  desktopNodes,
  docs,
  hints: HINTS,
  trapRoots: TRAP_ROOTS,
  trapHint: TRAP_HINT,
  designClue: DESIGN_CLUE_LINES,
  designShape: "basket",
  designTitle: "Hajurama's Picture",
  imageLines: ["I am Shepherd B.", "I ALWAYS tell the truth!"],
  finaleHeading: "You found Hajurama's box!",
  finaleLetter: [
    "My clever grandchild,",
    "Here is my Dashain blessing for you: tika, jamara, and a long, happy life. May you always be curious, and may you never stop learning.",
  ],
  signoff: "With love, Hajurama",
  prank: {
    wordmark: "eSewa",
    accent: "#60BB46",
    pitch1: "Hajurama has left you Rs 1,00,000 inside the box.",
    pitch2: "Log in to eSewa to receive the money in your wallet.",
    idLabel: "eSewa ID (mobile number or email)",
    pwLabel: "Password",
    button: "Receive Rs 1,00,000",
    error: "Enter your eSewa ID and password",
    fellHeading: "Hajurama is very disappointed.",
    fellLines: [
      "After everything you learned at the Tea Shop? You just gave your eSewa ID and password to a stranger for money that was never there. A real scammer would empty your wallet in two minutes.",
      "Relax, this was only a test. The game threw away everything you typed.",
    ],
    fellBold: "Nobody gives free money for your ID, password, PIN or OTP. Keep them secret, always.",
    fellButton: "Sorry, Hajurama",
    passHeading: "Shabash! You passed the real test.",
    passLine: "There was never any Rs 1 lakh. Anyone who asks for your eSewa ID and password is a scammer, even if they say they are Hajurama.",
    passButton: "Open my real gift",
    challengeDesc: "Say no to the eSewa prize.",
    skillLabel: "Refused a fake eSewa login",
  },
  teacherAnswers: [
    ["START HERE", `Ctrl+A shows: ${caesar(FIRST_CLUE, 3)} → key 3 → ${FIRST_CLUE} → Chautari`],
    ["Chautari", "Details view, sort Date modified, newest is leaf 17"],
    ["leaf 17", "MOMO=10, CHIYA=4, ROTI=2 → ROTI + MOMO x CHIYA = 42"],
    ["FORK", "password 42. B lies (both-truth impossible), follow Shepherd A"],
    ["Design", "move/send-to-back the basket → pen = Rs 5; last page is in Recycle Bin"],
    ["Recycle Bin", "right-click last page → Restore"],
    ["last page", "Google: Everest 1953 → FINAL CODE"],
    ["FINAL CODE", `password 1953 → ${caesar(FINAL_WORD, 5)}, key = pen price 5 → ${FINAL_WORD}`],
    ["BOX", `password ${FINAL_WORD}, then finish`],
  ],
  teacherTraps: [
    ["Tea Shop", "PIN/OTP fields or page 2 reveal the scam lesson"],
    ["Water Tap", "clue is 1pt: zoom or font up; 0.7734 → HELLO opens note"],
    ["Temple", `Ctrl+H replace @ with nothing → Google flower → RHODODENDRON → key 3 → "${TEMPLE_END}"`],
    ["Shepherd B", "right-click → Properties → Details → 'how many months have 28 days?' → 12 opens liar"],
    ["Final prize", "fake eSewa login after BOX opens. Right move: Not now. Typing an ID and password counts as falling for it."],
  ],
};

export const LEVEL2: LevelContent = {
  id: 2,
  cardTitle: "Level 2 · Hajurba's Radio",
  cardDesc: "Same skills, new clues. Play it after Level 1.",
  desktopNodes: desktopNodes2,
  docs: docs2,
  hints: HINTS2,
  trapRoots: TRAP_ROOTS, // same trap folder ids as Level 1
  trapHint: TRAP_HINT2,
  designClue: DESIGN_CLUE_LINES2,
  designShape: "topi",
  designTitle: "Hajurba's Picture",
  imageLines: ["I am Shyam.", "I ALWAYS tell the truth!"],
  finaleHeading: "You found Hajurba's radio!",
  finaleLetter: [
    "My clever grandchild,",
    "Here is my Tihar blessing for you: may your life shine like a row of diyo, and may you keep learning every single day.",
  ],
  signoff: "With love, Hajurba",
  prank: {
    wordmark: "facebook",
    accent: "#1877F2",
    pitch1: "Hajurba sent you a photo from Tihar.",
    pitch2: "Log in to Facebook to see it.",
    idLabel: "Mobile number or email",
    pwLabel: "Password",
    button: "Log in",
    error: "Enter your mobile number or email and password",
    fellHeading: "Hajurba is very disappointed.",
    fellLines: [
      "A photo does not need your password. Fake login pages steal Facebook accounts every day, then message your friends asking for money.",
      "Relax, this was only a test. The game threw away everything you typed.",
    ],
    fellBold: "Only type your password on the real Facebook app or facebook.com.",
    fellButton: "Sorry, Hajurba",
    passHeading: "Shabash! You spotted the fake login.",
    passLine: "Real photos open without asking for your password.",
    passButton: "Open my real gift",
    challengeDesc: "Say no to the fake Facebook login.",
    skillLabel: "Refused a fake Facebook login",
  },
  teacherAnswers: [
    ["START HERE", `Ctrl+A shows: ${caesar(FIRST_CLUE2, 3)} → key 3 → ${FIRST_CLUE2} → Bus Park`],
    ["Bus Park", "Details view, sort Date modified, newest is ticket 23"],
    ["ticket 23", "SEL=5, LASSI=7, DAHI=3 → DAHI + SEL x LASSI = 38"],
    ["FORK", "password 38. Shyam lies (both-lie impossible), follow Ram"],
    ["Design", "move/send-to-back the topi → eraser = Rs 4; last page is in Recycle Bin"],
    ["Recycle Bin", "right-click last page → Restore"],
    ["last page", "Google: Nepal federal democratic republic 2008 → FINAL CODE"],
    ["FINAL CODE", `password 2008 → ${caesar(FINAL_WORD2, 4)}, key = eraser price 4 → ${FINAL_WORD2}`],
    ["RADIO", `password ${FINAL_WORD2}, then finish`],
  ],
  teacherTraps: [
    ["Mobile Shop", "SIM PIN/OTP fields or page 2 reveal the scam lesson"],
    ["Old Bridge", "clue is 1pt: zoom or font up; 5338 → BEES opens note"],
    ["Gumba", `Ctrl+H replace # with nothing → Google bird → DANPHE → key 3 → "${GUMBA_END}"`],
    ["Shyam", "right-click → Properties → Details → 'you have 3 apples, take 2' → 2 opens liar"],
    ["Final photo", "fake Facebook login after RADIO opens. Right move: Not now. Typing anything counts as falling for it."],
  ],
};

export const LEVELS: LevelContent[] = [LEVEL1, LEVEL2];
export const levelContent = (level: number): LevelContent => (level === 2 ? LEVEL2 : LEVEL1);

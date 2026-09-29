// All game content, ported faithfully from build/build.py.
// Everything editable lives here: filesystem tree, documents, passwords, hints.

export type FontFamily = "sans" | "serif" | "mono";

export interface Run {
  text: string;
  size: number; // pt
  color?: string; // hex; undefined = ink
  font?: FontFamily;
  bold?: boolean;
  italic?: boolean;
}

export type Align = "left" | "center";

export interface ParaBlock {
  type: "para";
  align?: Align;
  runs: Run[];
  pageBreakBefore?: boolean;
}

export interface FieldsBlock {
  type: "fields";
  fields: { id: string; label: string; placeholder: string }[];
}

export type DocBlock = ParaBlock | FieldsBlock;

export interface Doc {
  id: string;
  blocks: DocBlock[];
}

export type NodeKind = "folder" | "doc" | "image" | "design" | "app";

export interface FSNode {
  id: string;
  name: string;
  kind: NodeKind;
  app?: "explorer" | "word" | "recycle" | "calculator" | "designer" | "imageview";
  password?: string;
  docId?: string;
  modified: string; // ISO
  size?: number;
  location: string; // display path of parent
  details?: { title?: string; comments?: string };
  children?: FSNode[];
  deleted?: boolean; // in recycle bin
  originalLocation?: string; // for recycle bin restore
  homePath?: string[]; // ids of folders to restore into (under box root)
}

// ---------------------------------------------------------------- helpers

export const COLORS = {
  brown: "#6B3E1E",
  red: "#A33A2C",
  green: "#4F6B52",
  white: "#FFFFFF",
} as const;

export function caesar(text: string, shift: number): string {
  return [...text]
    .map((c) =>
      c >= "A" && c <= "Z"
        ? String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26 + 26) % 26 + 65)
        : c,
    )
    .join("");
}

// Deterministic PRNG (mulberry32) — replaces python's random.Random seeds.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randint = (r: () => number, lo: number, hi: number) =>
  lo + Math.floor(r() * (hi - lo + 1));

export function checkPassword(input: string, expected: string): boolean {
  return input.trim().toLowerCase() === expected.trim().toLowerCase();
}

const B = "Hajurama's Box";

// ---------------------------------------------------------------- doc builder

class DocBuilder {
  blocks: DocBlock[] = [];
  private para(text: string, r: Partial<Run> = {}, align?: Align) {
    this.blocks.push({
      type: "para",
      align,
      runs: [{ text, size: 16, ...r }],
    });
  }
  title(text: string, color: string = COLORS.brown) {
    this.para(text, { size: 28, bold: true, color, font: "serif" }, "center");
  }
  p(text: string, r: Partial<Run> = {}, align?: Align) {
    this.para(text, r, align);
  }
  code(text: string, color?: string, size = 26) {
    this.para(text, { size, bold: true, font: "mono", color }, "center");
  }
  alphabet(color?: string) {
    this.para("A B C D E F G H I J K L M N O P Q R S T U V W X Y Z", {
      size: 16,
      bold: true,
      font: "mono",
      color,
    }, "center");
  }
  blank(n = 1) {
    for (let i = 0; i < n; i++) this.para(" ", {});
  }
  pageBreak() {
    this.blocks.push({ type: "para", runs: [{ text: " ", size: 16 }], pageBreakBefore: true });
  }
  sign() {
    this.para("- Hajurama", { size: 18, italic: true, color: COLORS.brown, font: "serif" });
  }
  done(): DocBlock[] {
    return this.blocks;
  }
}

export const docs: Record<string, Doc> = {};
function defDoc(id: string, blocks: DocBlock[]) {
  docs[id] = { id, blocks };
}

// ---------------------------------------------------------------- the story

export const FIRST_CLUE = "GO WHERE PEOPLE REST UNDER THE BIG TREE";
export const TEMPLE_END = "THIS BOX IS EMPTY. GO BACK AND READ MY FIRST LETTER AGAIN.";
export const FINAL_WORD = "DASHAIN";
export const PEN_PRICE = 5;
export const MAGIC_LEAF = 17;
export const MAGIC_TIME = "2026-09-27T18:45:00";
const BASE = "2026-09-15T10:00:00";

// START HERE
{
  const d = new DocBuilder();
  d.title("Hajurama's Letter");
  d.p("My dear grandchild,", { size: 18, font: "serif" });
  d.p(
    "Before Dashain, I hid my old wooden box somewhere in our village. " +
      "Inside it is something special, only for you.",
    { font: "serif" },
  );
  d.p("My first clue is written on this page. But your eyes cannot see it.", {
    font: "serif",
    bold: true,
  });
  d.sign();
  d.blank(8);
  d.p("Secret code:", { size: 20, bold: true, color: COLORS.white }, "center");
  d.p(caesar(FIRST_CLUE, 3), { size: 24, bold: true, color: COLORS.white, font: "mono" }, "center");
  d.p("KEY = 3. Move every letter 3 steps BACK.", { size: 18, bold: true, color: COLORS.white }, "center");
  d.alphabet(COLORS.white);
  d.p("Then go to that place.", { size: 18, bold: true, color: COLORS.white }, "center");
  defDoc("start-here", d.done());
}

// BOX (locked)
{
  const d = new DocBuilder();
  d.title("YOU FOUND HAJURAMA'S BOX!", COLORS.red);
  d.p("Tell your teacher your time, right now!", { size: 22, bold: true, color: COLORS.green }, "center");
  d.blank();
  d.p("My clever grandchild,", { size: 18, font: "serif" });
  d.p(
    "Here is my Dashain blessing for you: tika, jamara, and a long, happy life. " +
      "May you always be curious, and may you never stop learning.",
    { font: "serif" },
  );
  d.sign();
  d.blank();
  d.p("Look at everything you did today:", { size: 18, bold: true, color: COLORS.brown });
  for (const line of [
    "Found hidden white text in Word (Ctrl + A)",
    "Cracked two secret codes (this is called encryption)",
    "Sorted files by date in File Explorer",
    "Opened password-locked files",
    "Solved maths with the BODMAS trap",
    "Beat a liar with logic",
    "Moved a hidden picture in the design app",
    "Brought a file back from the Recycle Bin",
    "Searched Google for an answer",
    "And maybe: Calculator tricks, Find & Replace, tiny fonts, file Properties, and a phone scam you did NOT fall for",
  ]) {
    d.p("*  " + line, { size: 15 });
  }
  defDoc("box", d.done());
}

// Chautari READ ME FIRST
{
  const d = new DocBuilder();
  d.title("Under the Chautari");
  d.p("So many leaves fell under the big tree.", { font: "serif" });
  d.p("Only one leaf has my clue: the leaf I touched last.", { font: "serif", bold: true });
  d.sign();
  defDoc("read-me-first", d.done());
}

export const LEAF_LINES = [
  "Just a dry leaf.", "A small ant lives on this leaf.", "Only a leaf. Keep looking.",
  "This leaf is yellow. Nothing else.", "A peepal leaf. Very pretty. No clue.",
  "Leaf. Leaf. Leaf. Nothing here.", "A goat already ate half of this leaf.",
  "The wind blew this leaf here. No clue.", "Not this one.", "This leaf is wet from the rain.",
];

// leaf docs
{
  const r = rng(7);
  for (let i = 1; i <= 30; i++) {
    const d = new DocBuilder();
    if (i === MAGIC_LEAF) {
      d.title("You found my leaf!", COLORS.green);
      for (const line of [
        "MOMO + MOMO + MOMO = 30",
        "MOMO + CHIYA + CHIYA = 18",
        "CHIYA - ROTI = 2",
        "ROTI + MOMO x CHIYA = ?",
      ]) {
        d.code(line, undefined, 24);
      }
      d.blank();
      d.p("The answer opens the file FORK.", { size: 20, bold: true }, "center");
    } else {
      d.p(LEAF_LINES[Math.floor(r() * LEAF_LINES.length)], { size: 20 }, "center");
    }
    defDoc(`leaf-${String(i).padStart(2, "0")}`, d.done());
  }
}

// leaf modified dates — deterministic, leaf 17 strictly newest
export function leafDate(i: number): string {
  if (i === MAGIC_LEAF) return MAGIC_TIME;
  const r = rng(1000 + i * 37);
  const day = 21 + randint(r, 0, 5);
  const hour = randint(r, 7, 20);
  const min = randint(r, 0, 59);
  const dt = new Date(2026, 8, day, hour, min);
  if (dt.getTime() >= new Date(MAGIC_TIME).getTime()) {
    dt.setTime(new Date(MAGIC_TIME).getTime() - 3600_000);
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}:00`;
}

// FORK (locked 42)
{
  const d = new DocBuilder();
  d.title("The Fork in the Trail");
  d.p("The trail splits in two. Two shepherds are sitting there.", { font: "serif" });
  d.p("One shepherd ALWAYS lies. The other ALWAYS tells the truth.", { bold: true });
  d.blank();
  d.p('Shepherd A says:  "Shepherd B is lying."', { size: 20, bold: true, color: COLORS.brown });
  d.p('Shepherd B says:  "We BOTH tell the truth."', { size: 20, bold: true, color: COLORS.brown });
  d.blank();
  d.p("Follow the shepherd who tells the truth. Open his folder.", { bold: true });
  defDoc("fork", d.done());
}

// Shepherd A doc
{
  const d = new DocBuilder();
  d.title("Shepherd A");
  d.p("Namaste! I always tell the truth.", { font: "serif" });
  d.p('Hajurama made a picture for you.');
  d.p('Double-click  "Hajurama\'s Picture"  in this folder. It opens in the design app.');
  d.blank();
  d.p("Hajurama's picture is hiding something.", { bold: true, color: COLORS.red });
  defDoc("shepherd-a", d.done());
}

// FINAL CODE (locked 1953)
{
  const d = new DocBuilder();
  d.title("My Last Secret Code");
  d.code(caesar(FINAL_WORD, PEN_PRICE), undefined, 36);
  d.p("KEY = the price of the pen.", { size: 20, bold: true }, "center");
  d.p("Move every letter BACK by that many steps.", {}, "center");
  d.alphabet();
  d.blank();
  d.p("Type the word in CAPITAL letters to open BOX.", { size: 20, bold: true, color: COLORS.red }, "center");
  defDoc("final-code", d.done());
}

// liar (locked 12)
{
  const d = new DocBuilder();
  d.title("Ha ha ha!", COLORS.red);
  d.p("I am Shepherd B, and I ALWAYS lie.", { size: 22, bold: true }, "center");
  d.p('If one shepherd always lies, can "we BOTH tell the truth" ever be true?', {}, "center");
  d.blank();
  d.p("Go back to the FORK and follow the other shepherd.", { size: 20, bold: true, color: COLORS.brown }, "center");
  defDoc("liar", d.done());
}

// last page (starts in Recycle Bin)
{
  const d = new DocBuilder();
  d.title("My Last Page");
  d.p("Thank you for bringing it back from the bin!", { font: "serif" });
  d.blank();
  d.p("Open a new tab (Ctrl + T), search on Google:", { size: 20, bold: true });
  d.p("In which year did Tenzing Norgay Sherpa reach the top of Mount Everest?",
    { size: 22, bold: true, color: COLORS.brown }, "center");
  d.p("then come back to this tab.", { size: 16 });
  d.blank();
  d.p("That year opens FINAL CODE.", { size: 20, bold: true, color: COLORS.red }, "center");
  defDoc("last-page", d.done());
}

// Tea Shop PRIZE — with real input fields
{
  const d = new DocBuilder();
  d.title("CONGRATULATIONS!!!", COLORS.red);
  d.p("You won Rs 1,00,000 in the Dashain Lucky Draw!", { size: 24, bold: true, color: COLORS.green }, "center");
  d.p("To receive your money, write your mobile PIN and the OTP code here:", { size: 18 }, "center");
  d.done();
  const fields: FieldsBlock = {
    type: "fields",
    fields: [
      { id: "pin", label: "PIN", placeholder: "________" },
      { id: "otp", label: "OTP", placeholder: "________" },
    ],
  };
  const d2 = new DocBuilder();
  d2.title("CONGRATULATIONS!!!", COLORS.red);
  d2.p("You won Rs 1,00,000 in the Dashain Lucky Draw!", { size: 24, bold: true, color: COLORS.green }, "center");
  d2.p("To receive your money, write your mobile PIN and the OTP code here:", { size: 18 }, "center");
  d2.blank();
  d2.blocks.push(fields);
  d2.blank();
  d2.p("(scroll down to claim)", { size: 12, italic: true }, "center");
  d2.pageBreak();
  d2.title("STOP!", COLORS.red);
  d2.p("This is exactly how phone scams work.", { size: 22, bold: true }, "center");
  d2.p(
    "No real bank, phone company, or lucky draw will EVER ask for your PIN or OTP. " +
      "If someone asks, they are a thief. Hang up. Tell your family too.",
    { size: 18 }, "center");
  d2.blank();
  d2.p("Hajurama's box is not at the tea shop. Go back.", { size: 20, bold: true, color: COLORS.brown }, "center");
  defDoc("prize", d2.done());
}

// Tea Shop menu
{
  const d = new DocBuilder();
  d.title("Tea Shop Menu");
  for (const item of ["Chiya ........ Rs 20", "Momo ........ Rs 120", "Sel roti ..... Rs 30", "Chana ........ Rs 50"]) {
    d.code(item, undefined, 20);
  }
  d.blank();
  d.p('The shopkeeper says: "Hajurama? She was not here today."', { italic: true }, "center");
  defDoc("menu", d.done());
}

// Water Tap clue (1pt text)
{
  const d = new DocBuilder();
  d.p("Hajurama's writing is very, very small here.", { size: 18, italic: true }, "center");
  d.blank();
  d.p(
    "Open the Calculator on this computer. Type 0.7734  " +
      "Now turn your head upside down. What word does the computer say to you? " +
      "Type it in CAPITAL letters to open the file called note.",
    { size: 1 },
  );
  defDoc("clue", d.done());
}

// note (locked HELLO)
{
  const d = new DocBuilder();
  d.title("Only water here.");
  d.p("The box is not at the water tap.", { size: 20 }, "center");
  d.p("Go back and read my first letter again. Carefully.", { size: 20, bold: true, color: COLORS.brown }, "center");
  defDoc("note", d.done());
}

// Jug empty
{
  const d = new DocBuilder();
  d.p("Just water. Nothing else.", { size: 20 }, "center");
  defDoc("empty", d.done());
}

// Temple prayer (@-messy, seeded)
export const PRAYER_MESSAGE =
  "Open a new tab (Ctrl + T), search on Google: What is the national flower of Nepal? " +
  "Type its English name in CAPITAL letters to open the file called blessing, then come back to this tab.";

export function messyPrayer(): string {
  const r = rng(11);
  return [...PRAYER_MESSAGE].map((c) => c + "@".repeat(randint(r, 1, 3))).join("");
}

export const PRAYER_TEXT = messyPrayer();

{
  const d = new DocBuilder();
  d.p("Too many @ in Hajurama's prayer. Take them ALL out.", { size: 18, bold: true, color: COLORS.brown }, "center");
  d.blank();
  d.p(PRAYER_TEXT, { size: 16, font: "mono" });
  defDoc("prayer", d.done());
}

// blessing (locked RHODODENDRON)
{
  const d = new DocBuilder();
  d.title("Hajurama's Secret Code");
  d.code(caesar(TEMPLE_END, 3), undefined, 22);
  d.p("KEY = 3. Move every letter 3 steps BACK.", { size: 18, bold: true }, "center");
  d.alphabet();
  defDoc("blessing", d.done());
}

// flowers / shoes
{
  const d = new DocBuilder();
  d.p("Only fresh flowers and a little rice here.", { size: 20 }, "center");
  defDoc("flowers", d.done());
}
{
  const d = new DocBuilder();
  d.p("Only shoes. Everyone leaves their shoes outside the temple.", { size: 20 }, "center");
  defDoc("shoes", d.done());
}

// Design file clue text (from teacher guide section 2)
export const DESIGN_CLUE_LINES = [
  "You found it! Remember this puzzle:",
  "A notebook and a pen cost Rs 110 together.",
  "The notebook costs Rs 100 more than the pen.",
  "How much does the pen cost?",
  "Remember the answer. You will need it at the very end.",
  "Oh no... I threw my last page into the Recycle Bin by mistake. Please bring it back!",
];

// ---------------------------------------------------------------- filesystem

const f = (
  id: string,
  name: string,
  kind: NodeKind,
  location: string,
  extra: Partial<FSNode> = {},
): FSNode => ({ id, name, kind, location, modified: BASE, ...extra });

const doc = (id: string, name: string, location: string, extra: Partial<FSNode> = {}) =>
  f(id, name, "doc", location, { app: "word", docId: id, size: 2048 + id.length * 37, ...extra });

export const boxRoot: FSNode = f("box-root", B, "folder", "Desktop", {
  modified: BASE,
  children: [
    doc("start-here", "START HERE", B, { modified: BASE }),
    doc("box", "BOX", B, { password: FINAL_WORD, modified: BASE }),
    f("temple", "Temple", "folder", B, {
      modified: "2026-09-16T11:00:00",
      children: [
        f("temple-inside", "Inside", "folder", `${B}/Temple`, {
          modified: "2026-09-16T11:00:00",
          children: [
            f("bell", "Bell", "folder", `${B}/Temple/Inside`, {
              modified: "2026-09-16T11:00:00",
              children: [
                doc("prayer", "prayer", `${B}/Temple/Inside/Bell`, { modified: "2026-09-16T11:05:00" }),
                doc("blessing", "blessing", `${B}/Temple/Inside/Bell`, {
                  password: "RHODODENDRON",
                  modified: "2026-09-16T11:10:00",
                }),
              ],
            }),
            doc("flowers", "flowers", `${B}/Temple/Inside`, { modified: "2026-09-16T11:15:00" }),
          ],
        }),
        f("temple-outside", "Outside", "folder", `${B}/Temple`, {
          modified: "2026-09-16T11:00:00",
          children: [
            doc("shoes", "shoes", `${B}/Temple/Outside`, { modified: "2026-09-16T11:20:00" }),
          ],
        }),
      ],
    }),
    f("tea-shop", "Tea Shop", "folder", B, {
      modified: "2026-09-17T09:00:00",
      children: [
        doc("prize", "PRIZE", `${B}/Tea Shop`, { modified: "2026-09-17T09:05:00" }),
        doc("menu", "menu", `${B}/Tea Shop`, { modified: "2026-09-17T09:10:00" }),
      ],
    }),
    f("water-tap", "Water Tap", "folder", B, {
      modified: "2026-09-18T08:00:00",
      children: [
        f("bucket", "Bucket", "folder", `${B}/Water Tap`, {
          modified: "2026-09-18T08:00:00",
          children: [
            doc("clue", "clue", `${B}/Water Tap/Bucket`, { modified: "2026-09-18T08:05:00" }),
            doc("note", "note", `${B}/Water Tap/Bucket`, { password: "HELLO", modified: "2026-09-18T08:10:00" }),
          ],
        }),
        f("jug", "Jug", "folder", `${B}/Water Tap`, {
          modified: "2026-09-18T08:00:00",
          children: [
            doc("empty", "empty", `${B}/Water Tap/Jug`, { modified: "2026-09-18T08:15:00" }),
          ],
        }),
      ],
    }),
    f("chautari", "Chautari", "folder", B, {
      modified: "2026-09-19T15:00:00",
      children: [
        doc("read-me-first", "READ ME FIRST", `${B}/Chautari`, { modified: "2026-09-20T09:30:00" }),
        ...Array.from({ length: 30 }, (_, k) => {
          const i = k + 1;
          const id = `leaf-${String(i).padStart(2, "0")}`;
          return doc(id, `leaf ${String(i).padStart(2, "0")}`, `${B}/Chautari`, {
            modified: leafDate(i),
            size: 512 + i * 11,
          });
        }),
        doc("fork", "FORK", `${B}/Chautari`, { password: "42", modified: "2026-09-19T16:00:00" }),
        f("shepherd-a", "Shepherd A", "folder", `${B}/Chautari`, {
          modified: "2026-09-19T16:05:00",
          children: [
            doc("shepherd-a", "Shepherd A", `${B}/Chautari/Shepherd A`, { modified: "2026-09-19T16:05:00" }),
            f("hajuramas-picture", "Hajurama's Picture", "design", `${B}/Chautari/Shepherd A`, {
              app: "designer",
              modified: "2026-09-19T16:08:00",
              size: 4120,
            }),
            doc("final-code", "FINAL CODE", `${B}/Chautari/Shepherd A`, {
              password: "1953",
              modified: "2026-09-19T16:10:00",
            }),
          ],
        }),
        f("shepherd-b", "Shepherd B", "folder", `${B}/Chautari`, {
          modified: "2026-09-19T16:20:00",
          children: [
            f("shepherd-b-img", "Shepherd B", "image", `${B}/Chautari/Shepherd B`, {
              app: "imageview",
              modified: "2026-09-19T16:20:00",
              size: 90210,
              details: {
                title: "Shepherd B's secret",
                comments:
                  "How many months have 28 days? Type the number to open the file called liar.",
              },
            }),
            doc("liar", "liar", `${B}/Chautari/Shepherd B`, {
              password: "12",
              modified: "2026-09-19T16:20:00",
            }),
          ],
        }),
      ],
    }),
  ],
});

// last page — lives in the Recycle Bin until restored
export const lastPageNode: FSNode = doc("last-page", "last page", "Recycle Bin", {
  modified: "2026-09-19T16:15:00",
  deleted: true,
  originalLocation: `${B}/Chautari/Shepherd A`,
  homePath: ["box-root", "chautari", "shepherd-a"],
});

export const recycleBinNode: FSNode = f("recycle-bin", "Recycle Bin", "folder", "Desktop", {
  app: "recycle",
  modified: BASE,
  children: [lastPageNode],
});

export const desktopNodes: FSNode[] = [
  boxRoot,
  recycleBinNode,
  f("calculator", "Calculator", "app", "Desktop", { app: "calculator", modified: BASE }),
];

// ---------------------------------------------------------------- lookups

export function findNode(id: string, roots: FSNode[] = desktopNodes): FSNode | undefined {
  for (const n of roots) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(id, n.children);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function findParent(id: string, roots: FSNode[] = desktopNodes): FSNode | undefined {
  for (const n of roots) {
    if (n.children?.some((c) => c.id === id)) return n;
    if (n.children) {
      const hit = findParent(id, n.children);
      if (hit) return hit;
    }
  }
  return undefined;
}

// path of ids from a root to a node (for breadcrumbs / restore)
export function pathTo(id: string, root: FSNode): string[] | undefined {
  if (root.id === id) return [root.id];
  for (const c of root.children ?? []) {
    const p = pathTo(id, c);
    if (p) return [root.id, ...p];
  }
  return undefined;
}

// is a node id inside a trap subtree?
export const TRAP_ROOTS = ["temple", "tea-shop", "water-tap", "shepherd-b"];
export function isTrapPath(ids: string[]): boolean {
  return ids.some((i) => TRAP_ROOTS.includes(i));
}

// ---------------------------------------------------------------- milestones & hints

export const MILESTONES = [
  "openedStart",
  "revealedFirstCode",
  "enteredChautari",
  "openedMagicLeaf",
  "openedFork",
  "enteredShepherdA",
  "revealedDesignClue",
  "restoredLastPage",
  "openedFinalCode",
  "openedBox",
] as const;

export type Milestone = (typeof MILESTONES)[number];

// hint texts — level 1, level 2 (from teacher_guide hints table, same voice)
export const HINTS: Record<Milestone, [string, string]> = {
  openedStart: [
    "Start where every story starts: the first letter.",
    "Open Hajurama's Box and double-click START HERE.",
  ],
  revealedFirstCode: [
    "Is it really empty? Or does it only look empty?",
    "Select everything on the page: Ctrl + A.",
  ],
  enteredChautari: [
    "Where do people in a village rest under a big tree?",
    "Chautari. Open the Chautari folder.",
  ],
  openedMagicLeaf: [
    "Your computer remembers when every file was changed.",
    "Switch to Details view, then click the Date modified column.",
  ],
  openedFork: [
    "Check your last line again.",
    "Multiply before you add. The answer opens FORK.",
  ],
  enteredShepherdA: [
    "Can Shepherd B's sentence ever be true?",
    "If one always lies, 'we both tell the truth' is false. Follow Shepherd A.",
  ],
  revealedDesignClue: [
    "Hajurama's picture is covering something.",
    "Click the basket and drag it away, or send it to the back.",
  ],
  restoredLastPage: [
    "Where do deleted files go?",
    "Open the Recycle Bin on the Desktop, right-click the file, Restore.",
  ],
  openedFinalCode: [
    "The key is a number from an earlier puzzle.",
    "Open a new tab (Ctrl + T), search on Google, then come back. The pen price is the key.",
  ],
  openedBox: [
    "The last code is a word, in CAPITAL letters.",
    "Move each letter back by the pen price.",
  ],
};

export const TRAP_HINT = "Are you sure Hajurama came here? Read her first letter again.";

// ---------------------------------------------------------------- stats

export const SKILLS = {
  selectAll: "Selected everything (Ctrl + A)",
  fontColor: "Changed font colour",
  fontSize: "Changed font size",
  zoom: "Used zoom",
  findReplace: "Used Find & Replace",
  detailsSort: "Sorted files by date",
  properties: "Opened file Properties",
  restore: "Restored from the Recycle Bin",
  design: "Moved layers in the design app",
  calculator: "Used the Calculator",
  password: "Opened a locked file",
  google: "Reached a Google-search clue",
  scamRefuse: "Refused a fake eSewa login",
} as const;

export type SkillKey = keyof typeof SKILLS;

// Level 2: Hajurba's Radio. Same tree ids and difficulty as Level 1,
// only the story, names and answers change.
import {
  DocBuilder, caesar, rng, randint, f, doc, COLORS, BASE,
  FSNode, Doc, FieldsBlock, Milestone,
} from "./content";

export const FIRST_CLUE2 = "GO WHERE PEOPLE WAIT FOR A RIDE TO TOWN";
export const GUMBA_END = "THE RADIO IS NOT HERE. GO BACK.";
export const FINAL_WORD2 = "TIHAR";
export const ERASER_PRICE = 4;
export const MAGIC_TICKET = 23;
const B2 = "Hajurba's Radio";

export const docs2: Record<string, Doc> = {};
const defDoc = (id: string, blocks: ReturnType<DocBuilder["done"]>) => {
  docs2[id] = { id, blocks };
};

// START HERE
{
  const d = new DocBuilder();
  d.title("Hajurba's Letter");
  d.p("My dear grandchild,", { size: 18, font: "serif" });
  d.p(
    "Before Tihar, I hid my old radio somewhere in our village. " +
      "Inside it is something special, only for you.",
    { font: "serif" },
  );
  d.p("My first clue is written on this page. But your eyes cannot see it.", {
    font: "serif",
    bold: true,
  });
  d.sign("Hajurba");
  d.blank(8);
  d.p("Secret code:", { size: 20, bold: true, color: COLORS.white }, "center");
  d.p(caesar(FIRST_CLUE2, 3), { size: 24, bold: true, color: COLORS.white, font: "mono" }, "center");
  d.p("KEY = 3. Move every letter 3 steps BACK.", { size: 18, bold: true, color: COLORS.white }, "center");
  d.alphabet(COLORS.white);
  d.p("Then go to that place.", { size: 18, bold: true, color: COLORS.white }, "center");
  defDoc("start-here", d.done());
}

// RADIO (locked, opens the finale)
{
  const d = new DocBuilder();
  d.title("YOU FOUND HAJURBA'S RADIO!", COLORS.red);
  d.p("Tell your teacher your score, right now!", { size: 22, bold: true, color: COLORS.green }, "center");
  d.blank();
  d.p("My clever grandchild,", { size: 18, font: "serif" });
  d.p(
    "Here is my Tihar blessing for you: may your life shine like a row of diyo, " +
      "and may you keep learning every single day.",
    { font: "serif" },
  );
  d.sign("Hajurba");
  defDoc("box", d.done());
}

// Bus Park note
{
  const d = new DocBuilder();
  d.title("At the Bus Park");
  d.p("So many tickets were sold at the bus park.", { font: "serif" });
  d.p("The clue is the ticket I changed last.", { font: "serif", bold: true });
  d.sign("Hajurba");
  defDoc("read-me-first", d.done());
}

export const TICKET_LINES = [
  "Just an old ticket.", "Someone sat on this ticket.", "Only a ticket. Keep looking.",
  "A torn ticket. Nothing else.", "A ticket to Pokhara. No clue.",
  "Ticket. Ticket. Ticket. Nothing here.", "A bus ran over half of this ticket.",
  "The wind blew this ticket here. No clue.", "Not this one.", "This ticket is wet from the rain.",
];

// ticket docs (same ids as the leaves)
{
  const r = rng(7);
  for (let i = 1; i <= 30; i++) {
    const d = new DocBuilder();
    if (i === MAGIC_TICKET) {
      d.title("You found my ticket!", COLORS.green);
      for (const line of [
        "SEL + SEL + SEL = 15",
        "SEL + LASSI + LASSI = 19",
        "LASSI - DAHI = 4",
        "DAHI + SEL x LASSI = ?",
      ]) {
        d.code(line, undefined, 24);
      }
      d.blank();
      d.p("The answer opens the file FORK.", { size: 20, bold: true }, "center");
    } else {
      d.p(TICKET_LINES[Math.floor(r() * TICKET_LINES.length)], { size: 20 }, "center");
    }
    defDoc(`leaf-${String(i).padStart(2, "0")}`, d.done());
  }
}

// ticket dates: deterministic, ticket 23 strictly newest
export const MAGIC_TIME2 = "2026-09-27T18:45:00";
export function ticketDate(i: number): string {
  if (i === MAGIC_TICKET) return MAGIC_TIME2;
  const r = rng(1000 + i * 37);
  const day = 21 + randint(r, 0, 5);
  const hour = randint(r, 7, 20);
  const min = randint(r, 0, 59);
  const dt = new Date(2026, 8, day, hour, min);
  if (dt.getTime() >= new Date(MAGIC_TIME2).getTime()) {
    dt.setTime(new Date(MAGIC_TIME2).getTime() - 3600_000);
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}:00`;
}

// FORK (locked 38)
{
  const d = new DocBuilder();
  d.title("The Fork in the Trail");
  d.p("The trail splits in two. Two brothers, Ram and Shyam, are sitting there.", { font: "serif" });
  d.p("One brother ALWAYS lies. The other ALWAYS tells the truth.", { bold: true });
  d.blank();
  d.p('Ram says:  "Shyam is the liar."', { size: 20, bold: true, color: COLORS.brown });
  d.p('Shyam says:  "We both lie."', { size: 20, bold: true, color: COLORS.brown });
  d.blank();
  d.p("Follow the brother who tells the truth. Open his folder.", { bold: true });
  defDoc("fork", d.done());
}

// Ram doc
{
  const d = new DocBuilder();
  d.title("Ram");
  d.p("Namaste! I always tell the truth.", { font: "serif" });
  d.p('Hajurba made a picture for you.');
  d.p('Double-click  "Hajurba\'s Picture"  in this folder. It opens in the design app.');
  d.blank();
  d.p("Hajurba's picture is hiding something.", { bold: true, color: COLORS.red });
  defDoc("shepherd-a", d.done());
}

// FINAL CODE (locked 2008)
{
  const d = new DocBuilder();
  d.title("My Last Secret Code");
  d.code(caesar(FINAL_WORD2, ERASER_PRICE), undefined, 36);
  d.p("KEY = the price of the eraser.", { size: 20, bold: true }, "center");
  d.p("Move every letter BACK by that many steps.", {}, "center");
  d.alphabet();
  d.blank();
  d.p("Type the word in CAPITAL letters to open RADIO.", { size: 20, bold: true, color: COLORS.red }, "center");
  defDoc("final-code", d.done());
}

// liar (locked 2)
{
  const d = new DocBuilder();
  d.title("Ha ha ha!", COLORS.red);
  d.p("Shyam lied to you.", { size: 22, bold: true }, "center");
  d.p('If one brother always lies, can "we both lie" ever be true?', {}, "center");
  d.blank();
  d.p("Go back to the fork.", { size: 20, bold: true, color: COLORS.brown }, "center");
  defDoc("liar", d.done());
}

// last page (starts in the Recycle Bin)
{
  const d = new DocBuilder();
  d.title("My Last Page");
  d.p("Thank you for bringing it back from the bin!", { font: "serif" });
  d.blank();
  d.p("Open a new tab (Ctrl + T), search on Google:", { size: 20, bold: true });
  d.p("In which year did Nepal become a federal democratic republic?",
    { size: 22, bold: true, color: COLORS.brown }, "center");
  d.p("then come back to this tab.", { size: 16 });
  d.blank();
  d.p("That year opens FINAL CODE.", { size: 20, bold: true, color: COLORS.red }, "center");
  defDoc("last-page", d.done());
}

// Mobile Shop FREE RECHARGE, same fields trick as the Tea Shop
{
  const d2 = new DocBuilder();
  d2.title("CONGRATULATIONS!!!", COLORS.red);
  d2.p("You won Rs 500 free phone recharge!", { size: 24, bold: true, color: COLORS.green }, "center");
  d2.p("Write your SIM PIN and the OTP code here:", { size: 18 }, "center");
  d2.blank();
  const fields: FieldsBlock = {
    type: "fields",
    fields: [
      { id: "pin", label: "SIM PIN", placeholder: "________" },
      { id: "otp", label: "OTP", placeholder: "________" },
    ],
  };
  d2.blocks.push(fields);
  d2.blank();
  d2.p("(scroll down to claim)", { size: 12, italic: true }, "center");
  d2.pageBreak();
  d2.title("STOP!", COLORS.red);
  d2.p("This is how phone scams work.", { size: 22, bold: true }, "center");
  d2.p(
    "No real shop or phone company will EVER ask for your PIN or OTP. " +
      "If someone asks, they are a thief. Hang up. Tell your family too.",
    { size: 18 }, "center");
  d2.blank();
  d2.p("The radio is not at the mobile shop. Go back.", { size: 20, bold: true, color: COLORS.brown }, "center");
  defDoc("prize", d2.done());
}

// Mobile Shop rates
{
  const d = new DocBuilder();
  d.title("Mobile Shop Rates");
  for (const item of ["Recharge ..... Rs 50", "Cover ........ Rs 250", "Earphones .... Rs 350", "Data pack .... Rs 99"]) {
    d.code(item, undefined, 20);
  }
  d.blank();
  d.p('The shopkeeper says: "Hajurba? He was not here today."', { italic: true }, "center");
  defDoc("menu", d.done());
}

// Old Bridge clue (1pt)
{
  const d = new DocBuilder();
  d.p("Hajurba's writing is very, very small here.", { size: 18, italic: true }, "center");
  d.blank();
  d.p(
    "Open the Calculator. Type 5338 and turn your head upside down. " +
      "Type the word in CAPITAL letters to open the file called note.",
    { size: 1 },
  );
  defDoc("clue", d.done());
}

// note (locked BEES)
{
  const d = new DocBuilder();
  d.title("Only bees live here.");
  d.p("The radio is not under the bridge.", { size: 20 }, "center");
  d.p("Wrong place. Go back.", { size: 20, bold: true, color: COLORS.brown }, "center");
  defDoc("note", d.done());
}

{
  const d = new DocBuilder();
  d.p("Just river water. Nothing else.", { size: 20 }, "center");
  defDoc("empty", d.done());
}

// Gumba prayer wheel flags (#-messy, seeded)
export const FLAGS_MESSAGE =
  "Open a new tab (Ctrl + T), search on Google: What is the national bird of Nepal? " +
  "Type its Nepali name in CAPITAL letters to open the file called blessing, then come back to this tab.";

export function messyFlags(): string {
  const r = rng(13);
  return [...FLAGS_MESSAGE].map((c) => c + "#".repeat(randint(r, 1, 3))).join("");
}

export const FLAGS_TEXT = messyFlags();

{
  const d = new DocBuilder();
  d.p("Too many # on Hajurba's prayer flags. Take them ALL out.", { size: 18, bold: true, color: COLORS.brown }, "center");
  d.blank();
  d.p(FLAGS_TEXT, { size: 16, font: "mono" });
  defDoc("prayer", d.done());
}

// blessing (locked DANPHE, also accepts MONAL and HIMALAYAN MONAL)
{
  const d = new DocBuilder();
  d.title("Hajurba's Secret Code");
  d.code(caesar(GUMBA_END, 3), undefined, 22);
  d.p("KEY = 3. Move every letter 3 steps BACK.", { size: 18, bold: true }, "center");
  d.alphabet();
  defDoc("blessing", d.done());
}

{
  const d = new DocBuilder();
  d.p("Only candles and a little rice here.", { size: 20 }, "center");
  defDoc("flowers", d.done());
}
{
  const d = new DocBuilder();
  d.p("Only incense sticks. Everyone leaves them at the door.", { size: 20 }, "center");
  defDoc("shoes", d.done());
}

export const DESIGN_CLUE_LINES2 = [
  "You found it! Remember this puzzle:",
  "A pencil and an eraser cost Rs 12 together.",
  "The pencil costs Rs 4 more than the eraser.",
  "How much does the eraser cost?",
  "Remember the answer. You will need it at the very end.",
  "Oh no... I threw my last page into the Recycle Bin by mistake. Please bring it back!",
];

// ---------------------------------------------------------------- filesystem (same ids as Level 1)

export const boxRoot2: FSNode = f("box-root", B2, "folder", "Desktop", {
  modified: BASE,
  children: [
    doc("start-here", "START HERE", B2, { modified: BASE }),
    doc("box", "RADIO", B2, { password: FINAL_WORD2, modified: BASE }),
    f("temple", "Gumba", "folder", B2, {
      modified: "2026-09-16T11:00:00",
      children: [
        f("temple-inside", "Inside", "folder", `${B2}/Gumba`, {
          modified: "2026-09-16T11:00:00",
          children: [
            f("bell", "Prayer Wheel", "folder", `${B2}/Gumba/Inside`, {
              modified: "2026-09-16T11:00:00",
              children: [
                doc("prayer", "flags", `${B2}/Gumba/Inside/Prayer Wheel`, { modified: "2026-09-16T11:05:00" }),
                doc("blessing", "blessing", `${B2}/Gumba/Inside/Prayer Wheel`, {
                  password: "DANPHE|MONAL|HIMALAYAN MONAL|HIMALAYANMONAL",
                  modified: "2026-09-16T11:10:00",
                }),
              ],
            }),
            doc("flowers", "candles", `${B2}/Gumba/Inside`, { modified: "2026-09-16T11:15:00" }),
          ],
        }),
        f("temple-outside", "Outside", "folder", `${B2}/Gumba`, {
          modified: "2026-09-16T11:00:00",
          children: [
            doc("shoes", "incense", `${B2}/Gumba/Outside`, { modified: "2026-09-16T11:20:00" }),
          ],
        }),
      ],
    }),
    f("tea-shop", "Mobile Shop", "folder", B2, {
      modified: "2026-09-17T09:00:00",
      children: [
        doc("prize", "FREE RECHARGE", `${B2}/Mobile Shop`, { modified: "2026-09-17T09:05:00" }),
        doc("menu", "rates", `${B2}/Mobile Shop`, { modified: "2026-09-17T09:10:00" }),
      ],
    }),
    f("water-tap", "Old Bridge", "folder", B2, {
      modified: "2026-09-18T08:00:00",
      children: [
        f("bucket", "Under the Bridge", "folder", `${B2}/Old Bridge`, {
          modified: "2026-09-18T08:00:00",
          children: [
            doc("clue", "clue", `${B2}/Old Bridge/Under the Bridge`, { modified: "2026-09-18T08:05:00" }),
            doc("note", "note", `${B2}/Old Bridge/Under the Bridge`, { password: "BEES", modified: "2026-09-18T08:10:00" }),
          ],
        }),
        f("jug", "River Bank", "folder", `${B2}/Old Bridge`, {
          modified: "2026-09-18T08:00:00",
          children: [
            doc("empty", "empty", `${B2}/Old Bridge/River Bank`, { modified: "2026-09-18T08:15:00" }),
          ],
        }),
      ],
    }),
    f("chautari", "Bus Park", "folder", B2, {
      modified: "2026-09-19T15:00:00",
      children: [
        doc("read-me-first", "READ ME FIRST", `${B2}/Bus Park`, { modified: "2026-09-20T09:30:00" }),
        ...Array.from({ length: 30 }, (_, k) => {
          const i = k + 1;
          const id = `leaf-${String(i).padStart(2, "0")}`;
          return doc(id, `ticket ${String(i).padStart(2, "0")}`, `${B2}/Bus Park`, {
            modified: ticketDate(i),
            size: 512 + i * 11,
          });
        }),
        doc("fork", "FORK", `${B2}/Bus Park`, { password: "38", modified: "2026-09-19T16:00:00" }),
        f("shepherd-a", "Ram", "folder", `${B2}/Bus Park`, {
          modified: "2026-09-19T16:05:00",
          children: [
            doc("shepherd-a", "Ram", `${B2}/Bus Park/Ram`, { modified: "2026-09-19T16:05:00" }),
            f("hajuramas-picture", "Hajurba's Picture", "design", `${B2}/Bus Park/Ram`, {
              app: "designer",
              modified: "2026-09-19T16:08:00",
              size: 4120,
            }),
            doc("final-code", "FINAL CODE", `${B2}/Bus Park/Ram`, {
              password: "2008",
              modified: "2026-09-19T16:10:00",
            }),
          ],
        }),
        f("shepherd-b", "Shyam", "folder", `${B2}/Bus Park`, {
          modified: "2026-09-19T16:20:00",
          children: [
            f("shepherd-b-img", "Shyam's photo", "image", `${B2}/Bus Park/Shyam`, {
              app: "imageview",
              modified: "2026-09-19T16:20:00",
              size: 90210,
              details: {
                title: "Shyam's secret",
                comments:
                  "You have 3 apples and you take away 2. How many apples do YOU have? Type the number to open the file called liar.",
              },
            }),
            doc("liar", "liar", `${B2}/Bus Park/Shyam`, {
              password: "2",
              modified: "2026-09-19T16:20:00",
            }),
          ],
        }),
      ],
    }),
  ],
});

export const lastPageNode2: FSNode = doc("last-page", "last page", "Recycle Bin", {
  modified: "2026-09-19T16:15:00",
  deleted: true,
  originalLocation: `${B2}/Bus Park/Ram`,
  homePath: ["box-root", "chautari", "shepherd-a"],
});

export const recycleBinNode2: FSNode = f("recycle-bin", "Recycle Bin", "folder", "Desktop", {
  app: "recycle",
  modified: BASE,
  children: [lastPageNode2],
});

export const desktopNodes2: FSNode[] = [
  boxRoot2,
  recycleBinNode2,
  f("calculator", "Calculator", "app", "Desktop", { app: "calculator", modified: BASE }),
];

// ---------------------------------------------------------------- hints, same voice as Level 1

export const HINTS2: Record<Milestone, [string, string]> = {
  openedStart: [
    "Start where every story starts: the first letter.",
    "Open Hajurba's Radio and double-click START HERE.",
  ],
  revealedFirstCode: [
    "Is it really empty? Or does it only look empty?",
    "Select everything on the page: Ctrl + A.",
  ],
  enteredChautari: [
    "Where do people in a village wait for a ride to town?",
    "Bus Park. Open the Bus Park folder.",
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
    "Can Shyam's sentence ever be true?",
    "If one always lies, 'we both lie' is false. Follow Ram.",
  ],
  revealedDesignClue: [
    "Hajurba's picture is covering something.",
    "Click the cap and drag it away, or send it to the back.",
  ],
  restoredLastPage: [
    "Where do deleted files go?",
    "Open the Recycle Bin on the Desktop, right-click the file, Restore.",
  ],
  openedFinalCode: [
    "The key is a number from an earlier puzzle.",
    "Open a new tab (Ctrl + T), search on Google, then come back. The eraser price is the key.",
  ],
  openedBox: [
    "The last code is a word, in CAPITAL letters.",
    "Move each letter back by the eraser price.",
  ],
};

export const TRAP_HINT2 = "Are you sure Hajurba came here? Read his first letter again.";

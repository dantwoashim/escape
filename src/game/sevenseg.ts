// Canonical seven-segment map. Bit order is [a,b,c,d,e,f,g]:
//      --a--
//     |     |
//     f     b
//     |--g--|
//     e     c
//     |     |
//      --d--
// Standard sets: 0=abcdef 1=bc 2=abdeg 3=abcdg 4=bcfg 5=acdfg
//                6=acdefg 7=abc 8=abcdefg 9=abcdfg
export const SEGMENTS: Record<string, number[]> = {
  "0": [1, 1, 1, 1, 1, 1, 0],
  "1": [0, 1, 1, 0, 0, 0, 0],
  "2": [1, 1, 0, 1, 1, 0, 1],
  "3": [1, 1, 1, 1, 0, 0, 1],
  "4": [0, 1, 1, 0, 0, 1, 1],
  "5": [1, 0, 1, 1, 0, 1, 1],
  "6": [1, 0, 1, 1, 1, 1, 1],
  "7": [1, 1, 1, 0, 0, 0, 0],
  "8": [1, 1, 1, 1, 1, 1, 1],
  "9": [1, 1, 1, 1, 0, 1, 1],
  "-": [0, 0, 0, 0, 0, 0, 1],
  "E": [1, 0, 0, 1, 1, 1, 1],
  " ": [0, 0, 0, 0, 0, 0, 0],
};

// upside-down calculator spelling: read the string back to front
const FLIP: Record<string, string> = {
  "0": "O", "1": "I", "2": "S", "3": "E", "4": "h",
  "5": "S", "6": "g", "7": "L", "8": "B", "9": "G",
};
export function calcWord(digits: string): string {
  return [...digits].reverse().map((c) => FLIP[c] ?? "").join("");
}

// geometry for each segment in bit order [a,b,c,d,e,f,g] (digit cell ~20x36)
export const SEG_PATHS = [
  "M2 2 h14",   // a  top
  "M18 4 v12",  // b  upper right
  "M18 20 v12", // c  lower right
  "M2 34 h14",  // d  bottom
  "M0 20 v12",  // e  lower left
  "M0 4 v12",   // f  upper left
  "M2 18 h14",  // g  middle
];

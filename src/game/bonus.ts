// the word hidden in the keynote film earns one free hint, stored on the device
const KEY = "hajurama-box-word-v1";

export const WORD_ANSWERS = ["bistarai", "bistaarai", "बिस्तारै"];

export function bonusHint(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setBonusHint() {
  try {
    localStorage.setItem(KEY, "1");
  } catch { /* full/unavailable */ }
}

export function checkWord(s: string): boolean {
  return WORD_ANSWERS.includes(s.trim().toLowerCase());
}

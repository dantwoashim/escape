// in-game back stack for the mobile shell: every pushed UI depth (window,
// folder level, action sheet) gets a matching history entry, so the browser
// Back button and Android edge-swipe step through the game instead of
// leaving the site. Desktop never enables this.
let closers: (() => void)[] = [];
let enabled = false;
let installed = false;
let skipPop = false;

export function navEnabled(): boolean {
  return enabled;
}

export function installNav() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("popstate", () => {
    if (skipPop) {
      skipPop = false;
      return;
    }
    const c = closers.pop();
    if (c) c();
    else history.pushState({ hb: 0 }, ""); // trapped root: never leave the page
  });
}

export function navSetEnabled(v: boolean) {
  if (v && !enabled) history.pushState({ hb: 0 }, "");
  enabled = v;
}

// push one UI depth; closer runs the same thing the top-bar back arrow does
export function navPush(closer: () => void) {
  if (!enabled) return;
  closers.push(closer);
  history.pushState({ hb: closers.length }, "");
}

// the user dismissed the top layer directly (tap, not Back): eat its entry
export function navConsume() {
  if (!enabled || !closers.length) return;
  closers.pop();
  skipPop = true;
  history.back();
}

// shared by the top-bar back arrow and hardware/browser Back
export function navBack(fallback: () => void) {
  if (enabled && closers.length) history.back();
  else fallback();
}

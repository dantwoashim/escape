import { useState } from "react";
import { useMeta, useActions } from "../game/state";
import Wallpaper from "./Wallpaper";
import { nodeIcon, IconBin, IconBox, IconCalc } from "./icons";

export default function Desktop() {
  const state = useMeta();
  const { openNode } = useActions();
  const [sel, setSel] = useState<string | null>(null);
  const bin = state.fsRoots.find((r) => r.id === "recycle-bin");
  const binFull = (bin?.children?.length ?? 0) > 0;

  return (
    <div className="desktop" onClick={() => setSel(null)}>
      <Wallpaper />
      <div className="desk-icons" onClick={(e) => e.stopPropagation()}>
        {state.fsRoots.map((n) => (
          <button
            key={n.id}
            className={"desk-icon" + (sel === n.id ? " selected" : "")}
            data-desk={n.id}
            onClick={() => setSel(n.id)}
            onDoubleClick={() => openNode(n)}
            onKeyDown={(e) => e.key === "Enter" && openNode(n)}
          >
            {n.id === "box-root" ? <IconBox /> :
             n.id === "recycle-bin" ? <IconBin full={binFull} /> :
             n.app === "calculator" ? <IconCalc /> : nodeIcon(n.kind)}
            <span className="label">{n.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

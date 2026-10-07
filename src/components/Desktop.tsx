import { useState } from "react";
import { useMeta, useActions } from "../game/state";
import Wallpaper from "./Wallpaper";
import ActionSheet from "./ActionSheet";
import { useIsMobile } from "../game/useIsMobile";
import { useLongPress } from "../game/useLongPress";
import { nodeIcon, IconBin, IconBox, IconCalc } from "./icons";
import { FolderOpen, Info } from "@phosphor-icons/react";
import { FSNode } from "../game/content";

function DeskIcon({ n, binFull }: { n: FSNode; binFull: boolean }) {
  const { dispatch, openNode } = useActions();
  const mobile = useIsMobile();
  const [sel, setSel] = useState(false);
  const [sheet, setSheet] = useState(false);
  const lp = useLongPress(() => {
    setSel(true);
    setSheet(true);
  });
  return (
    <>
      <button
        className={"desk-icon" + (sel ? " selected" : "")}
        data-desk={n.id}
        onClick={() => (mobile ? openNode(n) : setSel(true))}
        onDoubleClick={() => !mobile && openNode(n)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (mobile) return;
          setSel(true);
          setSheet(true);
        }}
        {...(mobile ? lp : {})}
        onKeyDown={(e) => e.key === "Enter" && openNode(n)}
      >
        {n.id === "box-root" ? <IconBox /> :
         n.id === "recycle-bin" ? <IconBin full={binFull} /> :
         n.app === "calculator" ? <IconCalc /> : nodeIcon(n.kind)}
        <span className="label">{n.name}</span>
      </button>
      {sheet && (
        <ActionSheet
          onClose={() => setSheet(false)}
          items={[
            { label: "Open", icon: <FolderOpen size={18} />, onClick: () => openNode(n) },
            {
              label: "Properties",
              icon: <Info size={18} />,
              onClick: () => {
                dispatch({ type: "skill", k: "properties" });
                dispatch({ type: "open-app", app: "properties", title: `${n.name} Properties`, nodeId: n.id });
              },
            },
          ]}
        />
      )}
    </>
  );
}

export default function Desktop() {
  const state = useMeta();
  const bin = state.fsRoots.find((r) => r.id === "recycle-bin");
  const binFull = (bin?.children?.length ?? 0) > 0;

  return (
    <div className="desktop">
      <Wallpaper />
      <div className="desk-icons" onClick={(e) => e.stopPropagation()}>
        {state.fsRoots.map((n) => <DeskIcon key={n.id} n={n} binFull={binFull} />)}
      </div>
    </div>
  );
}

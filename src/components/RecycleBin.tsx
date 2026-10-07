import { useState } from "react";
import { useMeta, useActions } from "../game/state";
import { FSNode } from "../game/content";
import { fmtDate } from "../game/logic";
import { nodeIcon } from "./icons";
import { useIsMobile } from "../game/useIsMobile";
import { useLongPress } from "../game/useLongPress";
import ActionSheet from "./ActionSheet";
import { ArrowCounterClockwise, Info } from "@phosphor-icons/react";

// mobile row: tap opens, long-press brings up Restore/Properties
function MobileBinRow({ n, sel, onTap, onLong }: {
  n: FSNode; sel: boolean; onTap: () => void; onLong: () => void;
}) {
  const lp = useLongPress(onLong);
  return (
    <button className={"mrow" + (sel ? " sel" : "")} data-file={n.id} onClick={onTap} {...lp}>
      <span className="mr-ic">{nodeIcon(n.kind, true, 18)}</span>
      <span className="mr-txt">
        <span className="mr-name">{n.name}</span>
        <span className="mr-meta">{n.originalLocation ?? ""} · {fmtDate(n.modified)}</span>
      </span>
    </button>
  );
}

function BinRow({ n, sel, mobile, onTap, onCtx, onLong }: {
  n: FSNode; sel: boolean; mobile: boolean;
  onTap: () => void; onCtx: (e: React.MouseEvent) => void; onLong: () => void;
}) {
  const lp = useLongPress(onLong);
  return (
    <tr
      className={sel ? "sel" : ""}
      onClick={onTap}
      onDoubleClick={onTap}
      onContextMenu={onCtx}
      data-file={n.id}
      {...(mobile ? lp : {})}
    >
      <td><span className="nm"><span style={{width:18,height:18,display:"inline-flex"}}>{nodeIcon(n.kind, true)}</span>{n.name}</span></td>
      <td>{n.originalLocation ?? ""}</td>
      <td>{fmtDate(n.modified)}</td>
    </tr>
  );
}

export default function RecycleBin() {
  const state = useMeta();
  const { dispatch, openNode } = useActions();
  const [sel, setSel] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; node: FSNode } | null>(null);
  const mobile = useIsMobile();
  const bin = state.fsRoots.find((r) => r.id === "recycle-bin");
  const items = bin?.children ?? [];

  const restore = (n: FSNode) => {
    dispatch({ type: "restore", nodeId: n.id });
    setSel(null);
  };

  return (
    <div className="explorer" onClick={() => { if (!mobile) setCtx(null); }}>
      <div className="rb-toolbar">
        <button
          className="wbtn"
          disabled={!sel}
          style={{ opacity: sel ? 1 : 0.4 }}
          onClick={() => {
            const n = items.find((i) => i.id === sel);
            if (n) restore(n);
          }}
        >
          <ArrowCounterClockwise size={14} /> Restore selected item
        </button>
      </div>
      <div className="exp-list" style={{ flex: 1, overflow: "auto" }}>
        {items.length === 0 ? (
          <div className="empty-note">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              {nodeIcon("app")}
            </div>
            The Recycle Bin is empty.
          </div>
        ) : mobile ? (
          <div className="m-rows">
            {items.map((n) => (
              <MobileBinRow
                key={n.id}
                n={n}
                sel={sel === n.id}
                onTap={() => { setSel(n.id); openNode(n); }}
                onLong={() => { setSel(n.id); setCtx({ x: 0, y: 0, node: n }); }}
              />
            ))}
          </div>
        ) : (
          <table className="details">
            <thead>
              <tr><th>Name</th><th>Original location</th><th>Date deleted</th></tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <BinRow
                  key={n.id}
                  n={n}
                  sel={sel === n.id}
                  mobile={mobile}
                  onTap={() => (mobile ? (setSel(n.id), openNode(n)) : setSel(n.id))}
                  onCtx={(e) => {
                    e.preventDefault();
                    if (mobile) return;
                    setSel(n.id);
                    setCtx({ x: e.clientX, y: e.clientY, node: n });
                  }}
                  onLong={() => { setSel(n.id); setCtx({ x: 0, y: 0, node: n }); }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="exp-status">{items.length} item{items.length === 1 ? "" : "s"}</div>
      {ctx && mobile && (
        <ActionSheet
          onClose={() => setCtx(null)}
          items={[
            {
              label: "Restore",
              icon: <ArrowCounterClockwise size={18} />,
              onClick: () => restore(ctx.node),
            },
            {
              label: "Properties",
              icon: <Info size={18} />,
              onClick: () => {
                dispatch({ type: "skill", k: "properties" });
                dispatch({ type: "open-app", app: "properties", title: `${ctx.node.name} Properties`, nodeId: ctx.node.id });
              },
            },
          ]}
        />
      )}
      {ctx && !mobile && (
        <div className="ctx-menu" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
          <button className="ctx-item" onClick={() => { setCtx(null); restore(ctx.node); }}>
            <ArrowCounterClockwise size={14} /> Restore
          </button>
          <button
            className="ctx-item"
            onClick={() => {
              setCtx(null);
              dispatch({ type: "skill", k: "properties" });
              dispatch({ type: "open-app", app: "properties", title: `${ctx.node.name} Properties`, nodeId: ctx.node.id });
            }}
          >
            Properties
          </button>
        </div>
      )}
    </div>
  );
}

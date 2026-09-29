import { useState } from "react";
import { useMeta, useActions } from "../game/state";
import { FSNode } from "../game/content";
import { fmtDate } from "../game/logic";
import { nodeIcon } from "./icons";
import { ArrowCounterClockwise } from "@phosphor-icons/react";

export default function RecycleBin() {
  const state = useMeta();
  const { dispatch, openNode } = useActions();
  const [sel, setSel] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; node: FSNode } | null>(null);
  const bin = state.fsRoots.find((r) => r.id === "recycle-bin");
  const items = bin?.children ?? [];

  const restore = (n: FSNode) => {
    dispatch({ type: "restore", nodeId: n.id });
    setSel(null);
  };

  return (
    <div className="explorer" onClick={() => setCtx(null)}>
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
        ) : (
          <table className="details">
            <thead>
              <tr><th>Name</th><th>Original location</th><th>Date deleted</th></tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr
                  key={n.id}
                  className={sel === n.id ? "sel" : ""}
                  onClick={() => setSel(n.id)}
                  onDoubleClick={() => openNode(n)}
                  onContextMenu={(e) => { e.preventDefault(); setSel(n.id); setCtx({ x: e.clientX, y: e.clientY, node: n }); }}
                  data-file={n.id}
                >
                  <td><span className="nm"><span style={{width:18,height:18,display:"inline-flex"}}>{nodeIcon(n.kind, true)}</span>{n.name}</span></td>
                  <td>{n.originalLocation ?? ""}</td>
                  <td>{fmtDate(n.modified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="exp-status">{items.length} item{items.length === 1 ? "" : "s"}</div>
      {ctx && (
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

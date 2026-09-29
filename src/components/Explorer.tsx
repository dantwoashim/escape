import { Fragment, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMeta, useActions, Win } from "../game/state";
import { FSNode, desktopNodes, findNode, pathTo } from "../game/content";
import { sortNodes, SortKey, fmtDate } from "../game/logic";
import { nodeIcon, IconBin } from "./icons";
import {
  ArrowLeft, ArrowRight, ArrowUp, SquaresFour, List, CaretUp, CaretDown,
} from "@phosphor-icons/react";

type View = "icons" | "details";

const virtualDesktop: FSNode = {
  id: "desktop", name: "Desktop", kind: "folder", location: "", modified: "2026-09-15T10:00:00",
  children: desktopNodes,
};

function folderOf(path: string[], roots: FSNode[]): FSNode | undefined {
  const last = path[path.length - 1];
  if (last === "desktop") return { ...virtualDesktop, children: roots };
  return findNode(last, roots);
}

export function treeOf(stateRoots: FSNode[]): FSNode {
  return { ...virtualDesktop, children: stateRoots };
}

export default function Explorer({ win }: { win: Win }) {
  const state = useMeta();
  const { dispatch, openNode } = useActions();
  const [view, setView] = useState<View>("icons");
  const [sel, setSel] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "name", asc: true });
  const hist = useRef<{ back: string[][]; fwd: string[][] }>({ back: [], fwd: [] });
  const [ctx, setCtx] = useState<{ x: number; y: number; node: FSNode } | null>(null);

  const folder = folderOf(win.path, state.fsRoots);
  const items = useMemo(
    () => sortNodes(folder?.children ?? [], sort.key, sort.asc),
    [folder, sort],
  );

  const nav = (path: string[]) => {
    hist.current.back.push(win.path);
    hist.current.fwd = [];
    dispatch({ type: "navigate", winId: win.id, path });
  };
  const goBack = () => {
    const p = hist.current.back.pop();
    if (p) { hist.current.fwd.push(win.path); dispatch({ type: "navigate", winId: win.id, path: p }); }
  };
  const goFwd = () => {
    const p = hist.current.fwd.pop();
    if (p) { hist.current.back.push(win.path); dispatch({ type: "navigate", winId: win.id, path: p }); }
  };
  const goUp = () => {
    if (win.path.length > 1) nav(win.path.slice(0, -1));
  };

  const open = (n: FSNode) => {
    if (n.kind === "folder") {
      if (n.id === "recycle-bin") { openNode(n); return; }
      nav([...win.path, n.id]);
    } else {
      openNode(n);
    }
  };

  const clickSort = (k: SortKey) => {
    setSort((s) => {
      if (s.key === k) return { key: k, asc: !s.asc };
      // first click on Date modified sorts newest-first
      return { key: k, asc: k !== "modified" };
    });
    if (k === "modified") dispatch({ type: "skill", k: "detailsSort" });
  };

  // breadcrumbs: ids from desktop to current
  const crumbs: { id: string; name: string }[] = [{ id: "desktop", name: "Desktop" }];
  {
    const last = win.path[win.path.length - 1];
    const root = state.fsRoots.find((r) => r.id === "box-root");
    if (last && last !== "desktop" && root) {
      const p = pathTo(last, root);
      if (p) {
        crumbs.length = 0;
        crumbs.push({ id: "desktop", name: "Desktop" });
        for (const cid of p) {
          const n = findNode(cid, state.fsRoots);
          if (n) crumbs.push({ id: cid, name: n.name });
        }
      }
    }
    // fallback for non-box paths
    if (crumbs.length === 1 && win.path[0] !== "desktop" && win.path.length) {
      const n = findNode(win.path[win.path.length - 1], state.fsRoots);
      if (n) crumbs.push({ id: n.id, name: n.name });
    }
  }

  const treeKids = (n: FSNode, depth: number): ReactNode => (
    <div key={n.id}>
      <div
        className={"tree-item" + (win.path[win.path.length - 1] === n.id ? " here" : "")}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={() => (n.id === "recycle-bin" ? openNode(n) : nav(navPathFor(n.id)))}
      >
        <span className="tic">
          {n.id === "recycle-bin"
            ? <IconBin size={16} full={(n.children?.length ?? 0) > 0} />
            : nodeIcon("folder", false, 16)}
        </span>
        <span>{n.name}</span>
      </div>
      {(n.children ?? [])
        .filter((c) => c.kind === "folder" || c.id === "recycle-bin")
        .map((c) => treeKids(c, depth + 1))}
    </div>
  );

  const navPathFor = (id: string): string[] => {
    const root = state.fsRoots.find((r) => r.id === "box-root");
    if (id === "desktop") return ["desktop"];
    if (root) {
      const p = pathTo(id, root);
      if (p) return p;
    }
    return [id];
  };

  const onItemContext = (e: React.MouseEvent, n: FSNode) => {
    e.preventDefault();
    setSel(n.id);
    setCtx({ x: e.clientX, y: e.clientY, node: n });
  };

  return (
    <div className="explorer" onClick={() => setCtx(null)}>
      <div className="exp-toolbar">
        <button className="nav-btn" aria-label="Back" disabled={!hist.current.back.length} onClick={goBack}>
          <ArrowLeft size={15} />
        </button>
        <button className="nav-btn" aria-label="Forward" disabled={!hist.current.fwd.length} onClick={goFwd}>
          <ArrowRight size={15} />
        </button>
        <button className="nav-btn" aria-label="Up" disabled={win.path.length <= 1} onClick={goUp}>
          <ArrowUp size={15} />
        </button>
        <div className="breadcrumb">
          {crumbs.map((c, i) => (
            <Fragment key={c.id + i}>
              {i > 0 && <span className="sep">›</span>}
              <button
                className={"crumb" + (i === crumbs.length - 1 ? " here" : "")}
                onClick={() => {
                  if (c.id === "desktop") nav(["desktop"]);
                  else nav(navPathFor(c.id));
                }}
              >
                {c.name}
              </button>
            </Fragment>
          ))}
        </div>
        <div className="view-switch" role="group" aria-label="View">
          <button className={view === "icons" ? "on" : ""} title="Large icons" onClick={() => setView("icons")}>
            <SquaresFour size={14} />
          </button>
          <button className={view === "details" ? "on" : ""} title="Details" onClick={() => setView("details")}>
            <List size={14} />
          </button>
        </div>
      </div>
      <div className="exp-main">
        <div className="exp-tree">
          <div
            className={"tree-item" + (win.path[0] === "desktop" || win.path[win.path.length-1] === "desktop" ? " here" : "")}
            onClick={() => nav(["desktop"])}
          >
            <span className="tic" />
            <span>Desktop</span>
          </div>
          {state.fsRoots
            .filter((r) => r.kind === "folder" || r.id === "recycle-bin")
            .map((r) => treeKids(r, 1))}
        </div>
        <div
          className="exp-list"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" && sel) {
              const n = findNode(sel, state.fsRoots);
              if (n) open(n);
            }
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }}
        >
          {items.length === 0 && <div className="empty-note">This folder is empty.</div>}
          {view === "icons" ? (
            <div className="icons-grid">
              {items.map((n) => (
                <button
                  key={n.id}
                  className={"file-ico" + (sel === n.id ? " selected" : "")}
                  onClick={() => setSel(n.id)}
                  onDoubleClick={() => open(n)}
                  onContextMenu={(e) => onItemContext(e, n)}
                  data-file={n.id}
                >
                  {nodeIcon(n.kind, !!n.password && !state.unlocked.includes(n.id))}
                  <span className="label">{n.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <table className="details">
              <thead>
                <tr>
                  {([["name", "Name"], ["modified", "Date modified"], ["type", "Type"], ["size", "Size"]] as [SortKey, string][]).map(([k, label]) => (
                    <th key={k} onClick={() => clickSort(k)} data-col={k}>
                      {label}{" "}
                      {sort.key === k && (sort.asc ? <CaretUp size={10} /> : <CaretDown size={10} />)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr
                    key={n.id}
                    className={sel === n.id ? "sel" : ""}
                    onClick={() => setSel(n.id)}
                    onDoubleClick={() => open(n)}
                    onContextMenu={(e) => onItemContext(e, n)}
                    data-file={n.id}
                  >
                    <td><span className="nm"><span style={{width:18,height:18,display:"inline-flex"}}>{nodeIcon(n.kind, !!n.password && !state.unlocked.includes(n.id))}</span>{n.name}</span></td>
                    <td>{fmtDate(n.modified)}</td>
                    <td>{typeName(n)}</td>
                    <td>{n.kind === "folder" ? "" : formatSize(n.size ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="exp-status">{items.length} item{items.length === 1 ? "" : "s"}</div>
      {ctx && (
        <div className="ctx-menu" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
          <button className="ctx-item" onClick={() => { setCtx(null); open(ctx.node); }}>Open</button>
          <div className="ctx-sep" />
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

export function typeName(n: FSNode): string {
  switch (n.kind) {
    case "folder": return "File folder";
    case "doc": return "Document";
    case "image": return "Picture";
    case "design": return "Design";
    case "app": return "Application";
  }
}

export function formatSize(b: number): string {
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

// ---------------- Properties dialog ----------------
export function Properties({ win }: { win: Win }) {
  const state = useMeta();
  const [tab, setTab] = useState<"general" | "details">("general");
  const n = findNode(win.nodeId ?? "", state.fsRoots);
  if (!n) return <div className="empty-note">File not found.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", gap: 4, padding: "10px 12px 0", borderBottom: "1px solid var(--line)" }}>
        {(["general", "details"] as const).map((t) => (
          <button
            key={t}
            className={"wbtn" + (tab === t ? " on" : "")}
            style={{ borderRadius: "6px 6px 0 0", textTransform: "capitalize", height: 32 }}
            onClick={() => setTab(t)}
          >
            {t === "general" ? "General" : "Details"}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16, fontSize: 13 }}>
        {tab === "general" ? (
          <table>
            <tbody>
              <Row k="Name" v={n.name} />
              <Row k="Type" v={typeName(n)} />
              <Row k="Location" v={n.location || "Desktop"} />
              <Row k="Size" v={n.kind === "folder" ? "—" : formatSize(n.size ?? 0)} />
              <Row k="Modified" v={fmtDate(n.modified)} />
            </tbody>
          </table>
        ) : (
          <table>
            <tbody>
              <Row k="Title" v={n.details?.title ?? ""} />
              <Row k="Comments" v={n.details?.comments ?? ""} />
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => (
  <tr>
    <td style={{ padding: "5px 18px 5px 0", color: "var(--ink-2)", verticalAlign: "top", whiteSpace: "nowrap" }}>{k}</td>
    <td style={{ padding: "5px 0" }}>{v}</td>
  </tr>
);

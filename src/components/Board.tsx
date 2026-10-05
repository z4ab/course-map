import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { chain, label, type CourseStatus, type Plan } from "../lib/graph";
import { newTermId, placeCourse } from "../lib/plan";
import type { Course, Edge } from "../lib/types";

interface Props {
  plan: Plan;
  setPlan: (p: Plan) => void;
  byId: Map<string, Course>;
  edges: Edge[];
  status: Map<string, CourseStatus>;
  selected: string | null;
  onSelect: (id: string) => void;
}

interface Geom extends Edge {
  d: string;
}

export const subjectColor = (subject: string) =>
  ({ CS: "var(--cs)", MATH: "var(--math)", STAT: "var(--stat)", CO: "var(--co)" })[subject] ?? "var(--other)";

const subjectOf = (id: string) => id.match(/^[A-Z]+/)?.[0] ?? "";

export default function Board({ plan, setPlan, byId, edges, status, selected, onSelect }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const [geom, setGeom] = useState<Geom[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const planned = useMemo(() => new Set([...plan.terms.flatMap((t) => t.courses), ...plan.unscheduled]), [plan]);
  const planEdges = useMemo(() => edges.filter((e) => planned.has(e.from) && planned.has(e.to)), [edges, planned]);

  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const br = board.getBoundingClientRect();
    const out: Geom[] = [];
    for (const e of planEdges) {
      const a = cardRefs.current.get(e.from);
      const b = cardRefs.current.get(e.to);
      if (!a || !b) continue;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const x1 = ra.right - br.left;
      const y1 = ra.top + ra.height / 2 - br.top;
      let x2 = rb.left - br.left - 2;
      const y2 = rb.top + rb.height / 2 - br.top;
      let d: string;
      if (x2 > x1) {
        const dx = Math.max(24, (x2 - x1) * 0.45);
        d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
      } else {
        // Same column or backwards (e.g. a coreq in the same term): loop out to the right.
        x2 = rb.right - br.left + 2;
        const bulge = 34;
        d = `M${x1},${y1} C${x1 + bulge},${y1} ${x2 + bulge},${y2} ${x2},${y2}`;
      }
      out.push({ ...e, d });
    }
    setGeom(out);
    setSize({ w: board.scrollWidth, h: board.scrollHeight });
  }, [planEdges]);

  useLayoutEffect(measure, [measure, plan, byId]);
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(board);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  const active = hover ?? selected;
  const lit = useMemo(() => (active && planned.has(active) ? chain(active, planEdges) : null), [active, planned, planEdges]);

  const drop = (target: string) => (ev: React.DragEvent) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/plain");
    setDropTarget(null);
    if (id) setPlan(placeCourse(plan, id, target));
  };
  const dragOver = (target: string) => (ev: React.DragEvent) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
    if (dropTarget !== target) setDropTarget(target);
  };

  const updateTerm = (id: string, patch: Partial<Plan["terms"][number]>) =>
    setPlan({ ...plan, terms: plan.terms.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const card = (id: string) => {
    const c = byId.get(id);
    const st = status.get(id);
    const flags: { text: string; tone: string }[] = [];
    if (st && !st.prereqMet) flags.push({ text: "Prereqs missing", tone: "bad" });
    if (st && !st.coreqMet) flags.push({ text: "Coreq missing", tone: "bad" });
    if (st?.notOffered) flags.push({ text: `Usually ${c?.offered.join("/")}`, tone: "warn" });
    if (!c) flags.push({ text: "Not in catalog", tone: "muted" });
    return (
      <div
        key={id}
        role="button"
        tabIndex={0}
        ref={(el) => {
          if (el) cardRefs.current.set(id, el);
          else cardRefs.current.delete(id);
        }}
        className={`card${lit?.has(id) ? " on" : ""}${selected === id ? " sel" : ""}`}
        style={{ "--subj": subjectColor(subjectOf(id)) } as React.CSSProperties}
        draggable
        onDragStart={(ev) => {
          ev.dataTransfer.setData("text/plain", id);
          ev.dataTransfer.effectAllowed = "move";
        }}
        onMouseEnter={() => setHover(id)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(id)}
        onBlur={() => setHover(null)}
        onClick={() => onSelect(id)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onSelect(id);
          }
        }}
      >
        <div className="code">{label(id)}</div>
        {c && <div className="title">{c.title}</div>}
        {flags.length > 0 && (
          <div className="flags">
            {flags.map((f) => (
              <span key={f.text} className={`flag ${f.tone}`}>{f.text}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="scroller">
      <div className={`board${lit ? " focus" : ""}`} ref={boardRef}>
        <svg className="edges" width={size.w} height={size.h} aria-hidden="true">
          <defs>
            {["arrow", "arrow-on", "arrow-co"].map((id) => (
              <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" style={id === "arrow-co" ? { fill: "var(--coreq)" } : undefined} />
              </marker>
            ))}
          </defs>
          {geom.map((g) => {
            const on = Boolean(lit?.has(g.from) && lit?.has(g.to));
            return (
              <path
                key={`${g.from}-${g.to}`}
                d={g.d}
                className={`e ${g.kind}${on ? " on" : ""}`}
                markerEnd={`url(#${g.kind === "coreq" ? "arrow-co" : on ? "arrow-on" : "arrow"})`}
              />
            );
          })}
        </svg>

        {plan.terms.map((t, i) => (
          <section
            key={t.id}
            className={`col${t.coop ? " coop" : ""}${dropTarget === t.id ? " drop" : ""}`}
            onDragOver={dragOver(t.id)}
            onDragLeave={() => setDropTarget(null)}
            onDrop={drop(t.id)}
            aria-label={`Term ${t.label}`}
          >
            <div className="col-head">
              <input className="t-label" id={`label-${t.id}`} aria-label="Term name" value={t.label} onChange={(e) => updateTerm(t.id, { label: e.target.value })} />
              <input className="t-season" id={`season-${t.id}`} aria-label="Season, e.g. F26" placeholder="F26" value={t.season} onChange={(e) => updateTerm(t.id, { season: e.target.value.toUpperCase() })} />
              <div className="col-meta">
                <label>
                  <input type="checkbox" id={`coop-${t.id}`} checked={t.coop} onChange={(e) => updateTerm(t.id, { coop: e.target.checked })} /> Work term
                </label>
                {t.courses.length === 0 && (
                  <button type="button" className="btn quiet" onClick={() => setPlan({ ...plan, terms: plan.terms.filter((x) => x.id !== t.id) })}>
                    Remove
                  </button>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    className="btn quiet"
                    aria-label="Move term left"
                    onClick={() => {
                      const terms = [...plan.terms];
                      [terms[i - 1], terms[i]] = [terms[i], terms[i - 1]];
                      setPlan({ ...plan, terms });
                    }}
                  >
                    ←
                  </button>
                )}
              </div>
            </div>
            {t.courses.map(card)}
            {t.courses.length === 0 && <div className="empty-col">Drag a course here</div>}
          </section>
        ))}

        <button
          type="button"
          className="add-term"
          onClick={() => setPlan({ ...plan, terms: [...plan.terms, { id: newTermId(), label: `Term ${plan.terms.length + 1}`, season: "", coop: false, courses: [] }] })}
        >
          + Add term
        </button>

        <section
          className={`col unsched${dropTarget === "unscheduled" ? " drop" : ""}`}
          onDragOver={dragOver("unscheduled")}
          onDragLeave={() => setDropTarget(null)}
          onDrop={drop("unscheduled")}
          aria-label="Unscheduled courses"
        >
          <div className="col-head">
            <span className="t-label">Unscheduled</span>
          </div>
          {plan.unscheduled.map(card)}
          {plan.unscheduled.length === 0 && <div className="empty-col">Courses you want but haven't placed</div>}
        </section>
      </div>
    </div>
  );
}

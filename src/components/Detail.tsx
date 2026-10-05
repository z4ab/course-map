import { useMemo } from "react";
import { hasFrom, label, satisfied, type Plan } from "../lib/graph";
import { allPlanned, locate } from "../lib/plan";
import type { Course, Edge } from "../lib/types";
import ReqTree from "./ReqTree";

interface Props {
  id: string;
  byId: Map<string, Course>;
  edges: Edge[];
  plan: Plan;
  satisfiers: Map<string, Set<string>>;
  onOpen: (id: string) => void;
  onPlace: (id: string, target: string) => void;
  onRemove: (id: string) => void;
}

const SEASON = { F: "Fall", W: "Winter", S: "Spring" } as const;

export default function Detail({ id, byId, edges, plan, satisfiers, onOpen, onPlace, onRemove }: Props) {
  const c = byId.get(id);
  const where = locate(plan, id);
  const termIndex = plan.terms.findIndex((t) => t.id === where);

  // What counts as "already taken" for this course: earlier terms if it's placed,
  // otherwise everything in the plan.
  const { before, upToHere } = useMemo(() => {
    if (termIndex < 0) {
      const all = allPlanned(plan).filter((x) => x !== id);
      return { before: all, upToHere: all };
    }
    const prior = plan.terms.slice(0, termIndex).flatMap((t) => t.courses);
    return { before: prior, upToHere: [...prior, ...plan.terms[termIndex].courses] };
  }, [plan, termIndex, id]);
  const hasBefore = hasFrom(before, satisfiers);
  const hasWith = hasFrom(upToHere, satisfiers);

  const leadsTo = useMemo(
    () => [...new Set(edges.filter((e) => e.from === id && e.kind !== "coreq").map((e) => e.to))],
    [edges, id],
  );
  const planned = new Set(allPlanned(plan));
  const clashes = c?.req.antireq.filter((a) => planned.has(a)) ?? [];
  const basis = termIndex < 0 ? "your plan" : `terms before ${plan.terms[termIndex].label}`;

  return (
    <div className="detail">
      <section>
        <span className="code-line">{label(id)}</span>
        <h2>{c?.title ?? "Not in the loaded catalog"}</h2>
        {c && c.offered.length > 0 && (
          <span className="count">Offered in {c.offered.map((s) => SEASON[s as keyof typeof SEASON]).join(", ")} in the fetched terms</span>
        )}
      </section>

      <section className="place">
        <select id="detail-place" aria-label="Where this course is planned" value={where ?? ""} onChange={(e) => e.target.value && onPlace(id, e.target.value)}>
          {!where && <option value="">Not in plan</option>}
          <option value="unscheduled">Unscheduled</option>
          {plan.terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}{t.season ? ` · ${t.season}` : ""}
            </option>
          ))}
        </select>
        {where && (
          <button type="button" className="btn" onClick={() => onRemove(id)}>Remove from plan</button>
        )}
      </section>

      {c?.description && <p className="desc">{c.description}</p>}

      {c && (
        <>
          <section>
            <h3>Prerequisites</h3>
            {c.req.prereq ? (
              <>
                <span className={`status-line ${satisfied(c.req.prereq, hasBefore) ? "ok" : "bad"}`}>
                  {satisfied(c.req.prereq, hasBefore) ? `Met by ${basis}` : `Not met by ${basis}`}
                </span>
                <div className="tree">
                  <ReqTree req={c.req.prereq} has={hasBefore} byId={byId} onOpen={onOpen} />
                </div>
              </>
            ) : (
              <span className="placeholder">No course prerequisites</span>
            )}
          </section>

          {c.req.coreq && (
            <section>
              <h3>Corequisites</h3>
              <span className={`status-line ${satisfied(c.req.coreq, hasWith) ? "ok" : "bad"}`}>
                {satisfied(c.req.coreq, hasWith) ? "Met (same term or earlier)" : "Not met yet"}
              </span>
              <div className="tree">
                <ReqTree req={c.req.coreq} has={hasWith} byId={byId} onOpen={onOpen} />
              </div>
            </section>
          )}

          {c.req.restrictions.length > 0 && (
            <section>
              <h3>Restrictions</h3>
              <ul className="list">
                {c.req.restrictions.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          {c.req.antireq.length > 0 && (
            <section>
              <h3>Can't also take</h3>
              {clashes.length > 0 && (
                <span className="status-line bad">Your plan also has {clashes.map(label).join(", ")}</span>
              )}
              <div className="links">
                {c.req.antireq.map((a) => (
                  <button key={a} type="button" className="link-chip" onClick={() => onOpen(a)}>{label(a)}</button>
                ))}
              </div>
            </section>
          )}

          {leadsTo.length > 0 && (
            <section>
              <h3>Leads to</h3>
              <div className="links">
                {leadsTo.map((a) => (
                  <button key={a} type="button" className="link-chip" onClick={() => onOpen(a)}>{label(a)}</button>
                ))}
              </div>
            </section>
          )}

          {c.substitutes.length > 0 && (
            <section>
              <h3>Counts as</h3>
              <div className="links">
                {c.substitutes.map((a) => (
                  <button key={a} type="button" className="link-chip" onClick={() => onOpen(a)}>{label(a)}</button>
                ))}
              </div>
            </section>
          )}

          {c.requirementsText && (
            <section>
              <h3>Calendar text</h3>
              <p className="raw">{c.requirementsText}</p>
              {c.req.warnings.length > 0 && (
                <span className="status-line bad">The parser wasn't sure about this one: {c.req.warnings.join("; ")}</span>
              )}
            </section>
          )}
          <span className="count">Minimum grades are shown but not checked, since the plan doesn't know your marks.</span>
        </>
      )}
    </div>
  );
}

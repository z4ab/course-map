import { useMemo, useState } from "react";
import { label, normalizeId, type Plan } from "../lib/graph";
import { locate } from "../lib/plan";
import type { Course } from "../lib/types";

interface Props {
  courses: Course[];
  plan: Plan;
  onAdd: (id: string, target: string) => void;
  onOpen: (id: string) => void;
}

const LIMIT = 80;

export default function Catalog({ courses, plan, onAdd, onOpen }: Props) {
  const [q, setQ] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [target, setTarget] = useState("unscheduled");

  const allSubjects = useMemo(() => [...new Set(courses.map((c) => c.subject))].sort(), [courses]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/\s+/g, " ");
    const compact = needle.replace(/\s/g, "");
    return courses.filter((c) => {
      if (subjects.length && !subjects.includes(c.subject)) return false;
      if (!needle) return true;
      return c.id.toLowerCase().startsWith(compact) || c.title.toLowerCase().includes(needle);
    });
  }, [courses, q, subjects]);

  const typed = normalizeId(q);
  const typedMissing = typed && !courses.some((c) => c.id === typed);

  return (
    <div className="search">
      <input
        type="search"
        id="catalog-search"
        placeholder="Search by code or title, e.g. CS 341 or machine learning"
        aria-label="Search courses"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="chips" role="group" aria-label="Filter by subject">
        {allSubjects.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            aria-pressed={subjects.includes(s)}
            onClick={() => setSubjects(subjects.includes(s) ? subjects.filter((x) => x !== s) : [...subjects, s])}
          >
            {s}
          </button>
        ))}
      </div>
      <label className="row-inline">
        Add to
        <select id="catalog-target" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="unscheduled">Unscheduled</option>
          {plan.terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}{t.season ? ` · ${t.season}` : ""}
            </option>
          ))}
        </select>
      </label>

      {typedMissing && (
        <div className="row-inline">
          {label(typed)} isn't in the loaded catalog.
          <button type="button" className="btn" onClick={() => onAdd(typed, target)}>Add anyway</button>
        </div>
      )}

      <span className="count">
        {results.length} course{results.length === 1 ? "" : "s"}
        {results.length > LIMIT ? `, showing the first ${LIMIT}` : ""}
      </span>
      <ul className="results">
        {results.slice(0, LIMIT).map((c) => {
          const where = locate(plan, c.id);
          const term = plan.terms.find((t) => t.id === where);
          return (
            <li key={c.id}>
              <button type="button" className="open" onClick={() => onOpen(c.id)}>
                <div className="code">{label(c.id)}</div>
                <div className="title">{c.title}</div>
              </button>
              {where ? (
                <span className="in-plan">{term ? term.label : "Unscheduled"}</span>
              ) : (
                <button type="button" className="btn" onClick={() => onAdd(c.id, target)} aria-label={`Add ${label(c.id)}`}>
                  Add
                </button>
              )}
              {c.offered.length > 0 && <span className="seasons">Offered {c.offered.join(" ")}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { label, satisfied, type Has } from "../lib/graph";
import type { Course, Req } from "../lib/types";

interface Props {
  req: Req;
  has: Has;
  byId: Map<string, Course>;
  onOpen: (id: string) => void;
}

/** Renders an all/any requirement tree with a check against what the plan already covers. */
export default function ReqTree({ req, has, byId, onOpen }: Props) {
  if (req.kind === "course") {
    const ok = has(req.id);
    const c = byId.get(req.id);
    return (
      <button type="button" className={`leaf ${ok ? "ok" : "no"}`} onClick={() => onOpen(req.id)} title={ok ? "In your plan before this course" : "Not in your plan before this course"}>
        <span className="mark" aria-label={ok ? "met" : "not met"}>{ok ? "✓" : "·"}</span>
        <span className="code">{label(req.id)}</span>
        {req.minGrade !== undefined && <span className="grade">≥ {req.minGrade}%</span>}
        {c && <span className="t">{c.title}</span>}
      </button>
    );
  }
  const ok = satisfied(req, has);
  return (
    <div className={`group${ok ? " ok" : ""}`}>
      <span className="gl">{req.kind === "all" ? "All of" : "One of"}</span>
      {req.items.map((r, i) => (
        <ReqTree key={i} req={r} has={has} byId={byId} onOpen={onOpen} />
      ))}
    </div>
  );
}

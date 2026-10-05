import type { Course, Edge, EdgeKind, Req } from "./types";

/**
 * Turn a requirement tree into edges. A course that every path through the tree
 * needs is "required"; one that sits under an "any" group is one of several options.
 */
export function edgesFor(target: string, req: Req | null, kind: "prereq" | "coreq"): Edge[] {
  const out: Edge[] = [];
  const walk = (r: Req, optional: boolean) => {
    if (r.kind === "course") {
      if (r.id === target) return;
      const k: EdgeKind = kind === "coreq" ? "coreq" : optional ? "oneOf" : "required";
      out.push({ from: r.id, to: target, kind: k });
    } else {
      r.items.forEach((it) => walk(it, optional || r.kind === "any"));
    }
  };
  if (req) walk(req, false);
  // A course can appear twice (e.g. CS 136L in two branches); keep the strongest kind.
  const rank: Record<EdgeKind, number> = { required: 0, coreq: 1, oneOf: 2 };
  const best = new Map<string, Edge>();
  for (const e of out) {
    const prev = best.get(e.from);
    if (!prev || rank[e.kind] < rank[prev.kind]) best.set(e.from, e);
  }
  return [...best.values()];
}

export function allEdges(courses: Course[]): Edge[] {
  return courses.flatMap((c) => [...edgesFor(c.id, c.req.prereq, "prereq"), ...edgesFor(c.id, c.req.coreq, "coreq")]);
}

/**
 * Map each course id to the set of courses that count as it: itself, plus any
 * course whose calendar note says it "may be substituted for" it (CS 146 for CS 136).
 */
export function buildSatisfiers(courses: Course[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const c of courses) {
    for (const target of c.substitutes) {
      if (!map.has(target)) map.set(target, new Set([target]));
      map.get(target)!.add(c.id);
    }
  }
  return map;
}

export type Has = (id: string) => boolean;

export function hasFrom(taken: Iterable<string>, satisfiers: Map<string, Set<string>>): Has {
  const set = new Set(taken);
  return (id) => {
    if (set.has(id)) return true;
    const subs = satisfiers.get(id);
    if (!subs) return false;
    for (const s of subs) if (set.has(s)) return true;
    return false;
  };
}

/** Grades are unknown when planning, so minimum grades are shown but not enforced. */
export function satisfied(req: Req | null, has: Has): boolean {
  if (!req) return true;
  if (req.kind === "course") return has(req.id);
  if (req.kind === "all") return req.items.every((r) => satisfied(r, has));
  return req.items.some((r) => satisfied(r, has));
}

export interface PlanTerm {
  id: string;
  label: string;
  season: string; // "F26", "W27", "" when unknown
  coop: boolean;
  courses: string[];
}

export interface Plan {
  terms: PlanTerm[];
  unscheduled: string[];
}

export interface CourseStatus {
  prereqMet: boolean;
  coreqMet: boolean;
  notOffered: boolean; // term season not in the course's offered seasons
}

/** Check each planned course against everything placed in earlier terms (coreqs may share the term). */
export function planStatus(plan: Plan, byId: Map<string, Course>, satisfiers: Map<string, Set<string>>): Map<string, CourseStatus> {
  const status = new Map<string, CourseStatus>();
  const before: string[] = [];
  for (const term of plan.terms) {
    const prior = hasFrom(before, satisfiers);
    const withThis = hasFrom([...before, ...term.courses], satisfiers);
    for (const id of term.courses) {
      const c = byId.get(id);
      const season = term.season.charAt(0).toUpperCase();
      status.set(id, {
        prereqMet: satisfied(c?.req.prereq ?? null, prior),
        coreqMet: satisfied(c?.req.coreq ?? null, withThis),
        notOffered: Boolean(c && c.offered.length && season && !term.coop && !c.offered.includes(season)),
      });
    }
    before.push(...term.courses);
  }
  return status;
}

/** Every course reachable upstream and downstream of `id` through the given edges. */
export function chain(id: string, edges: Edge[]): Set<string> {
  const set = new Set([id]);
  const walk = (cur: string, up: boolean) => {
    for (const e of edges) {
      const [src, dst] = up ? [e.to, e.from] : [e.from, e.to];
      if (src === cur && !set.has(dst)) {
        set.add(dst);
        walk(dst, up);
      }
    }
  };
  walk(id, true);
  walk(id, false);
  return set;
}

/** "CS341" -> "CS 341" */
export function label(id: string): string {
  const m = id.match(/^([A-Z]+)(\d.*)$/);
  return m ? `${m[1]} ${m[2]}` : id;
}

/** "cs 341", "CS341" -> "CS341" */
export function normalizeId(input: string): string | null {
  const m = input.trim().toUpperCase().match(/^([A-Z]{2,7})\s*(\d{3}[A-Z]?)$/);
  return m ? m[1] + m[2] : null;
}

import type { Plan, PlanTerm } from "./graph";

const STORAGE_KEY = "course-map:plan:v2";

let counter = 0;
export const newTermId = () => `t${Date.now().toString(36)}${(counter++).toString(36)}`;

const term = (label: string, season: string, courses: string[], coop = false): PlanTerm => ({
  id: newTermId(),
  label,
  season,
  coop,
  courses,
});

/** A typical CS co-op sequence, shown until the user starts editing. */
export function examplePlan(): Plan {
  return {
    terms: [
      term("1A", "F23", ["CS135", "MATH135", "MATH137", "COMMST223", "ECON101"]),
      term("1B", "W24", ["CS146", "CS136L", "MATH136", "MATH128", "ENGL108D", "ECON102"]),
      term("2A", "S24", ["CS245", "CS246", "STAT230", "PHIL145"]),
      term("2B", "S25", ["CS240", "CS241", "CS251", "MATH239", "ECON371"]),
      term("3A", "W26", ["CS341", "CS350", "STAT231", "ECON206", "PHYS111"]),
      term("Co-op", "S26", ["CS370"], true),
      term("3B", "F26", ["CS343", "CS348", "SCI206"]),
      term("4A", "F27", ["CS451", "CS454", "CS456"]),
      term("4B", "W28", ["CS488", "CS458", "CS492", "ECON372"]),
    ],
    unscheduled: ["CS444", "CS480"],
  };
}

function isPlan(x: unknown): x is Plan {
  const p = x as Plan;
  return (
    !!p && Array.isArray(p.terms) && Array.isArray(p.unscheduled) &&
    p.terms.every((t) => typeof t.id === "string" && typeof t.label === "string" && Array.isArray(t.courses))
  );
}

export function loadPlan(): Plan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isPlan(parsed)) return parsed;
    }
  } catch {
    /* storage unavailable or corrupt: fall back to the example */
  }
  return examplePlan();
}

export function savePlan(plan: Plan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    /* private mode or quota: the plan still works for this session */
  }
}

export function parsePlanFile(text: string): Plan {
  const parsed = JSON.parse(text);
  const plan = parsed?.plan ?? parsed;
  if (!isPlan(plan)) throw new Error("That file isn't a course map plan.");
  return {
    unscheduled: plan.unscheduled,
    terms: plan.terms.map((t) => ({ ...t, season: t.season ?? "", coop: Boolean(t.coop) })),
  };
}

/** Where a course currently sits: a term id, "unscheduled", or null. */
export function locate(plan: Plan, id: string): string | null {
  if (plan.unscheduled.includes(id)) return "unscheduled";
  return plan.terms.find((t) => t.courses.includes(id))?.id ?? null;
}

export function removeCourse(plan: Plan, id: string): Plan {
  return {
    unscheduled: plan.unscheduled.filter((c) => c !== id),
    terms: plan.terms.map((t) => ({ ...t, courses: t.courses.filter((c) => c !== id) })),
  };
}

/** Put a course in a term (or "unscheduled"), removing it from wherever it was. */
export function placeCourse(plan: Plan, id: string, target: string): Plan {
  const p = removeCourse(plan, id);
  if (target === "unscheduled") return { ...p, unscheduled: [...p.unscheduled, id] };
  return { ...p, terms: p.terms.map((t) => (t.id === target ? { ...t, courses: [...t.courses, id] } : t)) };
}

export function allPlanned(plan: Plan): string[] {
  return [...plan.terms.flatMap((t) => t.courses), ...plan.unscheduled];
}

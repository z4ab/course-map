import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/cs-2324.json";
import { buildDataset, seasonOf } from "../src/lib/build";
import { buildSatisfiers, chain, edgesFor, hasFrom, normalizeId, planStatus, satisfied, type Plan } from "../src/lib/graph";
import { parseRequirements } from "../src/lib/parse";

const data = buildDataset(fixtures, { source: "fixture", sample: true, terms: [] });
const byId = new Map(data.courses.map((c) => [c.id, c]));
const satisfiers = buildSatisfiers(data.courses);

describe("edges", () => {
  it("marks options under 'any' as oneOf and the rest as required", () => {
    const req = parseRequirements("Prereq: CS 341 and (STAT 206 or 231 or 241)").prereq;
    const edges = edgesFor("CS480", req, "prereq");
    expect(edges).toContainEqual({ from: "CS341", to: "CS480", kind: "required" });
    expect(edges).toContainEqual({ from: "STAT231", to: "CS480", kind: "oneOf" });
  });

  it("includes coreq edges", () => {
    expect(data.edges).toContainEqual({ from: "CS240", to: "CS348", kind: "coreq" });
  });
});

describe("substitutes", () => {
  it("lets CS 146 stand in for CS 136", () => {
    const has = hasFrom(["CS146"], satisfiers);
    expect(has("CS136")).toBe(true);
    expect(satisfied(byId.get("CS251")!.req.prereq, has)).toBe(true);
  });
});

describe("plan status", () => {
  const plan: Plan = {
    unscheduled: [],
    terms: [
      { id: "1a", label: "1A", season: "F23", coop: false, courses: ["CS135", "MATH135"] },
      { id: "1b", label: "1B", season: "W24", coop: false, courses: ["CS146", "CS136L"] },
      { id: "2a", label: "2A", season: "S24", coop: false, courses: ["CS245", "CS246", "STAT230"] },
      { id: "2b", label: "2B", season: "S25", coop: false, courses: ["CS240", "CS241", "CS251", "CS348", "CS350"] },
    ],
  };
  const status = planStatus(plan, byId, satisfiers);

  it("passes courses whose prereqs are in earlier terms", () => {
    expect(status.get("CS240")?.prereqMet).toBe(true);
    expect(status.get("CS245")?.prereqMet).toBe(true); // CS 146 counts as CS 136
  });

  it("allows a coreq in the same term", () => {
    expect(status.get("CS348")?.coreqMet).toBe(true);
  });

  it("flags a course planned in the same term as its prereqs", () => {
    expect(status.get("CS350")?.prereqMet).toBe(false);
  });
});

describe("helpers", () => {
  it("reads seasons from term codes", () => {
    expect([seasonOf("1269"), seasonOf("1271"), seasonOf("1275")]).toEqual(["F", "W", "S"]);
  });

  it("normalizes typed course codes", () => {
    expect(normalizeId("cs 341")).toBe("CS341");
    expect(normalizeId("STAT231")).toBe("STAT231");
    expect(normalizeId("hello")).toBeNull();
  });

  it("finds upstream and downstream courses", () => {
    const c = chain("CS350", data.edges);
    expect(c.has("CS240")).toBe(true);
    expect(c.has("CS454")).toBe(true);
    expect(c.has("CS480")).toBe(false);
  });
});

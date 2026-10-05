import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/cs-2324.json";
import { parseRequirements, parseSubstitutes, show } from "../src/lib/parse";

const prereq = (text: string) => show(parseRequirements(`Prereq: ${text}`).prereq);

describe("prerequisite trees", () => {
  it.each([
    // simple
    ["CS 350 or SE 350; Computer Science students only", "CS350 | SE350"],
    ["CS 137", "CS137"],
    // bare numbers inherit the subject, "/" means equivalent courses
    ["CS 240/240E and (MATH 239 or 249)", "(CS240 | CS240E) & (MATH239 | MATH249)"],
    ["CS 115 or 135 or 145", "CS115 | CS135 | CS145"],
    // a plain comma list means all of them
    ["CS 240/240E, 241/241E, 246/246E, (CS 251/251E or ECE 222)", "(CS240 | CS240E) & (CS241 | CS241E) & (CS246 | CS246E) & (CS251 | CS251E | ECE222)"],
    ["CS 341, 348 and (CS 350 or SE 350)", "CS341 & CS348 & (CS350 | SE350)"],
    // "one of" turns the comma list into alternatives
    [
      "(CS 245/245E or SE 212), (one of CS 241/241E, 246/246E, 247), (one of STAT 206, 230, 240)",
      "(CS245 | CS245E | SE212) & (CS241 | CS241E | CS246 | CS246E | CS247) & (STAT206 | STAT230 | STAT240)",
    ],
    ["(One of CS 136, 138, 146), MATH 135", "(CS136 | CS138 | CS146) & MATH135"],
    // grades before and after the course
    ["At least 90% in CS 115 or at least 70% in CS 116 or at least 60% in CS 135 or CS 145", "CS115≥90 | CS116≥70 | CS135≥60 | CS145"],
    ["CS 145 with a grade of at least 75%", "CS145≥75"],
    ["MATH 235 or 245 with grade at least 80%", "MATH235≥80 | MATH245≥80"],
    ["(AMATH 242/CS 371 or CS 370) and (STAT 206 with at least 60% or STAT 231 or STAT 241)", "(AMATH242 | CS371 | CS370) & (STAT206≥60 | STAT231 | STAT241)"],
    // a grade in front of a group applies to every course in it
    ["A grade of 85% or higher in one of CS 136, 138 or 146", "CS136≥85 | CS138≥85 | CS146≥85"],
    ["CS 136L, a grade of 85% in either CS 136 or CS 146", "CS136L & (CS136≥85 | CS146≥85)"],
    // "and" binds tighter than "or"
    [
      "CS 138 or (CS 246/246E and CS 136L) or (CS 136L and a grade of 85% or higher in one of CS 136 or 146)",
      "CS138 | ((CS246 | CS246E) & CS136L) | (CS136L & (CS136≥85 | CS146≥85))",
    ],
    // ", or" joins clauses with "or"
    [
      "(CS 136L and a grade of 85% or higher in one of CS 136 or CS 146), or a grade of 85% or higher in CS 138",
      "(CS136L & (CS136≥85 | CS146≥85)) | CS138≥85",
    ],
    // "; or" continues the previous clause
    [
      "One of CS 230, 231, 234, 246/246E, 330; or (AFM 341 and (CS 116 or CS 136 or CS 146))",
      "CS230 | CS231 | CS234 | CS246 | CS246E | CS330 | (AFM341 & (CS116 | CS136 | CS146))",
    ],
    // ";" inside parentheses is "and"
    ["One of CS 116, 136, 138, 146 or (CS 114 with at least 60%; CS 115 or CS 135)", "CS116 | CS136 | CS138 | CS146 | (CS114≥60 & (CS115 | CS135))"],
  ])("%s", (text, expected) => {
    expect(prereq(text)).toBe(expected);
  });
});

describe("other sections", () => {
  it("keeps restrictions as text", () => {
    const r = parseRequirements("Prereq: CS 330; Level at least 3A; Not open to Computer Science students. Antireq: CS 446/ECE 452, SE 464");
    expect(show(r.prereq)).toBe("CS330");
    expect(r.restrictions).toEqual(["Level at least 3A", "Not open to Computer Science students"]);
    expect(r.antireq).toEqual(["CS446", "ECE452", "SE464"]);
  });

  it("reads coreqs separately from prereqs", () => {
    const r = parseRequirements("Prereq: Computer Science and BMath (Data Science) students only. Coreq: CS 240/240E. Antireq: CS 338, ECE 356, 456, MSCI 346");
    expect(r.prereq).toBeNull();
    expect(show(r.coreq)).toBe("CS240 | CS240E");
    expect(r.antireq).toEqual(["CS338", "ECE356", "ECE456", "MSCI346"]);
    expect(r.restrictions).toEqual(["Computer Science and BMath (Data Science) students only"]);
  });

  it("keeps text before the first label", () => {
    const r = parseRequirements("Department Consent Required. Antireq: CS 115, 135, 137, 138");
    expect(r.restrictions).toEqual(["Department Consent Required"]);
    expect(r.antireq).toEqual(["CS115", "CS135", "CS137", "CS138"]);
  });

  it("treats an antireq with no courses as a restriction", () => {
    const r = parseRequirements("Antireq: All second,third or fourth year CS courses or equivalents");
    expect(r.antireq).toEqual([]);
    expect(r.restrictions[0]).toMatch(/^Antireq: All second/);
  });

  it("reads substitution notes from descriptions", () => {
    expect(parseSubstitutes("[Note: This course may be substituted for CS 136 in any degree plan]")).toEqual(["CS136"]);
  });
});

describe("2023-24 CS calendar fixture", () => {
  const parsed = fixtures.map((c) => ({ id: c.subjectCode + c.catalogNumber, ...parseRequirements(c.requirementsDescription) }));

  it("parses every course", () => {
    expect(parsed).toHaveLength(fixtures.length);
  });

  it("only warns on the known typos in the source text", () => {
    const warned = parsed.filter((p) => p.warnings.length).map((p) => p.id);
    // CS 335 has an extra ")" and CS 449 writes "241CS/241E".
    expect(warned.sort()).toEqual(["CS335", "CS449"]);
  });
});

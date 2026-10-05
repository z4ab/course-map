/** A requirement expression parsed from calendar text. */
export type Req =
  | { kind: "course"; id: string; minGrade?: number }
  | { kind: "all"; items: Req[]; minGrade?: number }
  | { kind: "any"; items: Req[]; minGrade?: number };

/** Everything we could read out of a course's requirement text. */
export interface ParsedRequirements {
  prereq: Req | null;
  coreq: Req | null;
  antireq: string[];
  /** Non-course conditions, e.g. "Computer Science students only", "Level at least 3A". */
  restrictions: string[];
  /** Words or fragments the parser skipped. Non-empty means a human should check this course. */
  warnings: string[];
}

/** One course as written to public/data/courses.json. */
export interface Course {
  id: string; // "CS341"
  subject: string; // "CS"
  number: string; // "341"
  title: string;
  description: string;
  /** Original requirement text from the API, kept so the UI can always show the source. */
  requirementsText: string;
  req: ParsedRequirements;
  /** Courses this one may stand in for, from "[Note: ... may be substituted for CS 136 ...]". */
  substitutes: string[];
  /** Seasons the course was offered in the fetched terms: "F", "W", "S". */
  offered: string[];
}

export type EdgeKind = "required" | "oneOf" | "coreq";

export interface Edge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface Dataset {
  generatedAt: string;
  source: string;
  sample: boolean;
  terms: string[];
  courses: Course[];
  edges: Edge[];
}

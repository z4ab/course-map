import type { ParsedRequirements, Req } from "./types";

/*
 * Reads University of Waterloo calendar requirement text, e.g.
 *
 *   "Prereq: (CS 245/245E or SE 212), (one of CS 241/241E, 246/246E, 247),
 *    (one of STAT 206, 230, 240); Computer Science students only.
 *    Antireq: BME 122, CS 240E"
 *
 * into a logic tree of `all` / `any` groups over course ids, plus the
 * non-course conditions ("Computer Science students only") as plain text.
 *
 * Conventions in the calendar that the grammar encodes:
 *   - Top-level ";" and ". " separate independent conditions (all must hold).
 *   - A comma list is "all of", except after "one of", where it is "any of".
 *   - "/" joins equivalent or cross-listed courses: "CS 240/240E" = either one.
 *   - "and" binds tighter than "or".
 *   - A bare number inherits the last subject: "MATH 239 or 249" = MATH 249.
 *   - Grades come before ("at least 60% in CS 135") or after
 *     ("CS 135 with at least 60%") the course they apply to.
 *
 * Anything the parser cannot place is reported in `warnings` rather than guessed.
 */

type Tok =
  | { t: "LP" | "RP" | "COMMA" | "SEMI" | "SLASH" | "AND" | "OR" | "ONEOF" }
  | { t: "GRADE"; n: number; prefix: boolean }
  | { t: "COURSE"; subject: string; num: string }
  | { t: "NUM"; num: string }
  | { t: "WORD"; w: string };

const SECTION_RE = /\b(Prereq(?:uisites?)?|Coreq(?:uisites?)?|Antireq(?:uisites?)?)\s*:/gi;

/** Words that carry no meaning for the tree once grades and "one of" are tokenized. */
const FILLER = new Set([
  "a", "an", "at", "least", "grade", "grades", "of", "with", "minimum", "min", "in",
  "both", "the", "following", "earned", "obtained", "mark", "final", "higher",
  "better", "more", "equivalent", "equivalents", "courses", "course",
]);

const COURSE_RE = /\b[A-Z]{2,7}\s?\d{3}[A-Z]?\b/;

export function tokenize(text: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const rest = () => text.slice(i);
  while (i < text.length) {
    const s = rest();
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^\s+/))) { i += m[0].length; continue; }
    const c = s[0];
    if (c === "(" || c === "[") { toks.push({ t: "LP" }); i++; continue; }
    if (c === ")" || c === "]") { toks.push({ t: "RP" }); i++; continue; }
    if (c === ",") { toks.push({ t: "COMMA" }); i++; continue; }
    if (c === ";") { toks.push({ t: "SEMI" }); i++; continue; }
    if (c === "/") { toks.push({ t: "SLASH" }); i++; continue; }
    // "60%", "85% or higher in", "70% in"
    if ((m = s.match(/^(\d{1,3})\s*%(\s*or\s+(?:higher|more|better))?(\s+in\b)?/i))) {
      toks.push({ t: "GRADE", n: Number(m[1]), prefix: Boolean(m[3]) });
      i += m[0].length;
      continue;
    }
    if ((m = s.match(/^([A-Z]{2,7})\s?(\d{3}[A-Z]?)\b/))) {
      toks.push({ t: "COURSE", subject: m[1], num: m[2] });
      i += m[0].length;
      continue;
    }
    if ((m = s.match(/^(\d{3}[A-Z]?)\b/)) || (m = s.match(/^(\d{3})(?=[A-Z]{2,})/))) {
      toks.push({ t: "NUM", num: m[1] });
      i += m[0].length;
      continue;
    }
    // "one of A, B, C" and "either A or B" both mean any single item satisfies the group.
    if ((m = s.match(/^(?:one\s+of|either)\b/i))) { toks.push({ t: "ONEOF" }); i += m[0].length; continue; }
    if ((m = s.match(/^[A-Za-z][A-Za-z'-]*/))) {
      const w = m[0];
      const lw = w.toLowerCase();
      if (lw === "and") toks.push({ t: "AND" });
      else if (lw === "or") toks.push({ t: "OR" });
      else if (!FILLER.has(lw)) toks.push({ t: "WORD", w });
      i += w.length;
      continue;
    }
    // Stray punctuation such as "." or "-": skip.
    i++;
  }
  return toks;
}

class Parser {
  private p = 0;
  private subject: string | null;
  constructor(private toks: Tok[], private warnings: string[], subject: string | null = null) {
    this.subject = subject;
  }
  private peek(): Tok | undefined { return this.toks[this.p]; }
  private is(t: Tok["t"]) { return this.peek()?.t === t; }
  private next() { return this.toks[this.p++]; }
  done() { return this.p >= this.toks.length; }

  /** Comma/semicolon separated list where every item is required. */
  list(top: boolean): Req | null {
    const items: (Req | null)[] = [];
    while (!this.done()) {
      if (this.is("RP")) {
        if (!top) break;
        this.warnings.push("unmatched ')'");
        this.next();
        continue;
      }
      // "(A and B), or C": the comma ends the clause but "or" joins it to the next one.
      if (this.is("COMMA") && this.toks[this.p + 1]?.t === "OR" && items.length) {
        this.p += 2;
        items.push(group("any", [items.pop() ?? null, this.or()]));
        continue;
      }
      if (this.is("COMMA") || this.is("SEMI") || this.is("AND")) { this.next(); continue; }
      const before = this.p;
      items.push(this.or());
      if (this.p === before) this.next(); // guarantee progress
    }
    return group("all", items);
  }

  or(): Req | null {
    const items = [this.and()];
    while (this.is("OR")) {
      this.next();
      items.push(this.and());
    }
    // "MATH 235 or 245 with grade at least 80%": a grade that only the last of several
    // plain courses carries is read as applying to the whole list.
    const last = items[items.length - 1];
    const rest = items.slice(0, -1);
    if (
      rest.length &&
      last?.kind === "course" && last.minGrade !== undefined &&
      rest.every((r) => r?.kind === "course" && r.minGrade === undefined)
    ) {
      rest.forEach((r) => r && applyGrade(r, last.minGrade!));
    }
    return group("any", items);
  }

  and(): Req | null {
    const items = [this.unit()];
    while (this.is("AND")) {
      this.next();
      items.push(this.unit());
    }
    return group("all", items);
  }

  unit(): Req | null {
    const tok = this.peek();
    if (!tok) return null;
    let node: Req | null = null;
    switch (tok.t) {
      case "GRADE": {
        this.next();
        node = this.unit();
        if (node) applyGrade(node, tok.n);
        else this.warnings.push(`grade ${tok.n}% not attached to a course`);
        return node;
      }
      case "LP": {
        this.next();
        node = this.list(false);
        if (this.is("RP")) this.next();
        else this.warnings.push("missing ')'");
        break;
      }
      case "ONEOF": {
        this.next();
        node = this.oneOf();
        break;
      }
      case "COURSE":
      case "NUM":
        node = this.courseRef();
        break;
      case "WORD":
        this.next();
        this.warnings.push(`skipped "${tok.w}"`);
        return null;
      default:
        return null;
    }
    const g = this.peek();
    if (node && g?.t === "GRADE" && !g.prefix) {
      this.next();
      applyGrade(node, g.n);
    }
    return node;
  }

  /** After "one of": a comma list where any item satisfies the group. */
  oneOf(): Req | null {
    const items = [this.or()];
    while (this.is("COMMA")) {
      this.next();
      if (this.is("OR")) this.next(); // "A, B, or C"
      items.push(this.or());
    }
    return group("any", items);
  }

  /** "CS 240/240E", "AMATH 242/CS 371", "249" (inherits the last subject). */
  courseRef(): Req | null {
    const ids: string[] = [];
    const read = (): boolean => {
      const tok = this.peek();
      if (tok?.t === "COURSE") {
        this.next();
        this.subject = tok.subject;
        ids.push(tok.subject + tok.num);
        return true;
      }
      if (tok?.t === "NUM") {
        this.next();
        if (!this.subject) {
          this.warnings.push(`number ${tok.num} has no subject`);
          return true;
        }
        ids.push(this.subject + tok.num);
        return true;
      }
      return false;
    };
    read();
    while (this.is("SLASH")) {
      const save = this.p;
      this.next();
      if (!read()) { this.p = save; break; }
    }
    return group("any", ids.map((id) => ({ kind: "course", id }) as Req));
  }

  get lastSubject() { return this.subject; }
}

function applyGrade(node: Req, n: number) {
  if (node.kind === "course") {
    if (node.minGrade === undefined) node.minGrade = n;
  } else node.items.forEach((it) => applyGrade(it, n));
}

/** Build a group, dropping empties, unwrapping singletons and flattening same-kind children. */
function group(kind: "all" | "any", raw: (Req | null)[]): Req | null {
  const items: Req[] = [];
  for (const r of raw) {
    if (!r) continue;
    if (r.kind === kind) items.push(...r.items);
    else items.push(r);
  }
  const seen = new Set<string>();
  const unique = items.filter((r) => {
    const key = JSON.stringify(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];
  return { kind, items: unique };
}

/** Split on top-level ";" and sentence breaks, ignoring separators inside parentheses. */
function splitClauses(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth = Math.max(0, depth - 1);
    const sentenceEnd = c === "." && /^\s+[A-Z]/.test(text.slice(i + 1)) && depth === 0;
    if ((c === ";" && depth === 0) || sentenceEnd) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  const clauses = out.map((s) => s.trim().replace(/\.$/, "").trim()).filter(Boolean);
  // "One of CS 230, 231; or (AFM 341 and ...)": a clause opening with "or" continues the previous one.
  const merged: string[] = [];
  for (const c of clauses) {
    if (/^or\b/i.test(c) && merged.length) merged[merged.length - 1] += ` ${c}`;
    else merged.push(c);
  }
  return merged;
}

function isRestriction(clause: string): boolean {
  if (/^(not open|open only|level\b|only open|students in)/i.test(clause)) return true;
  return !COURSE_RE.test(clause);
}

function parseExpression(text: string, warnings: string[], restrictions: string[], subject: string | null): Req | null {
  const nodes: (Req | null)[] = [];
  let last = subject;
  for (const clause of splitClauses(text)) {
    if (isRestriction(clause)) {
      restrictions.push(clause);
      continue;
    }
    const local: string[] = [];
    const parser = new Parser(tokenize(clause), local, last);
    nodes.push(parser.list(true));
    last = parser.lastSubject;
    warnings.push(...local.map((w) => `${w} in "${clause}"`));
  }
  return group("all", nodes);
}

function parseCourseList(text: string, warnings: string[]): string[] {
  const ids: string[] = [];
  let subject: string | null = null;
  for (const tok of tokenize(text)) {
    if (tok.t === "COURSE") {
      subject = tok.subject;
      ids.push(tok.subject + tok.num);
    } else if (tok.t === "NUM") {
      if (subject) ids.push(subject + tok.num);
      else warnings.push(`antireq number ${tok.num} has no subject`);
    }
  }
  return [...new Set(ids)];
}

/** Parse a full requirement string ("Prereq: ... Coreq: ... Antireq: ..."). */
export function parseRequirements(text: string | null | undefined): ParsedRequirements {
  const result: ParsedRequirements = { prereq: null, coreq: null, antireq: [], restrictions: [], warnings: [] };
  if (!text) return result;
  const clean = text.replace(/\s+/g, " ").trim();

  const labels = [...clean.matchAll(SECTION_RE)];
  const lead = clean.slice(0, labels[0]?.index ?? clean.length).trim().replace(/\.$/, "");
  if (lead) result.restrictions.push(lead);

  labels.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = labels[i + 1]?.index ?? clean.length;
    const body = clean.slice(start, end).trim();
    const label = m[1].toLowerCase();
    if (label.startsWith("prereq")) {
      result.prereq = combine(result.prereq, parseExpression(body, result.warnings, result.restrictions, null));
    } else if (label.startsWith("coreq")) {
      result.coreq = combine(result.coreq, parseExpression(body, result.warnings, result.restrictions, null));
    } else {
      const ids = parseCourseList(body, result.warnings);
      if (ids.length) result.antireq.push(...ids);
      else result.restrictions.push(`Antireq: ${body.replace(/\.$/, "")}`);
    }
  });
  return result;
}

function combine(a: Req | null, b: Req | null): Req | null {
  return group("all", [a, b]);
}

/** "[Note: This course may be substituted for CS 136 in any degree plan ...]" */
export function parseSubstitutes(description: string): string[] {
  const ids = new Set<string>();
  for (const m of description.matchAll(/may be substituted for ([A-Z]{2,7})\s?(\d{3}[A-Z]?)/g)) {
    ids.add(m[1] + m[2]);
  }
  return [...ids];
}

/** Every course id that appears anywhere in a tree. */
export function courseIds(req: Req | null): string[] {
  if (!req) return [];
  if (req.kind === "course") return [req.id];
  return req.items.flatMap(courseIds);
}

/** Pretty-print a tree, e.g. "CS240 & (MATH239 | MATH249)". Used by tests and the parse report. */
export function show(req: Req | null): string {
  if (!req) return "∅";
  if (req.kind === "course") return req.minGrade !== undefined ? `${req.id}≥${req.minGrade}` : req.id;
  const sep = req.kind === "all" ? " & " : " | ";
  return req.items.map((r) => (r.kind === "course" ? show(r) : `(${show(r)})`)).join(sep);
}

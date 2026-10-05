import { allEdges } from "./graph";
import { parseRequirements, parseSubstitutes } from "./parse";
import type { Course, Dataset } from "./types";

/** The fields we use from a UW Open Data API v3 course record (plus the terms we saw it in). */
export interface RawCourse {
  subjectCode: string;
  catalogNumber: string;
  title: string;
  description?: string | null;
  requirementsDescription?: string | null;
  termCodes?: string[];
}

/** UW term codes are 1YYM: 1269 = Fall 2026, 1271 = Winter 2027, 1275 = Spring 2027. */
export function seasonOf(termCode: string): "F" | "W" | "S" | null {
  return ({ "9": "F", "1": "W", "5": "S" } as const)[termCode.slice(-1) as "9" | "1" | "5"] ?? null;
}

export function buildCourse(raw: RawCourse): Course {
  const subject = raw.subjectCode.trim().toUpperCase();
  const number = raw.catalogNumber.trim().toUpperCase();
  const description = (raw.description ?? "").trim();
  const requirementsText = (raw.requirementsDescription ?? "").trim();
  const offered = [...new Set((raw.termCodes ?? []).map(seasonOf).filter((s): s is "F" | "W" | "S" => Boolean(s)))];
  return {
    id: subject + number,
    subject,
    number,
    title: raw.title.trim(),
    description,
    requirementsText,
    req: parseRequirements(requirementsText),
    substitutes: parseSubstitutes(description),
    offered: ["F", "W", "S"].filter((s) => offered.includes(s as "F")),
  };
}

export function buildDataset(raw: RawCourse[], meta: { source: string; sample: boolean; terms: string[] }): Dataset {
  const courses = raw.map(buildCourse).sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  return {
    generatedAt: new Date().toISOString(),
    source: meta.source,
    sample: meta.sample,
    terms: meta.terms,
    courses,
    edges: allEdges(courses),
  };
}

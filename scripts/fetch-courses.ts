/**
 * Download course records from the UW Open Data API v3 and save them to data/raw/.
 *
 *   UW_API_KEY=... npm run data:fetch
 *   npm run data:fetch -- --subjects CS,MATH --terms 6
 *
 * The API only lists courses in terms where they are offered, so we read several
 * recent terms and merge them. The newest record wins, and every term a course
 * appeared in is kept so the app can show when it is usually offered.
 *
 * Get a free key at https://uwaterloo.ca/api/register
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { RawCourse } from "../src/lib/build";

// UW_API_BASE is only for tests against a local mock.
const API = process.env.UW_API_BASE ?? "https://openapi.data.uwaterloo.ca/v3";
const DEFAULT_SUBJECTS = ["CS", "MATH", "STAT", "CO"];
const DEFAULT_TERMS = 6; // two years of fall/winter/spring

interface ApiTerm {
  termCode: string;
  name: string;
  termBeginDate: string;
}

interface ApiCourse {
  subjectCode: string;
  catalogNumber: string;
  title: string;
  description?: string | null;
  requirementsDescription?: string | null;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (existsSync(".env")) process.loadEnvFile(".env");
const key = process.env.UW_API_KEY;
if (!key) {
  console.error("UW_API_KEY is not set. Register for a free key at https://uwaterloo.ca/api/register,\nthen put UW_API_KEY=... in .env or export it.");
  process.exit(1);
}

async function get<T>(path: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API + path, { headers: { "x-api-key": key!, accept: "application/json" } });
    if (res.ok) return (await res.json()) as T;
    // 404 means "no courses for this subject in this term", which is normal.
    if (res.status === 404) return [] as T;
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${path}: ${(await res.text()).slice(0, 200)}`);
  }
}

const subjects = (arg("subjects")?.split(",") ?? DEFAULT_SUBJECTS).map((s) => s.trim().toUpperCase());
const termCount = Number(arg("terms") ?? DEFAULT_TERMS);

const allTerms = await get<ApiTerm[]>("/Terms");
if (!Array.isArray(allTerms) || !allTerms.every((t) => t.termCode && t.termBeginDate)) {
  throw new Error("Unexpected /Terms response; the API format may have changed.");
}
// Terms that have started, newest first, plus the next upcoming term (often already scheduled).
const now = Date.now();
const sorted = [...allTerms].sort((a, b) => b.termBeginDate.localeCompare(a.termBeginDate));
const started = sorted.filter((t) => Date.parse(t.termBeginDate) <= now);
const upcoming = sorted.filter((t) => Date.parse(t.termBeginDate) > now).slice(-1);
const terms = [...upcoming, ...started.slice(0, termCount)];
console.log(`Terms: ${terms.map((t) => `${t.name} (${t.termCode})`).join(", ")}`);
console.log(`Subjects: ${subjects.join(", ")}`);

const merged = new Map<string, RawCourse>();
// Oldest first, so newer records overwrite older ones.
for (const term of [...terms].reverse()) {
  for (const subject of subjects) {
    const list = await get<ApiCourse[]>(`/Courses/${term.termCode}/${subject}`);
    for (const c of list) {
      const id = c.subjectCode.trim() + c.catalogNumber.trim();
      const prev = merged.get(id);
      merged.set(id, {
        subjectCode: c.subjectCode,
        catalogNumber: c.catalogNumber,
        title: c.title,
        description: c.description ?? prev?.description ?? "",
        requirementsDescription: c.requirementsDescription ?? prev?.requirementsDescription ?? "",
        termCodes: [...new Set([...(prev?.termCodes ?? []), term.termCode])],
      });
    }
    console.log(`  ${term.termCode} ${subject}: ${list.length}`);
    await new Promise((r) => setTimeout(r, 150)); // be polite
  }
}

const outDir = process.env.UW_OUT_DIR ?? "data/raw";
await mkdir(outDir, { recursive: true });
const out = {
  fetchedAt: new Date().toISOString(),
  terms: terms.map((t) => t.termCode),
  subjects,
  courses: [...merged.values()],
};
await writeFile(`${outDir}/courses.json`, JSON.stringify(out, null, 2));
console.log(`Saved ${out.courses.length} courses to ${outDir}/courses.json`);

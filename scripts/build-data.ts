/**
 * Parse raw course records into the dataset the app loads, and write a report of
 * everything the parser was unsure about.
 *
 *   npm run data:build            # from data/raw/courses.json (run data:fetch first)
 *   npm run data:sample           # from fixtures/cs-2324.json, no API key needed
 *
 * Outputs:
 *   public/data/courses.json      the app's data
 *   data/parse-report.md          courses with parser warnings, for manual review
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildDataset, type RawCourse } from "../src/lib/build";
import { show } from "../src/lib/parse";

const sample = process.argv.includes("--sample");

let raw: RawCourse[];
let terms: string[] = [];
let source: string;
if (sample) {
  raw = JSON.parse(await readFile("fixtures/cs-2324.json", "utf8"));
  source = "Sample: CS courses from the 2023-24 Undergraduate Calendar";
} else {
  const file = JSON.parse(await readFile("data/raw/courses.json", "utf8").catch(() => {
    console.error("data/raw/courses.json not found. Run `npm run data:fetch` first, or `npm run data:sample`.");
    process.exit(1);
  }));
  raw = file.courses;
  terms = file.terms;
  source = `UW Open Data API: ${file.subjects.join(", ")}, terms ${file.terms.join(", ")}`;
}

const data = buildDataset(raw, { source, sample, terms });
await mkdir("public/data", { recursive: true });
await writeFile("public/data/courses.json", JSON.stringify(data));

const flagged = data.courses.filter((c) => c.req.warnings.length);
const lines = [
  "# Parse report",
  "",
  `Source: ${source}`,
  `Generated: ${data.generatedAt}`,
  "",
  `${data.courses.length} courses, ${data.edges.length} edges, ${flagged.length} with warnings.`,
  "",
  ...flagged.flatMap((c) => [
    `## ${c.subject} ${c.number}: ${c.title}`,
    "",
    `- Source text: ${c.requirementsText}`,
    `- Prereq read as: \`${show(c.req.prereq)}\``,
    ...c.req.warnings.map((w) => `- Warning: ${w}`),
    "",
  ]),
];
await writeFile("data/parse-report.md", lines.join("\n"));

console.log(`Wrote ${data.courses.length} courses and ${data.edges.length} edges to public/data/courses.json`);
console.log(`${flagged.length} courses need a look; see data/parse-report.md`);

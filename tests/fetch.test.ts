import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/*
 * Runs scripts/fetch-courses.ts against a local mock of the UW Open Data API v3
 * to check term selection, merging across terms, and the key header.
 */
const run = promisify(execFile);
const day = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);

const terms = [
  { termCode: "1259", name: "Fall 2025", termBeginDate: iso(-400) },
  { termCode: "1261", name: "Winter 2026", termBeginDate: iso(-280) },
  { termCode: "1265", name: "Spring 2026", termBeginDate: iso(-160) },
  { termCode: "1269", name: "Fall 2026", termBeginDate: iso(-30) },
  { termCode: "1271", name: "Winter 2027", termBeginDate: iso(90) },
  { termCode: "1275", name: "Spring 2027", termBeginDate: iso(210) },
];

const courses: Record<string, Record<string, object[]>> = {
  "1261": { CS: [{ subjectCode: "CS", catalogNumber: "341", title: "Algorithms (old title)", description: "old", requirementsDescription: "Prereq: CS 240" }] },
  "1269": { CS: [{ subjectCode: "CS", catalogNumber: "341", title: "Algorithms", description: "new", requirementsDescription: "Prereq: CS 240/240E and (MATH 239 or 249)" }] },
  "1271": { CS: [{ subjectCode: "CS", catalogNumber: "350", title: "Operating Systems", description: "", requirementsDescription: "Prereq: CS 240, 241, 246, 251" }] },
};

let server: Server;
let base = "";
const seenKeys = new Set<string>();
const paths: string[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    seenKeys.add(String(req.headers["x-api-key"]));
    paths.push(req.url ?? "");
    const json = (code: number, body: unknown) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.url === "/Terms") return json(200, terms);
    const m = req.url?.match(/^\/Courses\/(\d+)\/(\w+)$/);
    const list = m ? courses[m[1]]?.[m[2]] : undefined;
    return list ? json(200, list) : json(404, { message: "not found" });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
});
afterAll(() => server.close());

describe("fetch-courses", () => {
  it("reads recent terms plus the next one and keeps the newest record", async () => {
    const out = mkdtempSync(join(tmpdir(), "course-map-"));
    await run("npx", ["tsx", "scripts/fetch-courses.ts", "--subjects", "CS", "--terms", "3"], {
      env: { ...process.env, UW_API_KEY: "test-key", UW_API_BASE: base, UW_OUT_DIR: out },
    });
    const file = JSON.parse(readFileSync(join(out, "courses.json"), "utf8"));

    // Three started terms (newest first) plus the next upcoming one; Spring 2027 is too far out.
    expect(file.terms).toEqual(["1271", "1269", "1265", "1261"]);
    expect(paths).not.toContain("/Courses/1259/CS");
    expect(paths).not.toContain("/Courses/1275/CS");
    expect(seenKeys).toEqual(new Set(["test-key"]));

    const cs341 = file.courses.find((c: { catalogNumber: string }) => c.catalogNumber === "341");
    expect(cs341.title).toBe("Algorithms");
    expect(cs341.requirementsDescription).toContain("MATH 239");
    expect(cs341.termCodes.sort()).toEqual(["1261", "1269"]);
    expect(file.courses).toHaveLength(2);
  }, 60_000);
});

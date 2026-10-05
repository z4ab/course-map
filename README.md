# Waterloo Course Map

Plan University of Waterloo courses term by term. Prerequisites are read from the official course data and drawn as arrows between the courses in your plan, and any course placed before its prerequisites is flagged.

- **Term board.** Drag courses between terms, rename terms, mark work terms.
- **Prerequisite arrows.** Solid for required, dashed for "one of several", dotted for corequisites. Hover or click a course to trace everything upstream and downstream of it.
- **Checks.** Each course is checked against the terms before it. Coreqs may sit in the same term, and substitutes count (CS 146 satisfies anything that needs CS 136).
- **Catalog.** Search by code or title, filter by subject, and see when a course is usually offered.
- **Course detail.** The full requirement tree with ✓ marks, restrictions, antirequisites, what the course leads to, and the original calendar text.
- **Saving.** Your plan stays in the browser. Export and import it as JSON to back it up or move devices.

## How the data works

```
UW Open Data API ──fetch──▶ data/raw/courses.json ──parse──▶ public/data/courses.json ──▶ app
                                                       └──────▶ data/parse-report.md
```

1. **Fetch** (`scripts/fetch-courses.ts`). Reads CS, MATH, STAT and CO from the [UW Open Data API v3](https://openapi.data.uwaterloo.ca/api-docs). The API only lists a course in terms when it is offered, so the script reads the last six terms plus the next one, keeps the newest record of each course, and remembers which seasons it appeared in.
2. **Parse** (`src/lib/parse.ts`). Turns requirement text into a logic tree instead of a flat list of edges:

   ```
   Prereq: (CS 245/245E or SE 212), (one of CS 241/241E, 246/246E, 247),
           (one of STAT 206, 230, 240); Computer Science students only.
   ```
   becomes
   ```
   ALL ─┬─ ANY: CS 245, CS 245E, SE 212
        ├─ ANY: CS 241, CS 241E, CS 246, CS 246E, CS 247
        └─ ANY: STAT 206, STAT 230, STAT 240
   restriction: "Computer Science students only"
   ```
   It handles "one of", "either", `/` equivalents, subjects carried over to bare numbers ("MATH 239 or 249"), grade minimums before or after a course, `;` and `, or` joins, coreqs, antireqs, and "may be substituted for" notes. Anything it can't place is reported as a warning instead of guessed.
3. **Report** (`data/parse-report.md`). Lists every course with a parser warning so you can check the few odd ones by hand.

The parsed dataset is committed, so the site is fully static: no server, no database, and no scraping at page load.

## Running locally

Requires Node 20+.

```bash
npm install
npm run data:sample   # sample data: CS courses from the 2023-24 calendar, no key needed
npm run dev
```

For current data, register for a free key at <https://uwaterloo.ca/api/register>, then:

```bash
echo "UW_API_KEY=your-key" > .env
npm run data          # fetch + parse
npm run dev
```

`npm run data:fetch -- --subjects CS,MATH,STAT,CO,PMATH --terms 9` changes the subjects or how many past terms are read.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Parser, planner, fetch (against a mock API) and UI tests |
| `npm run build` | Typecheck and build the static site into `dist/` |
| `npm run data:fetch` | Download course records from the Open Data API |
| `npm run data:build` | Parse them into `public/data/courses.json` |
| `npm run data:sample` | Build the sample dataset from `fixtures/cs-2324.json` |

## GitHub Actions

- **CI** runs the tests and build on every push.
- **Refresh course data** runs weekly and on demand. Add a repository secret named `UW_API_KEY` and it commits new data when anything changes.
- **Deploy to GitHub Pages** builds `master` and publishes it. Turn it on under Settings → Pages → Source: GitHub Actions.

## Project layout

```
scripts/       fetch-courses.ts, build-data.ts
src/lib/       parse.ts (requirement parser), graph.ts (edges, checks), plan.ts, build.ts
src/components Board (term columns + arrows), Catalog, Detail, ReqTree
fixtures/      real 2023-24 CS calendar text used by tests and the sample build
tests/         vitest suites
```

## Limits

- Minimum grades are shown but not checked, since the planner doesn't know your marks.
- Program restrictions ("Computer Science students only") are shown as text, not enforced.
- A few calendar entries contain typos (CS 449's "241CS/241E"); these show up in the parse report.

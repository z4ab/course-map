import { useEffect, useMemo, useRef, useState } from "react";
import Board from "./components/Board";
import Catalog from "./components/Catalog";
import Detail from "./components/Detail";
import { buildSatisfiers, planStatus, type Plan } from "./lib/graph";
import { examplePlan, loadPlan, parsePlanFile, placeCourse, removeCourse, savePlan } from "./lib/plan";
import type { Dataset } from "./lib/types";

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: Dataset };

export default function App() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [plan, setPlanState] = useState<Plan>(loadPlan);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"catalog" | "course">("catalog");
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/courses.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Dataset>;
      })
      .then((data) => setLoad({ state: "ready", data }))
      .catch((e: Error) => setLoad({ state: "error", message: e.message }));
  }, []);

  const setPlan = (p: Plan) => {
    setPlanState(p);
    savePlan(p);
  };

  const data = load.state === "ready" ? load.data : null;
  const byId = useMemo(() => new Map((data?.courses ?? []).map((c) => [c.id, c])), [data]);
  const satisfiers = useMemo(() => buildSatisfiers(data?.courses ?? []), [data]);
  const status = useMemo(() => planStatus(plan, byId, satisfiers), [plan, byId, satisfiers]);
  const problems = [...status.values()].filter((s) => !s.prereqMet || !s.coreqMet).length;

  const open = (id: string) => {
    setSelected(id);
    setTab("course");
  };

  const exportPlan = () => {
    const blob = new Blob([JSON.stringify({ app: "course-map", version: 2, plan }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "course-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlan = async (file: File) => {
    try {
      setPlan(parsePlanFile(await file.text()));
      setNotice(`Imported ${file.name}`);
    } catch (e) {
      setNotice((e as Error).message);
    }
  };

  if (load.state === "loading") return <div className="state">Loading courses…</div>;
  if (load.state === "error") {
    return (
      <div className="state">
        <h2>No course data yet</h2>
        <p>
          The app couldn't load <code>data/courses.json</code> ({load.message}). Run <code>npm run data:sample</code> for the
          sample CS data, or put <code>UW_API_KEY</code> in <code>.env</code> and run <code>npm run data</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Course Map</h1>
          <p>
            {problems === 0
              ? "Every planned course has its prerequisites in an earlier term."
              : `${problems} planned course${problems === 1 ? " is" : "s are"} missing prerequisites. Click one to see what's needed.`}
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={exportPlan}>Export plan</button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Import plan</button>
          <input
            ref={fileRef}
            id="import-file"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importPlan(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn quiet"
            onClick={() => {
              setPlan(examplePlan());
              setNotice("Reset to the example plan");
            }}
          >
            Reset to example
          </button>
        </div>
      </header>

      <div>
        {load.data.sample && (
          <div className="banner">
            Sample data: CS courses from the 2023–24 calendar only. For current CS, MATH, STAT and CO data, add a free UW API key
            and run <code>npm run data</code>.
          </div>
        )}
        {notice && (
          <div className="banner" role="status" onClick={() => setNotice(null)}>
            {notice}
          </div>
        )}
        <div className="legend" aria-label="Legend">
          <span><i className="dot" style={{ background: "var(--cs)" }} />CS</span>
          <span><i className="dot" style={{ background: "var(--math)" }} />MATH</span>
          <span><i className="dot" style={{ background: "var(--stat)" }} />STAT</span>
          <span><i className="dot" style={{ background: "var(--co)" }} />CO</span>
          <span><i className="dot" style={{ background: "var(--other)" }} />Other</span>
          <span><i className="lg-line" />Required</span>
          <span><i className="lg-line or" />One of several</span>
          <span><i className="lg-line co" />Corequisite</span>
        </div>
      </div>

      <main className="main">
        <Board
          plan={plan}
          setPlan={setPlan}
          byId={byId}
          edges={load.data.edges}
          status={status}
          selected={selected}
          onSelect={open}
        />
        <aside className="side">
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "catalog"} onClick={() => setTab("catalog")}>Catalog</button>
            <button type="button" role="tab" aria-selected={tab === "course"} onClick={() => setTab("course")}>Course</button>
          </div>
          <div className="panel" role="tabpanel">
            {tab === "catalog" ? (
              <Catalog courses={load.data.courses} plan={plan} onAdd={(id, t) => setPlan(placeCourse(plan, id, t))} onOpen={open} />
            ) : selected ? (
              <Detail
                id={selected}
                byId={byId}
                edges={load.data.edges}
                plan={plan}
                satisfiers={satisfiers}
                onOpen={open}
                onPlace={(id, t) => setPlan(placeCourse(plan, id, t))}
                onRemove={(id) => setPlan(removeCourse(plan, id))}
              />
            ) : (
              <p className="placeholder">Click a course on the board or in the catalog to see its prerequisites.</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

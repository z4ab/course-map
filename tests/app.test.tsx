// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { buildDataset } from "../src/lib/build";

const data = buildDataset(JSON.parse(readFileSync("fixtures/cs-2324.json", "utf8")), { source: "test", sample: true, terms: [] });

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(data))));
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("app", () => {
  it("renders the example plan on the board with a sample-data banner", async () => {
    render(<App />);
    await screen.findByText(/Sample data/);
    const board = screen.getByLabelText("Term 3A");
    expect(within(board).getByText("CS 341")).toBeTruthy();
    expect(screen.getByLabelText("Unscheduled courses").textContent).toContain("CS 480");
  });

  it("shows a course's prerequisite tree and whether the plan meets it", async () => {
    render(<App />);
    await screen.findByText(/Sample data/);
    fireEvent.click(within(screen.getByLabelText("Term 3A")).getByText("CS 350"));
    await screen.findByText("Operating Systems", { selector: "h2" });
    expect(screen.getByText(/Met by terms before 3A/)).toBeTruthy();
  });

  it("flags a course moved before its prerequisites and saves the plan", async () => {
    render(<App />);
    await screen.findByText(/Sample data/);
    fireEvent.click(within(screen.getByLabelText("Term 3A")).getByText("CS 341"));
    const select = await screen.findByLabelText("Where this course is planned");
    const firstTerm = (select as HTMLSelectElement).options[1].value; // [0] is Unscheduled, [1] is the first term
    fireEvent.change(select, { target: { value: firstTerm } });
    await waitFor(() => expect(within(screen.getByLabelText("Term 1A")).queryByText("CS 341")).toBeTruthy());
    expect(within(screen.getByLabelText("Term 1A")).getByText("Prereqs missing")).toBeTruthy();
    expect(localStorage.getItem("course-map:plan:v2")).toContain("CS341");
  });

  it("adds a course from the catalog search", async () => {
    render(<App />);
    await screen.findByText(/Sample data/);
    fireEvent.change(screen.getByLabelText("Search courses"), { target: { value: "compiler" } });
    expect(within(screen.getByRole("tabpanel")).getByText("Compiler Construction")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search courses"), { target: { value: "cs 466" } });
    fireEvent.click(screen.getByLabelText("Add CS 466"));
    expect(screen.getByLabelText("Unscheduled courses").textContent).toContain("CS 466");
  });
});

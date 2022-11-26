import {beforeEach, expect, test} from "vitest";
import {initialize} from "../src/pyodide_components/worker.js";

// Make an interpreter and capture its startup state
const thisPyodide = await initialize();
const initialPyodideState = thisPyodide.pyodide_py._state.save_state();


beforeEach(async () => {
    // On each test, reset to an "empty" interpreter
    thisPyodide.pyodide_py._state.restore_state(initialPyodideState);
});

test("Load and initialize Pyodide", () => {
    expect(typeof thisPyodide.runPythonAsync).to.eq("function");
});

test("Confirm valid and running Pyodide", async () => {
    const result = await thisPyodide.runPythonAsync("1+1");
    expect(result).to.eq(2);
});

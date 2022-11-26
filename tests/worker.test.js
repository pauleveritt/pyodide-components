import {beforeEach, expect, test} from "vitest";
import {initialize, dispatcher} from "../src/pyodide_components/worker.js";

// Make an interpreter and capture its startup state
const thisPyodide = await initialize();
const initialPyodideState = thisPyodide.pyodide_py._state.save_state();


beforeEach(async () => {
    // On each test, reset to an "empty" interpreter
    thisPyodide.pyodide_py._state.restore_state(initialPyodideState);
});

test("Load and initialize Pyodide", () => {
    expect(typeof thisPyodide.runPythonAsync).to.equal("function");
});

test("Confirm valid and running Pyodide", async () => {
    const result = await thisPyodide.runPythonAsync("1+1");
    expect(result).to.equal(2);
    expect(self.pyodide).to.exist;
});

test("rejects an invalid messageType", async () => {
    const msg = {messageType: "xxx"};
    const error = await dispatcher(msg).catch((error) => error);
    expect(error).to.equal(`No message handler for "xxx"`);
});

test("processes an initialize message", async () => {
    const msg = {messageType: "initialize"};
    const result = await dispatcher(msg);
    expect(result.messageType).to.equal("initialized");
});


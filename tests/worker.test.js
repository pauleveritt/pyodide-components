import {beforeEach, expect, test, vi} from "vitest";
import {dispatcher} from "../src/pyodide_components/worker.js";
import {loadPyodide} from "../src/pyodide_components/pyodide/pyodide.mjs";

// Make an interpreter and capture its startup state
const thisPyodide = await loadPyodide();
const initialPyodideState = thisPyodide.pyodide_py._state.save_state();


beforeEach(async () => {
    // On each test, reset to an "empty" interpreter
    thisPyodide.pyodide_py._state.restore_state(initialPyodideState);
    self.pyodide = thisPyodide;
});

test("Load and initialize Pyodide", () => {
    expect(typeof self.pyodide.runPythonAsync).to.equal("function");
});


test("Confirm valid and running Pyodide", async () => {
    const result = await self.pyodide.runPythonAsync("1+1");
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

test("handles incoming messages with onmessage", async () => {
    expect(self.onmessage).to.exist;
    expect(self.postMessage).to.exist;

    // Make a fake worker message
    const event = new MessageEvent("message");
    event.data = {messageType: "initialize", messageValue: null};

    // Spy on self.postMessage, then call our handler
    const spy = vi.spyOn(self, "postMessage");
    await self.onmessage(event);

    expect(spy).toHaveBeenCalledWith({messageType: "initialized"});
});

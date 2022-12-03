import { beforeEach, expect, test, vi } from "vitest";
import {
  dispatcher,
  initialize,
  loadApp,
} from "../src/pyodide_components/worker.js";
import { loadPyodide } from "../src/pyodide_components/pyodide/pyodide.mjs";

// Make an interpreter and capture its startup state
const thisPyodide = await loadPyodide();
const initialPyodideState = thisPyodide.pyodide_py._state.save_state();

beforeEach(async () => {
  // On each test, reset to an "empty" interpreter
  thisPyodide.pyodide_py._state.restore_state(initialPyodideState);
  self.pyodide = thisPyodide;

  // If the pyodide_components directory exists, let's delete it
  // and start over
  const pathInfo = self.pyodide.FS.analyzePath("pyodide_components");
  if (pathInfo.exists) {
    self.pyodide.runPython(
      "import shutil; shutil.rmtree('pyodide_components')"
    );
  }
  self.pyodide.runPython("import os; os.mkdir('pyodide_components')");

  // The "self" needs resetting
  if (self.pyodide_components) delete self.pyodide_components;
  if (self.registry) delete self.registry;
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
  const msg = { messageType: "xxx" };
  const error = await dispatcher(msg).catch((error) => error);
  expect(error).to.equal(`No message handler for "xxx"`);
});

test("processes an initialize message", async () => {
  expect(self.pyodide_components).not.to.exist;
  expect(self.registry).not.to.exist;
  const msg = { messageType: "initialize" };
  const result = await dispatcher(msg);
  expect(result.messageType).to.equal("initialized");
});

test("handles incoming messages with onmessage", async () => {
  expect(self.onmessage).to.exist;
  expect(self.postMessage).to.exist;

  // Make a fake worker message
  const event = new MessageEvent("message");
  event.data = { messageType: "initialize", messageValue: null };

  // Spy on self.postMessage, then call our handler
  const spy = vi.spyOn(self, "postMessage");
  await self.onmessage(event);

  expect(spy).toHaveBeenCalledWith({
    messageType: "initialized",
    messageValue: "Pyodide app is initialized",
  });
});

test("starts with an empty pyodide_components and registry", async () => {
  expect(self.pyodide_components).not.to.exist;
  expect(self.registry).not.to.exist;
});

test("initializes non-empty pyodide_components and registry", async () => {
  await initialize();
  expect(self.pyodide_components).to.exist;
  expect(self.registry).to.exist;
});

test("has MyCounter in registry", async () => {
  await initialize();
  expect(self.registry.length).to.equal(0);
  await loadApp();
  expect(self.registry.length).to.equal(1);
  const myCounter = self.registry[0];
  expect(myCounter.get("name")).to.equal("my-counter");
});

test("processes a load-app message", async () => {
  await initialize();
  const msg = { messageType: "load-app" };
  const result = await dispatcher(msg);
  expect(result.messageType).to.equal("finished-loadapp");
});

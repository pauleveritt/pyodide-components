import { beforeEach, expect, test, vi } from "vitest";
import {
  worker,
  initialize,
  messageHandlers,
  dispatcher,
  finishedInitialize,
  finishedLoadApp,
  makeCustomElement,
} from "../src/pyodide_components/main.js";
import { Window } from "happy-dom";

beforeEach(() => {
  window = new Window();
  document.body.innerHTML = `<span id="status"></span><my-counter id="mc1">Placeholder</my-counter>`;
});

test("has correct user agent", () => {
  expect(navigator.userAgent).to.equal("Happy DOM");
});

test("document has a status node", () => {
  const status = document.getElementById("status");
  expect(status).to.exist;
  expect(status.innerText).to.equal("");
});

test("has no initialized worker", () => {
  expect(Worker).to.exist;
  expect(worker).not.to.exist;
});

test("initializes workers", () => {
  initialize();
  expect(worker).to.exist;
});

test("has handler lookup table", () => {
  expect(messageHandlers.initialized).to.exist;
});

test("rejects an invalid messageType", async () => {
  const msg = { messageType: "xxx", messageValue: null };
  const errorMsg = `No message handler for "xxx"`;
  await expect(async () => await dispatcher(msg)).rejects.toThrowError(
    errorMsg
  );
});

test("dispatches to finishedInitialize", async () => {
  const spy = vi.spyOn(messageHandlers, "initialized");
  const msg = {
    messageType: "initialized",
    messageValue: "Pyodide app is initialized",
  };
  await dispatcher(msg);
  expect(spy).toHaveBeenCalledWith("Pyodide app is initialized");
});

test("updates document with initialized messageValue", async () => {
  const status = document.getElementById("status");
  const messageValue = "Loading is groovy";
  await finishedInitialize(messageValue);
  expect(status.innerText).to.equal(messageValue);
});

test("has a placeholder my-counter", async () => {
  const counter = document.getElementById("mc1");
  expect(counter.innerText).to.equal("Placeholder");
});

test("has a custom element for my-counter", async () => {
  const counter = document.getElementById("mc1");
  expect(counter.innerText).to.equal("Placeholder");
});

test("construct a custom element", () => {
  const factory = makeCustomElement("my-counter");
  expect(factory).is.a("function");
  const element = new factory();
  expect(element.name).to.equal("my-counter");
});

test("initialize the registry", () => {
  expect(window.customElements.get("my-counter")).not.to.exist;
  const thisEntry = new Map();
  thisEntry.set("name", "my-counter");
  finishedLoadApp([thisEntry]);
  expect(customElements.get("my-counter")).to.exist;
});

test("find the custom element innerHTML", () => {
  expect(window.customElements.get("my-counter")).not.to.exist;
  const thisEntry = new Map();
  thisEntry.set("name", "my-counter");
  finishedLoadApp([thisEntry]);
  document.body.innerHTML = `<my-counter id="mc1">Placeholder</my-counter>`;
  const mc1 = document.getElementById("mc1");
  expect(mc1.innerHTML).to.equal("<div>Element: <em>my-counter</em></div>");
});

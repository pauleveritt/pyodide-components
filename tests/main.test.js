import {beforeEach, expect, test, vi} from "vitest";
import {worker, initialize, messageHandlers, dispatcher, finishedInitialize} from "../src/pyodide_components/main.js";

beforeEach(() => {
    document.body.innerHTML = `<span id="status"></span>`;
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
    const msg = {messageType: "xxx", messageValue: null};
    const errorMsg = `No message handler for "xxx"`;
    await expect(async () => await dispatcher(msg)).rejects.toThrowError(errorMsg);
});

test("dispatches to finishedInitialize", async () => {
    const spy = vi.spyOn(messageHandlers, "initialized");
    const msg = {messageType: "initialized", messageValue: "Pyodide app is initialized"};
    await dispatcher(msg);
    expect(spy).toHaveBeenCalledWith("Pyodide app is initialized");
});

test("updates document with initialized messageValue", async () => {
    const status = document.getElementById("status");
    const messageValue = "Loading is groovy";
    await finishedInitialize(messageValue);
    expect(status.innerText).to.equal(messageValue);
});

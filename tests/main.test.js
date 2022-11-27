import {expect, test, vi} from "vitest";
import {worker, initialize, messageHandlers, dispatcher} from "../src/pyodide_components/main.js";


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

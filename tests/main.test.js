import {expect, test} from "vitest";
import {worker} from "../src/pyodide_components/main.js";


test("Worker initialization", () => {
    expect(Worker).to.exist;
    expect(worker.postMessage).to.exist;
});

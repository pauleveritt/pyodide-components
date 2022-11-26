import {expect, test} from "vitest";
import {PYODIDE_COMPONENTS} from "../src/pyodide_components/main.js";

test("Hello", () => {
    expect(PYODIDE_COMPONENTS).to.equal("Hello");
});

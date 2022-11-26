import {expect, test} from "vitest";
import {mockFetch} from "./setup.js";

test("File mapping works", async () => {
    const response = await mockFetch("./__init__.py");
    expect(response.ok).to.be.true;
    const responseText = await response.text();
    expect(responseText).to.contain("from pathlib");
});

import {vi} from "vitest";
import {readFileSync} from "node:fs";

const INIT_PATH = "src/pyodide_components/__init__.py";
const INIT_CONTENT = readFileSync(INIT_PATH, "utf-8");

const FILES = {
    "./__init__.py": INIT_CONTENT,
};

export async function mockFetch(url) {
    if (url.includes("pyodide")) {
        return {
            ok: true,
            status: 200,
        };
    }
    const fileText = FILES[url];
    return {
        ok: true,
        status: 200,
        text: async () => fileText
    };
}

vi.stubGlobal("fetch", mockFetch);

export const MockWorker = vi.fn(() => ({
    postMessage: vi.fn(),
}));

navigator.userAgent = "Happy DOM";

if (!globalThis["worker"]) {
    vi.stubGlobal("Worker", MockWorker);
    self.postMessage = vi.fn();
}

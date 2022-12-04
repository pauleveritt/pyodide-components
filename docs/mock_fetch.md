# Mocking `fetch`

"Joyful" Pyodide dev means sitting in NodeJS tooling.
But we're writing a browser app, which is going to issue HTTP requests using `fetch`.
How do we replace the server?
We'll start the process of using mocks.

## Vitest config file

Our path to mocking begins with a small [Vitest configuration file](https://vitest.dev/config/) at `vitest.config.js` in the top-level folder:

```javascript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.js"],
  },
});
```

It's one job: point at a "setup" file which will mock our `fetch` request.

:::{note} Vitest, mocking, and MSW
The [Vitest mocking docs](https://vitest.dev/guide/mocking.html#requests) recommend using Mock Service Worker.
Alas, that begins a rabbit hole.
MSW [doesn't support NodeJS native fetch](https://github.com/mswjs/msw/issues/1113)).
It instead relies on `node-fetch`, which requires absolute URLs.
:::

## Vitest setup test

We're about to write some JavaScript to mock `fetch` requests and responses.
Let's do that by...writing a test!

Put this in `tests/setup.test.js`:

```javascript
import {expect, test} from "vitest";
import {mockFetch} from "./setup.js";

test("File mapping works", async () => {
    const response = await mockFetch("./__init__.py");
    expect(response.ok).to.be.true;
    const responseText = await response.text();
    expect(responseText).to.contain("from pathlib");
});
```

The test fails, as we haven't started `tests/setup.js` yet.

## Vitest setup file

Let's now write our Vitest setup file at `tests/setup.js`:

```javascript
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
```

This [setup file](https://vitest.dev/config/#setupfiles) is run whenever a test sessions starts up.
It's useful for global initialization.
Several notable points:

- `vi` installs `mockFetch` in the place of `fetch`
- `mockFetch` returns the file content from certain matched URLs

## Implementation in `worker.js`

With this code in `worker.js`:

```javascript
export async function initialize() {
    let loaderContent;
    const pyodide = await loadPyodide();
    const response = await fetch("./__init__.py");
    if (response.ok) {
        loaderContent = await response.text();
    } else {
        console.log("Failed to fetch loader.py");
    }
    return pyodide;
}
```

...our test now passes.
You can see the `await fetch("./__init__.py")` line.
When this is run under NodeJS and Vitest, the mock takes over.
No HTTP request is sent.
Instead, the contents of `src/pyodide_components/__init__.py` are read from disk and returned to the `fetch`.

## Wrapup

We covered a lot of NodeJS weirdness in this step:

- `fetch` and versions of NodeJS
- Vitest configuration files
- Vitest setup files
- Installing mocks (and writing tests for them)

Truth be told, it's about the same as getting up-to-speed with `pytest` and network mocking.
Ultimately, it's worth the investment.

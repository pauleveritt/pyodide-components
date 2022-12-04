# Import Pyodide

Let's write some code that imports and runs Pyodide, then write a Vitest test.

## Why?

It's not a lot of fun doing Pyodide HTML/JS development the "normal" way.
You write some code, reload your browser, open the console, and look for `console.log`.
If you've learned how to use the browser's debugger, that can help.

IDEs are good at running and debugging code.
Since Vitest is a NodeJS application, you can get a much nicer development experience.
Write a test, put a breakpoint in your Pyodide JS code, and stop right there.
No browser involved.

## Test Code

Let's make a `tests/worker.test.js` that loads an `initialize` function and runs it:

```javascript
import {expect, test} from "vitest";
import {initialize} from "../src/pyodide_components/worker.mjs";

test("Load and initialize Pyodide", async () => {
    const pyodide = await initialize();
    expect(pyodide).to.equal(2);
});
```

:::{note} `async` and `await`

Note the use of `async` on the arrow function and `await` when calling our function.
We'll use the async flavors of Pyodide wherever possible.
:::

When you run this test, it fails.
Good!
Let's go write the implementation.

## Worker Code

For now the worker in `src/pyodide_components/worker.js` is really simple.
One function which loads Pyodide and runs a Python expression:

```javascript
import {loadPyodide} from "./pyodide/pyodide.mjs";

export async function initialize() {
    const pyodide = await loadPyodide();
    return pyodide.runPythonAsync("1+1");
}
```

:::{note} `.mjs` extension
Pyodide puts its ESM-compatible files with a `.mjs` file extension.
:::

When you run the test, you'll see it takes about 2 seconds to execute.
But it runs!
Even better, it runs in NodeJS, no need to leave your tooling to go to another application (the browser.)

## Watch mode

Vitest has a watch mode which acts as a killer feature.
When you ran the tests from the command-line, you saw it went into server mode, with a web UI for test output.

But the server mode is also watching for changes on the filesystem.
If you change your code, or your tests, it automatically re-runs.
Not just that, it re-runs without stopping the NodeJS process.
Instead, it uses "hot module replacement" (HMR) to patch the running process with the changes.

But there's even more.
Vitest does some analysis to determine which tests need to re-run, based on what changed.
It's a very fast, "joyful" way to develop.

This mode is available in the IDE as well, which makes it even more joyful.
Tracebacks have links to the line with the problem.
The experience has an even more joyful mode.

## Debugging and watch mode

We're developing using:

- NodeJS instead of the browser.
- Smart tooling such as an IDE.
- From a small test file, where we can poke around.
- A watch mode that's very smart about what changed.

Let's run it all under the NodeJS debugger.
Vitest is so fast, you won't notice the speed hit.
The nice part: if something needs investigating, you just set a breakpoint.
When the test re-runs, it stops on that line and you can poke around.

## Future work: speedups

All of this waxing-poetic about super-fast Vitest testing is obscured by a sad fact.
Pyodide initialization is so slow, it eats up all those gains.
Especially when you have multiple tests.
Each test has to do the Pyodide initialization.

We'll tackle this in later steps.
It's key to a productive Pyodide development experience.

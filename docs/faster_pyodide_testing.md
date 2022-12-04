# Faster Pyodide Testing

We're going to do a lot of "sit in JS, execute Python."
We want to speed it up.
Let's change our test strategy to re-use a single Pyodide across many tests.

## Clean up worker tests

We have a test that asserts the JS `initialize` function returns some flag.
Actually, it's going to return the Pyodide instance.

Let's re-organize our worker tests:

```javascript
import {beforeEach, expect, test} from "vitest";
import {initialize} from "../src/pyodide_components/worker.js";

// Make an interpreter and capture its startup state
const thisPyodide = await initialize();
const initialPyodideState = thisPyodide.pyodide_py._state.save_state();

beforeEach(async () => {
    // On each test, reset to an "empty" interpreter
    thisPyodide.pyodide_py._state.restore_state(initialPyodideState);
});

test("Load and initialize Pyodide", () => {
    expect(typeof thisPyodide.runPythonAsync).to.equal("function");
});

test("Confirm valid and running Pyodide", async () => {
    const result = await thisPyodide.runPythonAsync("1+1");
    expect(result).to.equal(2);
});
```

Lots of changes here.
First, the two lines about `thisPyodide`.
We make a Pyodide instance a module scope, then immediately capture its default startup state.

In `beforeEach`, we speed up our test runs.
Instead of making a new interpreter all the time, we re-use the existing one.
But we reset it to its initial state.

We then split our tests into two parts: did we actually get a Pyodide, and does it run Python code?

## Worker returns a `pyodide`

Over in our `initialize` function, for now, just return Pyodide:

```javascript
import {loadPyodide} from "./pyodide/pyodide.mjs";

export async function initialize() {
    return await loadPyodide();
}
```

## Wrapup

We're already in a neat spot.
We can sit in a test, in a debugger, in our smart editor -- and evaluate Python from JS.

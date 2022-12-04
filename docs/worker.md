# Worker Script

Our `main.js` script runs in the main UI thread and has access to the DOM.
We'll do the heavy lifting in a background "worker".
But this will change the environment we have for testing.

In this step, we'll enable Vitest-based testing of "module workers".

## Why and what of web workers

The [Pyodide docs](https://pyodide.org/en/stable/usage/webworker.html) give a good rundown on the benefits of a web worker.
Pyodide apps are a good candidate for this, to move heavy computation out of the main thread.
As it turns out, the downside -- communication has to be through JSON messages instead of object calls -- can be a benefit for our design.

Web workers also introduce a top-level `self` object that acts somewhat like a `this`.
It also can be very helpful.
But it also comes with a downside.

## `self` and NodeJS

This `self` value is part of browser JavaScript, not NodeJS.
We will need a fake DOM, available in NodeJS, that gives us `self`, `addEventListener`, and other browser-centric APIs available in a worker.

We will use `happy-dom` as this NodeJS-based fake DOM.
Install it:

```shell
$ npm install -D happy-dom
```

Then configure it [according to the Vitest docs](https://vitest.dev/config/#environment).
We'll use it for all of our Vitest tests by adding `environment` to `vitest.config.js`:

```
test: {
    setupFiles: ["./tests/setup.js"],
    environment: "happy-dom"
},
```

## The split-up

We want to handle specifically, we want to handle messages from the `main.mjs` module.
We want those message handler functions to be easy to test.
As such, we will have a `dispatcher` function which routes message "types" to callable functions.
We then have an event listener to handle `postMessage` from the main thread, unpack the message data, and call the dispatcher.

This isolation lets us easily test without having to simulate the `postMessage` paradigm.

## Message structure

The main module will send "messages" to the worker module, which will also send messages back.
These messages need to be simple objects that can, essentially, be encoded as JSON.

For now, we'll just assume a "message" is an object with `messageType` and `messageValue`.

## Worker dispatcher for unknown messages

We're going to write a function `dispatcher` which handles messages from the main thread.
If it receives a message it doesn't know about, it will throw an exception.

We'll implement that part first.
Starting with a test in `worker.test.js`:

```javascript
import {initialize, dispatcher} from "../src/pyodide_components/worker.js";

  it("rejects an invalid messageType", async () => {
    const msg = { messageType: "xxx" };
    const error = await dispatcher(msg).catch((error) => error);
    expect(error).to.equal(`No message handler for "xxx"`);
  });
```

If your debug session with the Vitest watcher is still running, you'll see this fails.
As expected: we haven't created `dispatcher` yet.

Let's create `src/pyodide_components/dispatcher.js`
It's just a starting point:

export async function dispatcher({messageType, messageValue}) {
```javascript
    throw `No message handler for "${messageType}"`;
}
```

## Worker dispatcher for `initialize`

When the main module wakes up, it will create the worker and tell it to initialize Pyodide.
It will do so via a message `{messageType: "initialize"}` and no `messageValue`.
This is async, so it will expect to be sent a message `{messageType: "initialized"}`.

Let's write a test for this:

```javascript
test("processes an initialize message", async () => {
    const msg = {messageType: "initialize"};
    const result = await dispatcher(msg);
    expect(result.messageType).to.equal("initialized");
});
```

We can now extend the `dispatcher` implementation:

```javascript
export async function dispatcher({messageType, messageValue}) {
    if (messageType === "initialize") {
        await initialize();
        return {
            messageType: "initialized",
            messageValue: "Pyodide app is initialized"
        };
    }
    throw `No message handler for "${messageType}"`;
}
```

## Keeping the `pyodide`  around

Web workers also introduce a top-level `self` object that acts somewhat like a `this`.
It also can be very helpful.
But it also comes with a downside: this `self` value is part of browser JavaScript, not NodeJS.

We're going to need the `pyodide` instance in lots of places in worker.
We could of course put it at global scope.
Instead, we will use `self` as a place to store it.

Let's change the `Confirm valid and running Pyodide` test to assert that `self.pyodide` exists:

```javascript
expect(self.pyodide).to.exist;
```

The test now fails.
We then make a single-line change in `initialize`:

```javascript
self.pyodide = await loadPyodide();
```

The test now passes.
But we now have an issue: our watcher re-runs all the tests.

## Preserve `self.pyodide` between test runs

Our problem: the `self.pyodide = await loadPyodide();` change above throws out the interpreter on every run.
We'd like to keep the same `self.pyodide` between runs and just reset its state, as before.

First, let's change the `beforeAll` to get the worker's `self` to use a Pyodide from the test scope:

```javascript
beforeEach(async () => {
    // On each test, reset to an "empty" interpreter
    thisPyodide.pyodide_py._state.restore_state(initialPyodideState);
    self.pyodide = thisPyodide;
});
```
Then, initialize should change to only assign a `self.pyodide` if it isn't present:

```javascript
if (!self.pyodide) {
    self.pyodide = await loadPyodide();
}
```
Our tests are now fast again.

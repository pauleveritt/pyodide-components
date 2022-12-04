# Worker to Main

We've been in isolation.
Let's get back into the browser by hooking the worker module up to the main module.

## What? Why?

Here are the layers of our cake:

- A web page includes the main module `main.js`
- Main makes a worker module that it sends/receives messages with
- The worker makes a Pyodide that it sends/receives calls with

In this step, we'll do the second part.
Our main module will:

- Initialize a `Worker`
- Send the worker a message, telling it to initialize Pyodide
- Receive a message from the worker, saying Pyodide is initialized
- Update the `document` with info from that message

We want to stay in the "joyful" mode by using tests.
It will prove a little more complicated, as `happy-dom` doesn't really support main<->worker.
So we'll still need to finish by confirming "end to end" in a browser.
We'll automate that in the next step with Playwright.

## Cleanup

We'll start by emptying `main.js` to delete the "tracer" constant we did earlier.
Equally, we'll edit `main.test.js` to delete that test.

## Make an uninitialized `Worker`

Let's create the worker.
We'll start with a test in `main.test.js`:

```javascript
test("Worker initialization", () => {
    expect(Worker).to.exist;
});
```

And immediately, a problem.
`Worker` is a global in browsers, but doesn't exist in `happy-dom`.
Thus, running this test produces:

```javascript
ReferenceError: Worker is not defined
```

This is tricky as this happens as soon as we do an import.
How can we inject a global before the import happens?

Back to `tests/setup.js` and our Vitest setup.
Let's add a `MockWorker` and register it with Vitest's `vi.stubGlobal`:

```javascript
const MockWorker = vi.fn(() => ({
    postMessage: vi.fn(),
}));

if (!globalThis["worker"]) {
    vi.stubGlobal("Worker", MockWorker);
    self.postMessage = vi.fn();
}
```

Back to `main.test.js`:

```javascript
import {expect, test} from "vitest";
import {worker} from "../src/pyodide_components/main.js";


test("Worker initialization", () => {
    expect(Worker).to.exist;
    expect(worker.postMessage).to.exist;
});
```

Now an implementation in `main.js`.

```javascript
export const worker = new Worker("worker.js", {type: "module"});
```

We created a `Worker` instance using the [module worker option](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker).
Our test passes.
Let's now implement an initializer.

## Initialize worker

When the main module "wakes up" and makes the worker, it needs to tell the worker to "initialize".
It appears to be simple: just add a `postMessage` call:

```javascript
worker.postMessage({messageType: "initialize"});
```

Then, go to `main.test.js` and -- like with `worker.test.js` -- install a spy on `worker.postMessage`.

However, this reveals a flaw.
`worker.postMessage` is at module scope and executes *at import*.
It's already run before we get into a test and try to install a spy.

We need to refactor our code so that initialization doesn't happen at import time.
As a note, this can have benefits to the application.
Conceivably, the main UI module could "restart" the worker and thus Pyodide.

## Delayed initialization

Let's change our tests to first assert that, at import time, `worker` exists but is uninitialized.
Another test will call `initialize` and cause it to be assigned a `Worker` instance:

```javascript
import {expect, test} from "vitest";
import {worker, initialize} from "../src/pyodide_components/main.js";


test("has no initialized worker", () => {
    expect(Worker).to.exist;
    expect(worker).not.to.exist;
});

test("initializes workers", () => {
    initialize();
    expect(worker).to.exist;
});
```

You might already spot the issue: how will the web page instrument the calling of `initialize`?
We'll tackle that below.

## Dispatcher table

The main module will send messages to the worker.
But it will also receive messages.
We'll have the equivalent of a dispatcher, using a little lookup table to find small message handler functions.
These handlers can then be tested in isolation.

Let's write some failing tests:

```javascript
import {worker, initialize, messageHandlers} from "../src/pyodide_components/main.js";


test("has handler lookup table", () => {
    expect(messageHandlers.initialized).to.exist;
});
```

Now in `main.js`, let's write the little dispatch table with an empty `finishedInitialized` handler:

```javascript
export function finishedInitialize(messageValue) {

}

export const messageHandlers = {
    "initialized": finishedInitialize,
};
```

Our tests pass.
Let's now move on to the dispatcher.
We'll start with the easy part -- handling invalid messages -- which gets our first chunch in place.

## Deal with invalid worker messages

This part is a bit complicated, as we'll ultimately have to install the `postMessage` mock again.
We'll get the basics in place by focusing first on dealing with unknown worker messages.

First, a test for an unknown message and a test for "initialized":

```javascript
import {dispatcher} from "../src/pyodide_components/worker.js";

test("rejects an invalid messageType", async () => {
    const msg = {messageType: "xxx", messageValue: null};
    const errorMsg = `No message handler for "xxx"`;
    await expect(async () => await dispatcher(msg)).rejects.toThrowError(errorMsg);
});
```

Now the `dispatcher` implementation:

```javascript
export function dispatcher({messageType, messageValue}) {
    if (!(messageType in messageHandlers)) {
        throw `No message handler for "${messageType}"`;
    }

    messageHandlers[messageType](messageValue);
}
```

This lets us write a test for a valid message:

```javascript
test("dispatches to finishedInitialize", async () => {
    const spy = vi.spyOn(messageHandlers, "initialized");
    const msg = {messageType: "initialized", messageValue: "Pyodide app is initialized"};
    await dispatcher(msg);
    expect(spy).toHaveBeenCalledWith("Pyodide app is initialized");
});
```

In this test, we spy on the `initialized` handler.
We then ensure the dispatcher called it with the correct arguments.

## Handler for `initialized`

Our `finishedInitialize` function is unimplemented.
We'd like it to grab a `<span id="status"></span>` node in the document.
Then, replace `innerText` with the `messageValue`.

First, a test.
Our Vitest environment uses `happy-dom` as a fake DOM document.
We need to initialize it to the HTML we expect in our real document.
We'll add a `beforeEach` that sets up the document, then a test to ensure the `<span>` is there:

```javascript
import {beforeEach, expect, test, vi} from "vitest";

beforeEach(() => {
    document.body.innerHTML = `<span id="status"></span>`;
});

test("document has a status node", () => {
    const status = document.getElementById("status");
    expect(status).to.exist;
    expect(status.innerText).to.equal("");
});
```

With that in place, we can write a failing test:

```javascript
test("updates document with initialized messageValue", async () => {
    const status = document.getElementById("status");
    const messageValue = "Loading is groovy";
    await finishedInitialize(messageValue);
    expect(status.innerText).to.equal(messageValue);
});
```

The implementation is really simple:

```javascript
export function finishedInitialize(messageValue) {
    const status = document.getElementById("status");
    status.innerText = messageValue;
}
```

The test and implementation were simple for an important reason.
We've adopted a development style where we can write small handler functions.
These functions can be exported individually, then imported in a test.

The work is moved elsewhere for:

- Registering a message handler
- unpacking the agreed-upon message structure
- Finding the right handler
- Calling it with the right argument

## Initialize when in a browser

Before we can open this in a browser, we have to confront a decision made above.
Our `initialize` function isn't called anywhere.
We could put `initialize()` at module scope.
But it would then be executed by the test at import time.

We need a way of knowing if we are running under a test, inside Happy DOM.
Let's arrange to set the "user agent".
First, a failing test:

```javascript
test("has correct user agent", () => {
    expect(navigator.userAgent).to.equal("Happy DOM");
});
```

Now in `tests/setup.js`:

```javascript
navigator.userAgent = "Happy DOM";
```

The test passes.
We can now add this to the end of `main.js`:

```javascript
if (navigator.userAgent !== "Happy DOM") {
    // We are running in a browser, not in a test, so initialize.
    initialize();
}
```

With this in place, we can finish our `main.js` with a finished `initialize`.
The arrow function for `worker.onmessage` unpacks the data from the message before sending to the dispatcher.

```javascript
export function initialize() {
    worker = new Worker("worker.js", {type: "module"});
    worker.onmessage = ({data}) => dispatcher(data);
    worker.postMessage({messageType: "initialize"});
}
```
## Back into the browser

Let's see if things are working ok in the browser. 
All we really need to add is some HTML for the status message:

```html
<div>Status: <span id="status">Startup</span></div>
```

With this in place, if you open `index.html` directly in a browser via an HTTP server, it works.
But:

- Only in non-Firefox
- Not when bundling with Vite

Why not in Firefox?
A 7-year-old [unimplemented feature](https://bugzilla.mozilla.org/show_bug.cgi?id=1247687).
Firefox implements web workers, but not *module* workers...meaning, you can't do ESM export/import in web workers.
The ticket has recent activity.

In theory, a bundler like Vite is the answer.
But Pyodide has some trouble with bundlers.

For the purpose of this series, we'll keep going and just view in Chrome/Safari, with no bundling.

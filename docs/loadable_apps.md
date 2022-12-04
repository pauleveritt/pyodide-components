# Loadable Apps

Our "counter" app is currently bundled into "the system".
Let's move it to `counter.py` and then teach "the system" to load "apps".

## Why? How?

In a theoretical finished system, "pyodide_components" would be in a package distributed on PyPI.
People would then need a way to point it at their app.

Of course, we're just writing a series of articles, not planning any shipping software.
Still, it's a useful aid, to help reason about the boundaries between things.

We'll construct it like this:

- Main messages the worker, telling it to load a named app
- Worker fetches that app's Python file, writes it to disk, imports it
- Worker then tells "the system" to initialize the app with that app module
- Worker then messages main with the updated registry

With this, we'll late be able to see a good DX for writing pluggable apps.

## Refactor into own module

We'll start by extracting `MyCounter` into `counter.py`.
We start here because it will help find the flaws in our hardwired approach.
Our tests will break, and we'll have to fix them to remove the assumption.

```python
from dataclasses import dataclass


@dataclass
class MyCounter:
    pass
```

Along the way, `initialize_app` needs to comment out the line that registers `MyCounter`.

Our `test_init.py` file has an import of `MyCounter`.
We comment out the `test_initialize_app` test.
We're left with just the failed test for the initialized registry.
Good start.

## Teach `setup.js` to fetch `counter.py`

Remember when we patched `fetch` to return content from disk, rather than issue an HTTP request?
This was in `tests/setup.js`.
We're still doing it in a dumb way, so continue on:

```javascript
const COUNTER_PATH = "src/pyodide_components/counter.py";
const COUNTER_CONTENT = readFileSync(COUNTER_PATH, "utf-8");

const FILES = {
    "./__init__.py": INIT_CONTENT,
    "./counter.py": COUNTER_CONTENT
};
```

## Fix the `loadApp`

We're going to teach `loadApp` in the worker to:

- Be passed an app name
- Fetch the Python file
- Write to local disk
- Import

We'll start in `worker.test.js`.
First, in `has MyCounter in registry`, change the `loadApp` call:

```javascript
  await loadApp({appName: "counter"});
```

Our `loadApp` function now changes.
Again, this can all be done in smarter ways:

```javascript
export async function loadApp({ appName }) {
  let appContent;
  const response = await fetch(`./${appName}.py`);
  if (response.ok) {
    appContent = await response.text();
  } else {
    console.log(`Failed to fetch ${appName}`);
  }
  self.pyodide.FS.writeFile(`${appName}.py`, appContent, { encoding: "utf8" });

  // Python timestamp thing with MEMFS
  // https://github.com/pyodide/pyodide/issues/737
  self.pyodide.runPython("import importlib; importlib.invalidate_caches()");
  const appModule = self.pyodide.pyimport(appName);

  // Now register the app and update the local registry
  self.pyodide_components.initialize_app(appModule);
  self.registry = self.pyodide_components.get_registry().toJs();

  return { messageType: "finished-loadapp", messageValue: self.registry };
}
```

You might notice `self.pyodide_components.initialize_app(appModule)`.
Previously, `initialize_app` was passed an argument.
So we head over to `__init__.py` to change the protocol.

## Initialize apps

We're about to do what we intended to do originally -- initialize an *app*.

Head to `test_init.py` and let's make it look the way the API should work.
First, let's change the fixture to initialize the registry with the counter app:

```python
@pytest.fixture
def initialized_app():
    """Reset the registry and setup counter app."""
    reset_registry()
    initialize_app(counter)
```

This requires an import of `counter`.
We now do an implementation of `initialize_app`:

```python

def initialize_app(app_module):
    """Scan for known components and register them."""
    setup_function = getattr(app_module, "setup_pyodide")
    setup_function(register)
```

We're doing something different here.
We expect the passed-in module to have a `setup_pyodide` function.
"The system" grabs that function and calls it, passing in its `register` function.

This means a trip to `counter.py` to add in that function:

```python

def setup_pyodide(register):
    """Run the register function to set up component in this app"""
    register(MyCounter)
```

With this in place, `test_init.py` now passes all tests.

## Finish wiring up worker

Some minor changes now needed.
`dispatcher` needs to send the `messageValue` to `loadApp`.
Our tests then need to send a full message to `dispatcher`:

```javascript
const msg = { messageType: "load-app", messageValue: { appName: "counter" } };
```

## Tell `main` to load the `counter` app

Our `main.js` is now ready to kick things off.
Change the `finishedInitialize` handler to post the correct message:

```javascript
  worker.postMessage({
    messageType: "load-app",
    messageValue: { appName: "counter" },
  });
```

All of our JS and Python tests pass.

## Wrapup

We still aren't in a complete "loadable app" setup.
You still have to edit `main.js` to decide what app to load.
We could, for example, move it to a well-known place, such as a data attribute on `body`.

But we're not writing a ready-to-go app, just a series of docs.
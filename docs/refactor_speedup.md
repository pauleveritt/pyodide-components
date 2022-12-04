# Refactor Speedup

Rewrite the Pyodide test speedup code to clear the local directory.

## Why? What?

We previously sped up the Pyodide tests by retaining a Pyodide instance across test runs.
When combined with Vitest "watch" and HMR, tests become essentially instant.
Even when running under debug mode.

But we now have a flaw.
We still want isolation on the `pyodide_components` code, as part of testing.
We don't want the "local" filesystem, where things are imported from, to still have a directory with `__init__.py` etc. in it.

We also have a flaw with "self".
It isn't part of the Pyodide state.
It's the worker, as part of Happy DOM.
Since we assign to `self`, we need to clear those assignments from call to call.

## Removing the directory in `beforeEach`

Let's address that first in `beforeEach`, where we are currently restoring the startup, empty state of Pyodide.

In the first attempt, through JS and the `pyodide.FS.rmdir` and friends, we ran into all kinds of timing issues.
It appears there is something async going on deep down in `emscripten`.
A switch to Python fixed it.
Here's the new `beforeEach`:

```javascript
beforeEach(async () => {
  // On each test, reset to an "empty" interpreter
  thisPyodide.pyodide_py._state.restore_state(initialPyodideState);
  self.pyodide = thisPyodide;

  // If the pyodide_components directory exists, let's delete it
  // and start over
  const pathInfo = self.pyodide.FS.analyzePath("pyodide_components");
  if (pathInfo.exists) {
    self.pyodide.runPython(
      "import shutil; shutil.rmtree('pyodide_components')"
    );
  }
  self.pyodide.runPython("import os; os.mkdir('pyodide_components')");
});
```

## Resetting `self`

In `beforeEach`, we'll also clear `self.pyodide_components` and `self.registry`:

```javascript
  // The "self" needs resetting
  if (self.pyodide_components) delete self.pyodide_components;
  if (self.registry) delete self.registry;
```

## Wrapup

With this in place, we're now ready to return to building up the registry.
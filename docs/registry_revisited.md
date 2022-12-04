# Registry Revisited

Get the Python code into the browser and tell Pyodide to load it.

## Why? What?

In [simple registry](./simple_registry.md) we started the process of talking to the Python side.
We copied the registry Python code but didn't apply it in any way.

We need to write this string to the filesystem, then import it.
We'll stash the registry on `self.registry`, as a JS object literal.

And of course, we'll start through the lens of tests, to keep things "joyful".

## First, a test

Remember, when this starts up, there's an empty Pyodide.
The main module will message the worker, telling it to initialize `pyodide_components`.
Thus, we'll start with a test that proves there is no `self.pyodide_components` (for the module) nor `self.registry`.

In `worker.test.js`:

```javascript
test("starts with an empty pyodide_components and registry", async () => {
  expect(self.pyodide_components).not.to.exist;
  expect(self.registry).not.to.exist;
});
```

Now a test which initializes the Pyodide, then confirms that they exist:

```javascript
test("initializes non-empty pyodide_components and registry", async () => {
  await initialize();
  expect(self.pyodide_components).to.exist;
  expect(self.registry).to.exist;
});
```

This test directly calls `initialize()`, which means it needs to be imported.
But it's a nicer, more normal style of coding.
No message-sending.

## Registry with a `my-counter` component

Our registry is currently very dumb.
Let's change it to have a single, hard-wired "component" called `my-counter`.
Hard-wired means, the component is -- for now -- defined directly in the loader code.

First a test, to see if `get_registry` returns us a JS object shaped the way we want:

```javascript
test("has MyCounter in registry", async () => {
  await initialize();
  expect(self.registry.length).to.equal(1);
  const myCounter = self.registry[0];
  expect(myCounter.get("name")).to.equal("my-counter");
});
```

We'll change the `__init__` implementation to just return a stub:

```python
def get_registry():
    return [dict(name="my-counter")]
```

## Wrapup

We now have our test strategy in place, with a good sequence for initializing everything.
The registry just gave its first glimpse of storing custom element -- aka component -- definitions.

In the next step, we jump right into that.
# Simple Components

We want custom elements, defined in Python, which we can use in HTML.
In this step we arrange a proper registry which can communicate back to JavaScript.
We also see the trick to create JS classes after startup.

## Why? How

Our ultimate goal is to have `<my-counter count="0"></my-counter>` in our user's HTML.
We want the definition -- even the existence -- of `<my-counter>` to be in Python.

But custom elements must be a JS class, registered in the `customElements` DOM object.
How will we avoid making our developers write JS?
Here's how:

- The Python side "discovers" component definitions
- Then, introspects them to build a little registry
- The JS side grabs that registry from the Python side
- For each entry, a custom class is created *dynamically*, at run time

We'll go a little further than that in the next step.
But that's the strategy for now.

## Discovery

We already have a test which confirms `my-counter` is in the registry.
Let's write an implementation: an actual component, plus the discovery process.

Here's a simple, dataclass-based component to add in `__init__.py`:

```python
from dataclasses import dataclass

@dataclass
class MyCounter:
    pass
```

We could write a test for it, but at this stage, there's no real logic.
We can trust that Python's dataclass machinery is already tested.

Next, let's write a tiny function that registers a component.
We can see into the future and know -- we'd like a helper to automate getting from `MyCounter` to `my-counter`.
First, a test in `test_init.py`:

```python
def test_to_element_case():
    result = to_element_case("MyCounter")
    assert result == "my-counter"
```

Not only does this test fail, but all of `test_init.py` fails.
We'll focus our efforts in this test file.

The implementation in `__init__.py` is simple:

```python
import re

def to_element_case(camel_str):
    """Convert MyCounter class name to my-counter custom element name."""
    return re.sub("([A-Z0-9])", r"-\1", camel_str).lower().lstrip("-")
```

## Registration

"Something" will tell the system to put a component in the registry.
First, let's define "the registry" as a global `defined_elements` dictionary.
In `__init__.py`:

```python
defined_elements = {}
```

A test to confirm it exists and starts empty:

```python
def test_initial_globals():
    assert defined_elements == {}
```

Now a function `register` which is passed a component:

```python
def register(component):
    element_name = to_element_case(component.__name__)
    defined_elements[element_name] = component
```

Once the imports are added, the test runs, but fails.
Our `get_registry` is still hardwired.
Let's fix that next.

## Getting the registry

We'll circle back and fix the broken test which presumed the registry contained `[1, 2, 3]`.
We'll also write a test that checks `get_registry`:

```python
def test_get_registry():
    assert get_registry() == []

def test_register_new_component():
    assert get_registry() == []
    register(MyCounter)
    registry = get_registry()
    assert registry == [dict(name="my-counter")]
```

With this failing test, let's fix `get_registry`:

```python
def get_registry():
    return [
        dict(
            name=component_name,
        )
        for component_name, component in defined_elements.items()
    ]
```

This function now acts as a mediator between the JS side and the Python side.
It dumps the registry into a format best-used in JS.

## Loading the "app"

Let's revisit the layers of the cake:

- `index.html` loads the `main.js` main module
- The main module makes a worker module
- Main tells worker to initialize a Pyodide instance
- Worker tells main it has initialized Pyodide

We'll later introduce the idea of the "app" that will be loaded into Pyodide.
For now, it's just a bundled `MyCounter` component.
Main will need to tell the worker to load components.

Let's start with a test in `test_init.py`:

```python
def test_initialize_app():
    assert get_registry() == []
```

Hmm, this ended quickly.
We haven't registered anything yet -- why is this test failing.

Because it still has the state from the previous registration.
Remember, our `defined_elements` "database" is a global.

We'll need a test and implementation for resetting the registry:

```python
def test_reset_registry():
    """Clear previous test's registration."""
    reset_registry()
    assert get_registry() == []
```

Then, in `__init__.py`, the reset function *and* the `initialize_app`:

```python
def reset_registry():
    """Used by tests to put the globals back in original state."""
    defined_elements.clear()

def initialize_app():
    register(MyCounter)
```

Now we use the reset in our test, and with the proper imports, it passes:

```python
def test_initialize_app():
    reset_registry()
    assert get_registry() == []
    initialize_app()
    assert get_registry() == [dict(name="my-counter")]
```

We don't want to have to do this reset dance all the time so we'll write a pytest fixture for later use:

Let's write a pytest fixture:

```python
import pytest

@pytest.fixture
def initialized_app():
    """Reset the registry and setup counter app."""
    reset_registry()
    initialize_app()
```

## Worker initializes components

When the worker starts, there is no Pyodide.
The main module sends a message saying "initialize Pyodide", which returns a message when it is done.
In that return message, we want to then say "initialize the app", where "app" is a collection of Pyodide Components.

At them moment, `worker.test.js` fails.
It's expecting `my-counter` to already be in the registry.
But we just made it a manual, explicit step: load Pyodide, *then* load components.

First, a test in `worker.test.js` for the `loadApp` function itself:

```javascript
test("has MyCounter in registry", async () => {
  await initialize();
  expect(self.registry.length).to.equal(0);
  await loadApp();
  expect(self.registry.length).to.equal(1);
  const myCounter = self.registry[0];
  expect(myCounter.get("name")).to.equal("my-counter");
});
```

Remember to import `loadApp`.
Next, an implementation:

```javascript
export async function loadApp() {
  self.pyodide_components.initialize_app();
  self.registry = self.pyodide_components.get_registry().toJs();
  return {messageType: "finished-loadapp", messageValue: self.registry};
}
```

With this, the test passes.
One more step: we need a handler for the message dispatcher.

```javascript
test("processes a load-app message", async () => {
  await initialize();
  const msg = { messageType: "load-app" };
  const result = await dispatcher(msg);
  expect(result.messageType).to.equal("finished-loadapp");
});
```

We need to make a change to `dispatcher` to handle a `load-app` message:

```javascript
  if (messageType === "initialize") {
    await initialize();
    return {
      messageType: "initialized",
      messageValue: "Pyodide app is initialized",
    };
  } else if (messageType === "load-app") {
    return await loadApp();
  }
```

The test passes.
Main is able to send the worker a `load-app` message and receive back an updated registry.

## A test for custom elements

Let's now hook this up to the main module and allow `<my-counter>` to exist in HTML.

First, a failing test.
We'll do so as part of `main.test.js`.
Add to the `beforeEach` a usage:

```javascript
beforeEach(() => {
  document.body.innerHTML = `<span id="status"></span><my-counter id="mc1">Placeholder</my-counter>`;
});
```

A test to see that this node exists, with `Placeholder` as the content:

```javascript
test("has a placeholder my-counter", async () => {
  const status = document.getElementById("mc1");
  expect(status.innerText).to.equal("Placeholder");
});
```

That's a good start.
Let's start writing the part that makes face custom element classes on the fly, then hooks them into the registry messaging.

## Fake custom element classes

Ok, here's the fun part: dynamic custom elements!
We will have a `makeCustomElement` function that acts as a factory.
You call it with the name you want -- such as `my-counter` -- and it returns a *class*.
Our message handler will then register that class as a custom element.

First, a test:

```javascript
test("construct a custom element", () => {
  const factory = makeCustomElement("my-counter");
  expect(factory).is.a("function");
  const element = new factory();
  expect(element.name).to.equal("my-counter");
});
```

Now, an implementation:

```javascript
export function makeCustomElement(name) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.name = name;
    }

    connectedCallback() {
      this.innerHTML = `<div>Element: <em>${this.name}</em></div>`;
    }
  };
}
```

We're close!
Now we need to wire this up to the `customElement.define` function.

## Put elements in the custom element registry

The main module will receive a `finished-loadapp` message when the registry is updated.
Let's implement that, but first, with a test:

```javascript
test("initialize the registry", () => {
  expect(window.customElements.get("my-counter")).not.to.exist;
  const thisEntry = new Map();
  thisEntry.set("name", "my-counter");
  finishedLoadApp([thisEntry]);
  expect(window.customElements.get("my-counter")).to.exist;
});
```

And now, with an implementation of `finishedLoadApp`:

```javascript
export function finishedLoadApp(registryEntries) {
    // When an app loads components, the worker gives us an updated registry.
    registryEntries.forEach((entry) => {
        const name = entry.get("name");
        customElements.define(name, makeCustomElement(name));
    });
}
```

And the test now passes.
We have defined a custom element in the custom element registry.

## Get the custom element innerHTML

Our tests have a `document` with HTML setup in `beforeEach`.
Is the placeholder text replaced with the `connectedCallback` text?
Let's write a test:

```javascript
test("find the custom element innerHTML", () => {
  expect(window.customElements.get("my-counter")).not.to.exist;
});
```

Hmm, failed quickly.
We lost test isolation again, because `window.customElements` -- which is an instance of `CustomElementRegistry` -- is already popuplated.
Let's fix that first by resetting the Happy DOM `window` in `beforeEach`:

```javascript
beforeEach(() => {
  window = new Window();
  document.body.innerHTML = `<span id="status"></span><my-counter id="mc1">Placeholder</my-counter>`;
});
```

That test now passes.
Now finish the test to see if we can trigger `connectedCallback`:

```javascript

test("find the custom element innerHTML", () => {
  expect(window.customElements.get("my-counter")).not.to.exist;
  const thisEntry = new Map();
  thisEntry.set("name", "my-counter");
  finishedLoadApp([thisEntry]);
  document.body.innerHTML = `<my-counter id="mc1">Placeholder</my-counter>`;
  const mc1 = document.getElementById("mc1");
  expect(mc1.innerHTML).to.equal("<div>Element: <em>my-counter</em></div>");
});
```

It was a little finicky, but...we were able to do custom elements in Happy DOM, without a Chromium browser.
To wrap up, let's register the message handler for the worker's message to the main module:

```javascript
export const messageHandlers = {
  initialized: finishedInitialize,
  "finished-loadapp": finishedLoadApp,
};
```

Then, in `finishedInitialize`, the main needs to tell the worker to load the app:

```javascript
export function finishedInitialize(messageValue) {
  const status = document.getElementById("status");
  status.innerText = messageValue;
  worker.postMessage({
    messageType: "load-app",
  });
}
```

## Wire into index.html

Let's see if we can get a working web page, in a browser.
We'll add this in the body:

```html
    <div>
      <my-counter></my-counter>
    </div>
```

Now let's wrap up with a Playwright E2E test.
We'll add to the test in `test_pages.py`:

```python
    # Did the custom element render into the innerHTML?
    my_counter = fake_page.wait_for_selector("my-counter em")
    assert my_counter.text_content() == "my-counter"
```


# Component instances

Have Python track instances of components, then dispatch events from the JavaScript side.

## Why track instances?

Answer: state!

Let's say we have a counter component.
It needs to know the current count: to display, and to increment.
Each usage of `<my-counter>` is a different, well, counter and thus a different instance.

We want the state to be in Python, not in JavaScript.
The JavaScript side sends messages to the Python side, which will return HTML to update the usage.
We'll use a shared UID to connect the JavaScript and Python instances.

:::{note} No attributes or events
We're still at this point not worried about attributes (aka props) nor events.
:::

## Python test and code

We'll start by adding some state to `MyCounter`, plus two methods that we'll use.
Test first, of course:

```python
import pytest

from pyodide_components.counter import MyCounter


@pytest.fixture
def this_component():
    return MyCounter(uid="n123")


def test_increment(this_component: MyCounter):
    assert this_component.count == 0
    this_component.increment()
    assert this_component.count == 1


def test_onclick(this_component: MyCounter):
    assert this_component.count == 0
    this_component.onclick({})
    assert this_component.count == 1


def test_render(this_component: MyCounter):
    html = this_component.render()
    assert "<span>0" in html
```

Now the implementation.
Our instances will be assigned a `uid` determined on the JS side.

```python
@dataclass
class MyCounter:
    uid: str
    count: int = 0

    def increment(self):
        self.count += 1

    def onclick(self, event):
        self.increment()

    def render(self):
        # language=html
        return f"<p><strong>Count</strong>: <span>{self.count}</span></p>"
```

We want a "database" to track these instances, by UID.
Back to `test_init.py`.
We'll ensure that the global for the `db` starts empty, which also means an import:

```python
def test_initial_globals():
    assert defined_elements == {}
    assert db == {}
```

Next, add a test for the `make_element` machinery we are about to add:

```python
def test_make_and_update_element(initialized_app):
    html = make_element("n123", "my-counter")
    assert "<span>0" in html
    my_counter = db["n123"]
    my_counter.increment()
    assert "<span>1" in my_counter.render()


def test_make_and_update_element_with_prop(initialized_app):
    """The node had an HTML attribute."""
    html = make_element("n123", "my-counter")
    assert "<span>0" in html
    my_counter = db["n123"]
    my_counter.increment()
    assert "<span>1" in my_counter.render()
```

We'll be adding a `make_element` message, sent from main to the worker.
While we're at it, add `db` to our `reset_registry` function:

```python
db = {}


def reset_registry():
    """Used by tests to put the globals back in original state."""
    defined_elements.clear()
    db.clear()

def make_element(uid, name):
    """Receive message from JS and make a node"""
    factory = defined_elements[name]
    instance = factory(uid)
    db[uid] = instance
    return instance.render()
```

With that, our two new tests pass.
That means we have a way for the worker to tell our Python system to make new component instances *and* render them.

Over to the worker.

## Tell the worker to tell Pyodide

How does a component instance get created?
What is it that calls `make_element`?

We need to make a Python instance *during custom element insertion* into DOM.
That means, in the connectedCallback, whic means the message actually originates in the main module.
It will then `postMessage` to the worker.

## Refactor worker message handling

The main module has a nice "handlers" table for message dispatch.
The worker message dispatching works on an `if` basis.
This was different as the hope was to just make the message name match the Python function name.

But this doesn't quite work.
We need a mediator, to unpack the `messageValue` and prepare arguments for the Python function.
Let's convert `worker.mjs` to use a `handler` table:

```javascript
const messageHandlers = {
  initialize: initialize,
  "load-app": loadApp,
};

export async function dispatcher({ messageType, messageValue }) {
  if (!(messageType in messageHandlers)) {
    throw `No message handler for "${messageType}"`;
  }
  const handler = messageHandlers[messageType];
  const result = await handler(messageValue);
  if (result) {
    return {
      messageType: result.messageType,
      messageValue: result.messageValue,
    };
  }
}
```

We then change the return value of `initialized`:

```python
  return {
    messageType: "initialized",
    messageValue: "Pyodide app is initialized",
  };
```

## `make-element` message

We'll tackle the last part now.
A test, to dispatch a `makeElement` message that calls that function.

```javascript
test("makes a new element", async () => {
  await initialize();
  await loadApp({ appName: "counter" });
  makeElement({ uid: "n123", name: "my-counter" });

  const expected = {
    messageType: "render-node",
    messageValue: {
      uid: "n123",
      html: "<p><strong>Count</strong>: <span>0</span></p>",
    },
  };
  expect(self.postMessage).toHaveBeenCalledWith(expected);
  const thisDb = self.pyodide_components.db.toJs();
  expect(thisDb.get("n123").uid).to.equal("n123");
});
```

Remember, our `setup.js` file helpfully puts a mock on the worker's `postMessage`.
This lets us see what it was telling the main module.
We see that our "component" rendered itself.
We also poke into the Python side to see that a component *instance* was stored in the db.

Let's now implement `makeElement`:

```javascript
export function makeElement({ uid, name }) {
  // Post a message to Pyodide telling it to make a node then render
  const html = self.pyodide_components.make_element(uid, name);
  renderNode(uid, html);
}
```

Add it to the handlers table:

```javascript
const messageHandlers = {
  initialize: initialize,
  "make-element": makeElement,
  "load-app": loadApp,
};
```

However, the test fails.
Our new `makeElement` function runs, but it calls a `renderNode` function.
This doesn't exist -- what's that?

## Rendering the component output

Our components render HTML in *Python* and returns to the JS function that calls it.
The JS side needs to take that and update the document.
But it's in the worker, which has no access to the DOM.
So the worker needs to message the main module: "Change this node to have this HTML."

There's not much to the implementation.
It simply wraps up inputs and does `postMessage`:

```javascript
function renderNode(uid, html) {
    self.postMessage({
        messageType: "render-node",
        messageValue: {uid, html},
    });
}
```

With this, the tests pass.

## main.mjs

On to actually updating the document.
We have a dynamically-generated anonymous class.
Each instance of that needs to generate a `uid` *data* attribute and store it on `this` in the constructor.
We don't want to use `id` as that should be left for the user.

Then, the `connectedCallback` method posts the `make-element` message to the worker.
When the worker makes the element instance in Python, it then posts back the `render-node` message.

Here are the changes to the dynamic class:

```javascript

```

Next, handle the `render-node` message from the worker:

```javascript
import * as Idiomorph from "./static/idiomorph.js";

function renderNode({uid, html}) {
    const target = document.querySelector(`*[data-uid=${uid}]`);
    Idiomorph.morph(target, html, {morphStyle: "innerHTML"});
}

export const messageHandlers = {
  initialized: finishedInitialize,
  "finished-loadapp": finishedLoadApp,
  "render-node": renderNode,
};
```

What's the `Idiomorph` line?
[Idiomorph](https://github.com/bigskysoftware/idiomorph) is a DOM-merging library.
Let's copy the file from the repo and save it as `idiomorph.js`.

## E2E test update

We wrap up by heading to the Playwright test in `test_pages.py` and updating our end-to-end (E2E) test:

```python
  # Did the custom element render into the innerHTML?
  my_counter = fake_page.wait_for_selector("my-counter span")
  assert my_counter.text_content() == "0"
```

Good news, our rendering-from-Python made it back through the worker, into the main module and browser.

## Wrapup

With that in place, we have component rendering in Python.

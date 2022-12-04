# Simple Component Registry

The Python side needs to tell the browser side about registered custom elements, aka components.
In this step, a Python function will return some data to the JS worker script.

## Components in Python

We want coding in Python, then running in browser.
But what is the unit of work that ties the two sides together?
And what is the unit of sharing?

Components.

Stated differently, [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).
With this, a web page can have HTML such as `<todo-list>My Items</todo-list>` that comes from Python code.

:::{note} Why not Web Components?
Web components are a superset of custom elements, adding things such as a Shadow DOM. 
But this brings in sharp edges when used in practice.
It isn't yet clear the gain is worth the pain.
:::

We'll talk more about components later.

## Python Registry

Let's write our registry.

In `tests/test_init.py`, add a failing test to get the registry.
This test will have an import which fails
While we're at it, we'll delete `test_hello` as we no longer need a placeholder.

```python
from pyodide_components import get_registry


def test_get_registry():
    assert get_registry() == [1, 2, 3]
```

Our tests fail, as expected.
Let's now put in an implementation in `__init__.py`:

```python
def get_registry():
    return [1, 2, 3]
```

We'll similarly delete the PYODIDE_COMPONENTS flag, as it isn't needed to demonstrate testing.

:::{note} Why in `__init__.py`?
It would be nicer to put this in, say, `loader.py`.
But Pyodide doesn't yet have a good story for packages.
You have to fetch every file yourself.
Thus, we'll put all the Python in one file for now.
:::

Tests now pass, let's hook this up to the JS side and do a test.

## Fetch `src/pyodide_components/__init__.py`

When working with Pyodide -- Python in the browser -- you first have to fetch the Python code and put it in the virtual filesystem.
You can then import it.
Later, we'll have a wheel in PyPI and Pyodide can handle the installation.

The `initialize` function in `worker.js` gets some lines added to it.
We're using `fetch` to make the HTTP request:

```javascript
let loaderContent;
const response = await fetch("./__init__.py");
if (response.ok) {
    loaderContent = await response.text();
} else {
    console.log("Failed to fetch loader.py");
}
```

And this...fails badly:

```
TypeError: Failed to parse URL from ./__init__.py
    at Object.fetch (node:internal/deps/undici/undici:11118:11)
```

If you're using a NodeJS before 18.3.0 (when native fetch landed), you might get a different error.

What's going on?
If you think about it, this code makes no sense from a NodeJS test.
There isn't an HTTP server (and we really don't want one for testing.)

We need a way to intercept `fetch` and mock its responses.
That's the topic for the next section.

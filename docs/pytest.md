# Setup `pytest`

We also want testing for our Python code, so let's get `pytest` installed.

## Install and Config

To start, we'll add `pytest` to the dependencies in `pyproject.toml`.
Really, they should go in dev dependencies, but this project really just a tutorial.
Let's go ahead and add all the dependencies we'll need for the next few steps:

```toml
dependencies = [
    "sphinx",
    "myst-parser",
    "furo",
    "pytest",
    "playwright",
    "html5lib",
    "pytest-playwright",
    "starlette",
    "uvicorn",
    "watchfiles",
    "anyio",
    "httpx"
]
```

After adding, we do:

```shell
$ pip install -e .
```

We'll also start the process of centralizing our pytest options.
Instead of `pytest.ini`, we'll use `[tool.pytest.ini_options]` in `pyproject.toml`.
As an example, add this to `pyproject.toml` to configure strict marker usage in `pytest`:

```toml
[tool.pytest.ini_options]
addopts = "--strict-markers"
```

## First Python Code and Test

As before, we'll put a little tracer in our Python code and write a simple test.

In `src/pyodide_components/__init__.py`:

```python
PYODIDE_COMPONENTS = "Hello"
```

Then, in `tests/test_init.py`:

```python
from pyodide_components import PYODIDE_COMPONENTS


def test_hello():
    assert PYODIDE_COMPONENTS == "Hello"
```

Running pytest shows that the test passes.

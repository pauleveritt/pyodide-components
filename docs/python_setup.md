# Python Setup

We want a nice home for our Python project: metadata, dependencies, and sharing.
We'll choose the really-modern Python approach:

- `pyproject.toml`
- `setuptools` as the build backend (no Poetry/Hatch, just regular pip)
- An [editable install](https://setuptools.pypa.io/en/latest/userguide/development_mode.html)

## Why?

Python certainly has...lots of options.
Why this as-yet-little-known approach?

Why an "editable install"?
The Python testing community [encourages an `src` layout](https://docs.pytest.org/en/7.1.x/explanation/goodpractices.html#choosing-a-test-layout-import-rules) of your project, as [recommended by others](https://hynek.me/articles/testing-packaging/).
When you make your workspace into a proper "package", you can import from anywhere...once the package is an "editable install".

Why not just a `requirements.txt`?
This won't get you into "proper package" mode.
Ditto for `pipenv` which is more about applications than packages.

Why not `setup.py`?
The Python world is (hopefully) moving away from that, to a world with `pyproject.toml` as the central configuration spot.

Why not Poetry or Hatch?
This series is trying to stay on a mainstream path.
`pip` is still the king of the hill.
Now that [`setuptools` is a valid `pyproject.toml` backend](https://setuptools.pypa.io/en/latest/userguide/pyproject_config.html), that's a good happy path for beginners.
Also, `setuptools` [directly supports the `src` layout](https://setuptools.pypa.io/en/latest/userguide/package_discovery.html#src-layout) described above.

Dear heavens, I hope one day to never need to explain that again.

## Python editable install with `pyproject.toml`

We're doing a "joyful Python" project.
That means coding through the lens of a *test*.
`pytest` best practices say to make a package and then do an "editable install."

We'll follow the `setuptools` page above, starting with an empty `pyproject.toml`.

```shell
$ touch pyproject.toml
```

### Build backend

In the first section of the TOML file, we need to tell our packaging tool what build backend to use.
There are lots of packaging tools -- we're using `pip`.
There are a number of backends -- we're using `setuptools`:

```toml
[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"
```
### Project metadata

Next, we'll tell our tooling -- and the world -- a little about our project.
Add this section to the `pyproject.toml` file:

```toml
[project]
name = "pyodide_components"
version = "0.0.1"
requires-python = ">=3.10"
license = {text = "BSD 3-Clause License"}
classifiers = [
    "Programming Language :: Python :: 3",
]
dependencies = [
    "sphinx",
]
```

We're doing the minimum for dependencies for now: just Sphinx, as a way to ensure our installation works.

## Project directory

Let's put some empty code into our project directory.
We said we were adopting the [src layout](https://setuptools.pypa.io/en/latest/userguide/package_discovery.html#src-layout).
Make an empty package file as a starter:

```shell
$ touch src/pyodide_components/__init__.py```
```

## Virtual environment

We want to follow best practices and work in a virtual environment.
Make one in the project folder, then upgrade the `pip` and `setuptools` it uses:

```shell
$ python -m venv .venv
$ .venv/bin/pip install --upgrade pip setuptools
```

## Editable install

We have a virtual environment.
We have a `pyproject.toml` that defines our package.
But the virtual environment needs to know about our package.

Let's do an [editable install](https://setuptools.pypa.io/en/latest/userguide/development_mode.html).
This put `pyodide_components` in the virtual environment's `site-packages`.
But, as basically a symbolic link back to the `src/pyodide_components` directory:

```shell
$ .venv/bin/pip install -e .
```

If this worked correctly, you now have a `src/pyodide_components.egg-info` directory.
You also have `sphinx-quickstart` in your virtual environment's `bin`:

```
$ ls src/pyodide_components.egg-info 
PKG-INFO              requires.txt
SOURCES.txt             top_level.txt
dependency_links.txt
$ ls .venv/bin/sphinx*
.venv/bin/sphinx-apidoc
.venv/bin/sphinx-autogen
.venv/bin/sphinx-build
.venv/bin/sphinx-quickstart
```

To confirm that we can import `pyodide_components` outside its source directory:

```
$ .venv/bin/python -c "import pyodide_components"
```

## Cleanup

There we go, a modern Python workspace.
Let's clean up a bit.

First, add some exclusions to your `.gitignore` file:

```
*.egg-info/
.venv
__pycache__/
```

Now commit your work:

```shell
$ git add .gitignore pyproject.toml src
$ git commit -m"Python project workspace setup"
```

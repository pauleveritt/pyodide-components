# Downloader

We don't want to download Pyodide every time we run a test or open a page.
Let's write a little downloader script and register it as a console app.

## The Theory

We want Pyodide locally.
It's cumbersome to download and extract, so we'll automate it with a script.

We'll store this in `src/pyodide_components/pyodide` with an entry in `.gitignore` to ensure it doesn't get checked in.
Why under `src`?
We'll explain in a bit.

## The Code

We add the code to `src/pyodide_components/downloader.py`:

```python
"""Downloads Pyodide and extracts to correct place."""
from pyodide_components import HERE

"""Automation scripts for getting setup."""
import os
import tarfile
from pathlib import Path
from shutil import copytree, rmtree
from tempfile import TemporaryDirectory

from urllib3 import PoolManager


def get_pyodide():
    print("Getting Pyodide")
    base_url = "https://github.com/pyodide/pyodide/releases/download"
    url = f"{base_url}/0.22.0a1/pyodide-0.22.0a1.tar.bz2"
    http = PoolManager()
    r = http.request('GET', url)
    with TemporaryDirectory() as tmp_dir_name:
        os.chdir(tmp_dir_name)
        tmp_dir = Path(tmp_dir_name)
        temp_file = tmp_dir / "pyodide.tar.bz2"
        temp_file.write_bytes(r.data)
        tar = tarfile.open(temp_file)
        tar.extractall()
        target = HERE / "pyodide"
        if target.exists():
            rmtree(target)
        copytree(tmp_dir / "pyodide", target)


if __name__ == '__main__':
    get_pyodide()
```

That code depends on `HERE`.
Let's add it to `src/pyodide_components/__init__.py`:

```python
from pathlib import Path

HERE = Path(__file__).parent
```

## Running it

It's a function that is run from a `__main__` block when you execute this in a virtual environment:

```shell
$ python -m pyodide_components.downloader
```

When run, it creates a directory at `src/pyodide_components/pyodide`.
We should also add that directory to our `.gitignore`:

```
src/pyodide_components/pyodide
```

## Add `node-fetch` dependency

If you fire up the `dev` server in `package.json`, you'll see a warning:

```
The following dependencies are imported but could not be resolved:

  node-fetch (imported by /somepath/pyodide-components/src/pyodide_components/pyodide/pyodide.mjs)
```

Vite is doing some static analysis and notices that Pyodide's JS depends on a package called `node-fetch`.
We can silence this by installing it:

```shell
$ npm install -S node-fetch
```

## Places for improvement

We won't spend too much time "hardening" this, as it is a just a means to an end.
We could though:

- Add these instructions to a README
- Write a test with some mocks to prove the logic works
- Not hard-coding the URL path and version

# Pyodide Components

[![PyPI - Version](https://img.shields.io/pypi/v/pyodide-components.svg)](https://pypi.org/project/pyodide-components)
[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/pyodide-components.svg)](https://pypi.org/project/pyodide-components)

-----

Prototype a testing-oriented, worker-based, message-style framework for Pyodide "components" based on custom elements.

## Motivation

What if you could do "joyful" Pyodide development?
Staying in a smart tool, in the flow, with super-fast results?

What if you could write custom elements in Python?

## Status

- Rewrote all but the last 8 sections from previous effort
- Still need a couple of rewrites
- Then, I can do the videos.

## Features

- Fast development based on Vitest, NodeJS, and smart tooling like IDEs.
- Write Pyodide Components which then register as custom elements, no hand-written JS needed.
- Rendering, state, props, events...all mapped to the Python side.
- If delivered from a server, pre-render the component and skip the empty-box from Pyodide.

## Installation

Clone the repo, then:

1. Make a virtual environment
2. `.venv/bin/pip install -e .`
3. `.venv/bin/python -m pyodide_components.downloader` to download Pyodide locally.
4. 
*Note: There is no concept of developer dependencies, as this is intended as a tutorial.*

## License

`pyodide-components` is distributed under the terms of the [MIT](https://spdx.org/licenses/MIT.html) license.

# Setup Vitest

Start doing basic JavaScript testing using Vitest.

## Why Testing?

I'm a big fan of "test-first" development.
Not TDD -- that kind of implies an "eat your vegetables" approach where the goal is quality.

Instead, I do my thinking and working inside a test because it is more *convenient*.
Switching to a browser, hitting reload, `console.log()` everywhere, struggling with a debugger.
This does not spark joy.
Instead, let tooling provide a better development experience.

For JavaScript, this means:

- Live in NodeJS, not the browser
- Writing code in exported chunks that can easily be imported in a test
- Use the test as a kind of REPL
- Run the tests under the debugger, to easily stop in a context and poke around

## Why Vitest?

I don't want to make folks adopt some heavy JS tooling hellscape.
Vitest is nice because it is fast, lighter-weight, modern (ESM-first), and has good tooling support.

To be clear: we're not using a JavaScript framework such as Vue.
We're using Vite and Vitest with vanilla JS.

## Launch your IDE

At this point we'll move from the command line to "your editor of choice."
I'll refer to it as "the IDE".
In my case, this means PyCharm Professional but smart editors and IDEs have all become quite good at "modern tooling."

## Installing Vitest

Let's install Vitest and its companion [`@vitest/ui`](https://vitest.dev/guide/ui.html) package that puts a pretty UI on testing.

If you're familiar with NodeJS development, you'll know: `npm` is used for installing a package and recording the dependency in `package.json`.
Thus:

```shell
$ npm install vitest @vitest/ui
```

Why not `npm install -D` to record this as a development dependency?
This is a tutorial series, not really a releasable-project.
We'll simplify by only having one set of dependencies.

## Hello World JS

We'll start with a new file named `src/pyodide_components/main.mjs`.
That already brings up a question -- what's the `.mjs` extension?
This helps flag to various tooling (NodeJS, web servers, etc.) that this file uses ECMAScript Modules (ESM) syntax.
With this, no module bundlers are needed when serving to a browser, as ESM Imports are now well-supported.

Here's an [in-depth ESM guide](https://gils-blog.tayar.org/posts/using-jsm-esm-in-nodejs-a-practical-guide-part-1/) to ESM for library authors.

The file is pretty empty:

```javascript
export const PYODIDE_COMPONENTS = "Hello";
```
Its purpose is only to get us started testing.

However, it already has a second head-scratcher: why no "document.addEventListener" for `DOMContentLoaded`?
As it turns out, in browsers, you can load with `<script defer>` and get the same effect.
This is recommended in Jake's HTTP 203 episode.

## Hello World Test

We have exported the `const`.
Let's write a simple test in `tests/main.test.js` which imports and checks it:

```javascript
import {expect, test} from "vitest";
import {PYODIDE_COMPONENTS} from "../src/pyodide_components/main.mjs";

test("Hello", () => {
    expect(PYODIDE_COMPONENTS).to.equal("Hello");
});
```

The filename `main.test.js` uses the `.test.` convention.
These files are usually alongside the source, but in Python the convention is different.
Also, we don't want those files shipping in the wheel we might build.

Why no `.mjs` extension?
This file will only be executed on the NodeJS side.

The test does an ESM-style import of the exported consistent.
It then has a single test, using Vitest's bundled [Chai assertion library](https://www.chaijs.com).

## Running Vitest

Let's edit the `scripts` block in `package.json` and add an entry to run `vitest`:

```
    "test": "vitest --ui"
```


You can run Vitest against this:

```shell
$ npm test
```

Notice that this isn't `npm run test`?
`npm` has some built-in shortcuts that it treats as first-class operations, such as `test`.

This goes into watch mode and brings up a nice UI in a browser.
Changes trigger a test run which updates the browser.

As a note, Vitest is FAST.
It also has a watch mode to be really fast.

## Wrapup

As usually, commit all the changes.

If you are using an IDE (VS Code, PyCharm) then you have good Vitest integration.
This replaces the need for running the `npm` script, the dev server, and looking in a browser.

We'll use an IDE for the rest of this series.
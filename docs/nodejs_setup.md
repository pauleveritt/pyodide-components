# NodeJS Setup

We also want a nice home for the JavaScript side.
Nothing too fancy.
But also nothing too austere.

In this section we'll get a NodeJS project setup with a minimum based around the Vite tooling.

:::{note} NodeJS 18.3.0 or higher
This tutorial presumes you are using NodeJS with the LTS (at time of writing) or higher.
Why?
We need `fetch`.
Otherwise, install `node-fetch` yourself in an older NodeJS.
:::

## What? What?

"NodeJS? Vite? WTH? I'm here for Python, not crazy JS frontend lolz."

Yes, good point.
BUT...the world of frontends has gotten very interesting and productive.
We're doing a "vanilla" project: no TypeScript and no frameworks.

But even so, we can benefit from modern tooling.
This is the "joyful" path.

We want "joyful Python" *and* "joyful JavaScript".
For the JavaScript *development*, *joyful* primarily means using NodeJS in an IDE instead of flipping to the browser all the time.
There's lots of great tooling in modern frontends.
Let's use some of it without going crazy.

We will center our strategy on [Vite](https://vitejs.dev) and its test runner named Vitest.
Vite is super-fast tooling for JavaScript applications, giving a fantastic developer experience, even for plain-old-JS projects.

## NodeJS setup

This series presumes you have a NodeJS installation.
Let's confirm this:

```shell
$ node -v
```
## Setup a Vite project

The NodeJS equivalent of `pyproject.toml` is the `package.json` file.
We'll create that by asking [a Vite scaffold](https://vitejs.dev/guide/#scaffolding-your-first-vite-project) to make us a "hello world" project for vanilla JS.

Start with the `npm` command, which is like `pip` but for NodeJS.
It has a mode like `pipx` where it can execute something that isn't locally installed:

```shell
$ npm create vite@latest pyodide-components -- --template vanilla
```

It generated files into a subdirectory.
Let's copy all of that up into our directory (while preserving our `.gitignore`), then remove that scaffold directory:

```shell
$ cp pyodide-components/.gitignore >> .gitignore
$ rm pyodide-components/.gitignore
$ cp -r pyodide-component/* .
$ rm -rf pyodide-components
```

## Vite cleanup

Sorry, we're going to have to talk about some things.
Just a few, not too scary.

The scaffold generated a sample application: `index.html`, `counter.js`, `javascript.svg`, `style.css`, and `main.js`.
It also generated `package.json` and a directory `public` for absolute-referenced static paths.

We'll later remove much of that.
For now, let's re-arrange some things to fit our project structure:

- Move `index.html`, `counter.js`, `javascript.svg`, `style.css`, and `main.js`...
- ...to `src/pyodide_components`

Then, edit the `package.json` to reflect this directory structure:

```
  "scripts": {
    "dev": "vite serve src/pyodide_components/",
    "build": "vite build --outDir=../../dist src/pyodide_components/",
    "preview": "vite preview"
  },
```
## Install and run

We're now in-place.
Let's install our dependencies:

```shell
$ npm install
```

This creates a `node_modules` directory with your one dependency -- vite -- and its dependencies (around 16.)
20 megabytes-ish.
Not terrible...after all, the virtual environment's `site-packages` with Sphinx is 90 Mb.

You can now run the dev server:

```shell
$ npm run dev
```

This launches a live-reload server running at a URL.
Click on the URL and it launches in a browser.
Make a change in the HTML or JS and you'll see the browser is updated.
It's fast!

Or, generate a build in a top-level `dist` directory:

```shell
$ npm run build
```

This creates a shippable site at `dist`.

## Add to git

We've added some files, obviously, so let's do a checkpoint:

```shell
$ git add .gitignore pyproject.toml package* src public
$ git commit -m"NodeJS project workspace setup"
```

## Wrapup

Good first step, from the command-line.
Let's switch over to our IDE, install some dependencies, and get some workflows going.

# Vite Cleanup

The scaffold gave us a demo application.
But lots of that stuff will get in the way later.
Let's do a quick cleanup, while ensuring that the demo still works in both modes:

- Dev mode with live reloading
- Build mode combined with the preview server

# Re-arrange favicon

The scaffold puts a `vite.svg` favicon in the `public` folder as a demo of a build feature.
Let's reduce that complexity.

First, make a `src/pyodide_components/static` directory.
Then, move `public/vite.svg` to `src/pyodide_components/static/vite.svg`:

```shell
$ mkdir src/pyodide_components/static
$ mv public/vite.svg src/pyodide_components/static/vite.svg
$ rmdir public
```

Then, change `index.html` just slightly to stop using an absolute URL:

```html
<link rel="icon" type="image/svg+xml" href="./static/vite.svg" />
```

## Strip down HTML and static

We'll remove some stuff from both the HTML and the JS.
First, `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <link rel="icon" type="image/svg+xml" href="./static/vite.svg"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Pyodide Components</title>
</head>
<body>
<h1>Pyodide Components</h1>
<script type="module" src="main.js"></script>
</body>
</html>
```

:::{note} Easy formatting with Prettier
Life is too short to manually format code.
Do `npm install prettier` and let your smart editor do formatting.
:::

Now a vastly-stripped-down `main.js`:

```javascript
export const PYODIDE_COMPONENTS = "Hello";
```

This means you can delete `style.css`, `counter.js` and `javascript.svg`.

## Dev server

Go back to `package.json` and run your `dev` script using your IDE, or from the command-line:

```shell
$ npm run dev
```

You'll now see a very stripped down page.
Only the favicon `vite.svg` and `main.js` files are loaded.
Of course, as you change the `index.html` (or anything it loads), the browser is updated.

## Build and preview

Does the bundler still work?
Run the `build` script and take a look at the `dist` folder.
You can then run the `preview` script and click on the URL.
You'll see a browser view of the statically-generated contents.
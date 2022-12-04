# Project Setup

Let's do a small first step, just to get things in place.
We'll make a directory, under version control, with a README and a `.gitignore` file.

## New directory

This series is focused on teaching a "joyful" development style for Pyodide.
It's secondary purpose is pitching an idea about a framework for Python-based custom elements as "components."

So let's jump right into that and setup `pyodide-components` as our project workspace:

```shell
$ mkdir pyodide-components
$ cd pyodide-components
```

We also want to initialize this as a Git repo:

```shell
$ git init
```

## First files

First, add a simple `README.md` file.
At a minimum, it will help the future you remember what this directory was about.

```markdown
# Pyodide Components

Learn a "joyful" way of Pyodide development while writing a simple framework 
for Python custom elements.
```

We'll also add a `.gitignore` file.
Later we'll add entries to it:

```shell
$ touch .gitignore
```

Finish by adding these to the repo and committing:

```shell
$ git add README.md .gitignore
$ git commit -m"Start project"
```

## Recap

Yep, this was some pro forma prep work, from the command-line.
We could have used our IDE, but we're going to stay old-school for the first few steps.
No "joyful" yet.
But a step forward before setting up our Python and NodeJS workspaces.

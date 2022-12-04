# Playwright Pyodide

Hook up a Playwright test to ensure Pyodide winds up talking to the browser.

## What? Why?

In an [earlier segment](./playwright.md) we did actual browser testing, using Playwright.
It's even more important now.
We don't have a way to do end-to-end (E2E) testing, to see if Pyodide operations actually update the document.

Equally, the E2E part -- integrating it all together -- is kind of fiddly.
Especially the bundler.

In this step, we'll learn to write a test for something that happens "later".

## Test the page

Let's extend our `index` test in `test_pages.py`:

```python
def test_index(fake_page: Page):
    """Use Playwright to do a test on Hello World."""
    # Use `PWDEBUG=1` to run "head-ful" in Playwright test app
    url = "http://fake/index.html"
    fake_page.goto(url)
    assert fake_page.title() == "Pyodide Components"

    # When the page loads, the span is empty, until
    # Pyodide kicks in.
    span = fake_page.locator("#status")
    assert span.text_content() == ""

    # Now wait for the span to get some content
    text = "Pyodide app is initialized"
    span = fake_page.wait_for_selector(f"#status:has-text('{text}')")
    assert span.text_content() == text
```

The `.wait_for_selector` is the key.
The locator waits until it finds something matching the selector.

One more small change.
In `index.html`, change the `<script>` near the bottom:

```html
<script defer type="module" src="./main.js"></script>
```

The `defer` lets us avoid the `DOMContentLoaded` dance.

## Wrapup

There's another Playwright test we need to write in the future.
The Vitest bundler output in `dist` is...well, kind of fiddly.
In fact, at the time of this writing, it doesn't work correctly.

Later, we'll have Playwright tests that talk to the bundled output.

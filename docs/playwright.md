# Playwright Tests

Add end-to-end (E2E) testing in a real browser.

## Why? What?

We have an HTML page.
Most of what we want to do can be done with a fake DOM.
But we also want to test in a real browser, particularly when Pyodide integration lands.

We will especially want to confirm that our `build` step produces a bundle that works.
It's a place that can break a lot, particularly across browsers.

We'll use [Playwright](https://playwright.dev) for this.
In particular, we'll extend our `pytest` testing to also use `pytest-playwright`.

## Setup `pytest-playwright`

First, make sure `pytest` and `pytest-playwright` are in `pyproject.toml`.
We added this in one of the first steps.

Next, run `playwright install` from the command line.
`playwright` is a "command" that was installed into your `.venv/bin`.
This gets browser binaries on your local system.

We're going to make some pytest fixtures to speed up our testing.
Add a file `src/pyodide_components/fixtures.py` -- empty for now.
Then, add `tests/conftest.py` to load them, with:

```python
pytest_plugins = "pyodide_components.fixtures"
```

## Fixtures and tests

We want to run Playwright.
But we don't want to have to fire up an HTTP server during our tests, just to serve files from disk.
Instead, we'll use Playwright's "network interceptor" approach to catch HTTP requests and handle them from our files.
And we'll do that in a fixture that installs it.

Which means -- you guessed it -- a *test* for the fixture we're going to write.
The `tests/test_fixtures.py` shows this in action:

```python
"""Ensure the test fixtures work as expected."""
from typing import cast

from playwright.sync_api import Page
from playwright.sync_api import Route

from pyodide_components import STATIC
from pyodide_components.fixtures import DummyPage
from pyodide_components.fixtures import DummyRequest
from pyodide_components.fixtures import DummyResponse
from pyodide_components.fixtures import DummyRoute
from pyodide_components.fixtures import route_handler


def test_dummy_request() -> None:
    """Ensure the fake Playwright request class works."""
    dummy_request = DummyRequest(url="/dummy")
    result = dummy_request.fetch(dummy_request)
    assert result.dummy_text == "URL Returned Text"


def test_dummy_response() -> None:
    """Ensure the fake Playwright response class works."""
    dummy_response = DummyResponse(dummy_text="test dummy response")
    assert dummy_response.text() == "test dummy response"
    assert dummy_response.body() == b"test dummy response"
    assert dummy_response.headers["Content-Type"] == "text/html"


def test_dummy_route() -> None:
    """Ensure the fake Playwright route class works."""
    dummy_request = DummyRequest(url="/dummy")
    dummy_route = DummyRoute(request=dummy_request)
    dummy_route.fulfill(
        body=b"dummy body", headers={"Content-Type": "text/html"}, status=200
    )
    assert dummy_route.body == b"dummy body"
    assert dummy_route.headers["Content-Type"] == "text/html"  # type: ignore


def test_route_handler_fake_good_path() -> None:
    """Fake points at good path in ``examples``."""
    # We are testing the interceptor, because the hostname is "fake".
    dummy_request = DummyRequest(url="https://fake/static/vite.svg")
    dummy_page = DummyPage(request=dummy_request)
    dummy_route = DummyRoute(request=dummy_request)
    route_handler(
        cast(Page, dummy_page),
        cast(Route, dummy_route),
    )
    if dummy_route.body:
        assert dummy_route.status == "200"
        with open(STATIC / "vite.svg", "rb") as f:
            body = f.read()
            assert dummy_route.body == body


def test_route_handler_non_fake() -> None:
    """Not fake thus not interceptor, but simulating network request."""
    dummy_request = DummyRequest(url="https://good/static/vite.svg")
    dummy_page = DummyPage(request=dummy_request)
    dummy_route = DummyRoute(request=dummy_request)
    route_handler(
        cast(Page, dummy_page),
        cast(Route, dummy_route),
    )
    assert dummy_route.body == b"URL Returned Text"


def test_route_handler_fake_bad_path() -> None:
    """Fake points at bad path in ``examples``."""
    dummy_request = DummyRequest(url="https://fake/staticxx")
    dummy_page = DummyPage(request=dummy_request)
    dummy_route = DummyRoute(request=dummy_request)
    route_handler(
        cast(Page, dummy_page),
        cast(Route, dummy_route),
    )
    assert dummy_route.status == "404"
```

We then implement the `src/pyodide_components/fixtures.py` file:

```python
"""Automate some testing."""
from __future__ import annotations

from dataclasses import dataclass
from dataclasses import field
from mimetypes import guess_type
from urllib.parse import urlparse

import pytest
from playwright.sync_api import Page
from playwright.sync_api import Route

from pyodide_components import HERE


@dataclass
class DummyResponse:
    """Fake the Playwright ``Response`` class."""

    dummy_text: str = ""
    headers: dict[str, object] = field(
        default_factory=lambda: {"Content-Type": "text/html"}
    )
    status: int | None = None

    def text(self) -> str:
        """Fake the text method."""
        return self.dummy_text

    def body(self) -> bytes:
        """Fake the text method."""
        return bytes(self.dummy_text, "utf-8")


@dataclass
class DummyRequest:
    """Fake the Playwright ``Request`` class."""

    url: str

    @staticmethod
    def fetch(request: DummyRequest) -> DummyResponse:
        """Fake the fetch method."""
        return DummyResponse(dummy_text="URL Returned Text")


@dataclass
class DummyRoute:
    """Fake the Playwright ``Route`` class."""

    request: DummyRequest
    body: bytes | None = None
    status: str | None = None
    headers: dict[str, object] | None = None

    def fulfill(self, body: bytes, headers: dict[str, object], status: int) -> None:
        """Stub the Playwright ``route.fulfill`` method."""
        self.body = body
        self.headers = headers
        self.status = str(status)


@dataclass
class DummyPage:
    """Fake the Playwright ``Page`` class."""

    request: DummyRequest


def route_handler(page: Page, route: Route) -> None:
    """Called from the interceptor to get the data off disk."""
    this_url = urlparse(route.request.url)
    this_path = this_url.path[1:]
    is_fake = this_url.hostname == "fake"
    headers = dict()
    if is_fake:
        # We should read something from the filesystem
        this_fs_path = HERE / this_path
        if this_fs_path.exists():
            status = 200
            mime_type = guess_type(this_fs_path)[0]
            if mime_type:
                headers = {"Content-Type": mime_type}
            body = this_fs_path.read_bytes()
        else:
            status = 404
            body = b""
    else:
        # This is to a non-fake server. Only for cases where the
        # local HTML asked for something out in the big wide world.
        response = page.request.fetch(route.request)
        status = response.status
        body = response.body()
        headers = response.headers

    route.fulfill(body=body, headers=headers, status=status)

@pytest.fixture
def fake_page(page: Page) -> Page:  # pragma: no cover
    """On the fake server, intercept and return from fs."""

    def _route_handler(route: Route) -> None:
        """Instead of doing this inline, call to a helper for easier testing."""
        route_handler(page, route)

    # Use Playwright's route method to intercept any URLs pointed at the
    # fake server and run through the interceptor instead.
    page.route("**", _route_handler)

    # Don't spend 30 seconds on timeout
    page.set_default_timeout(5000)
    return page

```

## `index.html` and test

We want a home page with HTML loads our JS and updates a DOM.
We'll start with a test at `tests/test_pages.py` and a first test for this index page.

Our fixture's interceptor catches anything to `http://fake/` and maps the rest of the path to the filesystem, rooted at `src/pyodide_components`.
So we'll put an `index.html` there.
Our test starts like this:

```python
from playwright.sync_api import Page


def test_index(fake_page: Page):
    """Use Playwright to do a test on Hello World."""
    # Use `PWDEBUG=1` to run "head-ful" in Playwright test app
    url = "http://fake/index.html"
    fake_page.goto(url)
    assert fake_page.title() == "Pyodide Components"
```

Not bad, and the test runs reasonably fast -- for now 😀.
We also have good debugger support.

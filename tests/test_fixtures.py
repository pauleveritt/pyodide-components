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

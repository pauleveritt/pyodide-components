import pytest
from pyodide_components import (
    get_registry,
    to_element_case,
    defined_elements,
    register,
    reset_registry,
    initialize_app,
    counter,
    make_element,
    db,
)


@pytest.fixture
def initialized_app():
    """Reset the registry and setup counter app."""
    reset_registry()
    initialize_app(counter)


def test_reset_registry():
    """Clear previous test's registration."""
    reset_registry()
    assert get_registry() == []


def test_get_registry():
    assert get_registry() == []


def test_to_element_case():
    result = to_element_case("MyCounter")
    assert result == "my-counter"


def test_initial_globals():
    assert defined_elements == {}
    assert db == {}


def test_register_new_component():
    assert get_registry() == []
    register(counter.MyCounter)
    registry = get_registry()
    assert registry == [dict(name="my-counter")]


def test_initialize_app():
    reset_registry()
    assert get_registry() == []
    initialize_app(counter)
    assert get_registry() == [dict(name="my-counter")]


def test_make_and_update_element(initialized_app):
    html = make_element("n123", "my-counter")
    assert "<span>0" in html
    my_counter = db["n123"]
    my_counter.increment()
    assert "<span>1" in my_counter.render()


def test_make_and_update_element_with_prop(initialized_app):
    """The node had an HTML attribute."""
    html = make_element("n123", "my-counter")
    assert "<span>0" in html
    my_counter = db["n123"]
    my_counter.increment()
    assert "<span>1" in my_counter.render()

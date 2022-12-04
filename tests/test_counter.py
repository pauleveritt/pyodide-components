import pytest

from pyodide_components.counter import MyCounter


@pytest.fixture
def this_component():
    return MyCounter(uid="n123")


def test_increment(this_component: MyCounter):
    assert this_component.count == 0
    this_component.increment()
    assert this_component.count == 1


def test_onclick(this_component: MyCounter):
    assert this_component.count == 0
    this_component.onclick({})
    assert this_component.count == 1


def test_render(this_component: MyCounter):
    html = this_component.render()
    assert "<span>0" in html

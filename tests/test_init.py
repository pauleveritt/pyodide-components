from pyodide_components import get_registry


def test_get_registry():
    assert get_registry() == [1, 2, 3]

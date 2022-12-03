import re
from pathlib import Path

HERE = Path(__file__).parent
STATIC = HERE / "static"

defined_elements = {}


def reset_registry():
    """Used by tests to put the globals back in original state."""
    defined_elements.clear()


def to_element_case(camel_str):
    """Convert MyCounter class name to my-counter custom element name."""
    return re.sub("([A-Z0-9])", r"-\1", camel_str).lower().lstrip("-")


def register(component):
    element_name = to_element_case(component.__name__)
    defined_elements[element_name] = component


def initialize_app(app_module):
    """Scan for known components and register them."""
    setup_function = getattr(app_module, "setup_pyodide")
    setup_function(register)


def get_registry():
    return [
        dict(
            name=component_name,
        )
        for component_name, component in defined_elements.items()
    ]

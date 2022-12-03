from dataclasses import dataclass


@dataclass
class MyCounter:
    pass


def setup_pyodide(register):
    """Run the register function to set up component in this app"""
    register(MyCounter)

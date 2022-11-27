from pathlib import Path

HERE = Path(__file__).parent
STATIC = HERE / "static"


def get_registry():
    return [1, 2, 3]

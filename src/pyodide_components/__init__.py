from pathlib import Path

HERE = Path(__file__).parent
STATIC = HERE / "static"


def get_registry():
    return [dict(name="my-counter")]

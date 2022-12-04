from dataclasses import dataclass


@dataclass
class MyCounter:
    uid: str
    count: int = 0

    def increment(self):
        self.count += 1

    def onclick(self, event):
        self.increment()

    def render(self):
        # language=html
        return f"<p><strong>Count</strong>: <span>{self.count}</span></p>"


def setup_pyodide(register):
    """Run the register function to set up component in this app"""
    register(MyCounter)

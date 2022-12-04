# TODO

Below is a list of some to do items for future work and the next rewrite.
Here's the list of sections that have already been written, but not put into this update:

events
attributes
detatch
mocks
apps
mock_fetch_pyodide
server
prerender

## Next

- Load the __init__
- Dispatcher with messages that go straight to Python
- A mock-able self.pyodide.*
- self.registry
- Rewrite
  - Setup Playwright tests from the beginning
  - Make sure Vite and Firefox work
  - Include the dist dir
  - Move the `fetch` part to much later
  - Emphasize coverage
  - Less Markdown, more comments
- For JS, unit test vs. integration tests...markers? Separate file names?
  - Unit tests all have a fake `self.pyodide_components`
  - This will speed them up and make them more reliable
- Replace the passed-in Python string with [mocked requests](https://vitest.dev/guide/mocking.html#requests)
- Create mocks for executing Pyodide for faster JS tests
- Have All Tests flavor that excludes slower tests (like pytest.mark)
- minx runner
- App
- Injector

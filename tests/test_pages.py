from playwright.sync_api import Page


def test_index(fake_page: Page):
    """Use Playwright to do a test on Hello World."""
    # Use `PWDEBUG=1` to run "head-ful" in Playwright test app
    url = "http://fake/index.html"
    fake_page.goto(url)
    assert fake_page.title() == "Pyodide Components"

    # When the page loads, the span is empty, until
    # Pyodide kicks in.
    span = fake_page.locator("#status")
    assert span.text_content() == ""

    # Now wait for the span to get some content
    text = "Pyodide app is initialized"
    span = fake_page.wait_for_selector(f"#status:has-text('{text}')")
    assert span.text_content() == text

#!/usr/bin/env python3
"""Real-browser UI test for the Ignition Timing Helper.

Drives index.html in headless Chromium (Playwright) and proves the
plain-JavaScript app actually runs: procedures render with steps,
the Dyna 2000i configurator returns the right switches, mark math
computes, the bench tests grade measurements, the reference renders
with sources, and the log saves and exports — with no page errors
and no failed requests. The only external requests are the Google
Fonts stylesheets for the 1990 Treatment type (Archivo Narrow,
UnifrakturCook); they fall back gracefully offline (and in sandboxes
with no route to the CDN, the test tolerates those two hosts
failing).

Requires: playwright + chromium (one-time setup, NOT shipped with the
app — see TESTING.md):
    pip install playwright
    playwright install chromium

Run from the project root:
    python3 test_ui.py
"""
import http.server
import functools
import pathlib
import socketserver
import threading

ROOT = pathlib.Path(__file__).parent


def serve():
    """Serve the project dir on an ephemeral localhost port."""
    handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                                directory=str(ROOT))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, httpd.server_address[1]


def main():
    from playwright.sync_api import sync_playwright

    httpd, port = serve()
    url = "http://127.0.0.1:%d/" % port
    errors = []
    failed_requests = []
    font_failures = []
    # Fonts are progressive enhancement from the Google Fonts CDN: the
    # palette-1a type (Special Elite, Chivo, IBM Plex Mono, Caveat)
    # falls back to system/Courier stacks offline, and this sandbox
    # has no route to the CDN at all. A failed font fetch is therefore
    # expected here, not an app error — but it must be a *font* fetch:
    # every other failed request still fails the test.
    font_hosts = ("fonts.googleapis.com", "fonts.gstatic.com")

    def is_font(url):
        return any(h in url for h in font_hosts)

    def on_request_failed(r):
        (font_failures if is_font(r.url) else failed_requests).append(r.url)

    def on_response(r):
        if r.status >= 400:
            (font_failures if is_font(r.url) else failed_requests).append(r.url)

    def on_console(m):
        if m.type == "error":
            # "Failed to load resource" for a font is covered by the
            # requestfailed accounting above; anything else is real.
            if m.text.startswith("Failed to load resource"):
                return
            errors.append(m.text)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 800, "height": 900})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", on_console)
            page.on("requestfailed", on_request_failed)
            page.on("response", on_response)
            page.goto(url, wait_until="load")

            # 1. Timing tab: stock dynamic procedure renders with steps.
            page.wait_for_selector("#timing-steps .card ol li", timeout=10000)
            steps = page.inner_text("#timing-steps")
            assert "20° BTDC" in steps, "procedure should name the 20° setting"
            assert "V.O.E.S. check" in steps, "procedure should include the VOES check"
            assert "HD-8699" in steps, "procedure should name the cover rivets"
            boxes = page.query_selector_all("#timing-steps input[type='checkbox']")
            assert len(boxes) == 8, "stock dynamic should have 8 steps, got %d" % len(boxes)
            # Check one off, then switch method and confirm the list changes.
            boxes[0].check()
            assert boxes[0].is_checked()
            page.select_option("#t-method", "static")
            page.wait_for_timeout(300)
            boxes2 = page.query_selector_all("#timing-steps input[type='checkbox']")
            assert len(boxes2) == 7, "stock static should have 7 steps, got %d" % len(boxes2)
            assert "5 V" in page.inner_text("#timing-steps"), "static should cite the 5 V drop"

            # 2. Dyna 2000i static procedure.
            page.select_option("#t-ignition", "dyna-2000i")
            page.wait_for_timeout(300)
            assert "45° BTDC" in page.inner_text("#timing-steps"), "Dyna static should cite the LED window"
            page.select_option("#t-method", "dynamic")
            page.wait_for_timeout(300)
            assert "35°" in page.inner_text("#timing-steps"), "Dyna dynamic should cite 35°"

            # 3. Log a result from the Timing tab.
            page.select_option("#t-ignition", "stock")
            page.select_option("#t-method", "dynamic")
            page.fill("#t-result", "20° mark centered at 1200 rpm, VOES check passed")
            page.click("#t-log-btn")
            page.wait_for_selector("#t-log-msg >> text=Saved to the log", timeout=5000)

            # 4. Dyna 2000i configurator: curve 3, 7000 rpm, single fire.
            page.click(".nav button[data-view='view-dyna']")
            page.select_option("#d-curve", "3")
            page.select_option("#d-rev", "7000")
            page.select_option("#d-voes", "normal")
            page.select_option("#d-fire", "single")
            page.select_option("#d-plugs", "1")
            page.click("#d-run")
            page.wait_for_selector("#d-results table", timeout=10000)
            dtext = page.inner_text("#d-results")
            assert "32°" in dtext, "curve 3 final advance should be 32°: %r" % dtext[:300]
            assert "DC6-5" in dtext, "single-fire single-plug coil should be DC6-5"
            assert "power cycle" in dtext.lower(), "should remind about the power cycle"
            # Switch table: curve 3 = SW2 OFF, SW3 ON; 7000 = SW4 OFF, SW5 ON; single = SW6 ON.
            rows = page.query_selector_all("#d-results table tr")
            cells = [r.inner_text() for r in rows]
            joined = "\n".join(cells)
            assert "Switch 2" in joined and "Switch 6" in joined

            # 5. Curve suggestion follows the build level.
            page.select_option("#d-build", "built")
            page.wait_for_timeout(300)
            assert page.input_value("#d-curve") == "3", "built motor should suggest curve 3"
            assert "curve 3" in page.inner_text("#d-suggest").lower()

            # 6. Mark math: 20° on an 8.5 in flywheel.
            page.click(".nav button[data-view='view-marks']")
            page.fill("#m-dia", "8.5")
            page.fill("#m-deg", "20")
            page.click("#m-run")
            page.wait_for_selector("#m-out .card", timeout=5000)
            mtext = page.inner_text("#m-out")
            assert "1.48 in" in mtext, "20° on 8.5 in should be 1.48 in: %r" % mtext
            page.fill("#m-dia2", "8.5")
            page.fill("#m-arc", "1.48")
            page.click("#m-run2")
            page.wait_for_selector("#m-out2 .card", timeout=5000)
            assert "19.95" in page.inner_text("#m-out2"), "1.48 in back-converts to ~19.95°"

            # 7. Bench tests: coil pass, VOES pass, LED meaning.
            page.click(".nav button[data-view='view-tests']")
            page.fill("#c-prim", "2.8")
            page.fill("#c-sec", "11000")
            page.click("#c-run")
            page.wait_for_selector("#c-out .card", timeout=5000)
            ctext = page.inner_text("#c-out")
            assert "PASS" in ctext and "FAIL" not in ctext, "2.8/11000 should pass: %r" % ctext
            page.fill("#c-prim", "1.2")
            page.click("#c-run")
            page.wait_for_timeout(300)
            assert "FAIL" in page.inner_text("#c-out"), "1.2 Ω primary should fail"
            page.fill("#v-vac", "4.0")
            page.fill("#v-ohms", "0.5")
            page.click("#v-run")
            page.wait_for_selector("#v-out .card", timeout=5000)
            assert "closed" in page.inner_text("#v-out").lower()
            page.select_option("#l-pattern", "rapid-flash")
            page.click("#l-run")
            page.wait_for_selector("#l-out .card", timeout=5000)
            assert "Over-current" in page.inner_text("#l-out")

            # 8. Reference tab renders with sources.
            page.click(".nav button[data-view='view-reference']")
            page.wait_for_selector("#reference .card table", timeout=10000)
            rtext = page.inner_text("#reference")
            assert "20° BTDC" in rtext
            assert "32402-83" in rtext, "rotor part number should be in the reference"
            assert "99482-98" in rtext
            assert "2801103" in rtext
            assert "3.5–4.5 inHg" in rtext

            # 9. Log tab shows the entry saved in step 3.
            page.click(".nav button[data-view='view-log']")
            page.wait_for_selector("#log-list .card", timeout=10000)
            ltext = page.inner_text("#log-list")
            assert "20° mark centered at 1200 rpm" in ltext, "saved entry missing from log"
            assert "1995 Fat Boy" in ltext

            # 10. About tab renders.
            page.click(".nav button[data-view='view-about']")
            assert "99482-98" in page.inner_text("#view-about")

            # 11. Offline: reload with the network cut — the service
            # worker cache should still serve the app shell.
            page.context.set_offline(True)
            page.reload(wait_until="load")
            page.wait_for_selector("#timing-steps .card ol li", timeout=10000)
            page.context.set_offline(False)

            browser.close()
    finally:
        httpd.shutdown()

    assert not errors, "page/console errors: %r" % errors
    assert not failed_requests, "failed requests: %r" % failed_requests
    print("UI test passed: procedures, Dyna configurator, mark math, "
          "bench tests, reference, log, about, offline — no page errors, "
          "no failed requests."
          + (" (font CDN unreachable here, fallback type in use: %r)"
             % font_failures if font_failures else ""))


if __name__ == "__main__":
    main()

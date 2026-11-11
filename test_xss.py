from playwright.sync_api import sync_playwright

def test_xss_file_drop():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # We start an HTTP server in the background for this test, but Playwright handles it
        import os, subprocess, time
        server = subprocess.Popen(["python", "-m", "http.server", "3000"])
        time.sleep(1) # wait for server to start

        try:
            page.goto("http://localhost:3000")

            # Go to contribute tab
            page.click("#tab-contribute")

            xss_payload = "<img src=x onerror=alert(1)>"

            page.evaluate(f"""() => {{
                // Let's directly call the function handling the files
                const file = new File(['{{}}'], 'config.json', {{ type: 'application/json' }});
                Object.defineProperty(file, 'webkitRelativePath', {{
                    value: '{xss_payload}/config.json'
                }});

                const e = {{
                    target: {{ files: [file] }}
                }};
                handleFileSelect(e);
            }}""")

            time.sleep(1)

            # Verify the HTML doesn't contain the raw payload, but rather the escaped version in staged list
            staged_html = page.inner_html("#stagedFilesList")

            if "<img" in staged_html:
                print("FAILED: XSS payload was found unescaped in the DOM logs")
                return False

            if "&lt;img" in staged_html:
                print("PASSED: XSS payload was properly escaped in staged files list")
                return True
            else:
                print("FAILED: Could not find escaped payload in the DOM logs")
                return False

        finally:
            browser.close()
            server.terminate()

if __name__ == "__main__":
    test_xss_file_drop()

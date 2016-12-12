/**
 * Integration test for outbound-rules web extension.
 *
 * Chrome only.
 *
 * FIREFOX + SELENIUM + WEB EXTENSIONS doesn't work yet!
 * https://github.com/seleniumhq/selenium/issues/1181
 */


/**
 * @fileoverview An example WebDriver script. This requires the chromedriver
 * to be present on the system PATH.
 *
 * Usage:
 *   // Default behavior
 *   node selenium-webdriver/example/google_search.js
 *
 *   // Target Chrome locally; the chromedriver must be on your PATH
 *   SELENIUM_BROWSER=chrome node selenium-webdriver/example/google_search.js
 *
 *   // Use a local copy of the standalone Selenium server
 *   SELENIUM_SERVER_JAR=/path/to/selenium-server-standalone.jar \
 *     node selenium-webdriver/example/google_search.js
 *
 *   // Target a remote Selenium server
 *   SELENIUM_REMOTE_URL=http://www.example.com:4444/wd/hub \
 *     node selenium-webdriver/example/google_search.js
 */

import * as process from 'process';
import * as webdriver from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

import {server} from './server';
import {testA} from './a';

const chromeExtensionPath = "outbound-rules-0.0.1.crx";

function chromeOptions() {
    return new chrome.Options().addExtensions(chromeExtensionPath);
}

interface Tester {
    (driver: any, urlbase: string): Promise<void>
}

const tests: Tester[] = [
    testA,
]

function all(): Promise<void> {
    const s = server();
    s.listen(24119, "127.0.0.1");
    const base = 'http://localhost:24119';
    console.log("Server is listening");
    const driver = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions())
        .build();

    const running = tests.map(f => f(driver, base));
    return Promise.all(running).then(() => {
        console.log("All tests completed successfully.");
        return 0;
    }, (err) => {
        console.error("Integration tests failed:", err);
        return 1;
    }).then((code: number) => {
        s.close();
        driver.quit().then(() => {
            process.exit(code);
        });
    });
}

all();
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
import * as testImg from './test-img';
import * as testScript from './test-script';
import * as testXhrGet from './test-xhr-get';

const chromeExtensionPath = "outbound-rules-0.0.2.crx";

function chromeOptions() {
    return new chrome.Options().addExtensions(chromeExtensionPath);
}

interface Tester {
    test: (driver: any, urlbase: string) => Promise<void>,
    name: string,
}

const tests: Tester[] = [
    testImg,
    testScript,
    testXhrGet,
];

function testAll(driver, base: string, expectTestSuccess: boolean): Promise<number> {
    return tests.reduce((results, tester) => {
        return results.then(numFails => {
            return tester.test(driver, base).then(() => {
                if (expectTestSuccess) {
                    console.log(`${tester.name}: Blocked (expected)`)
                    return numFails;
                } else {
                    console.error(`${tester.name}: Blocked, expected to be allowed`);
                    return numFails + 1;
                }
            }, err => {
                if (expectTestSuccess) {
                    console.error(`${tester.name} (inverse): Allowed, expected to be blocked: ${err}`);
                    return numFails + 1;
                } else {
                    console.log(`${tester.name} (inverse): Allowed (expected)`);
                    return numFails;
                }
            });
        });
    }, Promise.resolve(0));
}

function main_aux(driver): Promise<number> {
    const sDeny = server("DENY: ALL");
    const sAllow = server();
    sDeny.listen(24119, "127.0.0.1");
    sAllow.listen(25119, "127.0.0.1");
    // reduce all tests into a promise which always resolves, but
    // with an integer value indicating how many tests actually failed.
    // Can't use Promise.all because selenium drivers aren't thread-safe.
    return testAll(driver, "http://127.0.0.1:24119", true)
    .then(falseNegatives => {
        return testAll(driver, "http://127.0.0.1:25119", false).then(falsePositives => {
            return falseNegatives + falsePositives
        });
    }).then(numFails => {
        if (numFails === 0) {
            console.log("All integration tests ran succesfully");
        } else {
            console.error(`${numFails} Integration tests failed`);
        }
        sDeny.close();
        sAllow.close();
        return numFails;
    });
}

function main(): void {
    console.log("Server is listening");
    const driver = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions())
        .build();
    
    main_aux(driver).then((code: number) => {
        driver.quit().then(() => {
            process.exit(code);
        });
    });
}

main();